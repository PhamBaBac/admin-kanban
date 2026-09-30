/** @format */

import React, { useState } from "react";
import { Button, Card, Col, Collapse, Row, Tag, Tooltip, Typography, message, theme } from "antd";
import { useNavigate } from "react-router-dom";
import {
  ReloadOutlined,
  HomeOutlined,
  WarningOutlined,
  CopyOutlined,
  CheckCircleOutlined,
  CustomerServiceOutlined,
} from "@ant-design/icons";
import {
  IoServerOutline,
  IoPulseOutline,
  IoCloudOfflineOutline,
  IoSpeedometerOutline,
  IoWifiOutline,
} from "react-icons/io5";

const { Title, Paragraph, Text } = Typography;
const { useToken } = theme;

const ServerErrorScreen: React.FC = () => {
  const navigate = useNavigate();
  const { token } = useToken();

  const [isRetrying, setIsRetrying] = useState(false);
  const [isCheckingPing, setIsCheckingPing] = useState(false);
  const [copied, setCopied] = useState(false);

  const [incidentId] = useState(
    () => `ADMIN-500-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
  );
  const timestamp = new Date().toISOString();

  const handleReload = () => {
    setIsRetrying(true);
    message.loading({ content: "Đang tải lại trang...", key: "retry" });
    setTimeout(() => {
      window.location.reload();
    }, 800);
  };

  const handlePingServer = async () => {
    setIsCheckingPing(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const res = await fetch("http://localhost:8080/actuator/health", {
        method: "GET",
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.status < 500) {
        message.success("Máy chủ Backend đã phản hồi! Bạn có thể tải lại trang.");
      } else {
        message.warning(`Máy chủ trả về mã ${res.status}. Vui lòng kiểm tra lại dịch vụ.`);
      }
    } catch {
      message.error("Không thể kết nối tới máy chủ Backend (Port 8080). Hãy kiểm tra dịch vụ Springboot.");
    } finally {
      setIsCheckingPing(false);
    }
  };

  const handleCopyDebugInfo = () => {
    const debugInfo = JSON.stringify(
      {
        incidentId,
        statusCode: 500,
        portal: "ADMIN_KANBAN",
        timestamp,
        url: window.location.href,
        userAgent: navigator.userAgent,
      },
      null,
      2
    );

    navigator.clipboard.writeText(debugInfo);
    setCopied(true);
    message.success("Đã sao chép mã sự cố!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      style={{
        minHeight: "80vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 16px",
      }}
    >
      <div style={{ maxWidth: 800, width: "100%", textAlign: "center" }}>
        {/* Status Tag */}
        <div style={{ marginBottom: 20 }}>
          <Tag
            color="error"
            style={{
              padding: "6px 16px",
              fontSize: 14,
              borderRadius: 20,
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <WarningOutlined />
            HTTP 500 • INTERNAL SERVER ERROR
          </Tag>
        </div>

        {/* Big Icon */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 110,
            height: 110,
            borderRadius: 28,
            background: "#FEE2E2",
            color: "#DC2626",
            border: "1px solid #FCA5A5",
            marginBottom: 20,
          }}
        >
          <IoServerOutline size={56} />
        </div>

        <Title level={2} style={{ margin: "8px 0 12px", fontWeight: 700 }}>
          Lỗi kết nối máy chủ quản trị (500)
        </Title>

        <Paragraph
          type="secondary"
          style={{ fontSize: "1rem", maxWidth: 620, margin: "0 auto 28px", lineHeight: 1.6 }}
        >
          Đường dẫn quản trị hoàn toàn chính xác, tuy nhiên hệ thống máy chủ backend không thể xử lý yêu cầu lúc này.
          Sự cố có thể do mất kết nối Database, máy chủ quá tải hoặc backend đang khởi động lại.
        </Paragraph>

        {/* 3 cards */}
        <Row gutter={[16, 16]} style={{ marginBottom: 32, textAlign: "left" }}>
          <Col xs={24} sm={8}>
            <Card size="small" style={{ borderRadius: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <IoSpeedometerOutline size={18} color="#EA580C" />
                <Text strong>Cơ sở dữ liệu</Text>
              </div>
              <Text type="secondary" style={{ fontSize: "0.85rem" }}>
                Kết nối PostgreSQL/MySQL timeout hoặc pool kết nối đang quá tải.
              </Text>
            </Card>
          </Col>

          <Col xs={24} sm={8}>
            <Card size="small" style={{ borderRadius: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <IoCloudOfflineOutline size={18} color="#2563EB" />
                <Text strong>Máy chủ backend</Text>
              </div>
              <Text type="secondary" style={{ fontSize: "0.85rem" }}>
                Springboot Service tạm ngừng hoặc đang trong quá trình bảo trì.
              </Text>
            </Card>
          </Col>

          <Col xs={24} sm={8}>
            <Card size="small" style={{ borderRadius: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <IoWifiOutline size={18} color="#16A34A" />
                <Text strong>Đường truyền mạng</Text>
              </div>
              <Text type="secondary" style={{ fontSize: "0.85rem" }}>
                Gián đoạn kết nối socket/mạng giữa frontend và API gateway.
              </Text>
            </Card>
          </Col>
        </Row>

        {/* Action Buttons */}
        <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap", marginBottom: 28 }}>
          <Button
            type="primary"
            danger
            size="large"
            icon={<ReloadOutlined />}
            loading={isRetrying}
            onClick={handleReload}
            style={{ borderRadius: 8, height: 44, padding: "0 24px" }}
          >
            Tải lại trang ngay
          </Button>

          <Button
            size="large"
            icon={<IoPulseOutline size={18} />}
            loading={isCheckingPing}
            onClick={handlePingServer}
            style={{ borderRadius: 8, height: 44 }}
          >
            Kiểm tra kết nối backend
          </Button>

          <Button
            size="large"
            icon={<HomeOutlined />}
            onClick={() => navigate("/")}
            style={{ borderRadius: 8, height: 44 }}
          >
            Về trang chủ Admin
          </Button>
        </div>

        {/* Diagnostics collapse */}
        <div style={{ maxWidth: 640, margin: "0 auto", textAlign: "left" }}>
          <Collapse
            ghost
            items={[
              {
                key: "1",
                label: (
                  <span style={{ fontSize: "0.85rem", color: token.colorTextSecondary }}>
                    Thông tin sự cố kỹ thuật (Dành cho Quản trị viên / Dev)
                  </span>
                ),
                children: (
                  <div
                    style={{
                      background: "#F8FAFC",
                      padding: "12px 16px",
                      borderRadius: 8,
                      border: "1px solid #E2E8F0",
                      fontFamily: "monospace",
                      fontSize: "0.82rem",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <Text strong>
                        Incident ID: <span style={{ color: "#DC2626" }}>{incidentId}</span>
                      </Text>
                      <Tooltip title={copied ? "Đã chép" : "Sao chép"}>
                        <Button
                          type="text"
                          size="small"
                          icon={copied ? <CheckCircleOutlined style={{ color: "#16A34A" }} /> : <CopyOutlined />}
                          onClick={handleCopyDebugInfo}
                        >
                          {copied ? "Đã chép" : "Sao chép"}
                        </Button>
                      </Tooltip>
                    </div>
                    <div>• Status: 500 Internal Server Error</div>
                    <div>• Time: {timestamp}</div>
                    <div>• Path: {window.location.pathname}</div>
                  </div>
                ),
              },
            ]}
          />
        </div>
      </div>
    </div>
  );
};

export default ServerErrorScreen;
