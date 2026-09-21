/** @format */

import { ReactNode } from "react";
import { Typography } from "antd";

const { Text } = Typography;

interface Props {
  value: string;
  title: string;
  color?: string;
  type?: "vertical" | "horizontal";
  image?: string;
  icon?: ReactNode;
  trend?: string;
  isPositive?: boolean;
}

const StatisticComponent = (props: Props) => {
  const { value, title, color = "#1570EF", icon, image, trend, isPositive = true } = props;

  return (
    <div
      style={{
        padding: "12px 8px",
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        borderRadius: 10,
        height: "100%",
        minWidth: 0,
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 10,
          backgroundColor: `${color}14`,
          color: color,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          flexShrink: 0,
          marginTop: 2,
        }}
      >
        {icon ? (
          icon
        ) : (
          <img
            style={{
              width: 24,
              height: 24,
              objectFit: "contain",
            }}
            src={image}
            onError={(e) => {
              (e.target as HTMLElement).style.display = "none";
            }}
            alt=""
          />
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0, textAlign: "left", overflow: "hidden" }}>
        <div
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: "#64748b",
            marginBottom: 4,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {title}
        </div>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: "4px 6px",
          }}
        >
          <span
            style={{
              fontSize: "1.1rem",
              fontWeight: 700,
              color: "#0f172a",
              letterSpacing: "-0.02em",
              lineHeight: 1.2,
              whiteSpace: "nowrap",
            }}
          >
            {value}
          </span>
          {trend && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: isPositive ? "#12B76A" : "#F04438",
                backgroundColor: isPositive ? "#ecfdf5" : "#fef3f2",
                padding: "1px 5px",
                borderRadius: 999,
                whiteSpace: "nowrap",
                display: "inline-block",
              }}
            >
              {trend}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatisticComponent;
