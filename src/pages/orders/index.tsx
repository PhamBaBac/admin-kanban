/** @format */

import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  BillModel,
  PaymentStatusColor,
  PaymentTypeColor,
} from "../../models/BillModel";
import { useOrders } from "../../hooks/useOrders";
import { useSearchParams } from "react-router-dom";
import { ColumnProps, TableProps } from "antd/es/table";
import {
  DatePicker,
  Input,
  Table,
  Tag,
  Typography,
  Avatar,
  Space,
  Button,
  Tooltip,
  Modal,
  message,
  Card,
  Row,
  Col,
  Statistic,
  Select,
  Timeline,
  Spin,
  Descriptions,
  Divider,
  Alert,
  Steps,
  Badge,
  Tabs,
  Checkbox,
  Pagination,
  Empty,
} from "antd";
import {
  Edit2,
  Trash,
  Eye,
  ShoppingCart,
  DollarCircle,
  Clock,
  TruckFast,
  Location,
  Box,
  Call,
  Sms,
  FilterSearch,
  WalletMoney,
  ReceiptItem,
} from "iconsax-react";
import { orderService } from "../../services/orderService";
import { colors } from "../../constants/colors";
import { CreateShipmentModal, OrderDetailDrawer } from "../../modals";
import { ColorBadge, getColorName } from "../../utils/colorHelper";



const { confirm } = Modal;

const PRESET_CANCEL_REASONS = [
  "Khách hàng liên hệ yêu cầu hủy",
  "Sản phẩm trong kho hết hàng / hỏng hóc",
  "Không thể liên lạc số điện thoại người nhận",
  "Nghi ngờ đơn hàng spam / giả mạo",
  "Khác",
];

const isTerminalStatus = (status?: string) => {
  return status === "CANCELLED" || status === "REFUNDED";
};

const getNextAvailableStatuses = (currentStatus?: string): string[] => {
  switch (currentStatus) {
    case "PENDING":
      // Đơn PENDING muốn chuyển sang PROCESSING phải qua bước Đóng gói & Kê khai kiện hàng (GHN)
      return ["CANCELLED"];
    case "PROCESSING":
      return ["COMPLETED", "CANCELLED"];
    case "COMPLETED":
      return ["REFUNDED"];
    case "CANCELLED":
    case "REFUNDED":
    default:
      return [];
  }
};

