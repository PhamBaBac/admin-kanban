/** @format */

import React, { useEffect, useState } from "react";
import {
  Drawer,
  Typography,
  Descriptions,
  Table,
  Tag,
  Space,
  Avatar,
  Card,
  Row,
  Col,
  Timeline,
  Spin,
  Empty,
  Badge,
  Tooltip,
  Button,
  message,
  Statistic,
  Steps,
  Divider,
} from "antd";
import { ArrowRightOutlined } from "@ant-design/icons";
import {
  BillModel,
  OrderItem,
  OrderStatusHistoryModel,
  PaymentTransactionModel,
} from "../models/BillModel";
import { orderService } from "../services/orderService";
import { VND } from "../utils/handleCurrency";
import { ColorBadge } from "../utils/colorHelper";
import {
  ReceiptItem,
  User,
  Location,
  Call,
  Sms,
  Clock,
  MoneyRecive,
  MoneySend,
  TruckFast,
  ShieldSecurity,
  Copy,
  Box,
  CloseCircle,
  TickCircle,
} from "iconsax-react";

interface Props {
  open: boolean;
  order: BillModel | null;
  onClose: () => void;
}

const getOrderStatusColor = (orderStatus?: string) => {
  switch (orderStatus) {
    case "PENDING":
      return "processing";
    case "PROCESSING":
      return "warning";
    case "COMPLETED":
      return "success";
    case "CANCELLED":
      return "error";
    case "REFUNDED":
      return "magenta";
    default:
      return "default";
  }
};

const getRoleBadge = (role?: string) => {
  switch (role) {
    case "ADMIN":
      return <Tag color="purple">ADMIN</Tag>;
    case "SYSTEM":
      return <Tag color="blue">HỆ THỐNG</Tag>;
    case "SHIPPER":
      return <Tag color="orange">GIAO HÀNG</Tag>;
    case "CUSTOMER":
      return <Tag color="green">KHÁCH HÀNG</Tag>;
    default:
      return <Tag color="default">{role || "N/A"}</Tag>;
  }
};

const getStepCurrent = (status?: string) => {
  switch (status) {
    case "PENDING":
      return 0;
    case "PROCESSING":
      return 1;
    case "COMPLETED":
      return 2;
    case "REFUNDED":
      return 3;
    case "CANCELLED":
      return 1;
    default:
      return 0;
  }
};

