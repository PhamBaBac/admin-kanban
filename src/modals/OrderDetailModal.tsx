/** @format */

import React, { useEffect, useState } from "react";
import {
  Modal,
  Tabs,
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
} from "antd";
import { ArrowRightOutlined, InfoCircleOutlined } from "@ant-design/icons";
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

const OrderDetailModal: React.FC<Props> = ({ open, order, onClose }) => {
  const [activeTab, setActiveTab] = useState<string>("snapshot");
  const [historyList, setHistoryList] = useState<OrderStatusHistoryModel[]>([]);
  const [transactions, setTransactions] = useState<PaymentTransactionModel[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);
  const [loadingTx, setLoadingTx] = useState<boolean>(false);

  useEffect(() => {
    if (open && order?.id) {
      // Tải dữ liệu bổ trợ cho Tab đang active hoặc cả 2
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

  // Tính toán tóm tắt tài chính
  const subtotal =
    order.subtotal ??
    (order.orderResponses || []).reduce((sum, item) => sum + (item.totalPrice || 0), 0);
  const shippingFee = order.shippingFee ?? 0;
  const discountAmount = order.discountAmount ?? 0;
  const finalTotal = Math.max(0, subtotal + shippingFee - discountAmount);

  // Tính sổ cái dòng tiền
  const totalPaid = transactions
    .filter((tx) => tx.transactionType === "PAYMENT" && tx.status === "SUCCESS")
    .reduce((sum, tx) => sum + (tx.amount || 0), 0);

  const totalRefunded = transactions
    .filter((tx) => tx.transactionType === "REFUND" && tx.status === "SUCCESS")
    .reduce((sum, tx) => sum + (tx.amount || 0), 0);

  const netBalance = totalPaid - totalRefunded;

  // Cột cho bảng sản phẩm Snapshot
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
      title: "Đơn giá mua (Snapshot)",
      key: "price",
      width: 150,
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
              Giá vốn: {VND.format(item.cost)}
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Số lượng",
      dataIndex: "qty",
      key: "qty",
      width: 90,
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
      width: 140,
      align: "right" as const,
      render: (totalPrice: number) => (
        <span style={{ fontWeight: 700, color: "#166534", fontSize: 14 }}>
          {VND.format(totalPrice || 0)}
        </span>
      ),
    },
  ];

  // Cột cho bảng Sổ cái dòng tiền
  const ledgerColumns = [
    {
      title: "Mã giao dịch nội bộ",
      dataIndex: "transactionCode",
      key: "transactionCode",
      render: (code: string) => (
        <span style={{ fontFamily: "monospace", fontWeight: 600, color: "#1570ef" }}>
          {code}
        </span>
      ),
    },
    {
      title: "Mã cổng thanh toán",
      key: "gatewayTransactionNo",
      render: (_: any, record: PaymentTransactionModel) => {
        const code = record.gatewayTransactionNo || (record as any).gatewayTransactionId;
        return (
          <span style={{ fontFamily: "monospace", color: "#64748b", fontSize: 12 }}>
            {code || "— (COD / Thủ công)"}
          </span>
        );
      },
    },
    {
      title: "Phương thức",
      key: "paymentType",
      align: "center" as const,
      render: (_: any, record: PaymentTransactionModel) => {
        const method = record.paymentType || (record as any).paymentMethod || "COD";
        return (
          <Tag color={method === "COD" ? "orange" : method === "VNPAY" ? "blue" : "pink"}>
            {method}
          </Tag>
        );
      },
    },

    {
      title: "Loại giao dịch",
      dataIndex: "transactionType",
      key: "transactionType",
      align: "center" as const,
      render: (type: string) => {
        if (type === "PAYMENT") {
          return (
            <Tag color="success" icon={<MoneyRecive size={12} style={{ verticalAlign: "middle", marginRight: 4 }} />}>
              THANH TOÁN (THU)
            </Tag>
          );
        }
        return (
          <Tag color="error" icon={<MoneySend size={12} style={{ verticalAlign: "middle", marginRight: 4 }} />}>
            HOÀN TIỀN (CHI)
          </Tag>
        );
      },
    },
    {
      title: "Số tiền",
      dataIndex: "amount",
      key: "amount",
      align: "right" as const,
      render: (amount: number, record: PaymentTransactionModel) => (
        <span
          style={{
            fontWeight: 700,
            fontSize: 14,
            color: record.transactionType === "PAYMENT" ? "#166534" : "#dc2626",
          }}
        >
          {record.transactionType === "PAYMENT" ? "+" : "-"}
          {VND.format(amount || 0)}
        </span>
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
      width: 150,
      render: (dateStr: string) => (
        <span style={{ fontSize: 12, color: "#64748b" }}>
          {dateStr ? new Date(dateStr).toLocaleString("vi-VN") : "—"}
        </span>
      ),
    },
  ];

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="close" type="primary" onClick={onClose} style={{ fontWeight: 600, background: "#1677ff" }}>
          Đóng
        </Button>,
      ]}
      width={980}
      style={{ top: 20 }}
      title={
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingRight: 24 }}>
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
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>
                  Chi tiết Đơn hàng #{order.id}
                </span>
                <Tooltip title="Sao chép mã đơn">
                  <Button
                    type="text"
                    size="small"
                    icon={<Copy size={14} color="#64748b" />}
                    onClick={() => handleCopyCode(order.id, "Mã đơn hàng")}
                  />
                </Tooltip>
              </div>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                Thông tin chi tiết giao dịch, địa chỉ nhận hàng và snapshot sản phẩm
              </Typography.Text>
            </div>
          </div>
          <Space size={8}>
            <Tag color={getOrderStatusColor(order.orderStatus)} style={{ fontSize: 12, padding: "3px 12px", borderRadius: 8, fontWeight: 600 }}>
              {order.orderStatus}
            </Tag>
            <Tag color="blue" style={{ fontSize: 12, padding: "3px 12px", borderRadius: 8, fontWeight: 600 }}>
              {order.paymentType || "COD"}
            </Tag>
            {order.trackingCode && (
              <Tag color="cyan" style={{ fontSize: 12, padding: "3px 12px", borderRadius: 8, fontWeight: 600 }}>
                <TruckFast size={12} style={{ verticalAlign: "middle", marginRight: 4 }} />
                {order.trackingCode}
              </Tag>
            )}
          </Space>
        </div>
      }
    >
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: "snapshot",
            label: (
              <Space>
                <Box size={16} />
                <span>Chi tiết & Snapshot đơn hàng</span>
              </Space>
            ),
            children: (
              <Space direction="vertical" size="middle" style={{ width: "100%", marginTop: 8 }}>
                {/* Khối Thông tin giao hàng & Tóm tắt tài chính */}
                <Row gutter={[16, 16]}>
                  <Col xs={24} md={14}>
                    <Card
                      size="small"
                      title={
                        <Space>
                          <User size={16} color="#1570ef" />
                          <span style={{ fontWeight: 600 }}>Thông tin Người nhận (Địa chỉ đóng băng)</span>
                        </Space>
                      }
                      style={{ height: "100%", borderRadius: 8, background: "#f8fafc" }}
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
                        <Descriptions.Item label="Địa chỉ giao hàng">
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
                        <Descriptions.Item label="Ngày đặt hàng">
                          <span style={{ color: "#64748b", display: "inline-flex", alignItems: "center", gap: 4 }}>
                            <Clock size={14} color="#64748b" />
                            {order.createdAt ? new Date(order.createdAt).toLocaleString("vi-VN") : "—"}
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
                          <span style={{ fontWeight: 600 }}>Tóm tắt Tài chính & Thanh toán</span>
                        </Space>
                      }
                      style={{ height: "100%", borderRadius: 8, background: "#f8fafc" }}
                    >
                      <Descriptions column={1} size="small">
                        <Descriptions.Item label="Tiền hàng (Tạm tính)">
                          <span style={{ fontWeight: 500 }}>{VND.format(subtotal)}</span>
                        </Descriptions.Item>
                        <Descriptions.Item label="Phí vận chuyển">
                          <span style={{ fontWeight: 500 }}>{VND.format(shippingFee)}</span>
                        </Descriptions.Item>
                        <Descriptions.Item label="Giảm giá voucher">
                          <span style={{ color: "#dc2626", fontWeight: 500 }}>
                            -{VND.format(discountAmount)}
                          </span>
                        </Descriptions.Item>
                        <Descriptions.Item label="Tổng thanh toán">
                          <strong style={{ fontSize: 16, color: "#166534" }}>
                            {VND.format(finalTotal)}
                          </strong>
                        </Descriptions.Item>
                        <Descriptions.Item label="Hình thức">
                          <Tag color="blue">{order.paymentType || "COD"}</Tag>
                        </Descriptions.Item>
                        {order.cancelReason && (
                          <Descriptions.Item label="Lý do hủy đơn">
                            <span style={{ color: "#dc2626", fontWeight: 500 }}>
                              {order.cancelReason}
                            </span>
                          </Descriptions.Item>
                        )}
                      </Descriptions>
                    </Card>
                  </Col>
                </Row>

                {/* Danh sách sản phẩm Snapshot */}
                <Card
                  size="small"
                  title={
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontWeight: 600 }}>
                        Danh sách sản phẩm mua ({order.orderResponses?.length || 0} mục)
                      </span>
                      <Space size={4} style={{ fontSize: 12, color: "#64748b" }}>
                        <InfoCircleOutlined style={{ fontSize: 12 }} />
                        <span>Dữ liệu đóng băng snapshot tại thời điểm đặt hàng</span>
                      </Space>
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
                  />
                </Card>
              </Space>
            ),
          },
          {
            key: "audit",
            label: (
              <Space>
                <Clock size={16} />
                <span>Nhật ký trạng thái (Audit Trail)</span>
                {historyList.length > 0 && <Badge count={historyList.length} color="#1570ef" />}
              </Space>
            ),
            children: (
              <div style={{ padding: "16px 8px" }}>
                {loadingHistory ? (
                  <div style={{ textAlign: "center", padding: "40px 0" }}>
                    <Spin tip="Đang tải lịch sử audit trail..." />
                  </div>
                ) : historyList.length === 0 ? (
                  <Empty description="Chưa có bản ghi nhật ký chuyển trạng thái" />
                ) : (
                  <Timeline
                    mode="left"
                    items={historyList.map((item, index) => {
                      const isLatest = index === historyList.length - 1;
                      return {
                        color: isLatest ? "green" : "blue",
                        children: (
                          <div style={{ paddingBottom: 12 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                              <span style={{ fontWeight: 600, fontSize: 13, color: "#0f172a" }}>
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
                                ID tác vụ: <code style={{ color: "#0f172a" }}>{item.changedById}</code>
                              </span>
                            </div>
                            {item.reason && (
                              <div style={{ marginTop: 6, fontSize: 13, color: "#334155" }}>
                                <strong>Lý do / Diễn giải:</strong> {item.reason}
                              </div>
                            )}
                            {item.metadata && (
                              <div style={{ marginTop: 4, fontSize: 11, color: "#64748b", fontFamily: "monospace", background: "#f1f5f9", padding: "4px 8px", borderRadius: 4, display: "inline-block" }}>
                                Metadata: {item.metadata}
                              </div>
                            )}
                            <div style={{ marginTop: 4, fontSize: 11, color: "#94a3b8" }}>
                              {new Date(item.createdAt).toLocaleString("vi-VN")}
                            </div>
                          </div>
                        ),
                      };
                    })}
                  />
                )}
              </div>
            ),
          },
          {
            key: "transactions",
            label: (
              <Space>
                <MoneyRecive size={16} />
                <span>Sổ cái dòng tiền (Transaction Ledger)</span>
                {transactions.length > 0 && <Badge count={transactions.length} color="#166534" />}
              </Space>
            ),
            children: (
              <div style={{ padding: "8px 0" }}>
                {/* Thống kê dòng tiền */}
                <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                  <Col xs={24} sm={8}>
                    <Card size="small" style={{ borderRadius: 8, background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                      <Statistic
                        title={<span style={{ color: "#166534", fontSize: 12 }}>Tổng đã thu (Payment)</span>}
                        value={totalPaid}
                        formatter={(val) => VND.format(Number(val))}
                        valueStyle={{ color: "#166534", fontWeight: 700, fontSize: 18 }}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Card size="small" style={{ borderRadius: 8, background: "#fef2f2", border: "1px solid #fecaca" }}>
                      <Statistic
                        title={<span style={{ color: "#dc2626", fontSize: 12 }}>Tổng hoàn trả (Refund)</span>}
                        value={totalRefunded}
                        formatter={(val) => VND.format(Number(val))}
                        valueStyle={{ color: "#dc2626", fontWeight: 700, fontSize: 18 }}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Card size="small" style={{ borderRadius: 8, background: "#eff6ff", border: "1px solid #bfdbfe" }}>
                      <Statistic
                        title={<span style={{ color: "#1e40af", fontSize: 12 }}>Số dư ròng (Net Balance)</span>}
                        value={netBalance}
                        formatter={(val) => VND.format(Number(val))}
                        valueStyle={{ color: "#1e40af", fontWeight: 700, fontSize: 18 }}
                      />
                    </Card>
                  </Col>
                </Row>

                {loadingTx ? (
                  <div style={{ textAlign: "center", padding: "40px 0" }}>
                    <Spin tip="Đang tải sổ cái dòng tiền..." />
                  </div>
                ) : transactions.length === 0 ? (
                  <Empty description="Chưa có bút toán giao dịch nào được ghi nhận cho đơn hàng này" />
                ) : (
                  <Table
                    rowKey="id"
                    columns={ledgerColumns}
                    dataSource={transactions}
                    pagination={false}
                    size="small"
                  />
                )}
              </div>
            ),
          },
        ]}
      />
    </Modal>
  );
};

export default OrderDetailModal;
