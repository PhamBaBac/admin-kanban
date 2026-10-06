/** @format */

import React from "react";
import {
  Modal,
  Space,
  Tag,
  Button,
  Spin,
  Descriptions,
  Divider,
  Timeline,
} from "antd";
import { TruckFast, Clock, Location } from "iconsax-react";
import { BillModel } from "../../../models/BillModel";

interface GHNTrackingModalProps {
  open: boolean;
  trackingOrder: BillModel | null;
  trackingData: any;
  trackingLoading: boolean;
  onClose: () => void;
}

export const GHNTrackingModal: React.FC<GHNTrackingModalProps> = ({
  open,
  trackingOrder,
  trackingData,
  trackingLoading,
  onClose,
}) => {
  return (
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
      open={open}
      onCancel={onClose}
      footer={[
        <Button
          key="ghnLink"
          type="default"
          onClick={() => {
            const code = trackingData?.orderCode || trackingOrder?.trackingCode;
            if (code) {
              window.open(
                `https://tracking.ghn.dev/?order_code=${code}`,
                "_blank"
              );
            }
          }}
        >
          Mở trên GHN Tracking
        </Button>,
        <Button key="close" type="primary" onClick={onClose}>
          Đóng
        </Button>,
      ]}
      width={680}
    >
      {trackingLoading ? (
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <Spin size="large" />
          <div style={{ marginTop: 12, color: "#64748b", fontSize: 13 }}>Đang lấy dữ liệu từ hệ thống GHN...</div>
        </div>
      ) : trackingData ? (
        <div>
          <Descriptions size="small" bordered column={2}>
            <Descriptions.Item label="Mã vận đơn GHN">
              <strong style={{ color: "#13c2c2" }}>
                {trackingData.orderCode || trackingOrder?.trackingCode}
              </strong>
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái GHN">
              <Tag color="blue">
                {trackingData.statusName || trackingData.status}
              </Tag>
            </Descriptions.Item>
            {trackingData.expectedDeliveryTime && (
              <Descriptions.Item label="Dự kiến giao" span={2}>
                <Space>
                  <Clock size={16} color="#52c41a" />
                  <span>
                    {new Date(
                      trackingData.expectedDeliveryTime
                    ).toLocaleString("vi-VN")}
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
                                style={{
                                  marginRight: 4,
                                  verticalAlign: "middle",
                                }}
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
                              {new Date(
                                log.updatedDate || log.action_at
                              ).toLocaleString("vi-VN")}
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
                            {trackingData.statusName ||
                              "Mới tạo đơn - Chờ lấy hàng"}
                          </div>
                          <div style={{ fontSize: "12px", color: "#666" }}>
                            Đơn hàng đã được tạo thành công trên hệ thống GHN. Bưu
                            tá sẽ sớm đến lấy hàng tại shop.
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
  );
};