const OrderDetailDrawer: React.FC<Props> = ({ open, order, onClose }) => {
  const [historyList, setHistoryList] = useState<OrderStatusHistoryModel[]>([]);
  const [transactions, setTransactions] = useState<PaymentTransactionModel[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);
  const [loadingTx, setLoadingTx] = useState<boolean>(false);

  useEffect(() => {
    if (open && order?.id) {
      fetchHistory(order.id);
      fetchTransactions(order.id);
    }
  }, [open, order?.id]);

  const fetchHistory = async (orderId: string) => {
    setLoadingHistory(true);
    try {
      const data = await orderService.getOrderStatusHistory(orderId);
      setHistoryList(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error("Lỗi khi tải lịch sử trạng thái:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const fetchTransactions = async (orderId: string) => {
    setLoadingTx(true);
    try {
      const data = await orderService.getOrderTransactions(orderId);
      setTransactions(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error("Lỗi khi tải sổ cái giao dịch:", err);
    } finally {
      setLoadingTx(false);
    }
  };

  if (!order) return null;

  const handleCopyCode = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    message.success(`Đã sao chép ${label}!`);
  };

  const subtotal =
    order.subtotal ??
    (order.orderResponses || []).reduce((sum, item) => sum + (item.totalPrice || 0), 0);
  const shippingFee = order.shippingFee ?? 0;
  const discountAmount = order.discountAmount ?? 0;
  const finalTotal = Math.max(0, subtotal + shippingFee - discountAmount);

  const totalCost = (order.orderResponses || []).reduce(
    (sum, item) => sum + (item.cost || 0) * (item.qty || 1),
    0
  );
  const grossProfit = Math.max(0, subtotal - totalCost);

  const totalPaid = transactions
    .filter((tx) => tx.transactionType === "PAYMENT" && tx.status === "SUCCESS")
    .reduce((sum, tx) => sum + (tx.amount || 0), 0);

  const totalRefunded = transactions
    .filter((tx) => tx.transactionType === "REFUND" && tx.status === "SUCCESS")
    .reduce((sum, tx) => sum + (tx.amount || 0), 0);

  const isCancelled = order.orderStatus === "CANCELLED";
  const isRefunded = order.orderStatus === "REFUNDED";

  const snapshotColumns = [
    {
      title: "Sản phẩm",
      key: "product",
      render: (_: any, item: OrderItem) => (
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Avatar
            shape="square"
            size={52}
            src={item.image}
            style={{ borderRadius: 6, border: "1px solid #e2e8f0", flexShrink: 0 }}
          />
          <div>
            <div style={{ fontWeight: 600, color: "#1e293b", fontSize: 13 }}>
              {item.productTitle || item.title}
            </div>
            <div style={{ fontSize: 11, color: "#64748b", marginTop: 2, display: "flex", alignItems: "center", gap: 6 }}>
              Mã SKU: <span style={{ fontFamily: "monospace", fontWeight: 600, color: "#334155" }}>{item.skuCode || "N/A"}</span>
              {item.skuCode && (
                <Tooltip title="Sao chép SKU">
                  <Button
                    type="text"
                    size="small"
                    icon={<Copy size={12} color="#64748b" />}
                    onClick={() => handleCopyCode(item.skuCode!, "Mã SKU")}
                    style={{ padding: 0, height: 16, width: 16, display: "inline-flex", alignItems: "center", justifyContent: "center" }}
                  />
                </Tooltip>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
              {item.color && <ColorBadge color={item.color} size={12} />}
              {item.size && (
                <Tag color="cyan" style={{ margin: 0, fontSize: 11, borderRadius: 4 }}>
                  Size {item.size}
                </Tag>
              )}
              {item.attributesSnapshot && Object.keys(item.attributesSnapshot).length > 0 && (
                <Tooltip title={JSON.stringify(item.attributesSnapshot)}>
                  <Tag color="default" style={{ margin: 0, fontSize: 11, borderRadius: 4 }}>
                    + {Object.keys(item.attributesSnapshot).length} thuộc tính
                  </Tag>
                </Tooltip>
              )}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Đơn giá mua",
      key: "price",
      width: 140,
      align: "right" as const,
      render: (_: any, item: OrderItem) => (
        <div>
          <div style={{ fontWeight: 600, color: "#0f172a" }}>
            {VND.format(item.price || 0)}
          </div>
          {item.originalPrice && item.originalPrice > item.price && (
            <div style={{ fontSize: 11, color: "#94a3b8", textDecoration: "line-through" }}>
              {VND.format(item.originalPrice)}
            </div>
          )}
          {item.cost !== undefined && item.cost > 0 && (
            <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
              Vốn: {VND.format(item.cost)}
            </div>
          )}
        </div>
      ),
    },
    {
      title: "SL",
      dataIndex: "qty",
      key: "qty",
      width: 70,
      align: "center" as const,
      render: (qty: number) => (
        <span style={{ fontWeight: 700, color: "#1570ef", fontSize: 14 }}>
          x{qty}
        </span>
      ),
    },
    {
      title: "Thành tiền",
      dataIndex: "totalPrice",
      key: "totalPrice",
      width: 130,
      align: "right" as const,
      render: (totalPrice: number) => (
        <span style={{ fontWeight: 700, color: "#166534", fontSize: 14 }}>
          {VND.format(totalPrice || 0)}
        </span>
      ),
    },
  ];

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={860}
      title={
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                backgroundColor: "#eff6ff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#1677ff",
                flexShrink: 0,
              }}
            >
              <ReceiptItem size={22} color="#1677ff" variant="Bold" />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>
                Hồ sơ Đơn hàng #{order.id}
                <Tooltip title="Sao chép mã đơn">
                  <Button
                    type="text"
                    size="small"
                    icon={<Copy size={14} color="#64748b" />}
                    onClick={() => handleCopyCode(order.id, "Mã đơn hàng")}
                    style={{ marginLeft: 6 }}
                  />
                </Tooltip>
              </div>
              <div style={{ fontSize: 12, color: "#64748b", fontWeight: 400 }}>
                Ngày tạo: {order.createdAt ? new Date(order.createdAt).toLocaleString("vi-VN") : "—"}
              </div>
            </div>
          </div>
          <Space size={8}>
            <Tag color={getOrderStatusColor(order.orderStatus)} style={{ fontSize: 12, padding: "3px 10px", margin: 0 }}>
              {order.orderStatus}
            </Tag>
            <Tag color="blue" style={{ fontSize: 12, padding: "3px 10px", margin: 0 }}>
              {order.paymentType || "COD"}
            </Tag>
            {order.trackingCode && (
              <Tag color="cyan" style={{ fontSize: 12, padding: "3px 10px", margin: 0 }}>
                <TruckFast size={12} style={{ verticalAlign: "middle", marginRight: 4 }} />
                {order.trackingCode}
              </Tag>
            )}
          </Space>
        </div>
      }
    >
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        {/* KHỐI 1: STEPPER HÀNH TRÌNH ĐƠN HÀNG */}
        <Card size="small" style={{ borderRadius: 8, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
          <Steps
            size="small"
            current={getStepCurrent(order.orderStatus)}
            status={isCancelled ? "error" : undefined}
            items={
              isCancelled
                ? [
                    { title: "Đặt hàng", description: "Đã tiếp nhận" },
                    { title: "Đã hủy đơn", description: order.cancelReason || "Hủy / Hoàn kho" },
                  ]
                : isRefunded
                ? [
                    { title: "Đặt hàng", description: "Tiếp nhận" },
                    { title: "Chuẩn bị", description: "Đóng gói & GHN" },
                    { title: "Đã giao", description: "Hoàn tất" },
                    { title: "Đã hoàn tiền", description: "Hoàn dòng tiền" },
                  ]
                : [
                    { title: "Chờ xử lý", description: "Đơn mới" },
                    { title: "Đang chuẩn bị", description: "Đóng gói & GHN" },
                    { title: "Hoàn thành", description: "Giao thành công" },
                  ]
            }
          />
        </Card>

        {/* KHỐI 2: SNAPSHOT THÔNG TIN GIAO HÀNG & TÓM TẮT TÀI CHÍNH */}
        <Row gutter={[16, 16]}>
          <Col xs={24} md={14}>
            <Card
              size="small"
              title={
                <Space>
                  <User size={16} color="#1570ef" />
                  <span style={{ fontWeight: 600 }}>Địa chỉ giao hàng (Đóng băng Snapshot)</span>
                </Space>
              }
              style={{ height: "100%", borderRadius: 8 }}
            >
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Người nhận">
                  <strong style={{ color: "#0f172a" }}>
                    {order.nameRecipient || order.userName || "Khách mua"}
                  </strong>
                </Descriptions.Item>
                <Descriptions.Item label="Số điện thoại">
                  <span style={{ color: "#166534", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <Call size={14} color="#166534" />
                    {order.phoneNumber || "Chưa cập nhật"}
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="Email">
                  <span style={{ color: "#64748b", display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <Sms size={14} color="#64748b" />
                    {order.email || "Chưa cập nhật"}
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="Địa chỉ giao">
                  <span style={{ color: "#334155", display: "inline-flex", alignItems: "flex-start", gap: 4 }}>
                    <Location size={14} color="#1570ef" style={{ marginTop: 3, flexShrink: 0 }} />
                    <span>
                      {order.address || "N/A"}
                      {(order.shippingWard || order.shippingDistrict || order.shippingProvince) && (
                        <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                          {[order.shippingWard, order.shippingDistrict, order.shippingProvince]
                            .filter(Boolean)
                            .join(", ")}
                        </div>
                      )}
                    </span>
                  </span>
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>

          <Col xs={24} md={10}>
            <Card
              size="small"
              title={
                <Space>
                  <ShieldSecurity size={16} color="#166534" />
                  <span style={{ fontWeight: 600 }}>Tài chính & Thanh toán</span>
                </Space>
              }
              style={{ height: "100%", borderRadius: 8 }}
            >
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Tiền hàng (Tạm tính)">
                  <span style={{ fontWeight: 500 }}>{VND.format(subtotal)}</span>
                </Descriptions.Item>
                <Descriptions.Item label="Phí vận chuyển">
                  <span style={{ fontWeight: 500 }}>{VND.format(shippingFee)}</span>
                </Descriptions.Item>
                <Descriptions.Item label="Voucher giảm giá">
                  <span style={{ color: "#dc2626", fontWeight: 500 }}>
                    -{VND.format(discountAmount)}
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="Tổng thanh toán">
                  <strong style={{ fontSize: 16, color: "#166534" }}>
                    {VND.format(finalTotal)}
                  </strong>
                </Descriptions.Item>
                {totalCost > 0 && (
                  <Descriptions.Item label="Lãi gộp ước tính">
                    <span style={{ color: "#1e40af", fontWeight: 600 }}>
                      +{VND.format(grossProfit)}
                    </span>
                    <span style={{ fontSize: 11, color: "#64748b", marginLeft: 4 }}>
                      (Vốn: {VND.format(totalCost)})
                    </span>
                  </Descriptions.Item>
                )}
                {order.cancelReason && (
                  <Descriptions.Item label="Lý do hủy">
                    <span style={{ color: "#dc2626", fontWeight: 600 }}>
                      {order.cancelReason}
                    </span>
                  </Descriptions.Item>
                )}
              </Descriptions>
            </Card>
          </Col>
        </Row>

        {/* KHỐI 3: DANH SÁCH SẢN PHẨM SNAPSHOT */}
        <Card
          size="small"
          title={
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 600 }}>
                Chi tiết sản phẩm ({order.orderResponses?.length || 0} mục)
              </span>
              <span style={{ fontSize: 12, color: "#64748b" }}>
                *Dữ liệu đóng băng snapshot tại thời điểm đặt hàng
              </span>
            </div>
          }
          style={{ borderRadius: 8 }}
        >
          <Table
            rowKey={(item, index) => item.orderItemId || item.skuCode || `${index ?? 0}`}
            columns={snapshotColumns}
            dataSource={order.orderResponses || []}
            pagination={false}
            size="middle"
            scroll={{ x: 600 }}
            style={{ minHeight: 120 }}
          />
        </Card>

        {/* KHỐI 4: NHẬT KÝ KIỂM TOÁN CHUYỂN TRẠNG THÁI (AUDIT TRAIL) */}
        <Card
          size="small"
          title={
            <Space>
              <Clock size={16} color="#1570ef" />
              <span style={{ fontWeight: 600 }}>Nhật ký trạng thái & Thao tác kiểm toán (Audit Trail)</span>
              {historyList.length > 0 && <Badge count={historyList.length} color="#1570ef" />}
            </Space>
          }
          style={{ borderRadius: 8 }}
        >
          {loadingHistory ? (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <Spin tip="Đang tải nhật ký kiểm toán..." />
            </div>
          ) : historyList.length === 0 ? (
            <Empty description="Chưa có bản ghi nhật ký chuyển trạng thái" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          ) : (
            <Timeline
              mode="left"
              style={{ marginTop: 12 }}
              items={historyList.map((item, index) => {
                const isLatest = index === historyList.length - 1;
                return {
                  color: isLatest ? "green" : "blue",
                  children: (
                    <div style={{ paddingBottom: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span style={{ fontWeight: 600, fontSize: 13 }}>
                          {item.fromStatus ? (
                            <>
                              <Tag color={getOrderStatusColor(item.fromStatus)}>{item.fromStatus}</Tag>
                              <ArrowRightOutlined style={{ color: "#94a3b8", fontSize: 11, margin: "0 4px" }} />
                            </>
                          ) : null}
                          <Tag color={getOrderStatusColor(item.toStatus)}>{item.toStatus}</Tag>
                        </span>
                        {getRoleBadge(item.changedByRole)}
                        <span style={{ fontSize: 11, color: "#64748b" }}>
                          Bởi: <code>{item.changedById}</code>
                        </span>
                      </div>
                      {item.reason && (
                        <div style={{ marginTop: 4, fontSize: 12, color: "#334155" }}>
                          <strong>Diễn giải:</strong> {item.reason}
                        </div>
                      )}
                      {item.metadata && (
                        <div style={{ marginTop: 2, fontSize: 11, color: "#64748b", fontFamily: "monospace" }}>
                          Metadata: {item.metadata}
                        </div>
                      )}
                      <div style={{ marginTop: 2, fontSize: 11, color: "#94a3b8" }}>
                        {new Date(item.createdAt).toLocaleString("vi-VN")}
                      </div>
                    </div>
                  ),
                };
              })}
            />
          )}
        </Card>

        {/* KHỐI 5: SỔ CÁI BÚT TOÁN DÒNG TIỀN CỦA ĐƠN HÀNG */}
        <Card
          size="small"
          title={
            <Space>
              <MoneyRecive size={16} color="#166534" />
              <span style={{ fontWeight: 600 }}>Sổ cái bút toán thanh toán của đơn</span>
              {transactions.length > 0 && <Badge count={transactions.length} color="#166534" />}
            </Space>
          }
          style={{ borderRadius: 8 }}
        >
          {loadingTx ? (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <Spin tip="Đang tải sổ cái giao dịch..." />
            </div>
          ) : transactions.length === 0 ? (
            <Empty description="Chưa có bút toán thanh toán nào được ghi nhận" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          ) : (
            <div>
              <div style={{ display: "flex", gap: 24, marginBottom: 12, background: "#f8fafc", padding: "10px 16px", borderRadius: 6 }}>
                <div>
                  <span style={{ fontSize: 12, color: "#64748b" }}>Đã thu: </span>
                  <strong style={{ color: "#166534" }}>{VND.format(totalPaid)}</strong>
                </div>
                <div>
                  <span style={{ fontSize: 12, color: "#64748b" }}>Đã hoàn: </span>
                  <strong style={{ color: "#dc2626" }}>{VND.format(totalRefunded)}</strong>
                </div>
                <div>
                  <span style={{ fontSize: 12, color: "#64748b" }}>Dòng tiền ròng: </span>
                  <strong style={{ color: "#1e40af" }}>{VND.format(totalPaid - totalRefunded)}</strong>
                </div>
              </div>

              <Table
                rowKey="id"
                pagination={false}
                size="small"
                scroll={{ x: 650 }}
                style={{ minHeight: 120 }}
                dataSource={transactions}
                columns={[
                  {
                    title: "Mã giao dịch",
                    dataIndex: "transactionCode",
                    key: "transactionCode",
                    render: (code: string) => <span style={{ fontFamily: "monospace", color: "#1570ef" }}>{code}</span>,
                  },
                  {
                    title: "Mã cổng",
                    key: "gatewayNo",
                    render: (_: any, r: any) => (
                      <span style={{ fontFamily: "monospace", fontSize: 11, color: "#64748b" }}>
                        {r.gatewayTransactionNo || r.gatewayTransactionId || "— (COD)"}
                      </span>
                    ),
                  },
                  {
                    title: "Loại bút toán",
                    dataIndex: "transactionType",
                    key: "transactionType",
                    align: "center" as const,
                    render: (type: string) =>
                      type === "PAYMENT" ? (
                        <Tag color="success">THU TIỀN</Tag>
                      ) : (
                        <Tag color="error">HOÀN TIỀN</Tag>
                      ),
                  },
                  {
                    title: "Số tiền",
                    dataIndex: "amount",
                    key: "amount",
                    align: "right" as const,
                    render: (amount: number, r: any) => (
                      <strong style={{ color: r.transactionType === "PAYMENT" ? "#166534" : "#dc2626" }}>
                        {r.transactionType === "PAYMENT" ? "+" : "-"}
                        {VND.format(amount || 0)}
                      </strong>
                    ),
                  },
                  {
                    title: "Trạng thái",
                    dataIndex: "status",
                    key: "status",
                    align: "center" as const,
                    render: (status: string) => (
                      <Tag color={status === "SUCCESS" ? "green" : status === "PENDING" ? "gold" : "red"}>
                        {status}
                      </Tag>
                    ),
                  },
                  {
                    title: "Thời gian",
                    dataIndex: "createdAt",
                    key: "createdAt",
                    render: (d: string) => (
                      <span style={{ fontSize: 11, color: "#64748b" }}>
                        {d ? new Date(d).toLocaleString("vi-VN") : "—"}
                      </span>
                    ),
                  },
                ]}
              />
            </div>
          )}
        </Card>
      </Space>
    </Drawer>
  );
};

export default OrderDetailDrawer;
