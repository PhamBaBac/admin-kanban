/** @format */

import React from "react";
import {
  Card,
  Col,
  Divider,
  Form,
  InputNumber,
  Row,
  Segmented,
  Tag,
  Typography,
} from "antd";
import {
  DollarOutlined,
  GiftOutlined,
  PercentageOutlined,
} from "@ant-design/icons";
import { VND } from "../../../utils/handleCurrency";

const { Text } = Typography;

interface Props {
  isMobile: boolean;
  isLoading: boolean;
  watchedPrice: number;
  watchedDiscountType: string;
  watchedDiscountValue: number;
  onSetDiscountValue: (val: number) => void;
  onSetDiscountType: (type: string) => void;
}

export const SubProductPricingSection: React.FC<Props> = ({
  isMobile,
  isLoading,
  watchedPrice,
  watchedDiscountType,
  watchedDiscountValue,
  onSetDiscountValue,
  onSetDiscountType,
}) => {
  return (
    <Card
      size="small"
      title={
        <div className="modal-card-title">
          <DollarOutlined />
          <span>Quản lý Tồn kho & Định giá bán</span>
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
        <Col xs={24} sm={8}>
          <Form.Item
            name="qty"
            label="Tồn kho ban đầu"
            rules={[{ required: true, message: "Nhập số lượng tồn" }]}
            style={{ marginBottom: isMobile ? 14 : 0 }}
          >
            <InputNumber<number>
              min={0}
              style={{ width: "100%", borderRadius: 6, height: 38 }}
              placeholder="0"
              disabled={isLoading}
              formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
              parser={(v) => Number(v?.replace(/\$\s?|(,*)/g, "") || 0)}
            />
          </Form.Item>
        </Col>

        <Col xs={24} sm={8}>
          <Form.Item
            name="cost"
            label="Giá vốn (Nhập hàng)"
            rules={[{ required: true, message: "Nhập giá vốn" }]}
            style={{ marginBottom: isMobile ? 14 : 0 }}
          >
            <InputNumber<number>
              min={0}
              style={{ width: "100%", borderRadius: 6, height: 38 }}
              addonAfter="₫"
              placeholder="0"
              disabled={isLoading}
              formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
              parser={(v) => Number(v?.replace(/\$\s?|(,*)/g, "") || 0)}
            />
          </Form.Item>
        </Col>

        <Col xs={24} sm={8}>
          <Form.Item
            name="price"
            label="Giá bán niêm yết (Gốc)"
            rules={[{ required: true, message: "Nhập giá bán" }]}
            style={{ marginBottom: isMobile ? 14 : 0 }}
          >
            <InputNumber<number>
              min={0}
              style={{ width: "100%", borderRadius: 6, height: 38 }}
              addonAfter="₫"
              placeholder="0"
              disabled={isLoading}
              formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
              parser={(v) => Number(v?.replace(/\$\s?|(,*)/g, "") || 0)}
            />
          </Form.Item>
        </Col>
      </Row>

      <Divider style={{ margin: "18px 0 14px" }} />

      {/* KHỐI CẤU HÌNH GIẢM GIÁ */}
      <div
        style={{
          backgroundColor: "#f8fafc",
          padding: isMobile ? "12px 14px" : "14px 16px",
          borderRadius: 8,
          border: "1px solid #e2e8f0",
          marginBottom: 14,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            justifyContent: "space-between",
            alignItems: isMobile ? "stretch" : "center",
            marginBottom: 12,
            gap: isMobile ? 10 : 12,
          }}
        >
          <div className="modal-card-title">
            <GiftOutlined />
            <span>Chương trình giảm giá riêng</span>
          </div>
          <div style={{ width: isMobile ? "100%" : "auto", minWidth: isMobile ? "100%" : 300 }}>
            <Form.Item name="discountType" initialValue="NONE" noStyle>
              <Segmented
                block
                disabled={isLoading}
                value={watchedDiscountType || "NONE"}
                onChange={(val) => onSetDiscountType(String(val))}
                options={[
                  {
                    value: "NONE",
                    label: isMobile ? "Không" : "Không giảm",
                  },
                  {
                    value: "PERCENT",
                    label: "Giảm %",
                    icon: <PercentageOutlined />,
                  },
                  {
                    value: "DISCOUNT",
                    label: "Giảm tiền",
                    icon: <DollarOutlined />,
                  },
                ]}
              />
            </Form.Item>
          </div>
        </div>

        {watchedDiscountType === "PERCENT" && (
          <div style={{ marginTop: 10 }}>
            <Row gutter={[16, 10]} align="middle">
              <Col xs={24} sm={10}>
                <Form.Item
                  name="discountValue"
                  label="Mức giảm theo phần trăm (%)"
                  style={{ marginBottom: 0 }}
                  rules={[{ required: true, message: "Nhập % giảm (1-100)" }]}
                >
                  <InputNumber
                    min={1}
                    max={100}
                    disabled={isLoading}
                    style={{ width: "100%", borderRadius: 6, height: 36 }}
                    addonAfter="%"
                    placeholder="VD: 15, 20"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={14}>
                <div style={{ marginTop: isMobile ? 8 : 0 }}>
                  <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Gợi ý nhanh:
                    </Text>
                    {[5, 10, 15, 20, 25, 30, 50].map((pct) => (
                      <Tag
                        key={pct}
                        color={watchedDiscountValue === pct ? "blue" : undefined}
                        style={{
                          cursor: "pointer",
                          fontSize: 12,
                          padding: "2px 8px",
                          borderRadius: 4,
                          margin: 0,
                        }}
                        onClick={() => onSetDiscountValue(pct)}
                      >
                        -{pct}%
                      </Tag>
                    ))}
                  </div>
                </div>
              </Col>
            </Row>
          </div>
        )}

        {watchedDiscountType === "DISCOUNT" && (
          <div style={{ marginTop: 10 }}>
            <Row gutter={[16, 10]} align="middle">
              <Col xs={24} sm={10}>
                <Form.Item
                  name="discountValue"
                  label="Số tiền giảm trực tiếp (VND)"
                  style={{ marginBottom: 0 }}
                  rules={[{ required: true, message: "Nhập số tiền giảm" }]}
                >
                  <InputNumber<number>
                    min={1000}
                    max={watchedPrice || undefined}
                    disabled={isLoading}
                    style={{ width: "100%", borderRadius: 6, height: 38 }}
                    addonAfter="₫"
                    placeholder="VD: 50,000"
                    formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                    parser={(v) => Number(v?.replace(/\$\s?|(,*)/g, "") || 0)}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={14}>
                <div style={{ marginTop: isMobile ? 8 : 0 }}>
                  <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Gợi ý nhanh:
                    </Text>
                    {[20000, 50000, 100000, 200000, 500000].map((amt) => (
                      <Tag
                        key={amt}
                        color={watchedDiscountValue === amt ? "blue" : undefined}
                        style={{
                          cursor: "pointer",
                          fontSize: 12,
                          padding: "2px 8px",
                          borderRadius: 4,
                          margin: 0,
                        }}
                        onClick={() => onSetDiscountValue(amt)}
                      >
                        -{VND.format(amt)}
                      </Tag>
                    ))}
                  </div>
                </div>
              </Col>
            </Row>
          </div>
        )}

        {watchedDiscountType === "NONE" && (
          <div style={{ color: "#64748b", fontSize: 12, lineHeight: 1.5, marginTop: 6 }}>
            Biến thể sẽ bán theo đúng giá niêm yết (Không áp dụng chương trình giảm giá riêng).
          </div>
        )}
      </div>
    </Card>
  );
};
