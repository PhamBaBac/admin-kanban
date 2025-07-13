/** @format */

import { Card, Spin, Typography } from "antd";
import { useEffect, useState } from "react";
import { SalesAndPurchaseStatistic, StatisticComponent } from "../components";
import { BillModel } from "../models/BillModel";
import { VND } from "../utils/handleCurrency";
import handleAPI from "../apis/handleAPI";
import { ProductModel } from "../models/Products";

const HomeScreen = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [bestSellers, setBestSellers] = useState<ProductModel[]>([]);
  const [statistics, setStatistics] = useState({
    totalProducts: 0,
    totalSuppliers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    totalSubProducts: 0,
    totalSubProductValue: 0,
  });

  useEffect(() => {
    getStatistics();
  }, []);

  const getStatistics = async () => {
    setIsLoading(true);
    try {
      // Lấy best sellers
      const bestSellersResponse: any = await handleAPI("/products/bestSellers");
      setBestSellers(bestSellersResponse.result || []);

      // Lấy thống kê tổng quan
      // const statsResponse: any = await handleAPI("/statistics/dashboard");
      // if (statsResponse && statsResponse.data) {
      //   setStatistics(statsResponse.data);
      // }
    } catch (error) {
      console.error("Error fetching statistics:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return isLoading ? (
    <div className="container text-center py-5">
      <Spin />
    </div>
  ) : (
    <div className="container">
      <div className="row">
        <div className="col-sm-12 col-md-8">
          {bestSellers && bestSellers.length > 0 && (
            <Card className="mb-4">
              <Typography.Title level={3}>Sales Overviews</Typography.Title>
              <div className="row mt-4">
                <StatisticComponent
                  value={bestSellers.length.toLocaleString()}
                  title="Sales"
                  image="./access/icons8-sales-32.png"
                />
                <StatisticComponent
                  value={VND.format(
                    bestSellers.reduce((a, b) => {
                      const totalPrice =
                        b.subItems?.reduce(
                          (sum, item) => sum + item.price,
                          0
                        ) || 0;
                      return a + totalPrice;
                    }, 0)
                  )}
                  title="Revenue"
                  color="#DE5AFF"
                  image="./access/icons8-revenue-50.png"
                />
                <StatisticComponent
                  value={VND.format(
                    bestSellers.reduce((a, b) => {
                      const totalPrice =
                        b.subItems?.reduce(
                          (sum, item) => sum + item.price,
                          0
                        ) || 0;
                      const totalCost =
                        b.subItems?.reduce((sum, item) => sum + item.cost, 0) ||
                        0;
                      return a + (totalPrice - totalCost);
                    }, 0)
                  )}
                  title="Profit"
                  color="#FFB946"
                  image="./access/icons8-profit-80.png"
                />
                <StatisticComponent
                  value={VND.format(
                    bestSellers.reduce((a, b) => {
                      const totalCost =
                        b.subItems?.reduce((sum, item) => sum + item.cost, 0) ||
                        0;
                      return a + totalCost;
                    }, 0)
                  )}
                  title="Cost"
                  color="#FF5959"
                  image="./access/icons8-sales-32.png"
                />
              </div>
            </Card>
          )}
        </div>
        <div className="col-sm-12 col-md-4">
          <div className="row">
            <div className="col-sm-12">
              {bestSellers && bestSellers.length > 0 && (
                <Card className="mb-4">
                  <div className="row mt-4">
                    <div className="col">
                      <StatisticComponent
                        type="vertical"
                        value={`${bestSellers
                          .reduce((a, b) => {
                            const totalQty =
                              b.subItems?.reduce(
                                (sum, item) => sum + item.qty,
                                0
                              ) || 0;
                            return a + totalQty;
                          }, 0)
                          .toLocaleString()}`}
                        title="Total Quantity"
                      />
                    </div>
                    <div className="col">
                      <StatisticComponent
                        type="vertical"
                        value={`${bestSellers.length.toLocaleString()}`}
                        title="Best Sellers"
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
          {statistics.totalOrders > 0 && (
            <Card className="mb-4">
              <Typography.Title level={3}>Purchase Overview</Typography.Title>
              <div className="row mt-4">
                <StatisticComponent
                  value={statistics.totalOrders.toLocaleString()}
                  title="Orders"
                  image="./access/icons8-sales-32.png"
                />
                <StatisticComponent
                  value={VND.format(statistics.totalRevenue)}
                  title="Revenue"
                  color="#DE5AFF"
                  image="./access/icons8-revenue-50.png"
                />
                <StatisticComponent
                  value={statistics.totalSubProducts.toLocaleString()}
                  title="Sub product"
                  color="#FFB946"
                  image="./access/icons8-profit-80.png"
                />
                <StatisticComponent
                  value={VND.format(statistics.totalSubProductValue)}
                  title="Total"
                  color="#FF5959"
                  image="./access/icons8-sales-32.png"
                />
              </div>
            </Card>
          )}
        </div>
        <div className="col-sm-12 col-md-4">
          <div className="row">
            <div className="col-sm-12">
              {statistics.totalProducts > 0 &&
                statistics.totalSuppliers > 0 && (
                  <Card className="mb-4">
                    <div className="row mt-4">
                      <div className="col">
                        <StatisticComponent
                          type="vertical"
                          value={statistics.totalProducts.toLocaleString()}
                          title="Products"
                        />
                      </div>
                      <div className="col">
                        <StatisticComponent
                          type="vertical"
                          value={`${statistics.totalSuppliers.toLocaleString()}`}
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

      {/* <SalesAndPurchaseStatistic /> */}
    </div>
  );
};

export default HomeScreen;
