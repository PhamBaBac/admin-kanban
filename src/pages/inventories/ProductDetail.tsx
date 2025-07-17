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
} from "antd";
import { ColumnProps } from "antd/es/table";
import { Edit2, Trash } from "iconsax-react";
import { VND } from "../../utils/handleCurrency";
import { colors } from "../../constants/colors";
import { AddSubProductModal } from "../../modals";

const ProductDetail = () => {
  const { getSubProducts, deleteSubProduct, loading, error } = useProducts();
  const [productDetail, setProductDetail] = useState<ProductModel>();
  const [subProducts, setSubProducts] = useState<SubProductModel[]>([]);
  const [productSelected, setProductSelected] = useState<ProductModel>();
  const [isVisibleAddSubProduct, setIsVisibleAddSubProduct] = useState(false);
  const [subProductSelected, setSubProductSelected] =
    useState<SubProductModel>();
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
      title: "Size",
      key: "size",
      dataIndex: "size",
      render: (size: string) => <Tag>{size}</Tag>,
      align: "center",
    },
    {
      title: "Color",
      key: "color",
      dataIndex: "color",
      render: (color: string) => <Tag color={color}>{color}</Tag>,
      align: "center",
    },
    {
      key: "price",
      title: "Price",
      dataIndex: "price",
      render: (price: number) => VND.format(price),
      align: "right",
    },
    {
      key: "discount",
      title: "Discount",
      dataIndex: "discount",
      render: (discount: number) => (discount ? VND.format(discount) : null),
      align: "right",
    },
    {
      key: "stock",
      title: "stock",
      dataIndex: "stock",
      render: (stock: number) => stock.toLocaleString(),
      align: "right",
    },
    {
      key: "actions",
      dataIndex: "",
      render: (item: SubProductModel) => (
        <Space>
          <Button
            type="text"
            onClick={() => {
              setSubProductSelected(item);
              setIsVisibleAddSubProduct(true);
            }}
            icon={<Edit2 variant="Bold" color={colors.primary500} size={18} />}
          />
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
              setIsVisibleAddSubProduct(true);
            }}
            type="primary"
          >
            Add sub product
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
          onClose={() => {
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
