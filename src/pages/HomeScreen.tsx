/** @format */

import { Card, Spin, Typography, Divider } from "antd";
import { useEffect, useState } from "react";
import {
  SalesAndPurchaseStatistic,
  StatisticComponent,
  TopSellingAndLowQuantityStatictis,
} from "../components";
import { useStatistics } from "../hooks/useStatistics";
import { VND } from "../utils/handleCurrency";
import { DashboardStatistics } from "../services/statisticService";

const HomeScreen = () => {
  const { getDashboardStatistics, loading, error } = useStatistics();
  const [statictisValues, setStatictisValues] = useState<DashboardStatistics>();

  useEffect(() => {
    getStatistics();
  }, []);

  const getStatistics = async () => {
    try {
      const res = await getDashboardStatistics();
      setStatictisValues(res);
    } catch (error) {
      console.log(error);
    }
  };

  const totalcost = (value: any[]) => {
    return value.reduce((a, b) => a + b.price * (b.qty ?? 0), 0);
  };

  const sales = statictisValues?.sales || [];
  const totalSales = sales.length;
  const revenue = sales.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
  const cost = sales.reduce((sum, item) => sum + (item.cost || 0), 0);
  const profit = revenue - cost;
  const cancel = sales.filter(
    (item) => item.orderStatus === "CANCELLED"
  ).length;
  const returned = sales.filter(
    (item) => item.orderStatus === "REFUNDED"
  ).length;

  if (loading) {
    return (
      <div className="container text-center py-5">
        <Spin />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container text-center py-5">
        <Typography.Text type="danger">Error: {error}</Typography.Text>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <div className="row">
        <div className="col-sm-12 col-md-8">
          {statictisValues?.sales && (
            <Card className="mb-4">
              <Typography.Title level={3}>Sales Overview</Typography.Title>
              <div className="row mt-4 text-center align-items-center">
                <div
                  className="col"
                  style={{ borderRight: "1px solid #f0f0f0" }}
                >
                  <StatisticComponent
                    value={totalSales.toLocaleString()}
                    title="Sales"
                    image="./access/Sales.png"
                  />
                </div>

                <div
                  className="col"
                  style={{ borderRight: "1px solid #f0f0f0" }}
                >
                  <StatisticComponent
                    value={VND.format(revenue)}
                    title="Revenue"
                    image="./access/Revenue.png"
                  />
                </div>
                <div
                  className="col"
                  style={{ borderRight: "1px solid #f0f0f0" }}
                >
                  <StatisticComponent
                    value={VND.format(profit)}
                    title="Profit"
                    image="./access/icons8-profit-80.png"
                  />
                </div>
                <div className="col">
                  <StatisticComponent
                    value={VND.format(cost)}
                    title="Cost"
                    image="./access/Cost.png"
                  />
                </div>
              </div>
            </Card>
          )}
        </div>
        <div className="col-sm-12 col-md-4">
          <div className="row">
            <div className="col-sm-12">
              {statictisValues?.sales && (
                <Card className="mb-4">
                  <Typography.Title level={3}>Order Overview</Typography.Title>
                  <div className="row mt-4 ">
                    <div
                      className="col"
                      style={{ borderRight: "1px solid #f0f0f0" }}
                    >
                      <StatisticComponent
                        value={`${statictisValues.sales
                          .filter(
                            (element) => element.orderStatus === "PENDING"
                          )
                          .length.toLocaleString()}`}
                        title="Pending"
                        image="./access/Pending.png"
                      />
                    </div>
                    <div className="col">
                      <StatisticComponent
                        value={`${statictisValues.sales
                          .filter(
                            (element) => element.orderStatus === "CANCELLED"
                          )
                          .length.toLocaleString()}`}
                        title="Cancelled"
                        image="./access/icons8-cancel-40.png"
                      />
                    </div>
                  </div>
                </Card>
              )}
            </div>
            <div className="col-sm-12"></div>
          </div>
        </div>
      </div>
      {/* <div className="row mt-4">
        <div className="col-sm-12 col-md-8">
          <Card className="mb-4">
            <Typography.Title level={3}>Purchase Overview</Typography.Title>
            <div className="row mt-4">
              <div className="col" style={{ borderRight: "1px solid #f0f0f0" }}>
                <StatisticComponent
                  value={statictisValues?.totalQty?.toLocaleString() ?? "0"}
                  title="Purchases"
                  image="./access/Purchase-bag.png"
                />
              </div>
              <div className="col" style={{ borderRight: "1px solid #f0f0f0" }}>
                <StatisticComponent
                  value={VND.format(statictisValues?.totalSubProduct ?? 0)}
                  title="Cost"
                  color="#DE5AFF"
                  image="./access/Cost.png"
                />
              </div>
              <div className="col" style={{ borderRight: "1px solid #f0f0f0" }}>
                <StatisticComponent
                  value={statictisValues?.products?.toLocaleString() ?? "0"}
                  title="Product"
                  color="#FFB946"
                  image="./access/Cost.png"
                />
              </div>
              <div className="col">
                <StatisticComponent
                  value={VND.format(statictisValues?.totalSubProduct ?? 0)}
                  title="Total"
                  color="#FF5959"
                  image="./access/icons8-sales-32.png"
                />
              </div>
            </div>
          </Card>
        </div>
        <div className="col-sm-12 col-md-4">
          <div className="row">
            <div className="col-sm-12">
              {statictisValues?.subProduct && statictisValues.suppliers && (
                <Card className="mb-4">
                  <div className="row mt-4">
                    <div
                      className="col"
                      style={{ borderRight: "1px solid #f0f0f0" }}
                    >
                      <StatisticComponent
                        type="vertical"
                        value={
                          statictisValues?.subProduct?.toLocaleString() ?? "0"
                        }
                        title="Sub Product"
                      />
                    </div>
                    <div className="col">
                      <StatisticComponent
                        type="vertical"
                        value={`${
                          statictisValues?.suppliers?.toLocaleString() ?? "0"
                        }`}
                        title="Suppliers"
                      />
                    </div>
                  </div>
                </Card>
              )}
            </div>
            <div className="col-sm-12"></div>
          </div>
        </div>
      </div> */}

      <SalesAndPurchaseStatistic />
      <TopSellingAndLowQuantityStatictis />
    </div>
  );
};

export default HomeScreen;
