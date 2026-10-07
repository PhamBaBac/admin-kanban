/** @format */

import React from "react";
import {
  Card,
  Table,
  Button,
  Tag,
  Typography,
  Space,
  Avatar,
  Tooltip,
  Modal,
  Empty,
} from "antd";
import {
  AppstoreOutlined,
  CopyOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { Edit2, Trash } from "iconsax-react";
import { SubProductModel } from "../../../models/Products";
import { VND } from "../../../utils/handleCurrency";
import { colors } from "../../../constants/colors";
import { ColorBadge } from "../../../utils/colorHelper";

const { Text } = Typography;

interface ProductVariantsTableSectionProps {
  subProducts: SubProductModel[];
  loadingSubProducts: boolean;
  onOpenCreateModal: () => void;
  onCloneVariant: (variant: SubProductModel) => void;
  onEditVariant: (variant: SubProductModel) => void;
  onDeleteVariant: (subProductId: string) => void;
}

const isSystemAttr = (k: string) => {
  const lower = k.trim().toLowerCase();
  return (
    lower === "discounttype" ||
    lower === "discountvalue" ||
    lower === "discountamount" ||
    lower === "discount" ||
    lower === "price" ||
    lower === "cost" ||
    lower === "stock" ||
    lower === "qty"
  );
};

export const ProductVariantsTableSection: React.FC<ProductVariantsTableSectionProps> = ({
  subProducts,
  loadingSubProducts,
  onOpenCreateModal,
  onCloneVariant,
  onEditVariant,
  onDeleteVariant,
}) => {
  const subProductColumns = [
    {
      key: "images",
      title: "Ảnh",
      dataIndex: "images",
      width: 60,
      render: (imgs: string[] | null | undefined) => (
        <Avatar
          src={imgs && imgs.length > 0 ? imgs[0] : undefined}
          size={36}
          shape="square"
        />
      ),
    },
    {
      title: "Mã SKU",
      key: "sku",
      dataIndex: "sku",
      render: (sku: string, item: SubProductModel) => (
        <Text copyable strong style={{ fontSize: 12, color: colors.primary500 }}>
          {sku || item.id?.substring(0, 8).toUpperCase() || "—"}
        </Text>
      ),
    },
    {
      title: "Phân loại",
      key: "attributes",
      width: 220,
      render: (_: any, item: SubProductModel) => {
        let attrs = item.attributes;
        if (typeof attrs === "string") {
          try {
            attrs = JSON.parse(attrs);
          } catch {
            attrs = undefined;
          }
        }
        const validEntries = attrs && typeof attrs === "object"
          ? Object.entries(attrs).filter(([key]) => !isSystemAttr(key))
          : [];

        if (validEntries.length > 0) {
          return (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 4,
                width: "100%",
                maxWidth: "100%",
              }}
            >
              {validEntries.map(([key, val]) => {
                const isColor =
                  key.toLowerCase() === "color" || key.toLowerCase() === "màu sắc";
                const isHexColor =
                  isColor && typeof val === "string" && val.startsWith("#");
                return (
                  <Tag
                    key={key}
                    color={isHexColor ? val : undefined}
                    style={{
                      border: isHexColor ? "1px solid #bbb" : undefined,
                      fontSize: 11,
                      maxWidth: "100%",
                      whiteSpace: "normal",
                      wordBreak: "break-word",
                      height: "auto",
                      lineHeight: 1.4,
                      padding: "2px 8px",
                      margin: 0,
                    }}
                  >
                    {key}: {val}
                  </Tag>
                );
              })}
            </div>
          );
        }
        return (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 6,
              alignItems: "center",
              width: "100%",
              maxWidth: "100%",
            }}
          >
            {item.color && <ColorBadge color={item.color} size={14} />}
            {item.size && (
              <Tag
                style={{
                  margin: 0,
                  maxWidth: "100%",
                  whiteSpace: "normal",
                  wordBreak: "break-word",
                  height: "auto",
                  lineHeight: 1.4,
                  padding: "2px 8px",
                }}
              >
                Size {item.size}
              </Tag>
            )}
          </div>
        );
      },
    },
    {
      key: "cost",
      title: "Giá vốn",
      dataIndex: "cost",
      minWidth: 110,
      render: (cost: number) => (
        <span style={{ whiteSpace: "nowrap" }}>
          {cost ? VND.format(cost) : "—"}
        </span>
      ),
      align: "right" as const,
    },
    {
      key: "price",
      title: "Giá gốc",
      dataIndex: "price",
      minWidth: 110,
      render: (price: number, item: SubProductModel) => {
        const hasDiscount =
          typeof item.discount === "number" &&
          item.discount > 0 &&
          item.discount < item.price;
        return (
          <Text
            style={{
              textDecoration: hasDiscount ? "line-through" : undefined,
              color: hasDiscount ? "#8c8c8c" : undefined,
              whiteSpace: "nowrap",
            }}
          >
            {VND.format(price)}
          </Text>
        );
      },
      align: "right" as const,
    },
    {
      key: "discount",
      title: "Khuyến mãi",
      minWidth: 110,
      render: (_: any, item: SubProductModel) => {
        const hasDiscount =
          typeof item.discount === "number" &&
          item.discount > 0 &&
          item.discount < item.price;
        if (!hasDiscount || item.discount === undefined)
          return <Text type="secondary">—</Text>;
        const discountAmount = item.price - item.discount;
        const discountPercent = Math.round((discountAmount / item.price) * 100);
        return (
          <Space
            direction="vertical"
            size={0}
            align="end"
            style={{ width: "100%" }}
          >
            <Text
              style={{
                color: "#cf1322",
                fontWeight: 500,
                fontSize: 11,
                whiteSpace: "nowrap",
              }}
            >
              -{VND.format(discountAmount)}
            </Text>
            <Tag color="red" style={{ margin: 0, fontSize: 10 }}>
              -{discountPercent}%
            </Tag>
          </Space>
        );
      },
      align: "right" as const,
    },
    {
      key: "salePrice",
      title: "Giá bán thực tế",
      minWidth: 120,
      render: (_: any, item: SubProductModel) => {
        const hasDiscount =
          typeof item.discount === "number" &&
          item.discount > 0 &&
          item.discount < item.price;
        const actualPrice =
          hasDiscount && item.discount !== undefined ? item.discount : item.price;
        return (
          <Text
            strong
            style={{ color: "#1677ff", fontSize: 12, whiteSpace: "nowrap" }}
          >
            {VND.format(actualPrice)}
          </Text>
        );
      },
      align: "right" as const,
    },
    {
      key: "profit",
      title: "Lãi gộp ước tính",
      minWidth: 120,
      render: (_: any, item: SubProductModel) => {
        const hasDiscount =
          typeof item.discount === "number" &&
          item.discount > 0 &&
          item.discount < item.price;
        const actualPrice =
          hasDiscount && item.discount !== undefined ? item.discount : item.price;
        const cost = item.cost || 0;
        const profit = actualPrice - cost;
        const margin = actualPrice > 0 ? (profit / actualPrice) * 100 : 0;
        if (!item.cost) return <Text type="secondary">—</Text>;
        return (
          <Space
            direction="vertical"
            size={0}
            align="end"
            style={{ width: "100%" }}
          >
            <Text
              style={{
                fontWeight: 600,
                color: profit >= 0 ? "#52c41a" : "#cf1322",
                fontSize: 12,
                whiteSpace: "nowrap",
              }}
            >
              {profit >= 0 ? `+${VND.format(profit)}` : VND.format(profit)}
            </Text>
            <Tag
              color={profit < 0 ? "error" : margin < 15 ? "warning" : "success"}
              style={{ margin: 0, fontSize: 10 }}
            >
              {margin.toFixed(0)}%
            </Tag>
          </Space>
        );
      },
      align: "right" as const,
    },
    {
      key: "stock",
      title: "Tồn kho",
      dataIndex: "stock",
      minWidth: 80,
      render: (stock: number) => (
        <span style={{ fontWeight: 600, whiteSpace: "nowrap" }}>
          {stock?.toLocaleString() ?? 0}
        </span>
      ),
      align: "right" as const,
    },
    {
      key: "actions",
      title: "Thao tác",
      align: "center" as const,
      render: (item: SubProductModel) => (
        <Space size={2}>
          <Tooltip title="Nhân bản">
            <Button
              type="text"
              size="small"
              icon={<CopyOutlined style={{ color: colors.primary500 }} />}
              onClick={() => onCloneVariant(item)}
            />
          </Tooltip>
          <Tooltip title="Chỉnh sửa">
            <Button
              type="text"
              size="small"
              icon={<Edit2 variant="Bold" color={colors.primary500} size={15} />}
              onClick={() => onEditVariant(item)}
            />
          </Tooltip>
          <Tooltip title="Xóa">
            <Button
              type="text"
              size="small"
              danger
              icon={<Trash variant="Bold" size={15} />}
              onClick={() =>
                Modal.confirm({
                  title: "Xác nhận xóa biến thể",
                  content: "Bạn có chắc chắn muốn xóa biến thể phân loại này không?",
                  okText: "Xóa",
                  cancelText: "Hủy",
                  okButtonProps: { danger: true },
                  onOk: () => onDeleteVariant(item.id),
                })
              }
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className="col-12 mt-2">
      <Card
        title={
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Space size={8}>
              <AppstoreOutlined style={{ color: "#1677ff", fontSize: 18 }} />
              <Text strong style={{ fontSize: 15 }}>
                Danh sách biến thể phân loại (SKU & Tồn kho)
              </Text>
              <Tag color="blue" style={{ borderRadius: 12, fontWeight: 600 }}>
                {subProducts.length} biến thể
              </Tag>
            </Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={onOpenCreateModal}
              style={{ borderRadius: 6, fontWeight: 500 }}
            >
              Thêm biến thể mới
            </Button>
          </div>
        }
        style={{ borderRadius: 8, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}
      >
        <Table
          bordered
          columns={subProductColumns}
          dataSource={subProducts}
          rowKey="id"
          loading={loadingSubProducts}
          pagination={false}
          size="middle"
          scroll={{ x: "max-content" }}
          locale={{
            emptyText: (
              <Empty
                description="Sản phẩm này chưa có biến thể phân loại nào"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              >
                <Button
                  type="dashed"
                  icon={<PlusOutlined />}
                  onClick={onOpenCreateModal}
                >
                  Tạo biến thể đầu tiên
                </Button>
              </Empty>
            ),
          }}
        />
      </Card>
    </div>
  );
};
