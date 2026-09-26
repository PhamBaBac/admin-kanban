import {
  Avatar,
  Button,
  Divider,
  Dropdown,
  Input,
  message,
  Modal,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
  Checkbox,
  Pagination,
  Empty,
  Spin,
  Card,
  Popover,
} from "antd";
import { ColumnProps, TableProps } from "antd/es/table";
import { Edit2, Sort, Trash, Box } from "iconsax-react";
import React, { useEffect, useState } from "react";
import { MdLibraryAdd } from "react-icons/md";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { colors, listColors } from "../../constants/colors";
import { AddSubProductModal } from "../../modals";
import {
  CategoyModel,
  ProductModel,
  SubProductModel,
} from "../../models/Products";
import { replaceName } from "../../utils/replaceName";
import { FilterProduct } from "../../components";
import { FilterProductValue } from "../../components/FilterProduct";
import { useProducts } from "../../hooks/useProducts";
import { productService } from "../../services/productService";

const { confirm } = Modal;

const Inventories = () => {
  const {
    getProducts,
    deleteProduct,
    filterProducts: filterProductsApi,
    loading,
    error,
  } = useProducts();
  const [products, setProducts] = useState<ProductModel[]>([]);
  const [isVisibleAddSubProduct, setIsVisibleAddSubProduct] = useState(false);
  const [productSelected, setProductSelected] = useState<ProductModel>();
  const [selectedRowKeys, setSelectedRowKeys] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState<number>(10);
  const [searchKey, setSearchKey] = useState("");
  const [isFilting, setIsFilting] = useState(false);
  const [filterValues, setFilterValues] = useState<FilterProductValue>({});
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const searchFromUrl = urlParams.get("search");
    if (searchFromUrl) {
      setSearchKey(searchFromUrl);
      const key = replaceName(searchFromUrl);
      getProducts({ title: key, page: 1, pageSize }).then(async (res) => {
        if (res && res.data) {
          const subProductMap: { [key: string]: SubProductModel[] } = {};
          await Promise.all(
            res.data.map(async (product: ProductModel) => {
              const resSubs = await productService.getSubProducts(product.id);
              subProductMap[product.id] = resSubs || [];
            })
          );
          const enriched = res.data.map((item: any) => ({
            ...item,
            key: item.id,
            subProducts: subProductMap[item.id] || [],
          }));
          setProducts(enriched);
          setTotal(res.totalElements);
        }
      });
    }
  }, [location.search]);

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    if (urlParams.get("search")) return; 

    if (isFilting) {
      executeFilter(filterValues, page, pageSize);
    } else if (!searchKey) {
      fetchProducts(`/products/page?page=${page}&pageSize=${pageSize}`);
    }
  }, [searchKey, page, pageSize, isFilting]);

  useEffect(() => {
    if (location.state?.refresh) {
      fetchProducts(`/products/page?page=${page}&pageSize=${pageSize}`);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state?.refresh]);

  const fetchProducts = async (api: string) => {
    try {
      const res = await getProducts({ page, pageSize });
      const productsData = res.data;
      const totalItems = res.totalElements;

      const subProductMap: { [key: string]: SubProductModel[] } = {};
      await Promise.all(
        productsData.map(async (product: ProductModel) => {
          const resSubs = await productService.getSubProducts(product.id);
          subProductMap[product.id] = resSubs || [];
        })
      );

      const enrichedProducts = productsData.map((item: any) => ({
        ...item,
        key: item.id,
        subProducts: subProductMap[item.id] || [],
      }));

      setProducts(enrichedProducts);
      setTotal(totalItems);
    } catch (error) {
      console.log(error);
    }
  };

  const handleRemoveProduct = async (id: string) => {
    try {
      await deleteProduct(id);
      setProducts((prev) => prev.filter((product) => product.id !== id));
      message.success("Product removed");
    } catch (error: any) {
      message.error(error.message);
    }
  };

  const getMinMaxValues = (data: SubProductModel[]) => {
    const prices = data.map((item) => item.price);
    return prices.length
      ? `${Math.min(...prices).toLocaleString()} - ${Math.max(
          ...prices
        ).toLocaleString()}`
      : "";
  };

  const rowSelection: TableProps<ProductModel>["rowSelection"] = {
    selectedRowKeys,
    onChange: setSelectedRowKeys,
  };

  const handleSearchProducts = async () => {
    const key = replaceName(searchKey);
    try {
      const res = await getProducts({
        title: key,
        page,
        pageSize,
      });

      const productsData = res.data;
      const totalItems = res.totalElements;

      const subProductMap: { [key: string]: SubProductModel[] } = {};
      await Promise.all(
        productsData.map(async (product: ProductModel) => {
          const resSubs = await productService.getSubProducts(product.id);
          subProductMap[product.id] = resSubs || [];
        })
      );

      const enrichedProducts = productsData.map((item: any) => ({
        ...item,
        key: item.id,
        subProducts: subProductMap[item.id] || [],
      }));

      setProducts(enrichedProducts);
      setTotal(totalItems);
    } catch (error) {
      console.log(error);
    }
  };

  const handleSelectAllProduct = async () => {
    try {
      const res = await getProducts();
      setSelectedRowKeys(res.data.map((item: any) => item.id));
    } catch (error) {
      console.error("Error selecting all products:", error);
    }
  };

  const executeFilter = async (
    vals: FilterProductValue,
    targetPage = 1,
    targetPageSize = pageSize
  ) => {
    try {
      const res = await filterProductsApi({
        ...vals,
        page: targetPage,
        pageSize: targetPageSize,
      });

      const productsData = res.data || [];
      const totalItems = res.totalElements || 0;

      const subProductMap: { [key: string]: SubProductModel[] } = {};
      await Promise.all(
        productsData.map(async (product: ProductModel) => {
          const resSubs = await productService.getSubProducts(product.id);
          subProductMap[product.id] = resSubs || [];
        })
      );

      const enrichedProducts = productsData.map((item: any) => ({
        ...item,
        key: item.id,
        subProducts: subProductMap[item.id] || [],
      }));

      setProducts(enrichedProducts);
      setTotal(totalItems);
    } catch (error) {
      console.log(error);
    }
  };

  const handleFilterProducts = async (vals: FilterProductValue) => {
    setFilterValues(vals);
    setIsFilterOpen(false);

    const hasActiveFilter = Boolean(
      (vals.catIds && vals.catIds.length > 0) ||
        (vals.price && vals.price.length === 2)
    );

    if (!hasActiveFilter) {
      setIsFilting(false);
      setPage(1);
      fetchProducts(`/products/page?page=1&pageSize=${pageSize}`);
      return;
    }

    setIsFilting(true);
    setPage(1);
    await executeFilter(vals, 1, pageSize);
  };

  const handleClearFilter = async () => {
    setFilterValues({});
    setIsFilting(false);
    setPage(1);
    await fetchProducts(`/products/page?page=1&pageSize=${pageSize}`);
  };

  const columns: ColumnProps<ProductModel>[] = [
    {
      key: "images",
      title: "Hình ảnh",
      dataIndex: "images",
      width: 155,
      render: (imgs: string[] = [], item: ProductModel) => {
        const allImages = Array.from(
          new Set(
            [
              ...(imgs || []),
              ...(item.subProducts?.flatMap((s) => s.images || []) || []),
            ]
              .map((img: any) => (typeof img === "string" ? img : img?.url))
              .filter(
                (url): url is string =>
                  Boolean(url && typeof url === "string" && url.trim())
              )
          )
        );

        if (!allImages.length) {
          return (
            <Avatar
              icon={<Box size={20} color="#94a3b8" />}
              size={36}
              shape="square"
              style={{
                borderRadius: 8,
                border: "1px solid #e2e8f0",
                background: "#f8fafc",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            />
          );
        }

        const displayImages = allImages.slice(0, 2);
        const remainingCount = allImages.length - displayImages.length;

        return (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              maxWidth: "100%",
              paddingRight: 6,
            }}
          >
            {displayImages.map((imgUrl, idx) => (
              <Tooltip
                key={idx}
                placement="right"
                color="#fff"
                mouseEnterDelay={0.12}
                overlayInnerStyle={{
                  padding: 6,
                  borderRadius: 10,
                  backgroundColor: "#fff",
                  boxShadow:
                    "0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
                }}
                title={
                  <div style={{ textAlign: "center", padding: 2 }}>
                    <img
                      src={imgUrl}
                      alt={item.title}
                      style={{
                        width: 180,
                        height: 180,
                        objectFit: "cover",
                        borderRadius: 8,
                        display: "block",
                      }}
                    />
                    <div
                      style={{
                        marginTop: 6,
                        fontSize: 11,
                        fontWeight: 600,
                        color: "#334155",
                        maxWidth: 180,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {item.title}
                    </div>
                  </div>
                }
              >
                <Link
                  to={`/inventory/detail/${item.slug}?id=${item.id}`}
                  style={{ display: "inline-block", flexShrink: 0 }}
                >
                  <Avatar
                    src={imgUrl}
                    size={36}
                    shape="square"
                    style={{
                      borderRadius: 8,
                      border: "1px solid #e2e8f0",
                      background: "#f8fafc",
                      objectFit: "cover",
                      display: "block",
                      transition: "transform 0.15s ease",
                      cursor: "pointer",
                    }}
                  />
                </Link>
              </Tooltip>
            ))}

            {remainingCount > 0 && (
              <Popover
                placement="rightTop"
                title={
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b", padding: "2px 0" }}>
                    Tất cả hình ảnh ({allImages.length})
                  </div>
                }
                content={
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(3, 56px)",
                      gap: 6,
                      maxHeight: 200,
                      overflowY: "auto",
                      padding: 2,
                    }}
                  >
                    {allImages.map((url, i) => (
                      <Tooltip
                        key={i}
                        placement="top"
                        color="#fff"
                        mouseEnterDelay={0.12}
                        overlayInnerStyle={{
                          padding: 6,
                          borderRadius: 10,
                          backgroundColor: "#fff",
                          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.2)",
                        }}
                        title={
                          <div style={{ textAlign: "center", padding: 2 }}>
                            <img
                              src={url}
                              alt={`Ảnh ${i + 1}`}
                              style={{
                                width: 160,
                                height: 160,
                                objectFit: "cover",
                                borderRadius: 8,
                                display: "block",
                              }}
                            />
                            <div
                              style={{
                                marginTop: 4,
                                fontSize: 11,
                                fontWeight: 500,
                                color: "#64748b",
                              }}
                            >
                              Ảnh {i + 1}
                            </div>
                          </div>
                        }
                      >
                        <Link
                          to={`/inventory/detail/${item.slug}?id=${item.id}`}
                          style={{ display: "block" }}
                        >
                          <img
                            src={url}
                            alt={`Ảnh ${i + 1}`}
                            style={{
                              width: 56,
                              height: 56,
                              borderRadius: 6,
                              objectFit: "cover",
                              border: "1px solid #e2e8f0",
                              display: "block",
                              cursor: "pointer",
                            }}
                          />
                        </Link>
                      </Tooltip>
                    ))}
                  </div>
                }
              >
                <Link
                  to={`/inventory/detail/${item.slug}?id=${item.id}`}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    backgroundColor: "#eff6ff",
                    border: "1px solid #bfdbfe",
                    color: "#1677ff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    fontWeight: 700,
                    flexShrink: 0,
                    textDecoration: "none",
                  }}
                >
                  +{remainingCount}
                </Link>
              </Popover>
            )}
          </div>
        );
      },
    },
    {
      key: "title",
      title: "Tên sản phẩm",
      dataIndex: "",
      width: 280,
      render: (item: ProductModel) => (
        <Link to={`/inventory/detail/${item.slug}?id=${item.id}`} style={{ fontWeight: 600 }}>
          {item.title}
        </Link>
      ),
    },
    {
      key: "description",
      title: "Mô tả",
      dataIndex: "description",
      width: 350,
      render: (desc: string) => (
        <Tooltip title={desc}>
          <div className="text-2-line">{desc || "Chưa có mô tả"}</div>
        </Tooltip>
      ),
    },
    {
      key: "categories",
      title: "Danh mục",
      dataIndex: "categories",
      width: 250,
      render: (cats: CategoyModel[] = []) => (
        <Space wrap>
          {cats.map((cat) => (
            <Link
              to={`/inventory/categories/detail/${cat.slug}?id=${cat.id}`}
              key={cat.id}
            >
              <Tag
                color={
                  listColors[Math.floor(Math.random() * listColors.length)]
                }
              >
                {cat.title}
              </Tag>
            </Link>
          ))}
        </Space>
      ),
    },
    {
      key: "colors",
      title: "Màu sắc",
      dataIndex: "subProducts",
      width: 140,
      render: (items: SubProductModel[] = []) => (
        <Space>
          {Array.from(new Set(items.map((sub) => sub.color))).map(
            (color, idx) => (
              <div
                key={idx}
                style={{
                  width: 22,
                  height: 22,
                  backgroundColor: color,
                  borderRadius: "50%",
                  border: "1px solid #e2e8f0",
                }}
              />
            )
          )}
        </Space>
      ),
    },
    {
      key: "sizes",
      title: "Kích cỡ",
      dataIndex: "subProducts",
      width: 220,
      render: (items: SubProductModel[] = []) => (
        <Space wrap>
          {items.map((item, idx) => (
            <Tag key={idx}>{item.size}</Tag>
          ))}
        </Space>
      ),
    },
    {
      key: "price",
      title: "Khoảng giá (VNĐ)",
      dataIndex: "subProducts",
      width: 180,
      render: (items: SubProductModel[] = []) => (
        <Typography.Text strong>{getMinMaxValues(items)}</Typography.Text>
      ),
    },
    {
      key: "stock",
      title: "Tồn kho",
      dataIndex: "subProducts",
      width: 100,
      align: "right",
      render: (items: SubProductModel[] = []) =>
        items.reduce((sum, item) => sum + item.stock, 0),
    },
    {
      key: "actions",
      title: "Thao tác",
      dataIndex: "",
      fixed: "right",
      width: 130,
      align: "center" as const,
      render: (item: ProductModel) => (
        <Space size={2}>
          <Tooltip title="Thêm biến thể sản phẩm">
            <Button
              size="small"
              icon={<MdLibraryAdd color={colors.primary500} size={16} />}
              type="text"
              onClick={() => {
                setProductSelected(item);
                setIsVisibleAddSubProduct(true);
              }}
            />
          </Tooltip>
          <Tooltip title="Chỉnh sửa sản phẩm">
            <Button
              size="small"
              icon={<Edit2 color={colors.primary500} size={16} />}
              type="text"
              onClick={() =>
                navigate(`/inventory/add-product?id=${item.id}`, {
                  state: { slug: item.slug, product: item },
                })
              }
            />
          </Tooltip>
          <Tooltip title="Xóa sản phẩm">
            <Button
              size="small"
              icon={<Trash color={colors.error500} size={16} />}
              type="text"
              onClick={() =>
                confirm({
                  title: "Xác nhận xóa",
                  content: `Bạn có chắc muốn xóa sản phẩm "${item.title}"?`,
                  okText: "Xóa",
                  cancelText: "Hủy",
                  okType: "danger",
                  onOk: () => handleRemoveProduct(item.id),
                })
              }
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-3">
        <div className="d-flex align-items-center flex-wrap gap-2">
          <Typography.Title level={4} style={{ margin: 0, fontWeight: 700 }}>
            Quản lý sản phẩm
          </Typography.Title>
          {selectedRowKeys.length > 0 && (
            <Space wrap>
              <Tooltip title="Xóa các mục đã chọn">
                <Button
                  danger
                  type="primary"
                  icon={<Trash size={16} />}
                  onClick={() =>
                    confirm({
                      title: "Xác nhận xóa hàng loạt",
                      content: `Bạn có chắc muốn xóa ${selectedRowKeys.length} sản phẩm đã chọn?`,
                      okText: "Xóa",
                      cancelText: "Hủy",
                      okType: "danger",
                      onOk: async () => {
                        await Promise.all(
                          selectedRowKeys.map((id) => handleRemoveProduct(id))
                        );
                        setSelectedRowKeys([]);
                        await fetchProducts(
                          `/products/page?page=${page}&pageSize=${pageSize}`
                        );
                      },
                      onCancel: () => setSelectedRowKeys([]),
                    })
                  }
                >
                  Xóa ({selectedRowKeys.length})
                </Button>
              </Tooltip>
              {selectedRowKeys.length < total && (
                <Button type="link" onClick={handleSelectAllProduct}>
                  Chọn tất cả
                </Button>
              )}
            </Space>
          )}
        </div>
        <div className="d-flex align-items-center flex-wrap gap-2 w-100 w-md-auto justify-content-between justify-content-md-end">
          <Input.Search
            value={searchKey}
            onChange={(e) => {
              setSearchKey(e.target.value);
              if (e.target.value === "") {
                setPage(1);
                fetchProducts(
                  `/products/page?page=1&pageSize=${pageSize}`
                );
              }
            }}
            onSearch={handleSearchProducts}
            placeholder="Tìm kiếm sản phẩm..."
            allowClear
            style={{
              flex: 1,
              minWidth: isMobile ? 140 : 200,
              maxWidth: isMobile ? "none" : 320,
            }}
          />
          <div className="d-flex align-items-center gap-2 ms-auto" style={{ flexShrink: 0 }}>
            {isFilting && (
              <Button onClick={handleClearFilter}>
                Xóa bộ lọc
              </Button>
            )}
            <Dropdown
              open={isFilterOpen}
              onOpenChange={setIsFilterOpen}
              trigger={["click"]}
              placement="bottomRight"
              dropdownRender={() => (
                <FilterProduct
                  values={filterValues}
                  onFilter={handleFilterProducts}
                  onClose={() => setIsFilterOpen(false)}
                />
              )}
            >
              <Button
                icon={<Sort size={18} />}
                type={isFilting ? "primary" : "default"}
              >
                Bộ lọc {isFilting ? "(Đang bật)" : ""}
              </Button>
            </Dropdown>
          </div>
        </div>
      </div>

      {isMobile ? (
        /* GIAO DIỆN MOBILE / TABLET: DẠNG THẺ SẢN PHẨM HIỆN ĐẠI (CARD VIEW) */
        <div className="d-flex flex-column gap-2">
          {/* Thanh Chọn tất cả trên mobile */}
          {products.length > 0 && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "#f8fafc",
                padding: "8px 12px",
                borderRadius: 10,
                marginBottom: 4,
                border: "1px solid #e2e8f0",
              }}
            >
              <Checkbox
                checked={selectedRowKeys.length > 0 && selectedRowKeys.length === products.length}
                indeterminate={selectedRowKeys.length > 0 && selectedRowKeys.length < products.length}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedRowKeys(products.map((p) => p.id));
                  } else {
                    setSelectedRowKeys([]);
                  }
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 500 }}>
                  Chọn tất cả trang này ({products.length})
                </span>
              </Checkbox>
              {selectedRowKeys.length > 0 && (
                <span style={{ fontSize: 12, color: colors.primary500, fontWeight: 600 }}>
                  Đã chọn {selectedRowKeys.length}
                </span>
              )}
            </div>
          )}

          {loading ? (
            <div
              style={{
                textAlign: "center",
                padding: "48px 0",
                background: "#fff",
                borderRadius: 12,
                border: "1px solid #e2e8f0",
              }}
            >
              <Spin tip="Đang tải sản phẩm..." />
            </div>
          ) : products.length === 0 ? (
            <Card className="app-card" style={{ textAlign: "center", borderRadius: 12 }} bordered={false}>
              <Empty description="Không tìm thấy sản phẩm nào" />
            </Card>
          ) : (
            products.map((item) => {
              const isSelected = selectedRowKeys.includes(item.id);
              const totalStock = (item.subProducts || []).reduce((sum, s) => sum + (s.stock || 0), 0);
              const priceRange = getMinMaxValues(item.subProducts || []);
              const colorsList = Array.from(new Set((item.subProducts || []).map((s) => s.color).filter(Boolean)));
              const sizesList = (item.subProducts || []).map((s) => s.size).filter(Boolean);
              const mainImg = item.images?.[0] || "";

              return (
                <div
                  key={item.id}
                  style={{
                    background: "#fff",
                    borderRadius: 12,
                    border: isSelected ? `1.5px solid ${colors.primary500}` : "1px solid #e2e8f0",
                    boxShadow: isSelected ? "0 4px 14px rgba(21, 112, 239, 0.1)" : "0 2px 6px rgba(0, 0, 0, 0.02)",
                    padding: 14,
                    transition: "all 0.2s ease",
                  }}
                >
                  {/* Hàng 1: Checkbox + Thumbnail ảnh + Tên + Danh mục */}
                  <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <div style={{ paddingTop: 2 }}>
                      <Checkbox
                        checked={isSelected}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedRowKeys((prev) => [...prev, item.id]);
                          } else {
                            setSelectedRowKeys((prev) => prev.filter((id) => id !== item.id));
                          }
                        }}
                      />
                    </div>

                    <Link
                      to={`/inventory/detail/${item.slug}?id=${item.id}`}
                      style={{
                        width: 60,
                        height: 60,
                        borderRadius: 8,
                        overflow: "hidden",
                        background: "#f1f5f9",
                        flexShrink: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: "1px solid #e2e8f0",
                      }}
                    >
                      {mainImg ? (
                        <img
                          src={mainImg}
                          alt={item.title}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      ) : (
                        <Box size={24} color="#94a3b8" />
                      )}
                    </Link>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Link
                        to={`/inventory/detail/${item.slug}?id=${item.id}`}
                        style={{
                          fontWeight: 600,
                          fontSize: 14,
                          color: "#0f172a",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                          lineHeight: 1.35,
                          textDecoration: "none",
                        }}
                      >
                        {item.title}
                      </Link>

                      {item.categories && item.categories.length > 0 && (
                        <div style={{ marginTop: 6, display: "flex", flexWrap: "wrap", gap: 4 }}>
                          {item.categories.slice(0, 2).map((cat: any) => (
                            <Tag
                              key={cat.id || cat}
                              style={{
                                fontSize: 11,
                                margin: 0,
                                borderRadius: 4,
                                padding: "0 6px",
                                backgroundColor: "#eff6ff",
                                borderColor: "#bfdbfe",
                                color: "#1d4ed8",
                              }}
                            >
                              {cat.title || cat}
                            </Tag>
                          ))}
                          {item.categories.length > 2 && (
                            <Tag style={{ fontSize: 10, margin: 0, padding: "0 4px" }}>
                              +{item.categories.length - 2}
                            </Tag>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Đường kẻ phân cách nhẹ */}
                  <div style={{ height: 1, background: "#f1f5f9", margin: "10px 0 10px 0" }} />

                  {/* Hàng 2: Giá bán & Tồn kho */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <div>
                      <span style={{ fontSize: 12, color: "#64748b" }}>Giá bán: </span>
                      <span style={{ fontWeight: 700, fontSize: 14, color: "#16a34a" }}>
                        {priceRange ? `${priceRange} ₫` : "Chưa có giá"}
                      </span>
                    </div>
                    <div>
                      <span style={{ fontSize: 12, color: "#64748b" }}>Tồn: </span>
                      <span
                        style={{
                          fontWeight: 700,
                          fontSize: 13,
                          color: totalStock <= 5 ? "#ef4444" : "#0f172a",
                        }}
                      >
                        {totalStock} {totalStock <= 5 && <Tag color="error" style={{ fontSize: 10, padding: "0 4px", margin: "0 0 0 4px" }}>Sắp hết</Tag>}
                      </span>
                    </div>
                  </div>

                  {/* Hàng 3: Biến thể Màu sắc & Size */}
                  {(colorsList.length > 0 || sizesList.length > 0) && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        flexWrap: "wrap",
                        background: "#f8fafc",
                        padding: "6px 10px",
                        borderRadius: 8,
                        marginBottom: 10,
                        fontSize: 12,
                      }}
                    >
                      {colorsList.length > 0 && (
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <span style={{ color: "#64748b", fontSize: 11 }}>Màu:</span>
                          <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
                            {colorsList.slice(0, 5).map((color, cIdx) => (
                              <span
                                key={cIdx}
                                style={{
                                  width: 14,
                                  height: 14,
                                  borderRadius: "50%",
                                  backgroundColor: color,
                                  border: "1px solid #cbd5e1",
                                  display: "inline-block",
                                }}
                              />
                            ))}
                            {colorsList.length > 5 && (
                              <span style={{ fontSize: 10, color: "#64748b" }}>+{colorsList.length - 5}</span>
                            )}
                          </div>
                        </div>
                      )}

                      {sizesList.length > 0 && (
                        <div style={{ display: "flex", alignItems: "center", gap: 4, marginLeft: "auto" }}>
                          <span style={{ color: "#64748b", fontSize: 11 }}>Size:</span>
                          <span style={{ fontWeight: 600, color: "#334155", fontSize: 11 }}>
                            {Array.from(new Set(sizesList)).slice(0, 4).join(", ")}
                            {new Set(sizesList).size > 4 && "..."}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Hàng 4: Nhóm Nút Thao tác To bản, Dễ chạm */}
                  <div style={{ display: "flex", gap: 8, paddingTop: 4 }}>
                    <Button
                      size="middle"
                      icon={<MdLibraryAdd color="#1570ef" size={16} />}
                      onClick={() => {
                        setProductSelected(item);
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
                        color: "#1570ef",
                        background: "#eff6ff",
                      }}
                    >
                      + Biến thể
                    </Button>

                    <Button
                      size="middle"
                      icon={<Edit2 color="#475569" size={16} />}
                      onClick={() =>
                        navigate(`/inventory/add-product?id=${item.id}`, {
                          state: { slug: item.slug, product: item },
                        })
                      }
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
                      icon={<Trash color="#ef4444" size={16} />}
                      onClick={() =>
                        confirm({
                          title: "Xác nhận xóa",
                          content: `Bạn có chắc muốn xóa sản phẩm "${item.title}"?`,
                          okText: "Xóa",
                          cancelText: "Hủy",
                          okType: "danger",
                          onOk: () => handleRemoveProduct(item.id),
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

          {/* Phân trang Mobile */}
          <div style={{ display: "flex", justifyContent: "center", padding: "16px 0 20px 0" }}>
            <Pagination
              current={page}
              pageSize={pageSize}
              total={total}
              size="small"
              showSizeChanger={false}
              onChange={(p, size) => {
                setPage(p);
                setPageSize(size);
              }}
              showTotal={(tot, range) => `${range[0]}-${range[1]} / ${tot} sản phẩm`}
            />
          </div>
        </div>
      ) : (
        /* GIAO DIỆN DESKTOP (>= 768px): BẢNG DỮ LIỆU ĐẦY ĐỦ CỘT */
        <div className="app-card p-3">
          <Table
            bordered
            rowKey={(record) => record.id}
            rowSelection={rowSelection}
            pagination={{
              showSizeChanger: true,
              responsive: true,
              current: page,
              pageSize: pageSize,
              total,
              showTotal: (total, range) => `${range[0]}-${range[1]} trong tổng số ${total} sản phẩm`,
              onChange: (page, size) => {
                setPage(page);
                setPageSize(size);
              },
            }}
            columns={columns}
            dataSource={products}
            loading={loading}
            scroll={{ x: 1350 }}
            size="middle"
            style={{ minHeight: 450 }}
          />
        </div>
      )}

      <AddSubProductModal
        product={productSelected}
        visible={isVisibleAddSubProduct}
        onClose={() => {
          setProductSelected(undefined);
          setIsVisibleAddSubProduct(false);
        }}
        onAddNew={(newSubProduct) => {
          if (!newSubProduct || !productSelected) return;
          setProducts((prev) =>
            prev.map((prod) => {
              if (prod.id === productSelected.id) {
                const prodAny = prod as any;
                return {
                  ...prodAny,
                  subProducts: [...(prodAny.subProducts || []), newSubProduct],
                };
              }
              return prod;
            })
          );
        }}
      />
    </div>
  );
};

export default Inventories;
