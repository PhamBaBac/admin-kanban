/** @format */

import React from "react";
import {
  Card,
  Col,
  Form,
  Input,
  Row,
  Button,
} from "antd";
import {
  BarcodeOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";

interface Props {
  isMobile: boolean;
  isLoading: boolean;
  onAutoGenerateSku: () => void;
}

export const SubProductGeneralSection: React.FC<Props> = ({
  isMobile,
  isLoading,
  onAutoGenerateSku,
}) => {
  return (
    <Card
      size="small"
      title={
        <div className="modal-card-title">
          <BarcodeOutlined />
          <span>Định danh & Mã SKU</span>
        </div>
      }
      style={{
        marginBottom: 16,
        borderRadius: 8,
        border: "1px solid #e2e8f0",
        boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.03)",
      }}
      headStyle={{
        backgroundColor: "#f8fafc",
        borderBottom: "1px solid #f1f5f9",
        padding: isMobile ? "8px 12px" : "10px 16px",
      }}
      bodyStyle={{ padding: isMobile ? "12px 12px" : "16px 18px" }}
    >
      <Row gutter={[20, 16]}>
        <Col xs={24}>
          <Form.Item
            name="sku"
            label={
              <div className="form-item-header">
                <span>Mã SKU phân loại</span>
                <Button
                  type="link"
                  size="small"
                  icon={<ThunderboltOutlined />}
                  onClick={onAutoGenerateSku}
                  disabled={isLoading}
                  style={{ padding: 0, height: "auto", fontSize: 12 }}
                >
                  Tạo tự động
                </Button>
              </div>
            }
            style={{ marginBottom: 0 }}
          >
            <Input
              prefix={<BarcodeOutlined style={{ color: "#94a3b8" }} />}
              placeholder="Mã SKU (VD: IPHONE15-128G-BLK)"
              style={{ textTransform: "uppercase", height: 38, borderRadius: 6 }}
              allowClear
              disabled={isLoading}
            />
          </Form.Item>
        </Col>
      </Row>
    </Card>
  );
};
