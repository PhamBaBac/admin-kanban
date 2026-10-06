/** @format */

import React from "react";
import {
  Card,
  Col,
  Form,
  Input,
  Row,
  Button,
  Tooltip,
  Typography,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  AppstoreOutlined,
} from "@ant-design/icons";

const { Text } = Typography;

interface Props {
  isMobile: boolean;
  isLoading: boolean;
}

export const SubProductAttributesSection: React.FC<Props> = ({
  isMobile,
  isLoading,
}) => {
  return (
    <Card
      size="small"
      title={
        <div className="modal-card-title">
          <AppstoreOutlined />
          <span>Thuộc tính bổ sung</span>
        </div>
      }
      extra={
        <span style={{ fontSize: 12, color: "#64748b" }}>
          (Dung lượng, Size, RAM, Bộ nhớ...)
        </span>
      }
      style={{
        marginBottom: 16,
        borderRadius: 8,
        border: "1px solid #e2e8f0",
        boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.03)",
      }}
      styles={{
        header: {
          backgroundColor: "#f8fafc",
          borderBottom: "1px solid #f1f5f9",
          padding: isMobile ? "8px 12px" : "10px 16px",
        },
        body: { padding: isMobile ? "12px 12px" : "16px 18px" },
      }}
    >
      <Form.List name="customAttributes">
        {(fields, { add, remove }) => (
          <>
            {fields.map(({ key, name, ...restField }) => (
              <div
                key={key}
                style={{
                  backgroundColor: "#f8fafc",
                  padding: isMobile ? "8px 10px" : "10px 12px",
                  borderRadius: 6,
                  border: "1px solid #e2e8f0",
                  marginBottom: 8,
                }}
              >
                <Row gutter={[10, 10]} align="middle">
                  <Col xs={11} sm={11}>
                    <Form.Item
                      {...restField}
                      name={[name, "name"]}
                      rules={[{ required: true, message: "Nhập tên thuộc tính" }]}
                      style={{ marginBottom: 0 }}
                    >
                      <Input
                        placeholder="Tên thuộc tính (VD: Size, RAM...)"
                        allowClear
                        disabled={isLoading}
                        style={{ borderRadius: 6, height: 36 }}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={11} sm={11}>
                    <Form.Item
                      {...restField}
                      name={[name, "value"]}
                      rules={[{ required: true, message: "Nhập giá trị" }]}
                      style={{ marginBottom: 0 }}
                    >
                      <Input
                        placeholder="Giá trị (VD: XL, 128GB...)"
                        allowClear
                        disabled={isLoading}
                        style={{ borderRadius: 6, height: 36 }}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={2} sm={2} style={{ textAlign: "right" }}>
                    {fields.length > 1 ? (
                      <Tooltip title="Xóa thuộc tính này">
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => remove(name)}
                          disabled={isLoading}
                          style={{ borderRadius: 4, padding: 0 }}
                        />
                      </Tooltip>
                    ) : (
                      <div style={{ width: 24 }} />
                    )}
                  </Col>
                </Row>
              </div>
            ))}
            <Button
              type="dashed"
              onClick={() => add()}
              disabled={isLoading}
              block
              icon={<PlusOutlined />}
              style={{
                marginTop: 2,
                borderRadius: 6,
                height: 34,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              Thêm thuộc tính phân loại
            </Button>
          </>
        )}
      </Form.List>
    </Card>
  );
};
