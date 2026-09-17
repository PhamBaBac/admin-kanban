/** @format */

import React, { useEffect, useState } from "react";
import {
  BillModel,
  PaymentStatusColor,
  PaymentTypeColor,
} from "../../models/BillModel";
import { useOrders } from "../../hooks/useOrders";
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
} from "iconsax-react";
import { orderService } from "../../services/orderService";
import { colors } from "../../constants/colors";

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
      return ["PROCESSING", "CANCELLED"];
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
  const [bills, setBills] = useState<BillModel[]>([]);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(1);
  const [api, setApi] = useState("");
  const [selectedRowKeys, setSelectedRowKeys] = useState<any[]>([]);
  const [searchKey, setSearchKey] = useState("");
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

  const finalCancelReason = cancelReason === "Khác" ? customReason : cancelReason;

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

  useEffect(() => {
    if (!searchKey) {
      setApi(`/orders/all?page=${page}&pageSize=${limit}`);
    }
  }, [searchKey, page, limit]);

  useEffect(() => {
    api && getBills(api);
  }, [api]);

  const getBills = async (url: string) => {
    try {
      const params = new URLSearchParams(url.split("?")[1]);
      const page = params.get("page") || "1";
      const pageSize = params.get("pageSize") || "10";
      const search = params.get("search") || "";

      const res = await getOrders({
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        search,
      });
      const billsData = res.data.map((item: any) => ({
        ...item,
        key: item.id,
      }));
      setBills(billsData);
      setTotal(res.totalElements);
    } catch (error) {
      console.log(error);
    }
  };

  const handleSearchBills = async () => {
    try {
      const res = await getOrders({ page, pageSize: limit, search: searchKey });
      const billsData = res.data.map((item: any) => ({
        ...item,
        key: item.id,
      }));
      setBills(billsData);
      setTotal(res.totalElements);
    } catch (error) {
      console.log(error);
    }
  };

  const handleRemoveBill = async (id: string) => {
    try {
      await deleteOrder(id);
      setBills((prev) => prev.filter((bill) => bill.id !== id));
      message.success("Bill removed successfully");
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
      // reload bills
      getBills(api || `/orders/all?page=${page}&pageSize=${limit}`);
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
        return "processing";
      case "CONFIRMED":
        return "warning";
      case "SHIPPING":
        return "processing";
      case "DELIVERED":
        return "success";
      case "CANCELLED":
        return "error";
      default:
        return "default";
    }
  };

  const columns: ColumnProps<BillModel>[] = [
    {
      title: "Customer",
      dataIndex: "userName",
      key: "customer",
      width: 200,
      render: (userName: string, record: BillModel) => (
        <div>
          <div>
            <strong>{userName}</strong>
          </div>
          <div style={{ fontSize: "12px", color: "#666" }}>{record.email}</div>
        </div>
      ),
    },
    {
      title: "Recipient",
      dataIndex: "nameRecipient",
      key: "recipient",
      width: 180,
      render: (nameRecipient: string | null, record: BillModel) => (
        <div>
          <div>{nameRecipient || "N/A"}</div>
          <div style={{ fontSize: "12px", color: "#666" }}>
            {record.phoneNumber || "N/A"}
          </div>
        </div>
      ),
    },
    {
      title: "Shipping Address",
      dataIndex: "address",
      key: "shippingAddress",
      width: 250,
      render: (address: string | null) => (
        <Tooltip title={address || "N/A"}>
          <div className="text-2-line">{address || "N/A"}</div>
        </Tooltip>
      ),
      ellipsis: true,
    },
    {
      title: "Products",
      dataIndex: "orderResponses",
      key: "products",
      width: 300,
      render: (orderResponses: any[]) => (
        <Space direction="vertical" size="small">
          {orderResponses.map((item, index) => (
            <div
              key={index}
              style={{ display: "flex", alignItems: "center", gap: "8px" }}
            >
              <Avatar size="small" src={item.image} />
              <div style={{ fontSize: "12px" }}>
                <Tooltip title={item.title}>
                  <div className="text-2-line">
                    {item.title.length > 30
                      ? `${item.title.substring(0, 30)}...`
                      : item.title}
                  </div>
                </Tooltip>
                <div style={{ color: "#666" }}>
                  {(() => {
                    const descParts: string[] = [];
                    if (item.attributes && typeof item.attributes === "object") {
                      Object.entries(item.attributes).forEach(([k, v]) => {
                        if (v) descParts.push(`${k}: ${v}`);
                      });
                    }
                    if (descParts.length === 0) {
                      if (item.color) descParts.push(item.color);
                      if (item.size) descParts.push(`Size ${item.size}`);
                    }
                    const specStr = descParts.join(" | ");
                    return (
                      <>
                        {specStr && <span>{specStr} - </span>}
                        <span>Qty: {item.qty}</span>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          ))}
        </Space>
      ),
    },
    {
      title: "Payment Type",
      dataIndex: "paymentType",
      key: "paymentType",
      width: 120,
      align: "center",
      render: (paymentType: string) => (
        <Tag color={getPaymentTypeColor(paymentType)}>{paymentType}</Tag>
      ),
    },
    {
      title: "Order Status",
      dataIndex: "orderStatus",
      key: "orderStatus",
      width: 140,
      align: "center",
      render: (orderStatus: string, record: BillModel) => {
        const isTerminal = isTerminalStatus(orderStatus);
        const tag = (
          <Tag
            color={getOrderStatusColor(orderStatus)}
            style={{
              cursor: isTerminal ? "default" : "pointer",
              padding: "4px 8px",
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
          <Space direction="vertical" size={2} align="center">
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
              <Tooltip title={`Lý do: ${record.cancelReason}`}>
                <span
                  style={{
                    fontSize: "11px",
                    color: "#888",
                    maxWidth: 120,
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
      title: "Total Amount",
      key: "total",
      width: 150,
      align: "right",
      render: (_, record: BillModel) => {
        const total = record.orderResponses.reduce(
          (sum, item) => sum + item.totalPrice,
          0
        );
        return (
          <Typography.Text strong style={{ color: colors.primary500 }}>
            {total.toLocaleString("vi-VN")} ₫
          </Typography.Text>
        );
      },
      sorter: (a: BillModel, b: BillModel) => {
        const totalA = a.orderResponses.reduce(
          (sum, item) => sum + item.totalPrice,
          0
        );
        const totalB = b.orderResponses.reduce(
          (sum, item) => sum + item.totalPrice,
          0
        );
        return totalA - totalB;
      },
    },
    {
      title: "Created Date",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 120,
      align: "center",
      render: (createdAt: string) => (
        <div>
          <div>{new Date(createdAt).toLocaleDateString("vi-VN")}</div>
          <div style={{ fontSize: "11px", color: "#999" }}>
            {new Date(createdAt).toLocaleTimeString("vi-VN", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </div>
      ),
      sorter: (a: BillModel, b: BillModel) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },
    {
      key: "actions",
      title: "Actions",
      dataIndex: "",
      fixed: "right",
      width: 130,
      align: "center",
      render: (item: BillModel) => (
        <Space>
          {item.trackingCode && (
            <Tooltip title="Xem hành trình vận chuyển GHN">
              <Button
                icon={<TruckFast color="#13c2c2" size={18} />}
                type="text"
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
                  size={18}
                />
              }
              type="text"
              disabled={isTerminalStatus(item.orderStatus)}
              onClick={() => openStatusModal(item)}
            />
          </Tooltip>
          <Tooltip title="Delete bill">
            <Button
              icon={<Trash className="text-danger" size={18} />}
              type="text"
              onClick={() =>
                confirm({
                  title: "Confirm Delete",
                  content: "Are you sure you want to delete this bill?",
                  okText: "Delete",
                  okType: "danger",
                  cancelText: "Cancel",
                  onOk: () => handleRemoveBill(item.id),
                })
              }
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const totalRevenue = bills.reduce((sum, bill) => {
    return (
      sum +
      bill.orderResponses.reduce(
        (itemSum, item) => itemSum + item.totalPrice,
        0
      )
    );
  }, 0);

  const pendingOrders = bills.filter(
    (bill) => bill.orderStatus === "PENDING"
  ).length;

  return (
    <div style={{ padding: "24px" }}>
      <Card style={{ marginBottom: "16px" }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Typography.Title level={4} style={{ margin: 0 }}>
              Orders Management
            </Typography.Title>
          </Col>
          <Col>
            <Space>
              {selectedRowKeys.length > 0 && (
                <Space>
                  <Tooltip title="Delete selected orders">
                    <Button
                      danger
                      icon={<Trash size={16} />}
                      onClick={() =>
                        confirm({
                          title: "Confirm Delete",
                          content: `Are you sure you want to delete ${selectedRowKeys.length} selected orders?`,
                          okText: "Delete",
                          okType: "danger",
                          cancelText: "Cancel",
                          onOk: async () => {
                            await Promise.all(
                              selectedRowKeys.map((id) => handleRemoveBill(id))
                            );
                            setSelectedRowKeys([]);
                            await getBills(
                              `/orders/all?page=${page}&pageSize=${limit}`
                            );
                          },
                          onCancel: () => setSelectedRowKeys([]),
                        })
                      }
                    >
                      Delete ({selectedRowKeys.length})
                    </Button>
                  </Tooltip>
                </Space>
              )}
              <Input.Search
                value={searchKey}
                onChange={(e) => setSearchKey(e.target.value)}
                onSearch={handleSearchBills}
                placeholder="Search orders by customer name, email..."
                allowClear
                style={{ width: 300 }}
              />
              <DatePicker.RangePicker
                placeholder={["Start Date", "End Date"]}
                style={{ width: 250 }}
              />
            </Space>
          </Col>
        </Row>
      </Card>

      <Card>
        <Table
          rowKey={(record) => record.id}
          rowSelection={rowSelection}
          loading={loading}
          dataSource={bills}
          columns={columns}
          size="middle"
          scroll={{ x: 1400 }}
          bordered
          pagination={{
            total,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50", "100"],
            onShowSizeChange(current, size) {
              setLimit(size);
            },
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} orders`,
            pageSize: limit,
            current: page,
            onChange: (page, limit) => {
              setPage(page);
              setLimit(limit);
            },
            showQuickJumper: true,
          }}
        />
      </Card>

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
              {selectedStatus === "PROCESSING" && !trackingCode.trim() && (
                <Alert
                  type="info"
                  showIcon
                  style={{ marginTop: 8 }}
                  message="Tự động tạo đơn GHN"
                  description="Hệ thống sẽ tự động gọi GHN Open API để tạo vận đơn và gán mã tự động nếu bạn để trống ô này."
                />
              )}
            </div>

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
    </div>
  );
};

export default OrdersScreen;
