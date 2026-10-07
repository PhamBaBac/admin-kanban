/** @format */

import React from "react";
import {
  Modal,
  Space,
  Tag,
  Select,
  Input,
  Alert,
  Descriptions,
  Row,
  Col,
} from "antd";
import { TruckFast, Shop, Buildings } from "iconsax-react";
import { BillModel } from "../../../models/BillModel";

const PRESET_CANCEL_REASONS = [
  "Khách hàng liên hệ yêu cầu hủy",
  "Sản phẩm trong kho hết hàng / hỏng hóc",
  "Không thể liên lạc số điện thoại người nhận",
  "Nghi ngờ đơn hàng spam / giả mạo",
  "Khác",
];

const getNextAvailableStatuses = (currentStatus?: string): string[] => {
  switch (currentStatus) {
    case "PENDING":
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

interface OrderStatusModalProps {
  open: boolean;
  selectedOrder: BillModel | null;
  selectedStatus: string;
  trackingCode: string;
  carrier?: string;
  cancelReason: string;
  customReason: string;
  isUpdatingStatus: boolean;
  onClose: () => void;
  onStatusChange: (status: string) => void;
  onTrackingCodeChange: (code: string) => void;
  onCarrierChange?: (carrier: string) => void;
  onCancelReasonChange: (reason: string) => void;
  onCustomReasonChange: (custom: string) => void;
  onSubmit: () => void;
}

export const OrderStatusModal: React.FC<OrderStatusModalProps> = ({
  open,
  selectedOrder,
  selectedStatus,
  trackingCode,
  carrier,
  cancelReason,
  customReason,
  isUpdatingStatus,
  onClose,
  onStatusChange,
  onTrackingCodeChange,
  onCarrierChange,
  onCancelReasonChange,
  onCustomReasonChange,
  onSubmit,
}) => {
  const finalCancelReason = cancelReason === "Khác" ? customReason : cancelReason;
  const hasStatusChange = Boolean(
    selectedStatus && selectedStatus !== selectedOrder?.orderStatus
  );
  const hasTrackingChange =
    trackingCode.trim() !== (selectedOrder?.trackingCode || "").trim();
  const hasCarrierChange = Boolean(
    carrier && carrier !== (selectedOrder?.carrier || "GHN")
  );
  const isCancelWithoutReason =
    selectedStatus === "CANCELLED" && !finalCancelReason.trim();
  const isSubmitDisabled =
    (!hasStatusChange && !hasTrackingChange && !hasCarrierChange) || isCancelWithoutReason;

  return (
    <Modal
      title="Cập nhật trạng thái đơn hàng"
      open={open}
      onOk={onSubmit}
      onCancel={onClose}
      okText="Lưu thay đổi"
      cancelText="Hủy"
      confirmLoading={isUpdatingStatus}
      okButtonProps={{ disabled: isSubmitDisabled }}
    >
      {selectedOrder && (
        <Space direction="vertical" style={{ width: "100%" }} size="middle">
          <Descriptions size="small" column={1} bordered>
            <Descriptions.Item label="Mã đơn hàng">
              <strong>#{selectedOrder.id}</strong>
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái hiện tại">
              <Tag color={getOrderStatusColor(selectedOrder.orderStatus)}>
                {selectedOrder.orderStatus}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Khách hàng">
              {selectedOrder.nameRecipient || selectedOrder.userName || "N/A"}
            </Descriptions.Item>
          </Descriptions>

          <div>
            <div style={{ marginBottom: 8, fontWeight: 500 }}>
              Chuyển sang trạng thái mới:
            </div>
            <Select
              value={selectedStatus || undefined}
              onChange={onStatusChange}
              placeholder="Chọn trạng thái mới"
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
                  <strong>Đóng gói & Tạo vận đơn</strong> ở danh sách đơn hàng. Modal
                  này chỉ dùng để <strong>Hủy đơn hàng</strong>.
                </span>
              }
            />
          )}

          {selectedOrder.orderStatus !== "PENDING" && (
            <div>
              <div style={{ marginBottom: 8, fontWeight: 500 }}>
                Thông tin vận đơn & Đối tác giao hàng:
              </div>
              <Row gutter={8} style={{ marginBottom: 8 }}>
                <Col span={10}>
                  <Select
                    value={carrier || selectedOrder.carrier || "GHN"}
                    onChange={(val) => onCarrierChange && onCarrierChange(val)}
                    style={{ width: "100%" }}
                  >
                    <Select.Option value="GHN">
                      <Space size={6}>
                        <TruckFast size={14} color="#1677ff" />
                        <span>GHN</span>
                      </Space>
                    </Select.Option>
                    <Select.Option value="SHOP_DELIVERY">
                      <Space size={6}>
                        <Shop size={14} color="#16a34a" />
                        <span>Shop tự ship</span>
                      </Space>
                    </Select.Option>
                    <Select.Option value="VIETTEL_POST">
                      <Space size={6}>
                        <Buildings size={14} color="#dc2626" />
                        <span>ViettelPost</span>
                      </Space>
                    </Select.Option>
                    <Select.Option value="GHTK">
                      <Space size={6}>
                        <Buildings size={14} color="#16a34a" />
                        <span>GHTK</span>
                      </Space>
                    </Select.Option>
                    <Select.Option value="J_AND_T">
                      <Space size={6}>
                        <Buildings size={14} color="#ea580c" />
                        <span>J&T Express</span>
                      </Space>
                    </Select.Option>
                    <Select.Option value="VNPOST">
                      <Space size={6}>
                        <Buildings size={14} color="#ca8a04" />
                        <span>VNPost</span>
                      </Space>
                    </Select.Option>
                    <Select.Option value="OTHER">
                      <Space size={6}>
                        <Buildings size={14} color="#64748b" />
                        <span>Khác</span>
                      </Space>
                    </Select.Option>
                  </Select>
                </Col>
                <Col span={14}>
                  <Input
                    prefix={<TruckFast size={16} color="#888" />}
                    placeholder="Mã vận đơn (VD: L5G7S1, VT123...)"
                    value={trackingCode}
                    onChange={(e) => onTrackingCodeChange(e.target.value)}
                    allowClear
                  />
                </Col>
              </Row>
              <div style={{ fontSize: "12px", color: "#888" }}>
                Cập nhật hãng vận chuyển và mã vận đơn thực tế để theo dõi đơn hàng linh hoạt.
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
                onChange={onCancelReasonChange}
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
                  onChange={(e) => onCustomReasonChange(e.target.value)}
                />
              )}
              <Alert
                type="warning"
                showIcon
                style={{ marginTop: 10, borderRadius: 6 }}
                message="Thông báo đến khách hàng"
                description="Khi xác nhận hủy đơn, hệ thống sẽ tự động hoàn tồn kho và gửi thông báo kèm lý do hủy này đến tài khoản của khách hàng."
              />
            </div>
          )}
        </Space>
      )}
    </Modal>
  );
};
