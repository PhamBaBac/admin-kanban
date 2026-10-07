/** @format */

import React, { useState } from "react";
import {
  Modal,
  Space,
  Tag,
  Button,
  Spin,
  Steps,
  Row,
  Col,
  Typography,
  message,
  Tooltip,
} from "antd";
import {
  TruckFast,
  Clock,
  Location,
  Copy,
  ExportSquare,
  TickCircle,
  CloseCircle,
  Box,
  DollarCircle,
  Routing,
  User,
  Call,
  Warning2,
} from "iconsax-react";
import { BillModel, ShipmentModel } from "../../../models/BillModel";

const { Text, Title } = Typography;

export interface GHNTrackingModalProps {
  open: boolean;
  trackingOrder?: BillModel | ShipmentModel | any | null;
  shipment?: ShipmentModel | null;
  trackingData: any;
  trackingLoading: boolean;
  onClose: () => void;
}

// Chuyển đổi mã trạng thái GHN sang cấu hình hiển thị UI sang trọng
const getTrackingStatusConfig = (statusRaw?: string) => {
  const status = (statusRaw || "").toLowerCase().trim();

  if (status === "cancel") {
    return {
      title: "Đơn hàng đã hủy",
      subtitle: "Vận đơn đã bị hủy trên hệ thống GHN",
      color: "#dc2626",
      bg: "#fef2f2",
      border: "#fecaca",
      badgeColor: "error",
      icon: <CloseCircle size={22} color="#dc2626" variant="Bold" />,
      timelineDotColor: "#dc2626",
      stepCurrent: 3,
      stepStatus: "error" as const,
      isCancelled: true,
    };
  }

  if (status === "delivered") {
    return {
      title: "Giao hàng thành công",
      subtitle: "Kiện hàng đã được giao an toàn tới người nhận",
      color: "#16a34a",
      bg: "#f0fdf4",
      border: "#bbf7d0",
      badgeColor: "success",
      icon: <TickCircle size={22} color="#16a34a" variant="Bold" />,
      timelineDotColor: "#16a34a",
      stepCurrent: 3,
      stepStatus: "finish" as const,
      isCancelled: false,
    };
  }

  if (status === "delivering" || status === "money_collect_delivering") {
    return {
      title: "Đang trên đường giao",
      subtitle: "Bưu tá GHN đang đi giao kiện hàng đến địa chỉ nhận",
      color: "#0284c7",
      bg: "#f0f9ff",
      border: "#bae6fd",
      badgeColor: "processing",
      icon: <TruckFast size={22} color="#0284c7" variant="Bold" />,
      timelineDotColor: "#0284c7",
      stepCurrent: 2,
      stepStatus: "process" as const,
      isCancelled: false,
    };
  }

  if (
    ["picked", "storing", "transporting", "sorting"].includes(status)
  ) {
    return {
      title: "Đang luân chuyển / Trong kho",
      subtitle: "Kiện hàng đang được xử lý trong mạng lưới bưu cục GHN",
      color: "#ea580c",
      bg: "#fff7ed",
      border: "#fed7aa",
      badgeColor: "warning",
      icon: <Box size={22} color="#ea580c" variant="Bold" />,
      timelineDotColor: "#ea580c",
      stepCurrent: 1,
      stepStatus: "process" as const,
      isCancelled: false,
    };
  }

  if (["delivery_fail", "damage", "lost", "return_fail"].includes(status)) {
    return {
      title: "Gặp sự cố vận chuyển",
      subtitle: "Kiện hàng gặp sự cố trong quá trình vận chuyển",
      color: "#d92d20",
      bg: "#fff1f0",
      border: "#ffa39e",
      badgeColor: "error",
      icon: <Warning2 size={22} color="#d92d20" variant="Bold" />,
      timelineDotColor: "#d92d20",
      stepCurrent: 2,
      stepStatus: "error" as const,
      isCancelled: true,
    };
  }

  // Mới tạo đơn / chờ lấy hàng
  return {
    title: "Mới tạo đơn - Chờ lấy hàng",
    subtitle: "Đã tạo vận đơn trên GHN, bưu tá sẽ sớm lấy hàng tại shop",
    color: "#d97706",
    bg: "#fffbeb",
    border: "#fde68a",
    badgeColor: "warning",
    icon: <Clock size={22} color="#d97706" variant="Bold" />,
    timelineDotColor: "#d97706",
    stepCurrent: 0,
    stepStatus: "process" as const,
    isCancelled: false,
  };
};

