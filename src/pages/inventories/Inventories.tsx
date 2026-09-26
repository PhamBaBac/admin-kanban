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
} from "antd";
import { ColumnProps, TableProps } from "antd/es/table";
import { Edit2, Sort, Trash } from "iconsax-react";
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
  const navigate = useNavigate();
  const location = useLocation();

  // Đọc query param ?search= từ URL khi bấm từ Tổng quan
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
    if (urlParams.get("search")) return; // Ưu tiên search từ URL

    if (isFilting) {
      executeFilter(filterValues, page, pageSize);
    } else if (!searchKey) {
      fetchProducts(`/products/page?page=${page}&pageSize=${pageSize}`);
    }
  }, [searchKey, page, pageSize, isFilting]);

  // Refresh data khi quay lại từ AddProduct
  useEffect(() => {
    if (location.state?.refresh) {
      fetchProducts(`/products/page?page=${page}&pageSize=${pageSize}`);
      // Clear refresh state
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
      key: "images",
      title: "Hình ảnh",
      dataIndex: "images",
      width: 220,
      render: (imgs: string[] = []) =>
        imgs?.length ? (
          <Avatar.Group>
            {imgs.map((img, idx) => (
              <Avatar
                src={img}
                size={36}
                key={idx}
                style={{ marginRight: 6 }}
              />
            ))}
          </Avatar.Group>
        ) : null,
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
      <div className="row mb-3 align-items-center">
        <div className="col">
          <Typography.Title level={4} style={{ margin: 0, fontWeight: 700 }}>
            Quản lý sản phẩm
          </Typography.Title>
        </div>
        <div className="col">
          {selectedRowKeys.length > 0 && (
            <Space>
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
        <div className="col">
          <div className="d-flex justify-content-end">
            <Space>
              {isFilting && (
                <Button onClick={handleClearFilter}>
                  Xóa bộ lọc
                </Button>
              )}
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
              />
              <Dropdown
                open={isFilterOpen}
                onOpenChange={setIsFilterOpen}
                trigger={["click"]}
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
            </Space>
          </div>
        </div>
      </div>

      <div className="app-card p-3">
        <Table
          bordered
          rowKey={(record) => record.id}
          rowSelection={rowSelection}
          pagination={{
            showSizeChanger: true,
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
          scroll={{ x: 1000 }}
          size="middle"
        />
      </div>

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
