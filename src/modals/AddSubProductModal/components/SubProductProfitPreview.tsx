/** @format */

import React from "react";
import {
  Alert,
  Col,
  Row,
  Tag,
  Typography,
} from "antd";
import {
  WarningOutlined,
  CloseCircleOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { PriceMarginResult } from "../hooks/usePriceMarginCalc";
import { VND } from "../../../utils/handleCurrency";

const { Text } = Typography;

interface Props {
  isMobile: boolean;
  watchedPrice: number;
  calcResult: PriceMarginResult;
}

export const SubProductProfitPreview: React.FC<Props> = ({
  isMobile,
  watchedPrice,
  calcResult,
}) => {
  const {
    discountAmount,
    discountPercent,
    effectivePrice,
    profitPerUnit,
    marginPercent,
    isLoss,
    isThinMargin,
    isGoodMargin,
  } = calcResult;

  return (
    <div
      style={{
        padding: isMobile ? "10px 12px" : "12px 14px",
        borderRadius: 8,
        backgroundColor: isLoss ? "#fff1f0" : isThinMargin ? "#fffbe6" : "#f6ffed",
        border: `1px solid ${isLoss ? "#ffa39e" : isThinMargin ? "#ffe58f" : "#b7eb8f"}`,
        marginBottom: 16,
      }}
    >
      {isLoss && (
        <Alert
          type="error"
          showIcon
          icon={<CloseCircleOutlined />}
          message="Cảnh báo: Bán lỗ sau giảm giá!"
          description={`Giá bán thực tế (${VND.format(effectivePrice)}) thấp hơn giá vốn. Mỗi sản phẩm bán ra sẽ lỗ ${VND.format(Math.abs(profitPerUnit))}.`}
          style={{ marginBottom: 8, borderRadius: 6 }}
        />
      )}

      {isThinMargin && (
        <Alert
          type="warning"
          showIcon
          icon={<WarningOutlined />}
          message="Biên lợi nhuận mỏng (<15%)"
          description={`Biên lãi gộp chỉ đạt ${marginPercent.toFixed(1)}% (${VND.format(profitPerUnit)}/sp). Hãy cân nhắc chi phí vận hành.`}
          style={{ marginBottom: 8, borderRadius: 6 }}
        />
      )}

      {isGoodMargin && (
        <Alert
          type="success"
          showIcon
          icon={<CheckCircleOutlined />}
          message="Biên lợi nhuận an toàn"
          description={`Biên lãi gộp đạt ${marginPercent.toFixed(1)}%, tạo ra ${VND.format(profitPerUnit)} lợi nhuận trên mỗi đơn vị.`}
          style={{ marginBottom: 8, borderRadius: 6 }}
        />
      )}

      <Row gutter={[8, 8]} align="middle">
        <Col xs={12} sm={6}>
          <div
            style={{
              backgroundColor: "#ffffff",
              padding: "6px 10px",
              borderRadius: 6,
              border: "1px solid rgba(0,0,0,0.06)",
              height: "100%",
            }}
          >
            <Text type="secondary" style={{ fontSize: 11 }}>
              Giá niêm yết
            </Text>
            <div
              style={{
                fontWeight: 600,
                fontSize: isMobile ? 13 : 14,
                textDecoration: discountAmount > 0 ? "line-through" : undefined,
                color: discountAmount > 0 ? "#94a3b8" : "#1e293b",
                marginTop: 1,
              }}
            >
              {VND.format(watchedPrice)}
            </div>
          </div>
        </Col>

        <Col xs={12} sm={6}>
          <div
            style={{
              backgroundColor: "#ffffff",
              padding: "6px 10px",
              borderRadius: 6,
              border: "1px solid rgba(0,0,0,0.06)",
              height: "100%",
            }}
          >
            <Text type="secondary" style={{ fontSize: 11 }}>
              Mức giảm
            </Text>
            <div
              style={{
                fontWeight: 600,
                fontSize: isMobile ? 13 : 14,
                color: discountAmount > 0 ? "#dc2626" : "#64748b",
                marginTop: 1,
              }}
            >
              {discountAmount > 0
                ? `-${VND.format(discountAmount)} (${discountPercent.toFixed(0)}%)`
                : "0₫"}
            </div>
          </div>
        </Col>

        <Col xs={12} sm={6}>
          <div
            style={{
              backgroundColor: "#ffffff",
              padding: "6px 10px",
              borderRadius: 6,
              border: "1px solid rgba(0,0,0,0.06)",
              height: "100%",
            }}
          >
            <Text type="secondary" style={{ fontSize: 11 }}>
              Khách trả thực tế
            </Text>
            <div
              style={{
                fontWeight: 700,
                fontSize: isMobile ? 14 : 15,
                color: "#1677ff",
                marginTop: 1,
              }}
            >
              {VND.format(effectivePrice)}
            </div>
          </div>
        </Col>

        <Col xs={12} sm={6}>
          <div
            style={{
              backgroundColor: "#ffffff",
              padding: "6px 10px",
              borderRadius: 6,
              border: "1px solid rgba(0,0,0,0.06)",
              height: "100%",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Text type="secondary" style={{ fontSize: 11 }}>
                Lãi gộp
              </Text>
              <Tag
                color={isLoss ? "error" : isThinMargin ? "warning" : "success"}
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  margin: 0,
                  padding: "0 4px",
                  borderRadius: 4,
                }}
              >
                {marginPercent.toFixed(1)}%
              </Tag>
            </div>
            <div
              style={{
                fontWeight: 700,
                fontSize: isMobile ? 13 : 14,
                color: profitPerUnit >= 0 ? "#16a34a" : "#dc2626",
                marginTop: 1,
              }}
            >
              {profitPerUnit >= 0 ? `+${VND.format(profitPerUnit)}` : VND.format(profitPerUnit)}
            </div>
          </div>
        </Col>
      </Row>
    </div>
  );
};
