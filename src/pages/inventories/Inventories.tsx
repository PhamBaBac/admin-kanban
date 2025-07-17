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
  const { getProducts, deleteProduct, loading, error } = useProducts();
  const [products, setProducts] = useState<ProductModel[]>([]);
  const [isVisibleAddSubProduct, setIsVisibleAddSubProduct] = useState(false);
  const [productSelected, setProductSelected] = useState<ProductModel>();
  const [selectedRowKeys, setSelectedRowKeys] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState<number>(10);
  const [searchKey, setSearchKey] = useState("");
  const [isFilting, setIsFilting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!searchKey)
      fetchProducts(`/public/products/page?page=${page}&pageSize=${pageSize}`);
  }, [searchKey, page, pageSize]);

  // Refresh data khi quay lại từ AddProduct
  useEffect(() => {
    if (location.state?.refresh) {
      fetchProducts(`/public/products/page?page=${page}&pageSize=${pageSize}`);
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

  const handleFilterProducts = async (vals: FilterProductValue) => {
    if (typeof vals.colors === "string") {
      vals.colors = (vals.colors as string).includes(",")
        ? (vals.colors as string).split(",").map((c) => c.trim())
        : [vals.colors as string];
    } else if (!Array.isArray(vals.colors)) {
      vals.colors = [];
    }

    setIsFilting(true);
    try {
      const res = await getProducts({ ...vals, method: "filter" });
      setProducts(res.data);
      setTotal(res.totalElements);
    } catch (error) {
      console.log(error);
    }
  };

  const columns: ColumnProps<ProductModel>[] = [
    {
      key: "title",
      title: "Title",
      dataIndex: "",
      width: 300,
      render: (item: ProductModel) => (
        <Link to={`/inventory/detail/${item.slug}?id=${item.id}`}>
          {item.title}
        </Link>
      ),
    },
    {
      key: "description",
      title: "Description",
      dataIndex: "description",
      width: 400,
      render: (desc: string) => (
        <Tooltip title={desc}>
          <div className="text-2-line">{desc}</div>
        </Tooltip>
      ),
    },
    {
      key: "categories",
      title: "Categories",
      dataIndex: "categories",
      width: 300,
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
      title: "Images",
      dataIndex: "images",
      width: 300,
      render: (imgs: string[] = []) =>
        imgs?.length ? (
          <Avatar.Group>
            {imgs.map((img, idx) => (
              <Avatar
                src={img}
                size={40}
                key={idx}
                style={{ marginRight: 8 }}
              />
            ))}
          </Avatar.Group>
        ) : null,
    },
    {
      key: "colors",
      title: "Color",
      dataIndex: "subProducts",
      width: 150,
      render: (items: SubProductModel[] = []) => (
        <Space>
          {Array.from(new Set(items.map((sub) => sub.color))).map(
            (color, idx) => (
              <div
                key={idx}
                style={{
                  width: 24,
                  height: 24,
                  backgroundColor: color,
                  borderRadius: "50%",
                }}
              />
            )
          )}
        </Space>
      ),
    },
    {
      key: "sizes",
      title: "Sizes",
      dataIndex: "subProducts",
      width: 300,
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
      title: "Price",
      dataIndex: "subProducts",
      width: 200,
      render: (items: SubProductModel[] = []) => (
        <Typography.Text>{getMinMaxValues(items)}</Typography.Text>
      ),
    },
    {
      key: "stock",
      title: "Stock",
      dataIndex: "subProducts",
      width: 100,
      align: "right",
      render: (items: SubProductModel[] = []) =>
        items.reduce((sum, item) => sum + item.stock, 0),
    },
    {
      key: "actions",
      title: "Actions",
      dataIndex: "",
      fixed: "right",
      width: 150,
      align: "right",
      render: (item: ProductModel) => (
        <Space>
          <Tooltip title="Add sub product">
            <Button
              icon={<MdLibraryAdd color={colors.primary500} size={20} />}
              type="text"
              onClick={() => {
                setProductSelected(item);
                setIsVisibleAddSubProduct(true);
              }}
            />
          </Tooltip>
          <Tooltip title="Delete product">
            <Button
              icon={<Trash className="text-danger" size={20} />}
              type="text"
              onClick={() =>
                confirm({
                  title: "Confirm?",
                  content: "Are you sure you want to delete this item?",
                  onOk: () => handleRemoveProduct(item.id),
                })
              }
            />
          </Tooltip>
          <Tooltip title="Edit product">
            <Button
              icon={<Edit2 color={colors.primary500} size={20} />}
              type="text"
              onClick={() =>
                navigate(`/inventory/add-product?id=${item.id}`, {
                  state: { slug: item.slug, product: item },
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
      <div className="row mb-2">
        <div className="col">
          <Typography.Title level={4}>Product</Typography.Title>
        </div>
        <div className="col">
          {selectedRowKeys.length > 0 && (
            <Space>
              <Tooltip title="Delete product">
                <Button
                  danger
                  type="text"
                  icon={<Trash size={18} className="text-danger" />}
                  onClick={() =>
                    confirm({
                      title: "Confirm?",
                      content:
                        "Are you sure you want to delete selected items?",
                      onOk: async () => {
                        await Promise.all(
                          selectedRowKeys.map((id) => handleRemoveProduct(id))
                        );
                        setSelectedRowKeys([]);
                        await fetchProducts(
                          `/public/products/page?page=${page}&pageSize=${pageSize}`
                        );
                      },
                      onCancel: () => setSelectedRowKeys([]),
                    })
                  }
                >
                  Delete
                </Button>
              </Tooltip>
              <Typography.Text>
                {selectedRowKeys.length} items selected
              </Typography.Text>
              {selectedRowKeys.length < total && (
                <Button type="link" onClick={handleSelectAllProduct}>
                  Select all
                </Button>
              )}
            </Space>
          )}
        </div>
        <div className="col">
          <div className="d-flex justify-content-end">
            <Space>
              {isFilting && (
                <Button
                  onClick={async () => {
                    setPage(1);
                    await fetchProducts(
                      `/public/products/page?page=${page}&pageSize=${pageSize}`
                    );
                    setIsFilting(false);
                  }}
                >
                  Clear filter values
                </Button>
              )}
              <Input.Search
                value={searchKey}
                onChange={(e) => {
                  setSearchKey(e.target.value);
                  if (e.target.value === "") {
                    setPage(1);
                    fetchProducts(
                      `/public/products/page?page=1&pageSize=${pageSize}`
                    );
                  }
                }}
                onSearch={handleSearchProducts}
                placeholder="Search"
                allowClear
              />
              <Dropdown
                dropdownRender={() => (
                  <FilterProduct values={{}} onFilter={handleFilterProducts} />
                )}
              >
                <Button icon={<Sort size={20} />}>Filter</Button>
              </Dropdown>
            </Space>
          </div>
        </div>
      </div>
      <Table
        rowKey={(record) => record.id}
        rowSelection={rowSelection}
        pagination={{
          showSizeChanger: true,
          total,
          onChange: (page, size) => {
            setPage(page);
            setPageSize(size);
          },
        }}
        columns={columns}
        dataSource={products}
        loading={loading}
        scroll={{ x: "100%" }}
        bordered
        size="small"
      />

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
