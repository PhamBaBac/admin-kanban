/** @format */

import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ProductModel, SubProductModel } from "../../models/Products";
import { useProducts } from "../../hooks/useProducts";
import {
  Empty,
  Space,
  Spin,
  Typography,
  Table,
  Avatar,
  Tag,
  Button,
  Modal,
  message,
  Tooltip,
} from "antd";
import { CopyOutlined } from "@ant-design/icons";
import { ColumnProps } from "antd/es/table";
import { Edit2, Trash } from "iconsax-react";
import { VND } from "../../utils/handleCurrency";
import { colors } from "../../constants/colors";
import { AddSubProductModal } from "../../modals";
import { ColorBadge } from "../../utils/colorHelper";

const ProductDetail = () => {
  const { getSubProducts, deleteSubProduct, loading, error } = useProducts();
  const [productDetail, setProductDetail] = useState<ProductModel>();
  const [subProducts, setSubProducts] = useState<SubProductModel[]>([]);
  const [productSelected, setProductSelected] = useState<ProductModel>();
  const [isVisibleAddSubProduct, setIsVisibleAddSubProduct] = useState(false);
  const [subProductSelected, setSubProductSelected] =
    useState<SubProductModel>();
  const [cloneVariant, setCloneVariant] = useState<Partial<SubProductModel>>();
  const [removingSubProductId, setRemovingSubProductId] = useState<
    string | null
  >(null);

  const [searchParams] = useSearchParams();

  const id = searchParams.get("id");

  useEffect(() => {
    if (id) {
      getProductDetail();
    }
  }, [id]);

  useEffect(() => {
    setProductSelected(productDetail);
  }, [productDetail]);

  const getProductDetail = async () => {
    if (!id) return;

    try {
      const response = await getSubProducts(id);
      setProductDetail(response);
      setSubProducts(response);
    } catch (error) {
      console.log(error);
    }
  };

  const handleRemoveSubProduct = async (subProductId: string) => {
    setRemovingSubProductId(subProductId);
    try {
      await deleteSubProduct(subProductId); // chỉ truyền subProductId
      // update state
      setSubProducts((prev) =>
        prev.filter((element) => element.id !== subProductId)
      );
      message.success("SubProduct removed");
    } catch (error) {
      console.log(error);
      message.error("Failed to remove subProduct");
    } finally {
      setRemovingSubProductId(null);
    }
  };

  const columns: ColumnProps<SubProductModel>[] = [
    {
      key: "images",
      dataIndex: "images",
      title: "Images",
      render: (imgs: string[] | null | undefined) => (
        <Space>
          {imgs && imgs.length > 0 ? (
            imgs.map((img, idx) => (
              <Avatar key={img + idx} src={img} size={40} />
            ))
          ) : (
            <Avatar size={40} icon={null} />
          )}
        </Space>
      ),
    },
    {
      title: "Mã SKU",
      key: "sku",
      dataIndex: "sku",
      render: (sku: string, item: SubProductModel) => (
        <Typography.Text copyable strong style={{ fontSize: 12, color: colors.primary500 }}>
          {sku || item.id?.substring(0, 8).toUpperCase() || "—"}
        </Typography.Text>
      ),
    },
    {
      title: "Phân loại / Thuộc tính",
      key: "attributes",
      render: (_: any, item: SubProductModel) => {
        const attrs = item.attributes;
        if (attrs && Object.keys(attrs).length > 0) {
          return (
            <Space wrap size={[4, 4]}>
              {Object.entries(attrs).map(([key, val]) => {
                const isColor =
                  key.toLowerCase() === "color" || key.toLowerCase() === "màu sắc";
                const isHexColor = isColor && val.startsWith("#");
                return (
                  <Tag
                    key={key}
                    color={isHexColor ? val : undefined}
                    style={{
                      border: isHexColor ? "1px solid #bbb" : undefined,
                      fontWeight: 500,
                    }}
                  >
                    {key}: {val}
                  </Tag>
                );
              })}
            </Space>
          );
        }
        return (
          <Space wrap size={[6, 4]}>
            {item.color && <ColorBadge color={item.color} size={14} />}
            {item.size && <Tag style={{ margin: 0 }}>Size {item.size}</Tag>}
          </Space>
        );
      },
    },
    {
      key: "cost",
      title: "Giá vốn",
      dataIndex: "cost",
      render: (cost: number) => (cost ? VND.format(cost) : "—"),
      align: "right",
    },
    {
      key: "price",
      title: "Giá gốc",
      dataIndex: "price",
      render: (price: number, item: SubProductModel) => {
        const hasDiscount = typeof item.discount === "number" && item.discount > 0 && item.discount < item.price;
        return (
          <Typography.Text style={{ textDecoration: hasDiscount ? "line-through" : undefined, color: hasDiscount ? "#8c8c8c" : undefined }}>
            {VND.format(price)}
          </Typography.Text>
        );
      },
      align: "right",
    },
    {
      key: "discount",
      title: "Khuyến mãi",
      render: (_: any, item: SubProductModel) => {
        const hasDiscount = typeof item.discount === "number" && item.discount > 0 && item.discount < item.price;
        if (!hasDiscount || item.discount === undefined) return <Typography.Text type="secondary">—</Typography.Text>;
        const discountAmount = item.price - item.discount;
        const discountPercent = Math.round((discountAmount / item.price) * 100);
        return (
          <Space direction="vertical" size={0} align="end">
            <Typography.Text style={{ color: "#cf1322", fontWeight: 500, fontSize: 12 }}>
              -{VND.format(discountAmount)}
            </Typography.Text>
            <Tag color="red" style={{ margin: 0, fontSize: 10 }}>
              -{discountPercent}%
            </Tag>
          </Space>
        );
      },
      align: "right",
    },
    {
      key: "salePrice",
      title: "Giá bán thực tế",
      render: (_: any, item: SubProductModel) => {
        const hasDiscount = typeof item.discount === "number" && item.discount > 0 && item.discount < item.price;
        const actualPrice = hasDiscount && item.discount !== undefined ? item.discount : item.price;
        return (
          <Typography.Text strong style={{ color: "#1677ff", fontSize: 13 }}>
            {VND.format(actualPrice)}
          </Typography.Text>
        );
      },
      align: "right",
    },
    {
      key: "profit",
      title: "Lãi gộp ước tính",
      render: (_: any, item: SubProductModel) => {
        const hasDiscount = typeof item.discount === "number" && item.discount > 0 && item.discount < item.price;
        const actualPrice = hasDiscount && item.discount !== undefined ? item.discount : item.price;
        const cost = item.cost || 0;
        const profit = actualPrice - cost;
        const margin = actualPrice > 0 ? (profit / actualPrice) * 100 : 0;
        if (!item.cost) return <Typography.Text type="secondary">—</Typography.Text>;
        return (
          <Space direction="vertical" size={0} align="end">
            <Typography.Text style={{ fontWeight: 600, color: profit >= 0 ? "#52c41a" : "#cf1322" }}>
              {profit >= 0 ? `+${VND.format(profit)}` : VND.format(profit)}
            </Typography.Text>
            <Tag color={profit < 0 ? "error" : margin < 15 ? "warning" : "success"} style={{ margin: 0, fontSize: 11 }}>
              {margin.toFixed(0)}% margin
            </Tag>
          </Space>
        );
      },
      align: "right",
    },
    {
      key: "stock",
      title: "Tồn kho",
      dataIndex: "stock",
      render: (stock: number) => stock.toLocaleString(),
      align: "right",
    },
    {
      key: "actions",
      dataIndex: "",
      render: (item: SubProductModel) => (
        <Space>
          <Tooltip title="Chép biến thể">
            <Button
              type="text"
              onClick={() => {
                setProductSelected(productDetail);
                setSubProductSelected(undefined); // Chế độ thêm mới
                const { id: _, ...rest } = item;
                setCloneVariant({
                  ...rest,
                  images: item.images ? [...item.images] : [],
                  attributes: item.attributes ? { ...item.attributes } : undefined,
                });
                setIsVisibleAddSubProduct(true);
              }}
              icon={
                <CopyOutlined
                  style={{ fontSize: 18, color: colors.primary500 }}
                />
              }
            />
          </Tooltip>
          <Tooltip title="Chỉnh sửa biến thể">
            <Button
              type="text"
              onClick={() => {
                setCloneVariant(undefined);
                setSubProductSelected(item);
                setIsVisibleAddSubProduct(true);
              }}
              icon={<Edit2 variant="Bold" color={colors.primary500} size={18} />}
            />
          </Tooltip>
          <Tooltip title="Xóa biến thể">
            <Button
              loading={removingSubProductId === item.id}
              onClick={() =>
                Modal.confirm({
                  title: "Confirm",
                  content:
                    "Are you sure you want to remove this sub product item?",
                  onOk: async () => {
                    await handleRemoveSubProduct(item.id);
                  },
                })
              }
              type="text"
              danger
              icon={<Trash variant="Bold" size={18} />}
            />
          </Tooltip>
        </Space>
      ),
      align: "right",
      fixed: "right",
    },
  ];

  return productDetail ? (
    <div className="container">
      <div className="row">
        <div className="col">
          <Typography.Title level={3}>{productDetail?.title}</Typography.Title>
        </div>
        <div className="col text-right">
          <Button
            onClick={() => {
              setProductSelected(productDetail); // Đảm bảo luôn có productSelected
              setSubProductSelected(undefined); // Reset biến thể được chọn để là THÊM MỚI
              setCloneVariant(undefined);
              setIsVisibleAddSubProduct(true);
            }}
            type="primary"
          >
            Thêm biến thể mới
          </Button>
        </div>
      </div>
      <div className="mt-4">
        <Table columns={columns} dataSource={subProducts} rowKey="id" />
      </div>
      {productDetail && (
        <AddSubProductModal
          product={productSelected}
          visible={isVisibleAddSubProduct}
          initialValues={cloneVariant}
          onClose={() => {
            setSubProductSelected(undefined);
            setCloneVariant(undefined);
            setIsVisibleAddSubProduct(false);
          }}
          subProduct={subProductSelected}
          onAddNew={(val) => {
            setSubProducts((prev) => {
              const exists = prev.find((item) => item.id === val.id);
              if (exists) {
                // Nếu là update, thay thế phần tử cũ
                return prev.map((item) => (item.id === val.id ? val : item));
              }
              // Nếu là thêm mới, thêm vào cuối mảng
              return [...prev, val];
            });
            setSubProductSelected(undefined);
            setCloneVariant(undefined);
          }}
        />
      )}
    </div>
  ) : loading ? (
    <Spin />
  ) : (
    <Empty description="Data not found!!!" />
  );
};

export default ProductDetail;
