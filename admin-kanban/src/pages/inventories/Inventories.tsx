/** @format */

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
import { Link, useNavigate } from "react-router-dom";
import handleAPI from "../../apis/handleAPI";
import { colors, listColors } from "../../constants/colors";
import { AddSubProductModal } from "../../modals";
import {
  CategoyModel,
  ProductModel,
  SubProductModel,
} from "../../models/Products";
import { replaceName } from "../../utils/replaceName";

const { confirm } = Modal;

type TableRowSelection<T extends object = object> =
  TableProps<T>["rowSelection"];

const Inventories = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState<ProductModel[]>([]);
  const [isVisibleAddSubProduct, setIsVisibleAddSubProduct] = useState(false);
  const [productSelected, setProductSelected] = useState<ProductModel>();
  const [selectedRowKeys, setSelectedRowKeys] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  console.log("pageSize", pageSize);
  const [total, setTotal] = useState<number>(10);
  console.log()
  const [searchKey, setSearchKey] = useState("");
  const [isFilting, setIsFilting] = useState(false);

  const navigate = useNavigate();

useEffect(() => {
  if (!searchKey) {
    // setPage(1);  
    getProducts(`/products/page?page=${page}&pageSize=${pageSize}`);
  }
}, [searchKey, page, pageSize]);
  
   const hanleRemoveProduct = async (id: string) => {
     const api = `/products/${id}`;
     try {
       await handleAPI(api, undefined, "delete");
       const items = [...products];
       const index = items.findIndex((element) => element.id === id);

       if (index !== -1) {
         items.splice(index, 1);
       }

       setProducts(items);

       message.success("Product removed!!!");
     } catch (error: any) {
       message.error(error.message);
     }
   };


  const getProducts = async (api: string) => {
    setIsLoading(true);
    try {
      const res:any = await handleAPI(api);
      const data = res.result.data;
      const total = res.result.totalElements;
      setProducts(data.map((item: any) => ({ ...item, key: item.id })));
      setTotal(total);
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  const onSelectChange = (newSelectRowKeys: React.Key[]) => {
    setSelectedRowKeys(newSelectRowKeys);
  };

  const rowSelection: TableRowSelection<ProductModel> = {
    selectedRowKeys,
    onChange: onSelectChange,
  };
  const getMinMaxValues = (data: SubProductModel[]) => {
    const nums: number[] = [];

    if (data.length > 0) {
      data.forEach((item) => nums.push(item.price));
    }

    return nums.length > 0
      ? `${Math.min(...nums).toLocaleString()} - ${Math.max(
          ...nums
        ).toLocaleString()}`
      : "";
  };

 

  const columns: ColumnProps<ProductModel>[] = [
    {
      key: "title",
      dataIndex: "",
      title: "Title",
      width: 300,
      render: (item: ProductModel) => (
        <Link to={`/inventory/detail/${item.slug}?id=${item.id}`}>
          {item.title}
        </Link>
      ),
    },
    {
      key: "description",
      dataIndex: "description",
      title: "description",
      width: 400,
      render: (desc: string) => (
        <Tooltip style={{ width: 320 }} title={desc}>
          <div className="text-2-line">{desc}</div>
        </Tooltip>
      ),
    },
    {
      key: "categories",
      dataIndex: "categories",
      title: "categories",
      render: (cats: CategoyModel[]) => (
        <Space key={"categories-nd"} wrap>
          {cats.map((cat) => (
            <Link to={`/inventory/categories/detail/${cat.slug}?id=${cat.id}`}>
              <Tag
                color={
                  listColors[Math.floor(Math.random() * listColors.length)]
                }
                key={cat.id}
              >
                {cat.title}
              </Tag>
            </Link>
          ))}
        </Space>
      ),
      width: 300,
    },
    // {
    //   key: "images",
    //   dataIndex: "images",
    //   title: "Images",
    //   render: (imgs: string[]) =>
    //     imgs &&
    //     imgs.length > 0 && (
    //       <Space>
    //         <Avatar.Group>
    //           {imgs.map((img) => (
    //             <Avatar src={img} size={40} />
    //           ))}
    //         </Avatar.Group>
    //       </Space>
    //     ),
    //   width: 300,
    // },
    {
      key: "colors",
      dataIndex: "subProducts",
      title: "Color",
      render: (items: SubProductModel[]) => {
        const colors: string[] = [];

        items.forEach(
          (sub) => !colors.includes(sub.color) && colors.push(sub.color)
        );

        return (
          <Space>
            {colors.length > 0 &&
              colors.map((item, index) => (
                <div
                  style={{
                    width: 24,
                    height: 24,
                    backgroundColor: item,
                    borderRadius: 12,
                  }}
                  key={`color${item}${index}`}
                />
              ))}
          </Space>
        );
      },
      width: 300,
    },
    {
      key: "sizes",
      dataIndex: "subProducts",
      title: "Sizes",
      render: (items: SubProductModel[]) => (
        <Space wrap>
          {items.length > 0 &&
            items.map((item, index) => (
              <Tag key={`size${item.size}-${index}`}>{item.size}</Tag>
            ))}
        </Space>
      ),
      width: 150,
    },
    {
      key: "price",
      dataIndex: "subProducts",
      title: "Price",
      render: (items: SubProductModel[]) => (
        <Typography.Text>{getMinMaxValues(items)}</Typography.Text>
      ),
      width: 200,
    },
    {
      key: "stock",
      dataIndex: "subProducts",
      title: "Stock",
      render: (items: SubProductModel[]) =>
        items.reduce((a, b) => a + b.qty, 0),
      align: "right",
      width: 100,
    },
    {
      key: "actions",
      title: "Actions",
      dataIndex: "",
      fixed: "right",
      width: 150,
      render: (item: ProductModel) => (
        <Space>
          <Tooltip title="Add sub product" key={"addSubProduct"}>
            <Button
              icon={<MdLibraryAdd color={colors.primary500} size={20} />}
              type="text"
              onClick={() => {
                setProductSelected(item);
                setIsVisibleAddSubProduct(true);
              }}
            />
          </Tooltip>
          <Tooltip title="Delete product" key={"btnDelete"}>
            <Button
              icon={<Trash className="text-danger" size={20} />}
              type="text"
              onClick={() =>
                confirm({
                  title: "Confirm?",
                  content: "Are you sure you want to delete this item?",
                  onCancel: () => console.log("cancel"),
                  onOk: () => {hanleRemoveProduct(item.id)},
                })
              }
            />
          </Tooltip>
          <Tooltip title="Edit product" key={"btnEdit"}>
            <Button
              icon={<Edit2 color={colors.primary500} size={20} />}
              type="text"
              onClick={() => navigate(`/inventory/add-product?id=${item.id}`)}
            />
          </Tooltip>
        </Space>
      ),
      align: "right",
    },
  ];
  const handleSearchProducts = async () => {
    const key = replaceName(searchKey);
    const api = `/products/page?title=${key}&page=${page}&pageSize=${pageSize}`;
    setIsLoading(true);
    try {
      const res: any = await handleAPI(api);

      setProducts(res.result.data);
      setTotal(res.totalElements);
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };
  const handleSelectAllProduct = async () => {
    try {
      const res: any = await handleAPI("/products");

      const items = res.result
      console.log("Items:", items);

      if (items.length > 0) {
        const keys = items.map((item: any) => item.id);
        console.log("Selected Keys:", keys);
        setSelectedRowKeys(keys);
      } else {
        setSelectedRowKeys([]);
      }
    } catch (error) {
      console.error("Lỗi khi gọi API:", error);
    }
  };




  return (
    <div>
      <div className="row">
        <div className="col">
          <Typography.Title level={4}>Product</Typography.Title>
        </div>
        <div className="col">
          {selectedRowKeys.length > 0 && (
            <Space>
              <Tooltip title="Delete product">
                <Button
                  onClick={() =>
                    confirm({
                      title: "Confirm?",
                      content: "Are you sure you want to delete this item?",
                      onCancel: () => {
                        setSelectedRowKeys([]);
                      },
                      onOk: () => {
                        setSelectedRowKeys([]);
                        selectedRowKeys.forEach(async (key) =>{
                          await hanleRemoveProduct(key);
                          await getProducts(`/products/page?page=${page}&pageSize=${pageSize}`);
                          setSelectedRowKeys([]);
                          
                        } );
                      },
                    })
                  }
                  danger
                  type="text"
                  icon={<Trash size={18} className="text-danger" />}
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

        <div className="col text-right">
          <Space>
            {isFilting && (
              <Button
                onClick={async () => {
                  setPage(1);
                  await getProducts(
                    `/products/page?page=${page}&pageSize=${pageSize}`
                  );
                  setIsFilting(false);
                }}
              >
                Clear filter values
              </Button>
            )}
            <Input.Search
              value={searchKey}
              onChange={(val) => setSearchKey(val.target.value)}
              onSearch={handleSearchProducts}
              placeholder="Search"
              allowClear
            />
            {/* <Dropdown
              dropdownRender={(menu) => (
                <FilterProduct
                  values={{}}
                  onFilter={(vals: any) => handleFilterProducts(vals)}
                />
              )}
            >
              <Button icon={<Sort size={20} />}>Filter</Button>
            </Dropdown> */}
            <Divider type="vertical" />
            <Button type="primary">Add Product</Button>
          </Space>
        </div>
      </div>
      <Table
        rowKey={(record) => record.id}
        pagination={{
          showSizeChanger: true,
          onShowSizeChange: (current, size) => {
            console.log(current, size);
            console.log("size");
          },
          total,
          onChange(page, pageSize) {
            console.log(page, pageSize);
            setPage(page);
            setPageSize(pageSize);
          },
          showQuickJumper: false,
        }}
        rowSelection={rowSelection}
        dataSource={products}
        columns={columns}
        loading={isLoading}
        scroll={{
          x: "100%",
        }}
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
        onAddNew={async (val: any) => {
         
        }}
      />
    </div>
  );
};

export default Inventories;
