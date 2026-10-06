/** @format */

import React from "react";
import {
  Card,
  Table,
  Button,
  Tag,
  Typography,
  Space,
  Avatar,
  Tooltip,
  Modal,
} from "antd";
import type { TableProps, ColumnProps } from "antd/es/table";
import { Eye, TruckFast, Box, Edit2, Trash, Call, Sms } from "iconsax-react";
import { BillModel } from "../../../models/BillModel";
import { colors } from "../../../constants/colors";
import { ColorBadge } from "../../../utils/colorHelper";

const { confirm } = Modal;
const { Text } = Typography;

interface OrdersTableProps {
  bills: BillModel[];
  loading: boolean;
  total: number;
  page: number;
  limit: number;
  selectedRowKeys: any[];
  onSelectRowChange: (keys: any[]) => void;
  onPageChange: (page: number, limit?: number) => void;
  onOpenDetailModal: (order: BillModel) => void;
  onOpenCreateShipment: (order: BillModel) => void;
  onOpenTracking: (order: BillModel) => void;
  onOpenStatusModal: (order: BillModel) => void;
  onRemoveBill: (id: string) => void;
}

const isTerminalStatus = (status?: string) => {
  return status === "CANCELLED" || status === "REFUNDED";
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

export const OrdersTable: React.FC<OrdersTableProps> = ({
  bills,
  loading,
  total,
  page,
  limit,
  selectedRowKeys,
  onSelectRowChange,
  onPageChange,
  onOpenDetailModal,
  onOpenCreateShipment,
  onOpenTracking,
  onOpenStatusModal,
  onRemoveBill,
}) => {
  const rowSelection: TableProps<BillModel>["rowSelection"] = {
    selectedRowKeys,
    onChange: onSelectRowChange,
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
              onClick={() => onOpenDetailModal(record)}
            >
              #{record.id ? record.id.substring(0, 8) : "—"}
            </div>
          </Tooltip>
          <div style={{ fontSize: "12px", color: "#64748b", marginTop: 2 }}>
            {record.createdAt
              ? new Date(record.createdAt).toLocaleDateString("vi-VN")
              : "—"}{" "}
            <span style={{ fontSize: "11px", color: "#94a3b8" }}>
              {record.createdAt
                ? new Date(record.createdAt).toLocaleTimeString("vi-VN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : ""}
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
            <strong>
              {record.nameRecipient || record.userName || "Khách lẻ"}
            </strong>
          </div>
          {record.phoneNumber && (
            <div
              style={{
                fontSize: "12px",
                color: "#166534",
                fontWeight: 500,
                display: "flex",
                alignItems: "center",
                gap: 4,
                marginTop: 2,
              }}
            >
              <Call size={13} color="#166534" />
              {record.phoneNumber}
            </div>
          )}
          {record.email && (
            <div
              style={{
                fontSize: "11px",
                color: "#94a3b8",
                overflow: "hidden",
                textOverflow: "ellipsis",
                display: "flex",
                alignItems: "center",
                gap: 4,
                marginTop: 2,
              }}
            >
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
          <div
            className="text-2-line"
            style={{ fontSize: 13, color: "#334155" }}
          >
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
                <div
                  style={{
                    color: "#64748b",
                    fontSize: 11,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    flexWrap: "wrap",
                    marginTop: 2,
                  }}
                >
                  {item.skuCode && (
                    <span
                      style={{
                        fontFamily: "monospace",
                        color: "#1570ef",
                        fontWeight: 600,
                        fontSize: 11,
                        background: "#eff6ff",
                        padding: "0 4px",
                        borderRadius: 3,
                      }}
                    >
                      {item.skuCode}
                    </span>
                  )}
                  {item.color && <ColorBadge color={item.color} size={11} />}
                  {item.size && (
                    <span
                      style={{
                        background: "#f1f5f9",
                        padding: "1px 5px",
                        borderRadius: 4,
                        fontWeight: 500,
                      }}
                    >
                      Size {item.size}
                    </span>
                  )}
                  <span>
                    • SL:{" "}
                    <strong style={{ color: "#1570ef" }}>x{item.qty}</strong>
                  </span>
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
        const totalAmount = (record.orderResponses || []).reduce(
          (sum, item) => sum + (item.totalPrice || 0),
          0
        );
        const totalCost = (record.orderResponses || []).reduce(
          (sum, item) => sum + (item.cost || 0) * (item.qty || 1),
          0
        );
        const grossProfit = totalCost > 0 ? totalAmount - totalCost : 0;
        const profitMargin =
          totalAmount > 0 && totalCost > 0
            ? Math.round((grossProfit / totalAmount) * 100)
            : 0;

        return (
          <div style={{ textAlign: "right" }}>
            <div
              style={{
                fontWeight: 700,
                fontSize: 13,
                color: "#166534",
                whiteSpace: "nowrap",
              }}
            >
              {totalAmount.toLocaleString("vi-VN")} ₫
            </div>
            {totalCost > 0 ? (
              <div
                style={{
                  fontSize: 11,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  gap: 4,
                  marginTop: 2,
                }}
              >
                <span
                  style={{
                    color: grossProfit >= 0 ? "#15803d" : "#b91c1c",
                    fontWeight: 600,
                  }}
                >
                  +{grossProfit.toLocaleString("vi-VN")} ₫
                </span>
                <span
                  style={{
                    fontSize: 10,
                    background: grossProfit >= 0 ? "#dcfce7" : "#fee2e2",
                    color: grossProfit >= 0 ? "#15803d" : "#b91c1c",
                    padding: "0 4px",
                    borderRadius: 3,
                    fontWeight: 600,
                  }}
                >
                  {profitMargin}%
                </span>
              </div>
            ) : (
              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
                Chưa có giá vốn
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: "Thanh toán",
      dataIndex: "paymentType",
      key: "paymentType",
      width: 130,
      render: (paymentType: string, record: BillModel) => (
        <Space direction="vertical" size={2}>
          <Tag color={getPaymentTypeColor(paymentType)}>
            {paymentType || "COD"}
          </Tag>
          <Tag
            color={
              record.paymentStatus === "PAID"
                ? "green"
                : record.paymentStatus === "REFUNDED"
                ? "purple"
                : "default"
            }
            style={{ fontSize: 10, padding: "0 4px", lineHeight: "16px" }}
          >
            {record.paymentStatus === "PAID"
              ? "ĐÃ THU TIỀN"
              : record.paymentStatus === "REFUNDED"
              ? "ĐÃ HOÀN TIỀN"
              : "CHƯA THU TIỀN"}
          </Tag>
        </Space>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "orderStatus",
      key: "orderStatus",
      width: 140,
      render: (orderStatus: string, record: BillModel) => (
        <div>
          <Tag
            color={getOrderStatusColor(orderStatus)}
            style={{ fontWeight: 600 }}
          >
            {orderStatus}
          </Tag>
          {record.trackingCode && (
            <div style={{ marginTop: 4 }}>
              <Tooltip title="Nhấp xem chi tiết lộ trình GHN">
                <Tag
                  color="cyan"
                  style={{
                    cursor: "pointer",
                    fontSize: 11,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 3,
                  }}
                  onClick={() => onOpenTracking(record)}
                >
                  <TruckFast size={12} />
                  {record.trackingCode}
                </Tag>
              </Tooltip>
            </div>
          )}
        </div>
      ),
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
          <Tooltip title="Xem chi tiết đơn hàng, Snapshot & Nhật ký đối soát">
            <Button
              icon={<Eye color="#10b981" size={16} />}
              type="text"
              size="small"
              onClick={() => onOpenDetailModal(item)}
            />
          </Tooltip>

          {!item.trackingCode && item.orderStatus === "PENDING" && (
            <Tooltip title="Đóng gói & Tạo vận đơn GHN">
              <Button
                icon={<Box color="#1570ef" size={16} />}
                type="text"
                size="small"
                onClick={() => onOpenCreateShipment(item)}
              />
            </Tooltip>
          )}

          {item.trackingCode && (
            <Tooltip title="Xem hành trình vận chuyển GHN">
              <Button
                icon={<TruckFast color="#13c2c2" size={16} />}
                type="text"
                size="small"
                onClick={() => onOpenTracking(item)}
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
              onClick={() => onOpenStatusModal(item)}
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
                  onOk: () => onRemoveBill(item.id),
                })
              }
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <Card className="app-card" variant="borderless">
      <Table
        bordered
        rowKey={(record) => record.id}
        rowSelection={rowSelection}
        loading={loading}
        dataSource={bills}
        columns={columns}
        size="middle"
        scroll={{ x: 1400 }}
        style={{ minHeight: 450 }}
        pagination={{
          total,
          showSizeChanger: true,
          responsive: true,
          pageSizeOptions: ["10", "20", "50", "100"],
          onShowSizeChange(_current, size) {
            onPageChange(1, size);
          },
          showTotal: (tot, range) =>
            `${range[0]}-${range[1]} trong tổng số ${tot} đơn hàng`,
          pageSize: limit,
          current: page,
          onChange: (p, l) => {
            onPageChange(p, l);
          },
        }}
      />
    </Card>
  );
};
