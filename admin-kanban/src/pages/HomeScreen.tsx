/** @format */

import { Card, Spin, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { SalesAndPurchaseStatistic, StatisticComponent } from '../components';
import { BillModel } from '../models/BillModel';
import { VND } from '../utils/handleCurrency';

interface FakeBillModel extends BillModel {
  // Nếu BillModel có thêm thuộc tính, bạn có thể khai báo rõ ở đây hoặc dùng BillModel trực tiếp
}

const HomeScreen = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [statictisValues, setStatictisValues] = useState<{
    sales?: BillModel[];
    products: number;
    suppliers: number;
    orders: number;
    totalOrder: number;
    subProduct: number;
    totalSubProduct: number;
  }>();

  useEffect(() => {
    getStatistics();
  }, []);

  const getStatistics = async () => {
    setIsLoading(true);
    try {
      // Tạo dữ liệu giả với đầy đủ các thuộc tính của BillModel
      const fakeData: {
        sales: BillModel[];
        products: number;
        suppliers: number;
        orders: number;
        totalOrder: number;
        subProduct: number;
        totalSubProduct: number;
      } = {
        sales: [
          {
            _id: '1',
            products: [
              {
                _id: 'p1',
                createdBy: 'admin',
                count: 2,
                cost: 2,
                subProductId: 'sp1',
                image: 'https://via.placeholder.com/150',
                size: 'M',
                color: 'red',
                price: 100,
                qty: 1,
                productId: 'prod1',
                title: 'Product 1',
                __v: 0,
              },
              {
                _id: 'p2',
                createdBy: 'admin',
                count: 1,
                cost: 1,
                subProductId: 'sp2',
                image: 'https://via.placeholder.com/150',
                size: 'L',
                color: 'blue',
                price: 200,
                qty: 2,
                productId: 'prod2',
                title: 'Product 2',
                __v: 0,
              },
            ],
            total: 1000000,
            status: 1,
            customer_id: 'cust1',
            shippingAddress: {
              _id: 's1',
              address: '123 Main St',
            },
            paymentStatus: 1,
            paymentMethod: 'credit card',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            __v: 0,
          },
          {
            _id: '2',
            products: [
              {
                _id: 'p3',
                createdBy: 'admin',
                count: 1,
                cost: 3,
                subProductId: 'sp3',
                image: 'https://via.placeholder.com/150',
                size: 'S',
                color: 'green',
                price: 150,
                qty: 1,
                productId: 'prod3',
                title: 'Product 3',
                __v: 0,
              },
              {
                _id: 'p4',
                createdBy: 'admin',
                count: 2,
                cost: 2,
                subProductId: 'sp4',
                image: 'https://via.placeholder.com/150',
                size: 'XL',
                color: 'black',
                price: 250,
                qty: 1,
                productId: 'prod4',
                title: 'Product 4',
                __v: 0,
              },
            ],
            total: 2000000,
            status: 2,
            customer_id: 'cust2',
            shippingAddress: {
              _id: 's2',
              address: '456 Side St',
            },
            paymentStatus: 2,
            paymentMethod: 'paypal',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            __v: 0,
          },
        ],
        products: 50,
        suppliers: 10,
        orders: 5,
        totalOrder: 5000000,
        subProduct: 3,
        totalSubProduct: 1500000,
      };
      

      // Giả lập delay
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setStatictisValues(fakeData);
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  const totalcost = (value: BillModel[]) => {
    const items = value.map((item) => {
      return item.products.reduce((a, b) => a + b.price * (b.cost ?? 0), 0);
    });
    return items.reduce((a, b) => a + b, 0);
  };

  return isLoading ? (
    <div className="container text-center py-5">
      <Spin />
    </div>
  ) : (
    <div className="container">
      <div className="row">
        <div className="col-sm-12 col-md-8">
          {statictisValues?.sales && statictisValues.sales.length > 0 && (
            <Card className="mb-4">
              <Typography.Title level={3}>Sales Overviews</Typography.Title>
              <div className="row mt-4">
                <StatisticComponent
                  value={statictisValues.sales.length.toLocaleString()}
                  title="Sales"
                  image="./access/icons8-sales-32.png"
                />
                <StatisticComponent
                  value={VND.format(
                    statictisValues.sales.reduce((a, b) => a + b.total, 0)
                  )}
                  title="Revenue"
                  color="#DE5AFF"
                  image="./access/icons8-revenue-50.png"
                />
                <StatisticComponent
                  value={VND.format(
                    statictisValues.sales.reduce((a, b) => a + b.total, 0) -
                      totalcost(statictisValues.sales)
                  )}
                  title="Profit"
                  color="#FFB946"
                  image="./access/icons8-profit-80.png"
                />
                <StatisticComponent
                  value={VND.format(totalcost(statictisValues.sales))}
                  title="Sales"
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
              {statictisValues?.sales && statictisValues.sales.length > 0 && (
                <Card className="mb-4">
                  <div className="row mt-4">
                    <div className="col">
                      <StatisticComponent
                        type="vertical"
                        value={`${statictisValues.sales
                          .filter((element) => element.paymentStatus === 1)
                          .reduce(
                            (a, b) =>
                              a + (b.products.length > 0 ? b.products.length : 0),
                            0
                          )
                          .toLocaleString()}`}
                        title="Quantity in Hand"
                      />
                    </div>
                    <div className="col">
                      <StatisticComponent
                        type="vertical"
                        value={`${statictisValues.sales
                          .filter((element) => element.paymentStatus === 2)
                          .reduce(
                            (a, b) =>
                              a + (b.products.length > 0 ? b.products.length : 0),
                            0
                          )
                          .toLocaleString()}`}
                        title="To be received"
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
      <div className="row mt-4">
        <div className="col-sm-12 col-md-8">
          {statictisValues?.orders && statictisValues.subProduct > 0 && (
            <Card className="mb-4">
              <Typography.Title level={3}>Purchase Overview</Typography.Title>
              <div className="row mt-4">
                <StatisticComponent
                  value={statictisValues.orders.toLocaleString()}
                  title="Orders"
                  image="./access/icons8-sales-32.png"
                />
                <StatisticComponent
                  value={VND.format(statictisValues.totalOrder)}
                  title="Revenue"
                  color="#DE5AFF"
                  image="./access/icons8-revenue-50.png"
                />
                <StatisticComponent
                  value={statictisValues.subProduct.toLocaleString()}
                  title="Sub product"
                  color="#FFB946"
                  image="./access/icons8-profit-80.png"
                />
                <StatisticComponent
                  value={VND.format(statictisValues.totalSubProduct)}
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
              {statictisValues?.products && statictisValues.suppliers && (
                <Card className="mb-4">
                  <div className="row mt-4">
                    <div className="col">
                      <StatisticComponent
                        type="vertical"
                        value={statictisValues.products.toLocaleString()}
                        title="Products"
                      />
                    </div>
                    <div className="col">
                      <StatisticComponent
                        type="vertical"
                        value={`${statictisValues.suppliers.toLocaleString()}`}
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
      </div>

      <SalesAndPurchaseStatistic />
    </div>
  );
};

export default HomeScreen;
