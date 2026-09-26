import { useEffect, useState } from "react";
import { useSearchParams, useNavigate, useParams } from "react-router-dom";
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
  Card,
} from "antd";
import { CopyOutlined, PlusOutlined } from "@ant-design/icons";
import { ColumnProps } from "antd/es/table";
import { Edit2, Trash, ArrowLeft, Box } from "iconsax-react";
import { VND } from "../../utils/handleCurrency";
import { colors } from "../../constants/colors";
import { AddSubProductModal } from "../../modals";
import { ColorBadge } from "../../utils/colorHelper";

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

const ProductDetail = () => {
  const navigate = useNavigate();
  const { slug } = useParams();
  const { getProductById, getSubProducts, deleteSubProduct, loading, error } = useProducts();
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
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const [searchParams] = useSearchParams();

  const id = searchParams.get("id");

  useEffect(() => {
    if (id) {
      getProductDetail();
    }
  }, [id, slug]);

  const getProductDetail = async () => {
    if (!id) return;

    try {
      const [prodRes, subsRes] = await Promise.allSettled([
        getProductById(slug || "product", id),
        getSubProducts(id),
      ]);

      if (prodRes.status === "fulfilled" && prodRes.value) {
        const prod = prodRes.value.product || prodRes.value;
        setProductDetail(prod);
        setProductSelected(prod);
      }

      if (subsRes.status === "fulfilled" && subsRes.value) {
        const subs = Array.isArray(subsRes.value) ? subsRes.value : [];
        setSubProducts(subs);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleRemoveSubProduct = async (subProductId: string) => {
    setRemovingSubProductId(subProductId);
    try {
      await deleteSubProduct(subProductId); 
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
      title: "Hình ảnh",
      width: 120,
      render: (imgs: string[] | null | undefined) => {
        if (!imgs || imgs.length === 0) {
          return <Avatar size={36} icon={null} style={{ background: "#f1f5f9" }} />;
        }
        return (
          <Avatar.Group maxCount={2} size={36}>
            {imgs.map((img, idx) => (
              <Avatar key={img + idx} src={img} style={{ border: "1px solid #e2e8f0" }} />
            ))}
          </Avatar.Group>
        );
      },
    },
    {
      title: "Mã SKU",
      key: "sku",
      dataIndex: "sku",
      width: 140,
      render: (sku: string, item: SubProductModel) => (
        <Typography.Text copyable strong style={{ fontSize: 12, color: colors.primary500 }}>
          {sku || item.id?.substring(0, 8).toUpperCase() || "—"}
        </Typography.Text>
      ),
    },
    {
      title: "Phân loại / Thuộc tính",
      key: "attributes",
      width: 240,
      render: (_: any, item: SubProductModel) => {
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

        const attrs = item.attributes;
        const validEntries = attrs
          ? Object.entries(attrs).filter(([key]) => !isSystemAttr(key))
          : [];

        if (validEntries.length > 0) {
          return (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, width: "100%", maxWidth: "100%" }}>
              {validEntries.map(([key, val]) => {
                const isColor =
                  key.toLowerCase() === "color" || key.toLowerCase() === "màu sắc";
                const isHexColor = isColor && typeof val === "string" && val.startsWith("#");
                return (
                  <Tag
                    key={key}
                    color={isHexColor ? val : undefined}
                    style={{
                      border: isHexColor ? "1px solid #bbb" : undefined,
                      fontWeight: 500,
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
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center", width: "100%", maxWidth: "100%" }}>
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
      width: 120,
      render: (cost: number) => (cost ? VND.format(cost) : "—"),
      align: "right",
    },
    {
      key: "price",
      title: "Giá gốc",
      dataIndex: "price",
      width: 120,
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
      width: 120,
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
      width: 130,
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
      width: 140,
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
      width: 100,
      render: (stock: number) => stock.toLocaleString(),
      align: "right",
    },
    {
      key: "actions",
      title: "Thao tác",
      dataIndex: "",
      width: 130,
      align: "center" as const,
      fixed: "right" as const,
      render: (item: SubProductModel) => (
        <Space size={2}>
          <Tooltip title="Chép biến thể">
            <Button
              size="small"
              type="text"
              onClick={() => {
                setProductSelected(productDetail);
                setSubProductSelected(undefined);
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
                  style={{ fontSize: 16, color: colors.primary500 }}
                />
              }
            />
          </Tooltip>
          <Tooltip title="Chỉnh sửa biến thể">
            <Button
              size="small"
              type="text"
              onClick={() => {
                setCloneVariant(undefined);
                setProductSelected(productDetail);
                setSubProductSelected(item);
                setIsVisibleAddSubProduct(true);
              }}
              icon={<Edit2 variant="Bold" color={colors.primary500} size={16} />}
            />
          </Tooltip>
          <Tooltip title="Xóa biến thể">
            <Button
              size="small"
              loading={removingSubProductId === item.id}
              onClick={() =>
                Modal.confirm({
                  title: "Xác nhận xóa",
                  content: "Bạn có chắc muốn xóa biến thể này?",
                  okText: "Xóa",
                  cancelText: "Hủy",
                  okType: "danger",
                  onOk: async () => {
                    await handleRemoveSubProduct(item.id);
                  },
                })
              }
              type="text"
              danger
              icon={<Trash variant="Bold" size={16} />}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const totalStock = (subProducts || []).reduce(
    (sum, item) => sum + (item.stock || 0),
    0
  );

  return productDetail ? (
    <div style={{ padding: "8px 0" }}>
      {/* Header Điều hướng & Thao tác */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-3">
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <Button
            icon={<ArrowLeft size={18} />}
            onClick={() => navigate("/inventory")}
            style={{ borderRadius: 8, display: "inline-flex", alignItems: "center" }}
          >
            Quay lại
          </Button>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <Typography.Title level={4} style={{ margin: 0, fontWeight: 700 }}>
              {productDetail?.title}
            </Typography.Title>
            <Tag color="blue" style={{ fontWeight: 600, margin: 0 }}>
              {subProducts.length} biến thể
            </Tag>
            <Tag color="cyan" style={{ fontWeight: 600, margin: 0 }}>
              Tổng tồn: {totalStock.toLocaleString()} sp
            </Tag>
          </div>
        </div>

        <div className="d-flex align-items-center gap-2 w-100 w-md-auto justify-content-start justify-content-md-end flex-wrap">
          <Button
            onClick={() =>
              navigate(`/inventory/add-product?id=${productDetail?.id}`, {
                state: { slug: productDetail?.slug, product: productDetail },
              })
            }
            style={{ borderRadius: 8 }}
          >
            Sửa sản phẩm
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setProductSelected(productDetail);
              setSubProductSelected(undefined);
              setCloneVariant(undefined);
              setIsVisibleAddSubProduct(true);
            }}
            style={{ borderRadius: 8 }}
          >
            Thêm biến thể mới
          </Button>
        </div>
      </div>

      {/* Danh sách biến thể: Mobile Card View vs Desktop Table */}
      {isMobile ? (
        <div className="d-flex flex-column gap-3">
          {subProducts.length === 0 ? (
            <Card className="app-card" style={{ textAlign: "center", padding: "40px 0", borderRadius: 12 }} bordered={false}>
              <Empty description="Sản phẩm này chưa có biến thể phân loại nào" />
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  setProductSelected(productDetail);
                  setSubProductSelected(undefined);
                  setCloneVariant(undefined);
                  setIsVisibleAddSubProduct(true);
                }}
                style={{ marginTop: 12, borderRadius: 8 }}
              >
                Tạo biến thể đầu tiên
              </Button>
            </Card>
          ) : (
            subProducts.map((item) => {
              const hasDiscount =
                typeof item.discount === "number" &&
                item.discount > 0 &&
                item.discount < item.price;
              const actualPrice =
                hasDiscount && item.discount !== undefined
                  ? item.discount
                  : item.price;
              const discountAmount = hasDiscount ? item.price - (item.discount || 0) : 0;
              const discountPercent = hasDiscount
                ? Math.round((discountAmount / item.price) * 100)
                : 0;
              const cost = item.cost || 0;
              const profit = actualPrice - cost;
              const margin = actualPrice > 0 ? (profit / actualPrice) * 100 : 0;

              const attrs = item.attributes;
              const validEntries = attrs
                ? Object.entries(attrs).filter(([key]) => !isSystemAttr(key))
                : [];

              return (
                <div
                  key={item.id}
                  style={{
                    background: "#ffffff",
                    borderRadius: 12,
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                    padding: "14px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                  }}
                >
                  {/* Header: Ảnh đại diện + SKU + Tag tồn kho */}
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <Avatar
                      src={item.images && item.images.length > 0 ? item.images[0] : undefined}
                      icon={(!item.images || item.images.length === 0) ? <Box size={24} color="#94a3b8" /> : undefined}
                      size={52}
                      shape="square"
                      style={{ borderRadius: 8, background: "#f8fafc", flexShrink: 0, border: "1px solid #e2e8f0" }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 11, color: "#64748b" }}>Mã SKU:</div>
                      <Typography.Text
                        copyable
                        strong
                        style={{ fontSize: 13, color: colors.primary500 }}
                      >
                        {item.sku || item.id?.substring(0, 8).toUpperCase() || "—"}
                      </Typography.Text>
                    </div>
                    <div>
                      <Tag
                        color={item.stock === 0 ? "error" : item.stock <= 5 ? "warning" : "blue"}
                        style={{ fontWeight: 600, margin: 0, padding: "3px 8px", borderRadius: 6, fontSize: 12 }}
                      >
                        {item.stock === 0 ? "Hết hàng" : item.stock <= 5 ? `Sắp hết: ${item.stock}` : `Tồn: ${item.stock}`}
                      </Tag>
                    </div>
                  </div>

                  {/* Thuộc tính / Phân loại */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center", background: "#f8fafc", padding: "8px 10px", borderRadius: 8 }}>
                    {validEntries.length > 0 ? (
                      validEntries.map(([key, val]) => {
                        const isColor =
                          key.toLowerCase() === "color" || key.toLowerCase() === "màu sắc";
                        const isHexColor = isColor && typeof val === "string" && val.startsWith("#");
                        return (
                          <Tag
                            key={key}
                            color={isHexColor ? val : undefined}
                            style={{
                              border: isHexColor ? "1px solid #bbb" : undefined,
                              fontWeight: 500,
                              fontSize: 12,
                              margin: 0,
                              maxWidth: "100%",
                              whiteSpace: "normal",
                              wordBreak: "break-word",
                              height: "auto",
                              lineHeight: 1.4,
                              padding: "2px 8px",
                            }}
                          >
                            {key}: {val}
                          </Tag>
                        );
                      })
                    ) : (
                      <>
                        {item.color && (
                          <div style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                            <span style={{ fontSize: 12, color: "#64748b" }}>Màu:</span>
                            <ColorBadge color={item.color} size={16} />
                          </div>
                        )}
                        {item.size && (
                          <Tag style={{ margin: 0, fontWeight: 600, fontSize: 12 }}>
                            Size {item.size}
                          </Tag>
                        )}
                        {!item.color && !item.size && (
                          <span style={{ fontSize: 12, color: "#94a3b8" }}>Mặc định</span>
                        )}
                      </>
                    )}
                  </div>

                  {/* Khối tài chính: Giá bán, Giá vốn, Lãi gộp */}
                  <div
                    style={{
                      background: "#fdfdfd",
                      borderRadius: 8,
                      padding: "10px 12px",
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "8px 12px",
                      border: "1px solid #f1f5f9",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 11, color: "#64748b" }}>Giá bán thực tế:</div>
                      <div style={{ fontWeight: 700, color: "#1677ff", fontSize: 14 }}>
                        {VND.format(actualPrice)}
                      </div>
                      {hasDiscount && (
                        <div style={{ fontSize: 11, color: "#8c8c8c", textDecoration: "line-through", marginTop: 1 }}>
                          {VND.format(item.price)}{" "}
                          <Tag color="red" style={{ fontSize: 10, margin: 0, padding: "0 4px" }}>
                            -{discountPercent}%
                          </Tag>
                        </div>
                      )}
                    </div>

                    <div>
                      <div style={{ fontSize: 11, color: "#64748b" }}>Giá vốn:</div>
                      <div style={{ fontWeight: 600, color: "#334155", fontSize: 13 }}>
                        {item.cost ? VND.format(item.cost) : "—"}
                      </div>
                    </div>

                    <div
                      style={{
                        gridColumn: "span 2",
                        paddingTop: 6,
                        borderTop: "1px dashed #e2e8f0",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span style={{ fontSize: 12, color: "#64748b" }}>Lãi gộp ước tính:</span>
                      {item.cost ? (
                        <span style={{ fontWeight: 600, color: profit >= 0 ? "#16a34a" : "#dc2626", fontSize: 12 }}>
                          {profit >= 0 ? `+${VND.format(profit)}` : VND.format(profit)}
                          <Tag
                            color={profit < 0 ? "error" : margin < 15 ? "warning" : "success"}
                            style={{ marginLeft: 6, fontSize: 10, margin: "0 0 0 6px" }}
                          >
                            {margin.toFixed(0)}%
                          </Tag>
                        </span>
                      ) : (
                        <span style={{ color: "#8c8c8c", fontSize: 12 }}>—</span>
                      )}
                    </div>
                  </div>

                  {/* Nút Thao tác To bản, Dễ chạm */}
                  <div style={{ display: "flex", gap: 8, paddingTop: 4 }}>
                    <Button
                      size="middle"
                      icon={<CopyOutlined style={{ color: colors.primary500 }} />}
                      onClick={() => {
                        setProductSelected(productDetail);
                        setSubProductSelected(undefined);
                        const { id: _, ...rest } = item;
                        setCloneVariant({
                          ...rest,
                          images: item.images ? [...item.images] : [],
                          attributes: item.attributes ? { ...item.attributes } : undefined,
                        });
                        setIsVisibleAddSubProduct(true);
                      }}
                      style={{
                        flex: 1,
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 500,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 4,
                        borderColor: "#bfdbfe",
                        color: colors.primary500,
                        background: "#eff6ff",
                      }}
                    >
                      Nhân bản
                    </Button>

                    <Button
                      size="middle"
                      icon={<Edit2 color="#334155" size={16} />}
                      onClick={() => {
                        setCloneVariant(undefined);
                        setProductSelected(productDetail);
                        setSubProductSelected(item);
                        setIsVisibleAddSubProduct(true);
                      }}
                      style={{
                        flex: 1,
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 500,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 4,
                        borderColor: "#e2e8f0",
                        color: "#334155",
                      }}
                    >
                      Chỉnh sửa
                    </Button>

                    <Button
                      size="middle"
                      danger
                      loading={removingSubProductId === item.id}
                      icon={<Trash color="#ef4444" size={16} />}
                      onClick={() =>
                        Modal.confirm({
                          title: "Xác nhận xóa",
                          content: "Bạn có chắc muốn xóa biến thể này?",
                          okText: "Xóa",
                          cancelText: "Hủy",
                          okType: "danger",
                          onOk: async () => {
                            await handleRemoveSubProduct(item.id);
                          },
                        })
                      }
                      style={{
                        width: 44,
                        padding: 0,
                        borderRadius: 8,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderColor: "#fecaca",
                        background: "#fef2f2",
                      }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* Giao diện Desktop: Bảng dữ liệu có scroll an toàn */
        <div className="app-card p-3">
          <Table
            bordered
            columns={columns}
            dataSource={subProducts}
            rowKey="id"
            scroll={{ x: 1360 }}
            pagination={subProducts.length > 10 ? { pageSize: 10, showSizeChanger: true } : false}
          />
        </div>
      )}
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
                return prev.map((item) => (item.id === val.id ? val : item));
              }
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