// Tách ngày giờ rõ ràng, tránh dính chữ
const formatDateTime = (raw?: string) => {
  if (!raw) return { time: "", date: "" };
  try {
    const d = new Date(raw);
    if (isNaN(d.getTime())) {
      // Trường hợp chuỗi có định dạng sẵn
      const parts = raw.trim().split(" ");
      if (parts.length >= 2) {
        return { time: parts[0], date: parts[1] };
      }
      return { time: raw, date: "" };
    }
    const time = d.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    const date = d.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    return { time, date };
  } catch {
    return { time: raw, date: "" };
  }
};

export const GHNTrackingModal: React.FC<GHNTrackingModalProps> = ({
  open,
  trackingOrder,
  shipment,
  trackingData,
  trackingLoading,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  // Xác định mã vận đơn
  const trackingCode =
    trackingData?.orderCode ||
    shipment?.trackingCode ||
    trackingOrder?.trackingCode ||
    "";

  // Xác định số tiền COD & phí ship
  const codAmount =
    trackingData?.codAmount ??
    shipment?.codAmount ??
    trackingOrder?.codAmount ??
    0;

  const shippingFee =
    trackingData?.shippingFee ??
    shipment?.shippingFee ??
    trackingOrder?.shippingFee ??
    0;

  // Xác định cân nặng & kích thước
  const weight =
    trackingData?.weight ?? shipment?.weight ?? trackingOrder?.weight;
  const dimensions =
    shipment?.length && shipment?.width && shipment?.height
      ? `${shipment.length} x ${shipment.width} x ${shipment.height} cm`
      : null;

  // Trạng thái hiện tại
  const currentStatus = trackingData?.status || shipment?.shippingStatus || "";
  const statusConfig = getTrackingStatusConfig(currentStatus);

  // Copy mã vận đơn
  const handleCopyCode = () => {
    if (!trackingCode) return;
    navigator.clipboard.writeText(trackingCode);
    setCopied(true);
    message.success("Đã sao chép mã vận đơn GHN!");
    setTimeout(() => setCopied(false), 2000);
  };

  // Mở trang tracking chính thức của GHN
  const handleOpenGhnTracking = () => {
    if (trackingCode) {
      window.open(
        `https://tracking.ghn.dev/?order_code=${trackingCode}`,
        "_blank"
      );
    }
  };

  const logs = trackingData?.logs || [];

  return (
    <Modal
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 12px rgba(234, 88, 12, 0.25)",
            }}
          >
            <TruckFast color="#ffffff" size={22} variant="Bold" />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>
                Chi tiết lộ trình vận chuyển GHN
              </span>
              <Tag
                color="orange"
                style={{
                  borderRadius: 6,
                  fontWeight: 600,
                  fontSize: 11,
                  padding: "0 6px",
                  lineHeight: "20px",
                }}
              >
                GHN Express
              </Tag>
            </div>
            {trackingCode && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  marginTop: 2,
                }}
              >
                <Text style={{ fontSize: 13, color: "#64748b" }}>
                  Mã vận đơn:
                </Text>
                <strong style={{ color: "#0284c7", fontSize: 13 }}>
                  {trackingCode}
                </strong>
                <Tooltip title={copied ? "Đã sao chép" : "Sao chép mã"}>
                  <Button
                    type="text"
                    size="small"
                    icon={<Copy size={14} color="#0284c7" />}
                    onClick={handleCopyCode}
                    style={{ padding: "0 4px", height: 20 }}
                  />
                </Tooltip>
              </div>
            )}
          </div>
        </div>
      }
      open={open}
      onCancel={onClose}
      footer={[
        <Button
          key="ghnLink"
          icon={<ExportSquare size={16} />}
          onClick={handleOpenGhnTracking}
          style={{
            borderRadius: 8,
            fontWeight: 500,
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          Mở trên GHN Tracking
        </Button>,
        <Button
          key="close"
          type="primary"
          onClick={onClose}
          style={{
            borderRadius: 8,
            fontWeight: 600,
            backgroundColor: "#2563eb",
            boxShadow: "0 2px 8px rgba(37, 99, 235, 0.25)",
          }}
        >
          Đóng
        </Button>,
      ]}
      width={720}
      styles={{
        body: { maxHeight: "78vh", overflowY: "auto", padding: "12px 20px 24px" },
      }}
    >
      {trackingLoading ? (
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <Spin size="large" />
          <div style={{ marginTop: 16, color: "#64748b", fontSize: 14, fontWeight: 500 }}>
            Đang tải dữ liệu thời gian thực từ Giao Hàng Nhanh...
          </div>
        </div>
      ) : trackingData ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Status Banner */}
          <div
            style={{
              backgroundColor: statusConfig.bg,
              border: `1px solid ${statusConfig.border}`,
              borderRadius: 12,
              padding: "14px 18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  backgroundColor: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                  flexShrink: 0,
                }}
              >
                {statusConfig.icon}
              </div>
              <div>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: statusConfig.color,
                  }}
                >
                  {trackingData?.statusName || statusConfig.title}
                </div>
                <div style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>
                  {statusConfig.subtitle}
                </div>
              </div>
            </div>

            <Tag
              color={statusConfig.badgeColor}
              style={{
                borderRadius: 8,
                fontWeight: 600,
                fontSize: 12,
                padding: "4px 10px",
                margin: 0,
              }}
            >
              {trackingData?.statusName || statusConfig.title}
            </Tag>
          </div>

          {/* Stepper 4 chặng vận chuyển */}
          <div
            style={{
              backgroundColor: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: 12,
              padding: "16px 20px",
            }}
          >
            <Steps
              size="small"
              current={statusConfig.stepCurrent}
              status={statusConfig.stepStatus}
              items={[
                {
                  title: (
                    <span style={{ fontSize: 13, fontWeight: 600 }}>Tạo đơn</span>
                  ),
                  description: (
                    <span style={{ fontSize: 11, color: "#64748b" }}>
                      Shop đóng gói
                    </span>
                  ),
                },
                {
                  title: (
                    <span style={{ fontSize: 13, fontWeight: 600 }}>Lấy hàng</span>
                  ),
                  description: (
                    <span style={{ fontSize: 11, color: "#64748b" }}>
                      Bưu cục tiếp nhận
                    </span>
                  ),
                },
                {
                  title: (
                    <span style={{ fontSize: 13, fontWeight: 600 }}>Đang giao</span>
                  ),
                  description: (
                    <span style={{ fontSize: 11, color: "#64748b" }}>
                      Shipper phát hàng
                    </span>
                  ),
                },
                {
                  title: (
                    <span style={{ fontSize: 13, fontWeight: 600 }}>
                      {statusConfig.isCancelled ? "Đã hủy" : "Hoàn thành"}
                    </span>
                  ),
                  description: (
                    <span
                      style={{
                        fontSize: 11,
                        color: statusConfig.isCancelled ? "#dc2626" : "#64748b",
                      }}
                    >
                      {statusConfig.isCancelled ? "Hủy vận đơn" : "Đã giao khách"}
                    </span>
                  ),
                },
              ]}
            />
          </div>

          {/* Grid 4 Cards Thống kê tài chính & Vận đơn */}
          <Row gutter={[12, 12]}>
            {/* Card 1: Tiền thu COD */}
            <Col xs={12} sm={6}>
              <div
                style={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: 10,
                  padding: "12px 14px",
                  height: "100%",
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    color: "#64748b",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    marginBottom: 4,
                  }}
                >
                  <DollarCircle size={15} color="#ea580c" />
                  <span>Thu hộ (COD)</span>
                </div>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: codAmount > 0 ? "#e11d48" : "#16a34a",
                  }}
                >
                  {codAmount > 0
                    ? `${codAmount.toLocaleString("vi-VN")} ₫`
                    : "0 ₫ (Đã thanh toán)"}
                </div>
              </div>
            </Col>

            {/* Card 2: Cước phí GHN */}
            <Col xs={12} sm={6}>
              <div
                style={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: 10,
                  padding: "12px 14px",
                  height: "100%",
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    color: "#64748b",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    marginBottom: 4,
                  }}
                >
                  <TruckFast size={15} color="#0284c7" />
                  <span>Cước phí GHN</span>
                </div>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: "#0f172a",
                  }}
                >
                  {shippingFee > 0
                    ? `${shippingFee.toLocaleString("vi-VN")} ₫`
                    : "—"}
                </div>
              </div>
            </Col>

            {/* Card 3: Thông số gói hàng */}
            <Col xs={12} sm={6}>
              <div
                style={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: 10,
                  padding: "12px 14px",
                  height: "100%",
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    color: "#64748b",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    marginBottom: 4,
                  }}
                >
                  <Box size={15} color="#7c3aed" />
                  <span>Cân nặng</span>
                </div>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#0f172a",
                  }}
                >
                  {weight ? `${weight} g` : "500 g"}
                  {dimensions && (
                    <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 400 }}>
                      {dimensions}
                    </div>
                  )}
                </div>
              </div>
            </Col>

            {/* Card 4: Dự kiến giao */}
            <Col xs={12} sm={6}>
              <div
                style={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: 10,
                  padding: "12px 14px",
                  height: "100%",
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    color: "#64748b",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    marginBottom: 4,
                  }}
                >
                  <Clock size={15} color="#16a34a" />
                  <span>Dự kiến giao</span>
                </div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#0f172a",
                  }}
                >
                  {trackingData?.expectedDeliveryTime
                    ? new Date(
                      trackingData.expectedDeliveryTime
                    ).toLocaleDateString("vi-VN")
                    : "Theo lịch GHN"}
                </div>
              </div>
            </Col>
          </Row>

          {/* Card Người nhận & Địa chỉ giao hàng (nếu có) */}
          {(trackingData?.toName || trackingData?.toAddress) && (
            <div
              style={{
                backgroundColor: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: 10,
                padding: "12px 16px",
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 8,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <User size={16} color="#475569" />
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>
                    Người nhận: {trackingData.toName || "Khách hàng"}
                  </span>
                </div>
                {trackingData.toPhone && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Call size={14} color="#0284c7" />
                    <a
                      href={`tel:${trackingData.toPhone}`}
                      style={{ fontSize: 13, fontWeight: 600, color: "#0284c7" }}
                    >
                      {trackingData.toPhone}
                    </a>
                  </div>
                )}
              </div>
              {trackingData.toAddress && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 8,
                    fontSize: 12,
                    color: "#64748b",
                  }}
                >
                  <Location size={15} color="#0284c7" style={{ flexShrink: 0, marginTop: 2 }} />
                  <span>{trackingData.toAddress}</span>
                </div>
              )}
            </div>
          )}

          {/* Lịch sử hành trình (Timeline Section) */}
          <div
            style={{
              backgroundColor: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: 12,
              padding: "16px 18px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 16,
                paddingBottom: 10,
                borderBottom: "1px solid #f1f5f9",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Routing size={18} color="#0284c7" variant="Bold" />
                <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>
                  Lịch sử hành trình chi tiết (Timeline)
                </span>
              </div>
              <Tag
                style={{
                  borderRadius: 12,
                  fontSize: 11,
                  fontWeight: 600,
                  backgroundColor: "#f1f5f9",
                  color: "#475569",
                  border: "none",
                }}
              >
                {logs.length > 0 ? `${logs.length} mốc ghi nhận` : "Khởi tạo"}
              </Tag>
            </div>

            {logs && logs.length > 0 ? (
              <div style={{ paddingLeft: 6 }}>
                {logs.map((log: any, idx: number) => {
                  const isLatest = idx === 0;
                  const logCfg = getTrackingStatusConfig(log.status);
                  const dt = formatDateTime(log.updatedDate || log.action_at);

                  return (
                    <div
                      key={idx}
                      style={{
                        position: "relative",
                        paddingBottom: idx === logs.length - 1 ? 0 : 16,
                        paddingLeft: 28,
                      }}
                    >
                      {/* Đường nối dọc */}
                      {idx !== logs.length - 1 && (
                        <div
                          style={{
                            position: "absolute",
                            left: 8,
                            top: 18,
                            bottom: 0,
                            width: 2,
                            backgroundColor: "#e2e8f0",
                          }}
                        />
                      )}

                      {/* Icon mốc tròn */}
                      <div
                        style={{
                          position: "absolute",
                          left: 0,
                          top: 2,
                          width: 18,
                          height: 18,
                          borderRadius: "50%",
                          backgroundColor: isLatest ? logCfg.color : "#94a3b8",
                          border: "3px solid #ffffff",
                          boxShadow: isLatest
                            ? `0 0 0 3px ${logCfg.bg}`
                            : "0 0 0 2px #e2e8f0",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      />

                      {/* Card chi tiết mốc hành trình */}
                      <div
                        style={{
                          backgroundColor: isLatest ? "#f8fafc" : "#ffffff",
                          border: isLatest
                            ? `1px solid ${logCfg.border}`
                            : "1px solid #f1f5f9",
                          borderRadius: 10,
                          padding: "10px 14px",
                          transition: "all 0.2s ease",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            flexWrap: "wrap",
                            gap: 6,
                            marginBottom: 4,
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span
                              style={{
                                fontSize: 14,
                                fontWeight: 700,
                                color: isLatest ? logCfg.color : "#1e293b",
                              }}
                            >
                              {log.statusName || log.status}
                            </span>
                            {isLatest && (
                              <Tag
                                color={logCfg.badgeColor}
                                style={{
                                  fontSize: 10,
                                  fontWeight: 700,
                                  borderRadius: 6,
                                  lineHeight: "18px",
                                  padding: "0 6px",
                                }}
                              >
                                Mới nhất
                              </Tag>
                            )}
                          </div>

                          {/* Badge Ngày Giờ tách biệt */}
                          {(dt.time || dt.date) && (
                            <div
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 6,
                                fontSize: 11,
                                color: "#64748b",
                                backgroundColor: isLatest ? "#ffffff" : "#f8fafc",
                                border: "1px solid #e2e8f0",
                                borderRadius: 6,
                                padding: "2px 8px",
                              }}
                            >
                              <Clock size={12} color="#64748b" />
                              <strong style={{ color: "#0f172a" }}>
                                {dt.time}
                              </strong>
                              {dt.date && <span>• {dt.date}</span>}
                            </div>
                          )}
                        </div>

                        {log.location && (
                          <div
                            style={{
                              fontSize: 12,
                              color: "#475569",
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                              marginTop: 4,
                            }}
                          >
                            <Location size={14} color="#0284c7" />
                            <span>{log.location}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "16px",
                  borderRadius: 10,
                  backgroundColor: "#f8fafc",
                  border: "1px dashed #cbd5e1",
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    backgroundColor: "#e2e8f0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Clock size={18} color="#64748b" />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>
                    {trackingData.statusName || "Mới tạo đơn - Chờ lấy hàng"}
                  </div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>
                    Đơn hàng đã được ghi nhận trên hệ thống GHN. Lộ trình chi tiết sẽ tự động cập nhật ngay khi bưu tá quét mã kiện hàng.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div
          style={{
            textAlign: "center",
            padding: "50px 20px",
            color: "#64748b",
          }}
        >
          <Warning2 size={40} color="#94a3b8" />
          <div style={{ fontSize: 15, fontWeight: 600, color: "#1e293b", marginTop: 12 }}>
            Không tìm thấy thông tin vận đơn
          </div>
          <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>
            Mã vận đơn chưa tồn tại trên GHN hoặc vừa mới tạo nên chưa kịp đồng bộ dữ liệu.
          </div>
        </div>
      )}
    </Modal>
  );
};

export default GHNTrackingModal;
      )}
    </Modal >
  );
};

export default GHNTrackingModal;
