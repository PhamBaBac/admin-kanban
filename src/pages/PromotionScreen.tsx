/** @format */

import { ColumnProps } from "antd/es/table";
import { useEffect, useState } from "react";
import handleAPI from "../apis/handleAPI";
import { PromotionModel } from "../models/PromotionModel";
import { Avatar, Button, Image, Modal, Space, Table } from "antd";
import { Edit2, Trash } from "iconsax-react";
import AddPromotion from "../modals/AddPromotion ";

const { confirm } = Modal;

const PromotionScreen = () => {
  const [isVisibleModalAddPromotion, setIsVisibleModalAddPromotion] =
    useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [promotions, setPromotions] = useState<PromotionModel[]>([]);
  const [promotionSelected, setPromotionSelected] = useState<PromotionModel>();

  useEffect(() => {
    getPromotions();
  }, []);

  const getPromotions = async () => {
    const api = `/promotions`;
    setIsLoading(true);
    try {
      const res: any = await handleAPI(api);
      setPromotions(res.result);
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemovePromotion = async (id: string) => {
    const api = `/promotions/${id}`;

    try {
      await handleAPI(api, undefined, "delete");
      await getPromotions();
    } catch (error) {
      console.log(error);
    }
  };

  const columns: ColumnProps<PromotionModel>[] = [
    {
      key: "image",
      dataIndex: "imageURL",
      title: "Image",
      render: (img: string) => <Avatar src={img} size={50} />,
    },
    {
      key: "title",
      dataIndex: "title",
      title: "Title",
    },
    {
      key: "description",
      dataIndex: "description",
      title: "Description",
    },
    {
      key: "code",
      dataIndex: "code",
      title: "Code",
    },
    {
      key: "available",
      dataIndex: "numOfAvailable",
      title: "Available",
    },

    {
      key: "value",
      dataIndex: "value",
      title: "Value",
    },
    {
      key: "type",
      dataIndex: "type",
      title: "Type",
    },
    {
      key: "btn",
      dataIndex: "",
      align: "right",
      fixed: "right",
      render: (item: PromotionModel) => (
        <Space>
          <Button
            onClick={() => {
              setPromotionSelected(item);
              setIsVisibleModalAddPromotion(true);
            }}
            type="text"
            icon={<Edit2 variant="Bold" size={20} className="text-info" />}
          />
          <Button
            onClick={() =>
              confirm({
                title: "Confirm",
                content: "Are you sure you want to remove this promotion?",
                onOk: () => handleRemovePromotion(item.id),
              })
            }
            type="text"
            icon={<Trash variant="Bold" size={20} className="text-danger" />}
          />
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="container">
        <Button
          type="primary"
          onClick={() => setIsVisibleModalAddPromotion(true)}
        >
          Add new promotion
        </Button>
        <div className="mt-3"></div>
        <Table loading={isLoading} columns={columns} dataSource={promotions} />
      </div>

      <AddPromotion
        promotion={promotionSelected}
        onAddNew={async () => {
          await getPromotions();
          setPromotionSelected(undefined); // ← Sửa lỗi ở đây
          setIsVisibleModalAddPromotion(false);
        }}
        visible={isVisibleModalAddPromotion}
        onClose={() => {
          setPromotionSelected(undefined); // ← Và ở đây
          setIsVisibleModalAddPromotion(false);
        }}
      />
    </div>
  );
};

export default PromotionScreen;
