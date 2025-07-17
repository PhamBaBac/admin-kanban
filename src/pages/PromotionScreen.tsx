/** @format */

import { ColumnProps } from "antd/es/table";
import { useEffect, useState } from "react";
import { PromotionModel } from "../models/PromotionModel";
import { Avatar, Button, Image, Modal, Space, Table } from "antd";
import { Edit2, Trash } from "iconsax-react";
import AddPromotion from "../modals/AddPromotion ";
import { usePromotions } from "../hooks/usePromotions";

const { confirm } = Modal;

const PromotionScreen = () => {
  const { getPromotions, deletePromotion, loading, error } = usePromotions();
  const [isVisibleModalAddPromotion, setIsVisibleModalAddPromotion] =
    useState(false);
  const [promotions, setPromotions] = useState<PromotionModel[]>([]);
  const [promotionSelected, setPromotionSelected] = useState<PromotionModel>();

  useEffect(() => {
    fetchPromotions();
  }, []);

  const fetchPromotions = async () => {
    try {
      const response = await getPromotions();
      setPromotions(response);
    } catch (error) {
      console.log(error);
    }
  };

  const handleRemovePromotion = async (id: string) => {
    try {
      await deletePromotion(id);
      await fetchPromotions();
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
        <Table loading={loading} columns={columns} dataSource={promotions} />
      </div>

      <AddPromotion
        promotion={promotionSelected}
        onAddNew={(newPromotion) => {
          if (promotionSelected) {
            // Update: thay thế promotion cũ
            setPromotions((prev) =>
              prev.map((p) =>
                p.id === promotionSelected.id ? newPromotion : p
              )
            );
          } else {
            // Add: thêm promotion mới
            setPromotions((prev) => [...prev, newPromotion]);
          }
          setPromotionSelected(undefined);
          setIsVisibleModalAddPromotion(false);
        }}
        visible={isVisibleModalAddPromotion}
        onClose={() => {
          setPromotionSelected(undefined);
          setIsVisibleModalAddPromotion(false);
        }}
      />
    </div>
  );
};

export default PromotionScreen;
