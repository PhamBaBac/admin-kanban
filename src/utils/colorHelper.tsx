import React from "react";
import { Tag, Tooltip } from "antd";

/**
 * Bản đồ ánh xạ mã màu Hex phổ biến sang tên tiếng Việt
 */
export const COLOR_HEX_MAP: Record<string, string> = {
  "#000000": "Đen",
  "#ffffff": "Trắng",
  "#ff0000": "Đỏ",
  "#00ff00": "Xanh lá",
  "#0000ff": "Xanh dương",
  "#ffff00": "Vàng",
  "#ffa500": "Cam",
  "#800080": "Tím",
  "#ffc0cb": "Hồng",
  "#808080": "Xám",
  "#a52a2a": "Nâu",
  "#00ffff": "Xanh lơ",
  "#1570ef": "Xanh dương",
  "#12b76a": "Xanh lục",
  "#f79009": "Cam",
  "#f04438": "Đỏ cam",
  "#13c2c2": "Xanh ngọc",
  "#722ed1": "Tím đậm",
  "#eb2f96": "Hồng đậm",
  "#faad14": "Vàng cam",
  "#52c41a": "Xanh tươi",
  "#1890ff": "Xanh biển",
  "#2f54eb": "Xanh hoàng gia",
  "#334155": "Xám đậm",
  "#64748b": "Xám tro",
  "#f8fafc": "Trắng kem",
  "#f1f5f9": "Trắng xám",
};

/**
 * Lấy tên màu tiếng Việt từ mã hex hoặc trả về text tương ứng
 */
export const getColorName = (colorCode?: string): string => {
  if (!colorCode) return "";
  const clean = colorCode.trim().toLowerCase();
  return COLOR_HEX_MAP[clean] || colorCode;
};

/**
 * Component hiển thị chấm màu tròn trực quan + tên màu tiếng Việt
 */
export const ColorBadge: React.FC<{ color?: string; showText?: boolean; size?: number }> = ({
  color,
  showText = true,
  size = 14,
}) => {
  if (!color) return null;

  const colorLower = color.trim().toLowerCase();
  const colorName = COLOR_HEX_MAP[colorLower] || color;
  const isHex = color.startsWith("#") || color.startsWith("rgb");

  if (!isHex) {
    return (
      <Tag
        style={{
          margin: 0,
          fontSize: 12,
          fontWeight: 500,
          backgroundColor: "#f8fafc",
          border: "1px solid #e2e8f0",
          color: "#1e293b",
          borderRadius: 4,
          padding: "1px 8px",
        }}
      >
        {color}
      </Tag>
    );
  }

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        verticalAlign: "middle",
      }}
    >
      <span
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          backgroundColor: color,
          display: "inline-block",
          border: colorLower === "#ffffff" || colorLower === "white" ? "1px solid #d1d5db" : "1px solid rgba(0,0,0,0.1)",
          boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
          flexShrink: 0,
        }}
      />
      {showText && (
        <span style={{ fontSize: 12, color: "#334155", fontWeight: 500 }}>
          {colorName}
        </span>
      )}
    </span>
  );
};
