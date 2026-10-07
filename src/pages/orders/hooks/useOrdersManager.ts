/** @format */

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { message } from "antd";
import { BillModel } from "../../../models/BillModel";
import { useOrders } from "../../../hooks/useOrders";
import { orderService } from "../../../services/orderService";

export const useOrdersManager = () => {
  const { getOrders, deleteOrder, updateOrderStatus, loading } = useOrders();
  const [searchParams, setSearchParams] = useSearchParams();

  const statusFromUrl = searchParams.get("status");
  const orderIdFromUrl = searchParams.get("id") || searchParams.get("orderId");
  const searchFromUrl = searchParams.get("search");

  const [filterStatus, setFilterStatus] = useState<string>(
    statusFromUrl || "ALL"
  );
  const [statusCounts, setStatusCounts] = useState<{ [key: string]: number }>({
    ALL: 0,
    PENDING: 0,
    PROCESSING: 0,
    COMPLETED: 0,
    CANCELLED: 0,
    REFUNDED: 0,
  });

  const [bills, setBills] = useState<BillModel[]>([]);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(1);
  const [selectedRowKeys, setSelectedRowKeys] = useState<any[]>([]);
  const [searchKey, setSearchKey] = useState(
    orderIdFromUrl || searchFromUrl || ""
  );
  const [dateRange, setDateRange] = useState<[string, string] | null>(null);

  // Status Modal
  const [isModalStatusOpen, setIsModalStatusOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<BillModel | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [cancelReason, setCancelReason] = useState<string>("");
  const [customReason, setCustomReason] = useState<string>("");
  const [trackingCode, setTrackingCode] = useState<string>("");
  const [carrier, setCarrier] = useState<string>("GHN");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // GHN Tracking Modal
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingData, setTrackingData] = useState<any>(null);
  const [trackingOrder, setTrackingOrder] = useState<BillModel | null>(null);

  // Shipment & Drawer
  const [isShipmentModalOpen, setIsShipmentModalOpen] = useState(false);
  const [shipmentOrder, setShipmentOrder] = useState<BillModel | null>(null);
  const [mainTabKey, setMainTabKey] = useState<string>("orders");
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedDetailOrder, setSelectedDetailOrder] =
    useState<BillModel | null>(null);

  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const handledOrderIdRef = useRef<string | null>(null);
  const isSwitchingTabRef = useRef<boolean>(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      const container = tabsContainerRef.current;
      if (!container) return;
      const activeTab = container.querySelector(
        ".ant-tabs-tab-active"
      ) as HTMLElement | null;
      if (!activeTab) return;

      const containerLeft = container.scrollLeft;
      const containerRight = containerLeft + container.clientWidth;
      const tabLeft = activeTab.offsetLeft;
      const tabRight = tabLeft + activeTab.offsetWidth;

      if (tabLeft < containerLeft) {
        container.scrollTo({
          left: Math.max(0, tabLeft - 16),
          behavior: "smooth",
        });
      } else if (tabRight > containerRight) {
        container.scrollTo({
          left: tabRight - container.clientWidth + 16,
          behavior: "smooth",
        });
      }
    }, 60);

    return () => clearTimeout(timer);
  }, [filterStatus]);

  const fetchStatusCounts = useCallback(async () => {
    try {
      const counts = await orderService.getStatusCounts();
      if (counts && typeof counts === "object") {
        setStatusCounts((prev) => ({ ...prev, ...counts }));
        return;
      }
    } catch {
      try {
        const statuses = [
          "PENDING",
          "PROCESSING",
          "COMPLETED",
          "CANCELLED",
          "REFUNDED",
        ];
        const [allRes, ...statusResList] = await Promise.all([
          orderService.getOrders({ pageSize: 1 }),
          ...statuses.map((s) =>
            orderService.getOrders({ pageSize: 1, status: s })
          ),
        ]);
        const newCounts: Record<string, number> = {
          ALL: allRes?.totalElements || 0,
        };
        statuses.forEach((s, i) => {
          newCounts[s] = statusResList[i]?.totalElements || 0;
        });
        setStatusCounts(newCounts);
      } catch (e) {
        console.error("Error fetching fallback status counts:", e);
      }
    }
  }, []);

  useEffect(() => {
    fetchStatusCounts();
  }, [fetchStatusCounts]);

  const fetchBills = useCallback(
    async (
      targetPage = page,
      targetLimit = limit,
      targetStatus = filterStatus,
      targetSearch = searchKey,
      targetDates = dateRange
    ) => {
      try {
        const params: any = {
          page: targetPage,
          pageSize: targetLimit,
        };
        if (targetStatus && targetStatus !== "ALL") {
          params.status = targetStatus;
        }
        if (targetSearch && targetSearch.trim()) {
          params.search = targetSearch.trim();
        }
        if (targetDates && targetDates[0] && targetDates[1]) {
          params.startDate = targetDates[0];
          params.endDate = targetDates[1];
        }

        const res = await getOrders(params);
        const billsData = (res?.data || []).map((item: any) => ({
          ...item,
          key: item.id,
        }));
        setBills(billsData);
        setTotal(res?.totalElements || 0);

        if (
          targetStatus &&
          res?.totalElements !== undefined &&
          !targetSearch &&
          !targetDates
        ) {
          setStatusCounts((prev) => ({
            ...prev,
            [targetStatus]: res.totalElements,
          }));
        }
      } catch (error) {
        console.log(error);
      }
    },
    [getOrders, page, limit, filterStatus, searchKey, dateRange]
  );

  useEffect(() => {
    if (!orderIdFromUrl) {
      handledOrderIdRef.current = null;
      return;
    }

    if (
      isSwitchingTabRef.current ||
      handledOrderIdRef.current === orderIdFromUrl
    ) {
      return;
    }
    handledOrderIdRef.current = orderIdFromUrl;

    let isCancelled = false;

    const loadOrderFromUrl = async () => {
      try {
        if (statusFromUrl) {
          setFilterStatus(statusFromUrl);
        }

        const res = await getOrders({
          search: orderIdFromUrl,
          page: 1,
          pageSize: 10,
        });
        if (isCancelled || isSwitchingTabRef.current) return;

        const foundOrder =
          (res?.data || []).find((b: any) => b.id === orderIdFromUrl) ||
          (res?.data || [])[0];

        if (foundOrder) {
          const matchedStatus = foundOrder.orderStatus || statusFromUrl || "ALL";
          setFilterStatus(matchedStatus);
          setSelectedDetailOrder(foundOrder);
          setIsDetailModalOpen(true);

          const billsData = (res?.data || []).map((item: any) => ({
            ...item,
            key: item.id,
          }));
          setBills(billsData);
          setTotal(res?.totalElements || billsData.length);
          return;
        }

        const fetched = await orderService.getOrderById(orderIdFromUrl);
        if (isCancelled || isSwitchingTabRef.current) return;
        if (fetched) {
          const matchedStatus = fetched.orderStatus || statusFromUrl || "ALL";
          setFilterStatus(matchedStatus);
          setSelectedDetailOrder(fetched);
          setIsDetailModalOpen(true);
          setBills([{ ...fetched, key: fetched.id }]);
          setTotal(1);
          return;
        }
      } catch (err) {
        console.error("Lỗi khi tải chi tiết đơn hàng từ thông báo:", err);
      }

      if (!isCancelled && !isSwitchingTabRef.current) {
        fetchBills(1, limit, statusFromUrl || "ALL", orderIdFromUrl, null);
      }
    };

    loadOrderFromUrl();

    return () => {
      isCancelled = true;
    };
  }, [orderIdFromUrl, statusFromUrl]);

  useEffect(() => {
    if (isSwitchingTabRef.current) return;
    if (orderIdFromUrl) return;

    if (searchFromUrl) {
      setSearchKey(searchFromUrl);
      setPage(1);
      fetchBills(1, limit, filterStatus, searchFromUrl, dateRange);
    } else {
      fetchBills(page, limit, filterStatus, searchKey, dateRange);
    }
  }, [page, limit, filterStatus, dateRange, searchFromUrl]);

  useEffect(() => {
    const handleNewNoti = () => {
      fetchBills(page, limit, filterStatus, searchKey, dateRange);
      fetchStatusCounts();
    };
    window.addEventListener("new_admin_notification", handleNewNoti);
    return () => {
      window.removeEventListener("new_admin_notification", handleNewNoti);
    };
  }, [page, limit, filterStatus, searchKey, dateRange, fetchBills, fetchStatusCounts]);

  const handleOpenDetailModal = (order: BillModel) => {
    setSelectedDetailOrder(order);
    setIsDetailModalOpen(true);
  };

  const handleOpenDetailById = async (orderId: string) => {
    const found = bills.find((b) => b.id === orderId);
    if (found) {
      setSelectedDetailOrder(found);
      setIsDetailModalOpen(true);
      if (found.orderStatus) {
        setFilterStatus(found.orderStatus);
      }
      return;
    }
    try {
      const fetched = await orderService.getOrderById(orderId);
      if (fetched) {
        setSelectedDetailOrder(fetched);
        setIsDetailModalOpen(true);
        if (fetched.orderStatus) {
          setFilterStatus(fetched.orderStatus);
        }
        return;
      }
    } catch {
      try {
        const res = await getOrders({ search: orderId, page: 1, pageSize: 10 });
        const matched: BillModel | undefined =
          (res?.data || []).find((b: any) => b.id === orderId) ||
          (res?.data || [])[0];
        if (matched) {
          setSelectedDetailOrder(matched);
          setIsDetailModalOpen(true);
          if (matched.orderStatus) {
            setFilterStatus(matched.orderStatus);
          }
          return;
        }
      } catch (e) {
        console.error("Lỗi khi tải chi tiết đơn hàng fallback:", e);
      }
    }
    message.error("Không thể tải thông tin đơn hàng này");
  };

  const handleOpenCreateShipment = (order: BillModel) => {
    setShipmentOrder(order);
    setIsShipmentModalOpen(true);
  };

  const openStatusModal = (order: BillModel) => {
    setSelectedOrder(order);
    setSelectedStatus("");
    setTrackingCode(order.trackingCode || "");
    setCarrier(order.carrier || "GHN");
    setCancelReason("");
    setCustomReason("");
    setIsModalStatusOpen(true);
  };

  const handleOpenTracking = (order: BillModel) => {
    const code = order.trackingCode?.trim();
    const currentCarrier = (order.carrier || "GHN").toUpperCase();
    if (!code) {
      message.info("Đơn hàng này chưa có mã vận đơn");
      return;
    }
    if (currentCarrier === "GHN") {
      window.open(`https://tracking.ghn.dev/?order_code=${code}`, "_blank");
    } else if (currentCarrier === "VIETTEL_POST") {
      window.open(`https://viettelpost.com.vn/tra-cuu-hanh-trinh-don/?code=${code}`, "_blank");
    } else if (currentCarrier === "GHTK") {
      window.open(`https://giaohangtietkiem.vn/tra-cuu-don-hang/?order_code=${code}`, "_blank");
    } else {
      navigator.clipboard.writeText(code);
      message.info(`Đã sao chép mã vận đơn: ${code}`);
    }
  };

  const handleSearchBills = async () => {
    setPage(1);
    await fetchBills(1, limit, filterStatus, searchKey, dateRange);
  };

  const handleRemoveBill = async (id: string) => {
    const targetOrder = bills.find((bill) => bill.id === id);
    if (targetOrder && targetOrder.orderStatus !== "CANCELLED") {
      message.error(
        "Không thể xóa đơn hàng khi chưa hủy. Vui lòng hủy đơn và gửi thông báo cho khách hàng trước khi xóa!"
      );
      return;
    }

    try {
      await deleteOrder(id);
      setBills((prev) => prev.filter((bill) => bill.id !== id));
      message.success("Đã xóa đơn hàng thành công");
      fetchStatusCounts();
    } catch (error: any) {
      const errorMsg =
        error?.message ||
        (typeof error === "string" ? error : "Không thể xóa đơn hàng");
      message.error(errorMsg);
    }
  };

  const handleUpdateStatusOrder = async () => {
    if (!selectedOrder) return;
    const finalReason =
      cancelReason === "Khác" ? customReason : cancelReason;
    if (selectedStatus === "CANCELLED" && !finalReason.trim()) {
      message.warning("Vui lòng nhập hoặc chọn lý do hủy đơn");
      return;
    }
    setIsUpdatingStatus(true);
    try {
      const statusToSend = selectedStatus || selectedOrder.orderStatus;
      await updateOrderStatus(
        selectedOrder.id,
        statusToSend,
        selectedStatus === "CANCELLED" ? finalReason : undefined,
        trackingCode.trim() ? trackingCode.trim() : undefined,
        carrier || undefined
      );
      if (selectedStatus === "PROCESSING" && !trackingCode.trim()) {
        message.success(
          "Đơn hàng đã chuyển sang PROCESSING & tự động gán mã vận đơn thành công!"
        );
      } else {
        message.success("Cập nhật đơn hàng thành công");
      }
      const nextStatus = selectedStatus;
      setIsModalStatusOpen(false);
      setSelectedOrder(null);
      setSelectedStatus("");
      setTrackingCode("");
      setCarrier("GHN");
      setCancelReason("");
      setCustomReason("");
      if (nextStatus && filterStatus !== "ALL" && nextStatus !== filterStatus) {
        handleStatusFilterChange(nextStatus);
      } else {
        fetchBills(page, limit, filterStatus, searchKey, dateRange);
      }
      fetchStatusCounts();
    } catch (error: any) {
      message.error(error.message || "Failed to update order status");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleStatusFilterChange = (val: string) => {
    isSwitchingTabRef.current = true;
    setFilterStatus(val);
    setPage(1);
    setSearchKey("");

    const newParams = new URLSearchParams();
    if (val !== "ALL") {
      newParams.set("status", val);
    }
    setSearchParams(newParams, { replace: true });
    fetchBills(1, limit, val, "", dateRange);

    setTimeout(() => {
      isSwitchingTabRef.current = false;
    }, 400);
  };

  const handleClearUrlOrderFilter = () => {
    isSwitchingTabRef.current = true;
    searchParams.delete("id");
    searchParams.delete("orderId");
    setSearchParams(searchParams, { replace: true });
    setSearchKey("");
    setPage(1);
    fetchBills(1, limit, filterStatus, "", dateRange);
    setTimeout(() => {
      isSwitchingTabRef.current = false;
    }, 200);
  };

  const handleResetFilters = () => {
    isSwitchingTabRef.current = true;
    setFilterStatus("ALL");
    setSearchKey("");
    setDateRange(null);
    setPage(1);
    setSearchParams({}, { replace: true });
    fetchBills(1, limit, "ALL", "", null);
    setTimeout(() => {
      isSwitchingTabRef.current = false;
    }, 200);
  };

  return {
    bills,
    loading,
    total,
    page,
    limit,
    selectedRowKeys,
    searchKey,
    orderIdFromUrl,
    filterStatus,
    statusCounts,
    dateRange,
    isMobile,
    mainTabKey,
    tabsContainerRef,
    isModalStatusOpen,
    selectedOrder,
    selectedStatus,
    trackingCode,
    carrier,
    cancelReason,
    customReason,
    isUpdatingStatus,
    isTrackingModalOpen,
    trackingOrder,
    trackingData,
    trackingLoading,
    isShipmentModalOpen,
    shipmentOrder,
    isDetailModalOpen,
    selectedDetailOrder,
    setSelectedRowKeys,
    setSearchKey,
    setDateRange,
    setPage,
    setLimit,
    setMainTabKey,
    setIsModalStatusOpen,
    setSelectedOrder,
    setSelectedStatus,
    setTrackingCode,
    setCarrier,
    setCancelReason,
    setCustomReason,
    setIsTrackingModalOpen,
    setTrackingData,
    setTrackingOrder,
    setIsShipmentModalOpen,
    setShipmentOrder,
    setIsDetailModalOpen,
    setSelectedDetailOrder,
    handleStatusFilterChange,
    handleClearUrlOrderFilter,
    handleResetFilters,
    handleSearchBills,
    handleRemoveBill,
    handleUpdateStatusOrder,
    handleOpenDetailModal,
    handleOpenDetailById,
    handleOpenCreateShipment,
    handleOpenTracking,
    openStatusModal,
    fetchBills,
    fetchStatusCounts,
  };
};
