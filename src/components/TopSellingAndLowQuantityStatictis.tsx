/** @format */

import { Avatar, Button, Card, List, Table, Tag, Tooltip } from "antd";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import handleAPI from "../apis/handleAPI";
import { ProductModel } from "../models/Products";
import { VND } from "../utils/handleCurrency";
import { useStatistics } from "../hooks/useStatistics";

interface TopSellingItem {
  title: string;
  color: string;
  size: string;
  soldQuantity: number;
  stock: number;
  price: number;
  images?: string[];
}

interface LowQuantityItem {
  name: string;
  remainingQuantity: number;
  images: string[];
}

const TopSellingAndLowQuantityStatictis = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [datas, setDatas] = useState<{
    topSelling: TopSellingItem[];
    lowQuantity: LowQuantityItem[];
  }>();
  const { getTopSellingAndLowQuantity, loading: statisticsLoading } =
    useStatistics();
  useEffect(() => {
    getTopStatictis();
  }, []);
  const getTopStatictis = async () => {
    setIsLoading(true);
    try {
      const res = await getTopSellingAndLowQuantity();
      setDatas(res as any); // ép kiểu tạm thời để tránh lỗi linter
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="row mt-4">
      <div className="col-sm-12 col-md-8">
        <Card
          loading={isLoading || statisticsLoading}
          title="Top selling stock"
          extra={<Link to={`/bills`}>See all</Link>}
        >
          <Table
            dataSource={datas?.topSelling}
            size="small"
            pagination={{
              pageSize: 5,
              hideOnSinglePage: true,
            }}
            columns={[
              {
                title: "#",
                dataIndex: "",
                align: "center",
                width: 50,
                render: (value, record, index) => index + 1,
              },
              {
                title: "Image",
                dataIndex: "images",
                key: "images",
                align: "center",
                width: 60,
                render: (images: string[] | undefined) =>
                  images && images.length > 0 ? (
                    <Avatar src={images[0]} size={40} />
                  ) : null,
              },
              {
                title: "Product Name",
                dataIndex: "title",
                key: "title",
                render: (value) => (
                  <Tooltip title={value}>
                    <div style={{ fontSize: "12px", lineHeight: "1.3" }}>
                      {value.length > 60
                        ? value.substring(0, 60) + "..."
                        : value}
                    </div>
                  </Tooltip>
                ),
              },
              {
                title: "Color",
                dataIndex: "color",
                key: "color",
                align: "center",
                width: 80,
                render: (color) =>
                  color ? (
                    <div
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: "50%",
                        backgroundColor: color,
                        border: "1px solid #d9d9d9",
                        display: "inline-block",
                      }}
                      title={color}
                    />
                  ) : null,
              },
              {
                title: "Size",
                dataIndex: "size",
                key: "size",
                align: "center",
                width: 60,
                render: (size) => <Tag>{size}</Tag>,
              },
              {
                title: "Sold Qty",
                dataIndex: "soldQuantity",
                key: "soldQuantity",
                align: "center",
                width: 80,
                render: (value) => (
                  <span style={{ fontWeight: "bold", color: "#52c41a" }}>
                    {value.toLocaleString()}
                  </span>
                ),
              },
              {
                title: "Remaining",
                dataIndex: "stock",
                key: "stock",
                align: "center",
                width: 80,
                render: (value) => (
                  <span style={{ fontWeight: "bold", color: "#1890ff" }}>
                    {value.toLocaleString()}
                  </span>
                ),
              },
              {
                title: "Price",
                dataIndex: "price",
                key: "price",
                align: "right",
                width: 100,
                render: (value) => VND.format(value),
              },
              {
                title: "Total Revenue",
                dataIndex: "",
                key: "totalRevenue",
                align: "right",
                width: 120,
                render: (value, record: TopSellingItem) =>
                  VND.format(record.soldQuantity * record.price),
              },
            ]}
          />
        </Card>
      </div>
      <div className="col-sm-12 col-md-4">
        <Card
          loading={isLoading || statisticsLoading}
          title="Low quantity stock"
          extra={<Link to={`/inventory`}>See all</Link>}
        >
          <List
            dataSource={datas?.lowQuantity}
            renderItem={(item) => (
              <List.Item key={item.name} extra={<Tag color="red">Low</Tag>}>
                <List.Item.Meta
                  avatar={
                    <Avatar
                      src={item.images.length > 0 ? item.images[0] : ""}
                      size={40}
                    />
                  }
                  title={
                    <Tooltip title={item.name}>
                      <div style={{ fontSize: "12px", lineHeight: "1.4" }}>
                        {item.name.length > 50
                          ? item.name.substring(0, 50) + "..."
                          : item.name}
                      </div>
                    </Tooltip>
                  }
                  description={
                    <div style={{ fontSize: "11px", color: "#666" }}>
                      Remaining:{" "}
                      <span style={{ color: "#ff4d4f", fontWeight: "bold" }}>
                        {item.remainingQuantity}
                      </span>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        </Card>
      </div>
    </div>
  );
};

export default TopSellingAndLowQuantityStatictis;
