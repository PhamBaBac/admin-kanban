/** @format */

import React from "react";
import { Typography } from "antd";

const { Title, Paragraph } = Typography;

const NotFoundScreen: React.FC = () => {
  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px",
        backgroundColor: "#f9fafb",
        color: "#111827",
        textAlign: "center",
        userSelect: "none",
      }}
    >
      <div
        style={{
          fontSize: "clamp(5.5rem, 15vw, 9rem)",
          fontWeight: 900,
          lineHeight: 1,
          letterSpacing: "-0.04em",
          marginBottom: 8,
          color: "#e2e8f0",
        }}
      >
        404
      </div>

      <Title
        level={1}
        style={{
          fontSize: "clamp(1.5rem, 3.5vw, 2.2rem)",
          fontWeight: 700,
          margin: "0 0 12px 0",
          color: "#1f2937",
          letterSpacing: "-0.02em",
        }}
      >
        404 - Không tìm thấy trang
      </Title>

      <Paragraph
        style={{
          fontSize: "1rem",
          color: "#6b7280",
          maxWidth: 460,
          margin: 0,
          lineHeight: 1.6,
        }}
      >
        Trang bạn đang tìm kiếm không tồn tại, đã bị xóa hoặc đường dẫn không chính xác.
      </Paragraph>
    </div>
  );
};

export default NotFoundScreen;
