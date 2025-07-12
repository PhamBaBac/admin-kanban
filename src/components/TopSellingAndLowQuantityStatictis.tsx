/** @format */

import { Avatar, Button, Card, List, Table, Tag } from "antd";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import handleAPI from "../apis/handleAPI";
import { ProductModel } from "../models/Products";
import { VND } from "../utils/handleCurrency";

interface TopSellingItem {
  name: string;
  soldQuantity: number;
  remainingQuantity: number;
  price: number;
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

  useEffect(() => {
    getTopStatictis();
  }, []);

  const getTopStatictis = async () => {
    const api = `/statistics/topSellingAndLowQuantity`;
    setIsLoading(true);
    try {
      const res: any = await handleAPI(api);
      setDatas(res.result);
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
          loading={isLoading}
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
                title: "Product Name",
                dataIndex: "name",
                key: "name",
                render: (value) => (
                  <div style={{ fontSize: "12px", lineHeight: "1.3" }}>
                    {value.length > 60 ? value.substring(0, 60) + "..." : value}
                  </div>
                ),
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
                dataIndex: "remainingQuantity",
                key: "remainingQuantity",
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
          loading={isLoading}
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
                    <div style={{ fontSize: "12px", lineHeight: "1.4" }}>
                      {item.name.length > 50
                        ? item.name.substring(0, 50) + "..."
                        : item.name}
                    </div>
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