const OrdersScreen = () => {
  const { getOrders, deleteOrder, updateOrderStatus, loading, error } =
    useOrders();
  const [searchParams, setSearchParams] = useSearchParams();
  const statusFromUrl = searchParams.get("status");
  const [filterStatus, setFilterStatus] = useState<string>(statusFromUrl || "ALL");

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
  const [searchKey, setSearchKey] = useState("");
  const [dateRange, setDateRange] = useState<[string, string] | null>(null);
  const [isModalStatusOpen, setIsModalStatusOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<BillModel | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [cancelReason, setCancelReason] = useState<string>("");
  const [customReason, setCustomReason] = useState<string>("");
  const [trackingCode, setTrackingCode] = useState<string>("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingData, setTrackingData] = useState<any>(null);
  const [trackingOrder, setTrackingOrder] = useState<BillModel | null>(null);

  const [isShipmentModalOpen, setIsShipmentModalOpen] = useState(false);
  const [shipmentOrder, setShipmentOrder] = useState<BillModel | null>(null);

  const [mainTabKey, setMainTabKey] = useState<string>("orders");
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedDetailOrder, setSelectedDetailOrder] = useState<BillModel | null>(null);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const tabsContainerRef = useRef<HTMLDivElement>(null);

  // Cuộn nhẹ tab đang active vào tầm nhìn nếu nó bị che khuất ở mép container
  useEffect(() => {
    const container = tabsContainerRef.current;
    if (!container) return;
    const activeTab = container.querySelector(".ant-tabs-tab-active") as HTMLElement | null;
    if (!activeTab) return;

    const containerLeft = container.scrollLeft;
    const containerRight = containerLeft + container.clientWidth;
    const tabLeft = activeTab.offsetLeft;
    const tabRight = tabLeft + activeTab.offsetWidth;

    // Chỉ cuộn khi tab vượt ra ngoài khung nhìn của container, tránh nhảy lại đầu khi bấm
    if (tabLeft < containerLeft) {
      container.scrollTo({ left: Math.max(0, tabLeft - 16), behavior: "smooth" });
    } else if (tabRight > containerRight) {
      container.scrollTo({ left: tabRight - container.clientWidth + 16, behavior: "smooth" });
    }
  }, [filterStatus]);

  const handleOpenDetailModal = (order: BillModel) => {
    setSelectedDetailOrder(order);
    setIsDetailModalOpen(true);
  };

  const handleOpenDetailById = async (orderId: string) => {
    const found = bills.find((b) => b.id === orderId);
    if (found) {
      setSelectedDetailOrder(found);
      setIsDetailModalOpen(true);
      return;
    }
    try {
      const fetched: any = await orderService.getOrderById(orderId);
      if (fetched) {
        setSelectedDetailOrder(fetched);
        setIsDetailModalOpen(true);
      }
    } catch (err: any) {
      message.error("Không thể tải thông tin đơn hàng này");
    }
  };

  const finalCancelReason = cancelReason === "Khác" ? customReason : cancelReason;

  const handleOpenCreateShipment = (order: BillModel) => {
    setShipmentOrder(order);
    setIsShipmentModalOpen(true);
  };


  const openStatusModal = (order: BillModel) => {
    setSelectedOrder(order);
    setSelectedStatus("");
    setTrackingCode(order.trackingCode || "");
    setCancelReason("");
    setCustomReason("");
    setIsModalStatusOpen(true);
  };

  const handleOpenTracking = async (order: BillModel) => {
    if (!order.trackingCode) {
      message.info("Đơn hàng này chưa có mã vận đơn GHN");
      return;
    }
    setTrackingOrder(order);
    setIsTrackingModalOpen(true);
    setTrackingLoading(true);
    setTrackingData(null);
    try {
      const data = await orderService.getTrackingByCode(order.trackingCode);
      setTrackingData(data);
    } catch (err: any) {
      message.error(err.message || "Không thể lấy thông tin hành trình GHN");
    } finally {
      setTrackingLoading(false);
    }
  };

  const fetchStatusCounts = useCallback(async () => {
    try {
      const counts = await orderService.getStatusCounts();
      if (counts && typeof counts === "object") {
        setStatusCounts((prev) => ({ ...prev, ...counts }));
        return;
      }
    } catch {
      // Fallback nếu backend endpoint chưa khởi động lại: truy vấn pageSize=1 để lấy totalElements
      try {
        const statuses = ["PENDING", "PROCESSING", "COMPLETED", "CANCELLED", "REFUNDED"];
        const [allRes, ...statusResList] = await Promise.all([
          orderService.getOrders({ pageSize: 1 }),
          ...statuses.map((s) => orderService.getOrders({ pageSize: 1, status: s })),
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

  useEffect(() => {
    if (statusFromUrl) {
      setFilterStatus(statusFromUrl);
    }
  }, [statusFromUrl]);

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

        // Đồng bộ số lượng cho tab hiện tại nếu không có search/date filter
        if (targetStatus && res?.totalElements !== undefined && !targetSearch && !targetDates) {
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
    fetchBills(page, limit, filterStatus, searchKey, dateRange);
  }, [page, limit, filterStatus, dateRange]);

  const handleSearchBills = async () => {
    setPage(1);
    await fetchBills(1, limit, filterStatus, searchKey, dateRange);
  };

  const handleRemoveBill = async (id: string) => {
    try {
      await deleteOrder(id);
      setBills((prev) => prev.filter((bill) => bill.id !== id));
      message.success("Bill removed successfully");
      fetchStatusCounts();
    } catch (error: any) {
      message.error(error.message || "Failed to remove bill");
    }
  };

  const hasStatusChange = Boolean(
    selectedStatus && selectedStatus !== selectedOrder?.orderStatus
  );
  const hasTrackingChange =
    trackingCode.trim() !== (selectedOrder?.trackingCode || "").trim();
  const isCancelWithoutReason =
    selectedStatus === "CANCELLED" && !finalCancelReason.trim();
  const isSubmitDisabled =
    (!hasStatusChange && !hasTrackingChange) || isCancelWithoutReason;

  const handleUpdateStatusOrder = async () => {
    if (!selectedOrder) return;
    if (selectedStatus === "CANCELLED" && !finalCancelReason.trim()) {
      message.warning("Vui lòng nhập hoặc chọn lý do hủy đơn");
      return;
    }
    setIsUpdatingStatus(true);
    try {
      const statusToSend = selectedStatus || selectedOrder.orderStatus;
      await updateOrderStatus(
        selectedOrder.id,
        statusToSend,
        selectedStatus === "CANCELLED" ? finalCancelReason : undefined,
        trackingCode.trim() ? trackingCode.trim() : undefined
      );
      if (selectedStatus === "PROCESSING" && !trackingCode.trim()) {
        message.success("Đơn hàng đã chuyển sang PROCESSING & tự động tạo vận đơn GHN thành công!");
      } else {
        message.success("Cập nhật đơn hàng thành công");
      }
      setIsModalStatusOpen(false);
      setSelectedOrder(null);
      setSelectedStatus("");
      setTrackingCode("");
      setCancelReason("");
      setCustomReason("");
      // reload bills and counts
      fetchBills(page, limit, filterStatus, searchKey, dateRange);
      fetchStatusCounts();
    } catch (error: any) {
      message.error(error.message || "Failed to update order status");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const rowSelection: TableProps<BillModel>["rowSelection"] = {
    selectedRowKeys,
    onChange: setSelectedRowKeys,
  };

  const getPaymentTypeColor = (paymentType: string) => {
    switch (paymentType) {
      case "COD":
        return "orange";
      case "VNPAY":
        return "blue";
      case "MOMO":
        return "pink";
      default:
        return "default";
    }
  };

  const getOrderStatusColor = (orderStatus: string) => {
    switch (orderStatus) {
      case "PENDING":
        return "orange";
      case "PROCESSING":
        return "blue";
      case "COMPLETED":
        return "success";
      case "CANCELLED":
        return "error";
      case "REFUNDED":
        return "purple";
      case "CONFIRMED":
        return "warning";
      case "SHIPPING":
        return "cyan";
      case "DELIVERED":
        return "green";
      default:
        return "default";
    }
  };

  const columns: ColumnProps<BillModel>[] = [
    {
      title: "Mã đơn & Ngày đặt",
      key: "orderInfo",
      width: 170,
      render: (_: any, record: BillModel) => (
        <div>
          <Tooltip title="Nhấp để xem chi tiết Snapshot & Nhật ký đối soát">
            <div
              style={{
                fontWeight: 700,
                color: "#1570ef",
                cursor: "pointer",
                display: "inline-block",
                textDecoration: "underline",
                textUnderlineOffset: 3,
              }}
              onClick={() => handleOpenDetailModal(record)}
            >
              #{record.id ? record.id.substring(0, 8) : "—"}
            </div>
          </Tooltip>
          <div style={{ fontSize: "12px", color: "#64748b", marginTop: 2 }}>
            {record.createdAt ? new Date(record.createdAt).toLocaleDateString("vi-VN") : "—"}
            {" "}
            <span style={{ fontSize: "11px", color: "#94a3b8" }}>
              {record.createdAt ? new Date(record.createdAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : ""}
            </span>
          </div>
        </div>
      ),
      sorter: (a: BillModel, b: BillModel) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },

    {
      title: "Khách hàng & Người nhận",
      key: "customerAndRecipient",
      width: 200,
      render: (_: any, record: BillModel) => (
        <div>
          <div>
            <strong>{record.nameRecipient || record.userName || "Khách lẻ"}</strong>
          </div>
          {record.phoneNumber && (
            <div style={{ fontSize: "12px", color: "#166534", fontWeight: 500, display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
              <Call size={13} color="#166534" />
              {record.phoneNumber}
            </div>
          )}
          {record.email && (
            <div style={{ fontSize: "11px", color: "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
              <Sms size={13} color="#94a3b8" />
              {record.email}
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Địa chỉ giao hàng",
      dataIndex: "address",
      key: "shippingAddress",
      width: 220,
      render: (address: string | null) => (
        <Tooltip title={address || "Chưa có địa chỉ"}>
          <div className="text-2-line" style={{ fontSize: 13, color: "#334155" }}>
            {address || "N/A"}
          </div>
        </Tooltip>
      ),
      ellipsis: true,
    },
    {
      title: "Sản phẩm đặt",
      dataIndex: "orderResponses",
      key: "products",
      width: 280,
      render: (orderResponses: any[]) => (
        <Space direction="vertical" size="small">
          {(orderResponses || []).map((item, index) => (
            <div
              key={index}
              style={{ display: "flex", alignItems: "center", gap: "8px" }}
            >
              <Avatar size="small" src={item.image} shape="square" />
              <div style={{ fontSize: "12px" }}>
                <Tooltip title={item.title}>
                  <div className="text-2-line" style={{ fontWeight: 500 }}>
                    {item.title.length > 28
                      ? `${item.title.substring(0, 28)}...`
                      : item.title}
                  </div>
                </Tooltip>
                <div style={{ color: "#64748b", fontSize: 11, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginTop: 2 }}>
                  {item.skuCode && (
                    <span style={{ fontFamily: "monospace", color: "#1570ef", fontWeight: 600, fontSize: 11, background: "#eff6ff", padding: "0 4px", borderRadius: 3 }}>
                      {item.skuCode}
                    </span>
                  )}
                  {item.color && (
                    <ColorBadge color={item.color} size={11} />
                  )}
                  {item.size && (
                    <span style={{ background: "#f1f5f9", padding: "1px 5px", borderRadius: 4, fontWeight: 500 }}>
                      Size {item.size}
                    </span>
                  )}
                  <span>• SL: <strong style={{ color: "#1570ef" }}>x{item.qty}</strong></span>
                </div>
              </div>
            </div>
          ))}
        </Space>
      ),
    },
    {
      title: "Tổng tiền & Lãi gộp",
      key: "total",
      width: 155,
      align: "right",
      render: (_, record: BillModel) => {
        const total = (record.orderResponses || []).reduce(
          (sum, item) => sum + (item.totalPrice || 0),
          0
        );
        const totalCost = (record.orderResponses || []).reduce(
          (sum, item) => sum + (item.cost || 0) * (item.qty || 1),
          0
        );
        const grossProfit = total - totalCost;

        return (
          <div>
            <Typography.Text strong style={{ color: "#166534", fontSize: 14 }}>
              {total.toLocaleString("vi-VN")} ₫
            </Typography.Text>
            {totalCost > 0 && grossProfit > 0 && (
              <div style={{ fontSize: 11, color: "#1e40af", fontWeight: 500, marginTop: 2 }}>
                Lãi: +{grossProfit.toLocaleString("vi-VN")} ₫
              </div>
            )}
          </div>
        );
      },
      sorter: (a: BillModel, b: BillModel) => {
        const totalA = (a.orderResponses || []).reduce((sum, item) => sum + (item.totalPrice || 0), 0);
        const totalB = (b.orderResponses || []).reduce((sum, item) => sum + (item.totalPrice || 0), 0);
        return totalA - totalB;
      },
    },

    {
      title: "Thanh toán",
      dataIndex: "paymentType",
      key: "paymentType",
      width: 120,
      align: "center",
      render: (paymentType: string) => (
        <Tag color={getPaymentTypeColor(paymentType)} style={{ margin: 0, fontWeight: 500 }}>
          {paymentType || "COD"}
        </Tag>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "orderStatus",
      key: "orderStatus",
      width: 160,
      align: "center",
      render: (orderStatus: string, record: BillModel) => {
        const isTerminal = isTerminalStatus(orderStatus);
        const tag = (
          <Tag
            color={getOrderStatusColor(orderStatus)}
            style={{
              cursor: isTerminal ? "default" : "pointer",
              padding: "3px 8px",
              margin: 0,
            }}
            onClick={() => {
              if (!isTerminal) {
                openStatusModal(record);
              }
            }}
          >
            {orderStatus}
          </Tag>
        );

        return (
          <Space direction="vertical" size={3} align="center">
            {tag}
            {record.trackingCode ? (
              <Tag
                color="cyan"
                style={{
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  margin: 0,
                  fontSize: 11,
                }}
                onClick={() => handleOpenTracking(record)}
              >
                <TruckFast size={12} /> {record.trackingCode}
              </Tag>
            ) : null}
            {record.cancelReason && (
              <Tooltip title={`Lý do hủy: ${record.cancelReason}`}>
                <span
                  style={{
                    fontSize: "11px",
                    color: "#dc2626",
                    maxWidth: 130,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    display: "block",
                  }}
                >
                  {record.cancelReason}
                </span>
              </Tooltip>
            )}
          </Space>
        );
      },
    },
    {
      key: "actions",
      title: "Thao tác",
      dataIndex: "",
      fixed: "right",
      width: 160,
      align: "center",
      render: (item: BillModel) => (
        <Space size={2}>
          {/* Nút Xem chi tiết đơn hàng, Snapshot & Sổ cái */}
          <Tooltip title="Xem chi tiết đơn hàng, Snapshot & Nhật ký đối soát">
            <Button
              icon={<Eye color="#10b981" size={16} />}
              type="text"
              size="small"
              onClick={() => handleOpenDetailModal(item)}
            />
          </Tooltip>

          {/* Nút Đóng gói & Kê khai Ship - Chỉ hiển thị cho đơn hàng Chờ xử lý (PENDING) chưa có mã vận đơn */}
          {!item.trackingCode && item.orderStatus === "PENDING" && (
            <Tooltip title="Đóng gói & Tạo vận đơn GHN">
              <Button
                icon={<Box color="#1570ef" size={16} />}
                type="text"
                size="small"
                onClick={() => handleOpenCreateShipment(item)}
              />
            </Tooltip>
          )}

          {item.trackingCode && (
            <Tooltip title="Xem hành trình vận chuyển GHN">
              <Button
                icon={<TruckFast color="#13c2c2" size={16} />}
                type="text"
                size="small"
                onClick={() => handleOpenTracking(item)}
              />
            </Tooltip>
          )}
          <Tooltip
            title={
              isTerminalStatus(item.orderStatus)
                ? "Đơn hàng đã kết thúc, không thể đổi trạng thái"
                : "Cập nhật trạng thái"
            }
          >
            <Button
              icon={
                <Edit2
                  color={
                    isTerminalStatus(item.orderStatus)
                      ? "#bbb"
                      : colors.primary500
                  }
                  size={16}
                />
              }
              type="text"
              size="small"
              disabled={isTerminalStatus(item.orderStatus)}
              onClick={() => openStatusModal(item)}
            />
          </Tooltip>
          <Tooltip title="Xóa đơn hàng">
            <Button
              icon={<Trash className="text-danger" size={16} />}
              type="text"
              size="small"
              onClick={() =>
                confirm({
                  title: "Xác nhận xóa",
                  content: "Bạn có chắc chắn muốn xóa đơn hàng này?",
                  okText: "Xóa",
                  okType: "danger",
                  cancelText: "Hủy",
                  onOk: () => handleRemoveBill(item.id),
                })
              }
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const totalRevenue = (bills || []).reduce((sum, bill) => {
    return (
      sum +
      (bill?.orderResponses || []).reduce(
        (itemSum, item) => itemSum + (item?.totalPrice || 0),
        0
      )
    );
  }, 0);

  return (
    <div style={{ padding: "8px 0" }}>
      <Card className="app-card" style={{ marginBottom: "16px" }} bordered={false}>
        <div className="d-flex flex-column flex-lg-row justify-content-between align-items-start align-items-lg-center gap-3" style={{ marginBottom: 14 }}>
          <div>
            <Typography.Title level={4} style={{ margin: 0, fontWeight: 700 }}>
              Quản lý đơn hàng
            </Typography.Title>
          </div>
          <div className="d-flex align-items-center flex-wrap gap-2 w-100 w-lg-auto justify-content-start justify-content-lg-end">
            {selectedRowKeys.length > 0 && (
              <Tooltip title="Xóa các đơn hàng đã chọn">
                <Button
                  danger
                  type="primary"
                  icon={<Trash size={16} />}
                  onClick={() =>
                    confirm({
                      title: "Xác nhận xóa hàng loạt",
                      content: `Bạn có chắc muốn xóa ${selectedRowKeys.length} đơn hàng đã chọn?`,
                      okText: "Xóa",
                      okType: "danger",
                      cancelText: "Hủy",
                      onOk: async () => {
                        await Promise.all(
                          selectedRowKeys.map((id) => handleRemoveBill(id))
                        );
                        setSelectedRowKeys([]);
                        await fetchBills(page, limit, filterStatus, searchKey, dateRange);
                        fetchStatusCounts();
                      },
                      onCancel: () => setSelectedRowKeys([]),
                    })
                  }
                >
                  Xóa ({selectedRowKeys.length})
                </Button>
              </Tooltip>
            )}
            <Input.Search
              value={searchKey}
              onChange={(e) => {
                setSearchKey(e.target.value);
                if (!e.target.value) {
                  setPage(1);
                  fetchBills(1, limit, filterStatus, "", dateRange);
                }
              }}
              onSearch={handleSearchBills}
              placeholder="Tìm kiếm theo mã đơn, khách hàng, sản phẩm..."
              allowClear
              style={{ minWidth: 240, flex: 1, maxWidth: 360 }}
            />
            <DatePicker.RangePicker
              placeholder={["Từ ngày", "Đến ngày"]}
              style={{ minWidth: 220, flex: 1, maxWidth: 280 }}
              onChange={(dates, dateStrings) => {
                setPage(1);
                if (dates && dateStrings[0] && dateStrings[1]) {
                  setDateRange([dateStrings[0], dateStrings[1]]);
                } else {
                  setDateRange(null);
                }
              }}
            />
          </div>
        </div>

        <div ref={tabsContainerRef} className="orders-status-tabs-container">
          <Tabs
            activeKey={filterStatus}
            className="orders-status-tabs"
            onChange={(val) => {
              setFilterStatus(val);
              setPage(1);
              if (val === "ALL") {
                searchParams.delete("status");
                setSearchParams(searchParams);
              } else {
                setSearchParams({ status: val });
              }
            }}
            items={[
              {
                key: "ALL",
                label: (
                  <Space size={6}>
                    <span>Tất cả</span>
                    <Badge
                      count={statusCounts["ALL"] || 0}
                      overflowCount={999}
                      color="#64748b"
                    />
                  </Space>
                ),
              },
              {
                key: "PENDING",
                label: (
                  <Space size={6}>
                    <span>Chờ xử lý</span>
                    {(statusCounts["PENDING"] || 0) > 0 && (
                      <Badge count={statusCounts["PENDING"]} color="#f04438" />
                    )}
                  </Space>
                ),
              },
              {
                key: "PROCESSING",
                label: (
                  <Space size={6}>
                    <span>Đang chuẩn bị</span>
                    {(statusCounts["PROCESSING"] || 0) > 0 && (
                      <Badge count={statusCounts["PROCESSING"]} color="#1570ef" />
                    )}
                  </Space>
                ),
              },
              {
                key: "COMPLETED",
                label: (
                  <Space size={6}>
                    <span>Hoàn thành</span>
                    {(statusCounts["COMPLETED"] || 0) > 0 && (
                      <Badge count={statusCounts["COMPLETED"]} color="#12b76a" />
                    )}
                  </Space>
                ),
              },
              {
                key: "CANCELLED",
                label: (
                  <Space size={6}>
                    <span>Đã hủy</span>
                    {(statusCounts["CANCELLED"] || 0) > 0 && (
                      <Badge count={statusCounts["CANCELLED"]} color="#98a2b3" />
                    )}
                  </Space>
                ),
              },
              {
                key: "REFUNDED",
                label: (
                  <Space size={6}>
                    <span>Hoàn tiền</span>
                    {(statusCounts["REFUNDED"] || 0) > 0 && (
                      <Badge count={statusCounts["REFUNDED"]} color="#f79009" />
                    )}
                  </Space>
                ),
              },
            ]}
          />
        </div>
      </Card>


      {filterStatus !== "ALL" && (
        <Alert
          message={
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <FilterSearch size={16} color="#1570ef" variant="Bold" />
                Đang lọc danh sách theo: <strong>{filterStatus === "PENDING" ? "Đơn hàng chờ xác nhận" : filterStatus}</strong> ({total} đơn)
              </span>
              <Button
                size="small"
                type="link"
                onClick={() => {
                  setFilterStatus("ALL");
                  setSearchKey("");
                  setDateRange(null);
                  setPage(1);
                  searchParams.delete("status");
                  setSearchParams(searchParams);
                }}
              >
                Xóa bộ lọc (Xem tất cả)
              </Button>
            </div>
          }
          type="info"
          showIcon
          style={{ marginBottom: 16, borderRadius: 8 }}
        />
      )}

      {isMobile ? (
        /* GIAO DIỆN MOBILE / TABLET: DẠNG THẺ ĐƠN HÀNG (ORDER CARD VIEW) */
        <div className="d-flex flex-column" style={{ gap: 10 }}>
          {/* Thanh Chọn tất cả trên mobile */}
          {bills.length > 0 && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "#f8fafc",
                padding: "8px 12px",
                borderRadius: 10,
                marginBottom: 4,
                border: "1px solid #e2e8f0",
              }}
            >
              <Checkbox
                checked={selectedRowKeys.length > 0 && selectedRowKeys.length === bills.length}
                indeterminate={selectedRowKeys.length > 0 && selectedRowKeys.length < bills.length}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedRowKeys(bills.map((b) => b.id));
                  } else {
                    setSelectedRowKeys([]);
                  }
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 500 }}>
                  Chọn tất cả trang này ({bills.length})
                </span>
              </Checkbox>
              {selectedRowKeys.length > 0 && (
                <span style={{ fontSize: 12, color: colors.primary500, fontWeight: 600 }}>
                  Đã chọn {selectedRowKeys.length}
                </span>
              )}
            </div>
          )}

          {loading ? (
            <div
              style={{
                textAlign: "center",
                padding: "48px 0",
                background: "#fff",
                borderRadius: 12,
                border: "1px solid #e2e8f0",
              }}
            >
              <Spin tip="Đang tải danh sách đơn hàng..." />
            </div>
          ) : bills.length === 0 ? (
            <Card className="app-card" style={{ textAlign: "center", borderRadius: 12 }} bordered={false}>
              <Empty description="Không có đơn hàng nào phù hợp" />
            </Card>
          ) : (
            bills.map((item) => {
              const isSelected = selectedRowKeys.includes(item.id);
              const total = (item.orderResponses || []).reduce(
                (sum, sub) => sum + (sub.totalPrice || 0),
                0
              );
              const isTerminal = isTerminalStatus(item.orderStatus);

              return (
                <div
                  key={item.id}
                  style={{
                    background: "#fff",
                    borderRadius: 12,
                    border: isSelected ? `1.5px solid ${colors.primary500}` : "1px solid #e2e8f0",
                    boxShadow: isSelected ? "0 4px 14px rgba(21, 112, 239, 0.1)" : "0 2px 6px rgba(0, 0, 0, 0.04)",
                    padding: 14,
                    transition: "all 0.2s ease",
                  }}
                >
                  {/* Hàng 1: Checkbox + Mã đơn + Trạng thái */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <Checkbox
                        checked={isSelected}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedRowKeys((prev) => [...prev, item.id]);
                          } else {
                            setSelectedRowKeys((prev) => prev.filter((id) => id !== item.id));
                          }
                        }}
                      />
                      <span
                        style={{
                          fontWeight: 700,
                          fontSize: 14,
                          color: colors.primary500,
                          cursor: "pointer",
                        }}
                        onClick={() => handleOpenDetailModal(item)}
                      >
                        #{item.id.substring(0, 8).toUpperCase()}
                      </span>
                    </div>

                    <Tag
                      color={getOrderStatusColor(item.orderStatus)}
                      style={{
                        cursor: isTerminal ? "default" : "pointer",
                        margin: 0,
                        fontWeight: 600,
                        fontSize: 12,
                        padding: "2px 8px",
                        borderRadius: 6,
                      }}
                      onClick={() => {
                        if (!isTerminal) openStatusModal(item);
                      }}
                    >
                      {item.orderStatus}
                    </Tag>
                  </div>

                  {/* Hàng 2: Khách hàng + Thời gian */}
                  <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontWeight: 600, fontSize: 13, color: "#1e293b" }}>
                        {item.nameRecipient || item.userName || "Khách lẻ"}
                      </span>
                      {item.phoneNumber && (
                        <span style={{ fontSize: 12, color: "#64748b", marginLeft: 6 }}>
                          • {item.phoneNumber}
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: 11, color: "#94a3b8", flexShrink: 0 }}>
                      {item.createdAt ? new Date(item.createdAt).toLocaleDateString("vi-VN") : ""}
                    </span>
                  </div>

                  {/* Hàng 3: Danh sách sản phẩm thu gọn */}
                  {(item.orderResponses || []).length > 0 && (
                    <div style={{ marginTop: 8, background: "#f8fafc", padding: "8px 10px", borderRadius: 8, overflow: "hidden" }}>
                      {(item.orderResponses || []).slice(0, 2).map((prod, pIdx) => (
                        <div
                          key={pIdx}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            fontSize: 12,
                            marginTop: pIdx > 0 ? 4 : 0,
                            gap: 8,
                          }}
                        >
                          <span
                            style={{
                              color: "#334155",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              flex: 1,
                              minWidth: 0,
                            }}
                          >
                            • {prod.title || "Sản phẩm"} {prod.size ? `(${prod.size})` : ""}
                          </span>
                          <span style={{ color: "#64748b", fontWeight: 500, flexShrink: 0 }}>x{prod.qty || 1}</span>
                        </div>
                      ))}
                      {(item.orderResponses || []).length > 2 && (
                        <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>
                          + {(item.orderResponses || []).length - 2} sản phẩm khác...
                        </div>
                      )}
                    </div>
                  )}

                  {/* Hàng 4: Tổng tiền & Phương thức thanh toán */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <Tag color={getPaymentTypeColor(item.paymentType)} style={{ margin: 0, fontSize: 11 }}>
                        {item.paymentType || "COD"}
                      </Tag>
                      {item.trackingCode && (
                        <Tag
                          color="cyan"
                          style={{ margin: 0, fontSize: 11, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 3 }}
                          onClick={() => handleOpenTracking(item)}
                        >
                          <TruckFast size={12} /> {item.trackingCode}
                        </Tag>
                      )}
                    </div>
                    <div>
                      <span style={{ fontSize: 12, color: "#64748b" }}>Tổng: </span>
                      <span style={{ fontWeight: 700, fontSize: 15, color: "#166534" }}>
                        {total.toLocaleString("vi-VN")} ₫
                      </span>
                    </div>
                  </div>

                  {/* Đường kẻ mỏng */}
                  <div style={{ height: 1, background: "#f1f5f9", margin: "10px 0 10px 0" }} />

                  {/* Hàng 5: Nút thao tác to bản */}
                  <div style={{ display: "flex", gap: 8 }}>
                    <Button
                      size="middle"
                      icon={<Eye color="#10b981" size={16} />}
                      onClick={() => handleOpenDetailModal(item)}
                      style={{
                        flex: 1,
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 500,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 4,
                        borderColor: "#bbf7d0",
                        color: "#166534",
                        background: "#f0fdf4",
                      }}
                    >
                      Chi tiết
                    </Button>

                    {!item.trackingCode && item.orderStatus === "PENDING" ? (
                      <Button
                        size="middle"
                        icon={<Box color="#1570ef" size={16} />}
                        onClick={() => handleOpenCreateShipment(item)}
                        style={{
                          flex: 1,
                          borderRadius: 8,
                          fontSize: 12,
                          fontWeight: 500,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 4,
                          borderColor: "#bfdbfe",
                          color: "#1570ef",
                          background: "#eff6ff",
                        }}
                      >
                        Đóng gói GHN
                      </Button>
                    ) : (
                      <Button
                        size="middle"
                        icon={<Edit2 color={isTerminal ? "#94a3b8" : "#1570ef"} size={16} />}
                        disabled={isTerminal}
                        onClick={() => openStatusModal(item)}
                        style={{
                          flex: 1,
                          borderRadius: 8,
                          fontSize: 12,
                          fontWeight: 500,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 4,
                          borderColor: isTerminal ? "#f1f5f9" : "#bfdbfe",
                          color: isTerminal ? "#94a3b8" : "#1570ef",
                          background: isTerminal ? "#f8fafc" : "#eff6ff",
                        }}
                      >
                        Đổi trạng thái
                      </Button>
                    )}

                    <Button
                      size="middle"
                      danger
                      icon={<Trash color="#ef4444" size={16} />}
                      onClick={() =>
                        confirm({
                          title: "Xác nhận xóa",
                          content: "Bạn có chắc chắn muốn xóa đơn hàng này?",
                          okText: "Xóa",
                          okType: "danger",
                          cancelText: "Hủy",
                          onOk: () => handleRemoveBill(item.id),
                        })
                      }
                      style={{
                        width: 44,
                        padding: 0,
                        borderRadius: 8,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderColor: "#fecaca",
                        background: "#fef2f2",
                      }}
                    />
                  </div>
                </div>
              );
            })
          )}

          {/* Phân trang Mobile */}
          <div style={{ display: "flex", justifyContent: "center", padding: "16px 0 20px 0" }}>
            <Pagination
              current={page}
              pageSize={limit}
              total={total}
              size="small"
              showSizeChanger={false}
              onChange={(p, size) => {
                setPage(p);
                if (size && size !== limit) setLimit(size);
              }}
              showTotal={(tot, range) => `${range[0]}-${range[1]} / ${tot} đơn`}
            />
          </div>
        </div>
      ) : (
        /* GIAO DIỆN DESKTOP (>= 768px): BẢNG DỮ LIỆU ĐẦY ĐỦ */
        <Card className="app-card" bordered={false}>
          <Table
            bordered
            rowKey={(record) => record.id}
            rowSelection={rowSelection}
            loading={loading}
            dataSource={bills}
            columns={columns}
            size="middle"
            scroll={{ x: 1400 }}
            pagination={{
              total,
              showSizeChanger: true,
              responsive: true,
              pageSizeOptions: ["10", "20", "50", "100"],
              onShowSizeChange(current, size) {
                setLimit(size);
                setPage(1);
              },
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} trong tổng số ${total} đơn hàng`,
              pageSize: limit,
              current: page,
              onChange: (p, l) => {
                setPage(p);
                if (l && l !== limit) setLimit(l);
              },
            }}
          />
        </Card>
      )}

      <Modal
        title={
          selectedOrder


            ? `Cập nhật trạng thái đơn #${selectedOrder.id.substring(0, 8)}`
            : "Edit Order Status"
        }
        open={isModalStatusOpen}
        onCancel={() => {
          setIsModalStatusOpen(false);
          setSelectedOrder(null);
          setSelectedStatus("");
          setCancelReason("");
          setCustomReason("");
        }}
        onOk={handleUpdateStatusOrder}
        okText="Cập nhật"
        cancelText="Hủy"
        okButtonProps={{
          disabled: isSubmitDisabled,
          danger: selectedStatus === "CANCELLED",
          loading: isUpdatingStatus,
        }}
      >
        {selectedOrder && (
          <Space direction="vertical" style={{ width: "100%" }} size="middle">
            <div>
              <span style={{ marginRight: 8, color: "#666" }}>
                Trạng thái hiện tại:
              </span>
              <Tag color={getOrderStatusColor(selectedOrder.orderStatus)}>
                {selectedOrder.orderStatus}
              </Tag>
            </div>

            <div>
              <div style={{ marginBottom: 8, fontWeight: 500 }}>
                Chọn trạng thái mới:
              </div>
              <Select
                value={selectedStatus || undefined}
                onChange={(value) => setSelectedStatus(value)}
                placeholder={`Giữ nguyên (${selectedOrder.orderStatus}) hoặc chọn mới`}
                allowClear
                style={{ width: "100%" }}
              >
                {getNextAvailableStatuses(selectedOrder.orderStatus).map(
                  (status) => (
                    <Select.Option key={status} value={status}>
                      <Space>
                        <Tag color={getOrderStatusColor(status)}>{status}</Tag>
                        <span style={{ fontSize: "12px", color: "#666" }}>
                          {status === "PROCESSING" && "(Xác nhận / Đang chuẩn bị)"}
                          {status === "COMPLETED" && "(Giao thành công)"}
                          {status === "CANCELLED" && "(Hủy đơn / Hoàn kho)"}
                          {status === "REFUNDED" && "(Hoàn tiền / Đổi trả)"}
                        </span>
                      </Space>
                    </Select.Option>
                  )
                )}
              </Select>
            </div>

            {selectedOrder.orderStatus === "PENDING" && (
              <Alert
                type="info"
                showIcon
                message="Đơn hàng đang chờ xử lý"
                description={
                  <span>
                    Để xác nhận đơn và giao hàng, vui lòng sử dụng tính năng{" "}
                    <strong>Đóng gói & Tạo vận đơn</strong> ở danh sách đơn hàng. Modal này chỉ dùng để <strong>Hủy đơn hàng</strong>.
                  </span>
                }
              />
            )}

            {selectedOrder.orderStatus !== "PENDING" && (
              <div>
                <div style={{ marginBottom: 8, fontWeight: 500 }}>
                  Mã vận đơn Giao Hàng Nhanh (GHN):
                </div>
                <Input
                  prefix={<TruckFast size={16} color="#888" />}
                  placeholder="Nhập mã vận đơn GHN (VD: L5G7S1...)"
                  value={trackingCode}
                  onChange={(e) => setTrackingCode(e.target.value)}
                  allowClear
                />
                <div style={{ fontSize: "12px", color: "#888", marginTop: 4 }}>
                  Cập nhật mã vận đơn để cả Admin và Khách hàng theo dõi lộ trình đơn hàng thời gian thực.
                </div>
              </div>
            )}

            {selectedStatus === "CANCELLED" && (
              <div>
                <div
                  style={{
                    marginBottom: 8,
                    fontWeight: 500,
                    color: "#ff4d4f",
                  }}
                >
                  Lý do hủy đơn hàng: <span style={{ color: "red" }}>*</span>
                </div>
                <Select
                  value={cancelReason || undefined}
                  onChange={(value) => setCancelReason(value)}
                  placeholder="Chọn lý do hủy"
                  style={{ width: "100%", marginBottom: 8 }}
                >
                  {PRESET_CANCEL_REASONS.map((reason) => (
                    <Select.Option key={reason} value={reason}>
                      {reason}
                    </Select.Option>
                  ))}
                </Select>
                {cancelReason === "Khác" && (
                  <Input.TextArea
                    rows={3}
                    placeholder="Nhập lý do chi tiết..."
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                  />
                )}
              </div>
            )}
          </Space>
        )}
      </Modal>

      {/* Modal xem lộ trình vận chuyển GHN */}
      <Modal
        title={
          <Space>
            <TruckFast color="#13c2c2" size={22} />
            <span>Chi tiết lộ trình vận chuyển GHN</span>
            {trackingOrder?.trackingCode && (
              <Tag color="cyan">{trackingOrder.trackingCode}</Tag>
            )}
          </Space>
        }
        open={isTrackingModalOpen}
        onCancel={() => {
          setIsTrackingModalOpen(false);
          setTrackingData(null);
          setTrackingOrder(null);
        }}
        footer={[
          <Button
            key="ghnLink"
            type="default"
            onClick={() => {
              const code = trackingData?.orderCode || trackingOrder?.trackingCode;
              if (code) {
                window.open(`https://tracking.ghn.dev/?order_code=${code}`, "_blank");
              }
            }}
          >
            Mở trên GHN Tracking
          </Button>,
          <Button
            key="close"
            type="primary"
            onClick={() => {
              setIsTrackingModalOpen(false);
              setTrackingData(null);
              setTrackingOrder(null);
            }}
          >
            Đóng
          </Button>,
        ]}
        width={680}
      >
        {trackingLoading ? (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <Spin tip="Đang lấy dữ liệu từ hệ thống GHN..." size="large" />
          </div>
        ) : trackingData ? (
          <div>
            {/* Progress Steps */}
            {(() => {
              const currentStatus = (trackingData.status || "").toLowerCase();
              let currentStep = 0;
              let isFailed = false;

              if (["ready_to_pick", "picking", "money_collect_picking"].includes(currentStatus)) {
                currentStep = 0;
              } else if (["picked", "storing", "transporting", "sorting"].includes(currentStatus)) {
                currentStep = 1;
              } else if (["delivering", "money_collect_delivering"].includes(currentStatus)) {
                currentStep = 2;
              } else if (["delivered"].includes(currentStatus)) {
                currentStep = 3;
              } else if (["cancel", "return", "return_transporting", "return_sorting", "returning", "return_fail", "returned", "delivery_fail", "damage", "lost"].includes(currentStatus)) {
                currentStep = 1;
                isFailed = true;
              }

              return (
                <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "8px", marginBottom: "16px", border: "1px solid #e2e8f0" }}>
                  <Steps
                    size="small"
                    current={currentStep}
                    status={isFailed ? "error" : undefined}
                    items={[
                      { title: "Chờ lấy hàng", description: "GHN tiếp nhận" },
                      { title: "Đang luân chuyển", description: "Đã nhập kho" },
                      { title: "Đang giao", description: "Shipper đang giao" },
                      { title: "Thành công", description: "Đã giao hàng" },
                    ]}
                  />
                </div>
              );
            })()}

            <Descriptions
              bordered
              size="small"
              column={2}
              style={{ marginBottom: 20 }}
            >
              <Descriptions.Item label="Mã vận đơn">
                <strong>{trackingData.orderCode || trackingOrder?.trackingCode}</strong>
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                <Tag color="processing">
                  {trackingData.statusName || trackingData.status || "Đang xử lý"}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Người nhận">
                {trackingData.toName || trackingOrder?.nameRecipient || "N/A"}
              </Descriptions.Item>
              <Descriptions.Item label="Số điện thoại">
                {trackingData.toPhone || trackingOrder?.phoneNumber || "N/A"}
              </Descriptions.Item>
              <Descriptions.Item label="Địa chỉ giao" span={2}>
                {trackingData.toAddress || trackingOrder?.address || "N/A"}
              </Descriptions.Item>
              {trackingData.expectedDeliveryTime && (
                <Descriptions.Item label="Dự kiến giao" span={2}>
                  <Space>
                    <Clock size={16} color="#52c41a" />
                    <span>
                      {new Date(trackingData.expectedDeliveryTime).toLocaleString("vi-VN")}
                    </span>
                  </Space>
                </Descriptions.Item>
              )}
              {trackingData.shippingFee ? (
                <Descriptions.Item label="Cước phí GHN" span={2}>
                  {trackingData.shippingFee.toLocaleString("vi-VN")} ₫
                </Descriptions.Item>
              ) : null}
            </Descriptions>

            <Divider orientation="left" style={{ fontSize: "14px" }}>
              Lịch sử hành trình (Timeline)
            </Divider>

            <Timeline
              mode="left"
              style={{ marginTop: 16 }}
              items={
                trackingData.logs && trackingData.logs.length > 0
                  ? trackingData.logs.map((log: any, index: number) => {
                    const isLatest = index === 0;
                    return {
                      color: isLatest ? "green" : "blue",
                      children: (
                        <div>
                          <div
                            style={{
                              fontWeight: isLatest ? 600 : 500,
                              color: isLatest ? "#52c41a" : "#333",
                            }}
                          >
                            {log.statusName || log.status}
                          </div>
                          {log.location && (
                            <div style={{ fontSize: "12px", color: "#666" }}>
                              <Location
                                size={12}
                                style={{ marginRight: 4, verticalAlign: "middle" }}
                              />
                              {log.location}
                            </div>
                          )}
                          {(log.updatedDate || log.action_at) && (
                            <div
                              style={{
                                fontSize: "11px",
                                color: "#999",
                                marginTop: 2,
                              }}
                            >
                              {new Date(log.updatedDate || log.action_at).toLocaleString("vi-VN")}
                            </div>
                          )}
                        </div>
                      ),
                    };
                  })
                  : [
                    {
                      color: "green",
                      children: (
                        <div>
                          <div style={{ fontWeight: 600, color: "#52c41a" }}>
                            {trackingData.statusName || "Mới tạo đơn - Chờ lấy hàng"}
                          </div>
                          <div style={{ fontSize: "12px", color: "#666" }}>
                            Đơn hàng đã được tạo thành công trên hệ thống GHN. Bưu tá sẽ sớm đến lấy hàng tại shop.
                          </div>
                        </div>
                      ),
                    },
                  ]
              }
            />
          </div>
        ) : (
          <div
            style={{
              textAlign: "center",
              color: "#888",
              padding: "30px 0",
            }}
          >
            Không tìm thấy thông tin vận đơn trên GHN hoặc mã không hợp lệ.
          </div>
        )}
      </Modal>

      {/* Modal Kê khai cân nặng, kích thước & Tạo vận đơn GHN */}
      <CreateShipmentModal
        visible={isShipmentModalOpen}
        order={shipmentOrder}
        onClose={() => {
          setIsShipmentModalOpen(false);
          setShipmentOrder(null);
        }}
        onSuccess={() => {
          fetchBills();
        }}
      />

      {/* Drawer Chi tiết đơn hàng 360°, Snapshot, Audit Trail & Sổ cái */}
      <OrderDetailDrawer
        open={isDetailModalOpen}
        order={selectedDetailOrder}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedDetailOrder(null);
        }}
      />

    </div>
  );
};


export default OrdersScreen;
