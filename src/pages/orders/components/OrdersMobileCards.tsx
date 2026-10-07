/** @format */

import React from "react";
import { Checkbox, Pagination, Tag, Button, Empty, Modal, Tooltip } from "antd";
import { Eye, TruckFast, Box, Edit2, Trash, Call, Sms, ExportSquare } from "iconsax-react";
import { BillModel } from "../../../models/BillModel";
import { colors } from "../../../constants/colors";

const { confirm } = Modal;

interface OrdersMobileCardsProps {
  bills: BillModel[];
  loading: boolean;
  total: number;
  page: number;
  limit: number;
  selectedRowKeys: any[];
  onSelectRowKeysChange: (keys: any[]) => void;
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

export const OrdersMobileCards: React.FC<OrdersMobileCardsProps> = ({
  bills,
  loading,
  total,
  page,
  limit,
  selectedRowKeys,
  onSelectRowKeysChange,
  onPageChange,
  onOpenDetailModal,
  onOpenCreateShipment,
  onOpenTracking,
  onOpenStatusModal,
  onRemoveBill,
}) => {
  return (
    <div className="d-flex flex-column" style={{ gap: 10 }}>
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
            checked={
              selectedRowKeys.length > 0 &&
              selectedRowKeys.length === bills.length
            }
            indeterminate={
              selectedRowKeys.length > 0 &&
              selectedRowKeys.length < bills.length
            }
            onChange={(e) => {
              if (e.target.checked) {
                onSelectRowKeysChange(bills.map((b) => b.id));
              } else {
                onSelectRowKeysChange([]);
              }
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 500 }}>
              Chọn tất cả trang này ({bills.length})
            </span>
          </Checkbox>
          {selectedRowKeys.length > 0 && (
            <span
              style={{
                fontSize: 12,
                color: colors.primary500,
                fontWeight: 600,
              }}
            >
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
            minHeight: 320,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#fff",
            borderRadius: 12,
            border: "1px solid #e2e8f0",
          }}
        >
          <div style={{ color: "#64748b" }}>Đang tải danh sách đơn hàng...</div>
        </div>
      ) : bills.length === 0 ? (
        <div
          style={{
            background: "#fff",
            borderRadius: 12,
            padding: "48px 16px",
            border: "1px solid #e2e8f0",
          }}
        >
          <Empty description="Không tìm thấy đơn hàng nào phù hợp" />
        </div>
      ) : (
        bills.map((item) => {
          const isSelected = selectedRowKeys.includes(item.id);
          const isTerminal = isTerminalStatus(item.orderStatus);
          const totalAmount = (item.orderResponses || []).reduce(
            (sum, p) => sum + (p.totalPrice || 0),
            0
          );

          return (
            <div
              key={item.id}
              style={{
                background: "#ffffff",
                borderRadius: 12,
                padding: "14px 14px",
                border: isSelected
                  ? "2px solid #1677ff"
                  : "1px solid #e2e8f0",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              {/* Hàng 1: Checkbox + Mã đơn + Trạng thái */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Checkbox
                    checked={isSelected}
                    onChange={(e) => {
                      if (e.target.checked) {
                        onSelectRowKeysChange([...selectedRowKeys, item.id]);
                      } else {
                        onSelectRowKeysChange(
                          selectedRowKeys.filter((k) => k !== item.id)
                        );
                      }
                    }}
                  />
                  <span
                    style={{
                      fontWeight: 700,
                      color: "#1570ef",
                      fontSize: 14,
                      cursor: "pointer",
                      textDecoration: "underline",
                      textUnderlineOffset: 2,
                    }}
                    onClick={() => onOpenDetailModal(item)}
                  >
                    #{item.id ? item.id.substring(0, 8) : "—"}
                  </span>
                  <span style={{ fontSize: 11, color: "#94a3b8" }}>
                    {item.createdAt
                      ? new Date(item.createdAt).toLocaleDateString("vi-VN")
                      : ""}
                  </span>
                </div>
                <Tag
                  color={getOrderStatusColor(item.orderStatus)}
                  style={{ margin: 0, fontWeight: 600, fontSize: 11 }}
                >
                  {item.orderStatus}
                </Tag>
              </div>

              {/* Hàng 2: Khách hàng + SĐT */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  fontSize: 13,
                }}
              >
                <span style={{ fontWeight: 600, color: "#1e293b" }}>
                  {item.nameRecipient || item.userName || "Khách lẻ"}
                </span>
                {item.phoneNumber && (
                  <span
                    style={{
                      color: "#166534",
                      fontSize: 12,
                      fontWeight: 500,
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <Call size={12} color="#166534" />
                    {item.phoneNumber}
                  </span>
                )}
              </div>

              {/* Hàng 3: Danh sách sản phẩm rút gọn */}
              {item.orderResponses && item.orderResponses.length > 0 && (
                <div
                  style={{
                    background: "#f8fafc",
                    padding: "8px 10px",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                >
                  {item.orderResponses.slice(0, 2).map((prod, pIdx) => (
                    <div
                      key={pIdx}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
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
                        • {prod.title || "Sản phẩm"}{" "}
                        {prod.size ? `(${prod.size})` : ""}
                      </span>
                      <span
                        style={{
                          color: "#64748b",
                          fontWeight: 500,
                          flexShrink: 0,
                        }}
                      >
                        x{prod.qty || 1}
                      </span>
                    </div>
                  ))}
                  {item.orderResponses.length > 2 && (
                    <div
                      style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}
                    >
                      + {item.orderResponses.length - 2} sản phẩm khác...
                    </div>
                  )}
                </div>
              )}

              {/* Hàng 4: Tổng tiền & Phương thức thanh toán */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: 10,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Tag
                    color={getPaymentTypeColor(item.paymentType)}
                    style={{ margin: 0, fontSize: 11 }}
                  >
                    {item.paymentType || "COD"}
                  </Tag>
                  {item.trackingCode && (
                    <Tooltip title="Tra cứu trực tiếp trên GHN (Mở tab mới)">
                      <Tag
                        color="orange"
                        style={{
                          margin: 0,
                          fontSize: 11,
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          fontWeight: 600,
                        }}
                        onClick={() => onOpenTracking(item)}
                      >
                        <ExportSquare size={12} color="#ea580c" /> {item.trackingCode}
                      </Tag>
                    </Tooltip>
                  )}
                </div>
                <div>
                  <span style={{ fontSize: 12, color: "#64748b" }}>Tổng: </span>
                  <span
                    style={{
                      fontWeight: 700,
                      fontSize: 15,
                      color: "#166534",
                    }}
                  >
                    {totalAmount.toLocaleString("vi-VN")} ₫
                  </span>
                </div>
              </div>

              {/* Đường kẻ mỏng */}
              <div
                style={{
                  height: 1,
                  background: "#f1f5f9",
                  margin: "10px 0 10px 0",
                }}
              />

              {/* Hàng 5: Nút thao tác to bản */}
              <div style={{ display: "flex", gap: 8 }}>
                <Button
                  size="middle"
                  icon={<Eye color="#10b981" size={16} />}
                  onClick={() => onOpenDetailModal(item)}
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
                    onClick={() => onOpenCreateShipment(item)}
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
                    icon={
                      <Edit2
                        color={isTerminal ? "#94a3b8" : "#1570ef"}
                        size={16}
                      />
                    }
                    disabled={isTerminal}
                    onClick={() => onOpenStatusModal(item)}
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

                <Tooltip
                  title={
                    item.orderStatus !== "CANCELLED"
                      ? "Không thể xóa đơn hàng khi chưa hủy. Vui lòng hủy đơn và gửi thông báo cho khách hàng trước khi xóa!"
                      : "Xóa đơn hàng"
                  }
                >
                  <span>
                    <Button
                      size="middle"
                      danger={item.orderStatus === "CANCELLED"}
                      disabled={item.orderStatus !== "CANCELLED"}
                      icon={
                        <Trash
                          color={
                            item.orderStatus === "CANCELLED" ? "#ef4444" : "#94a3b8"
                          }
                          size={16}
                        />
                      }
                      onClick={() =>
                        confirm({
                          title: "Xác nhận xóa",
                          content:
                            "Bạn có chắc chắn muốn xóa vĩnh viễn đơn hàng đã hủy này?",
                          okText: "Xóa",
                          okType: "danger",
                          cancelText: "Hủy",
                          onOk: () => onRemoveBill(item.id),
                        })
                      }
                      style={{
                        width: 44,
                        padding: 0,
                        borderRadius: 8,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderColor:
                          item.orderStatus === "CANCELLED" ? "#fecaca" : "#e2e8f0",
                        background:
                          item.orderStatus === "CANCELLED" ? "#fef2f2" : "#f1f5f9",
                      }}
                    />
                  </span>
                </Tooltip>
              </div>
            </div>
          );
        })
      )}

      {/* Phân trang Mobile */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          padding: "16px 0 20px 0",
        }}
      >
        <Pagination
          current={page}
          pageSize={limit}
          total={total}
          size="small"
          showSizeChanger={false}
          onChange={(p, size) => {
            onPageChange(p, size);
          }}
          showTotal={(tot, range) => `${range[0]}-${range[1]} / ${tot} đơn`}
        />
      </div>
    </div>
  );
};
