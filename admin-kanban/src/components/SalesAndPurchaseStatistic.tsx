/** @format */

import { Card, Empty, Radio, Spin } from 'antd';
import React, { useEffect, useState } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import { DateTime } from '../utils/dateTime';
import { add0toNumber } from '../utils/add0toNumber';

const SalesAndPurchaseStatistic = () => {
  const [timeTypeSelected, setTimeTypeSelected] = useState('monthly');
  const [isLoading, setIsLoading] = useState(false);
  const [datas, setDatas] = useState<
    {
      date: string;
      data: {
        orders: number;
        purchase: number;
      };
    }[]
  >([]);

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
      title: {
        display: false,
      },
    },
  };

  useEffect(() => {
    getSalseAndPurchase();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeTypeSelected]);

  const getSalseAndPurchase = async () => {
    setIsLoading(true);
    try {
      // Tạo dữ liệu giả dựa vào timeTypeSelected
      let fakeData: typeof datas = [];
      if (timeTypeSelected === 'weekly') {
        fakeData = [
          { date: '2025-02-17', data: { orders: 10, purchase: 5 } },
          { date: '2025-02-18', data: { orders: 15, purchase: 7 } },
          { date: '2025-02-19', data: { orders: 12, purchase: 9 } },
          { date: '2025-02-20', data: { orders: 20, purchase: 10 } },
          { date: '2025-02-21', data: { orders: 8, purchase: 4 } },
          { date: '2025-02-22', data: { orders: 18, purchase: 12 } },
          { date: '2025-02-23', data: { orders: 25, purchase: 15 } },
        ];
      } else if (timeTypeSelected === 'monthly') {
        fakeData = Array.from({ length: 30 }).map((_, i) => {
          const date = new Date(2025, 1, i + 1).toISOString();
          return {
            date,
            data: {
              orders: Math.floor(Math.random() * 50) + 10,
              purchase: Math.floor(Math.random() * 30) + 5,
            },
          };
        });
      } else if (timeTypeSelected === 'yearly') {
        fakeData = Array.from({ length: 12 }).map((_, i) => {
          const date = new Date(2025, i, 1).toISOString();
          return {
            date,
            data: {
              orders: Math.floor(Math.random() * 500) + 50,
              purchase: Math.floor(Math.random() * 300) + 30,
            },
          };
        });
      }
      // Giả lập delay
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setDatas(fakeData);
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderChart = () => {
    return {
      labels: datas.map((item) =>
        timeTypeSelected === 'yearly'
          ? `${add0toNumber(new Date(item.date).getMonth() + 1)}`
          : DateTime.getShortDate(item.date)
      ),
      datasets: [
        {
          label: 'Sales',
          data: datas.map((item) => item.data.purchase),
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1,
        },
        {
          label: 'Orders',
          data: datas.map((item) => item.data.orders),
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1,
        },
      ],
    };
  };

  return isLoading ? (
    <div className="text-center">
      <Spin />
    </div>
  ) : datas && datas.length > 0 ? (
    <div className="row mt-4">
      <div className="col-sm-12 col-md-6">
        <Card
          title="Purchase & Order"
          extra={
            <Radio.Group
              value={timeTypeSelected}
              onChange={(e) => setTimeTypeSelected(e.target.value)}
              options={[
                { label: 'Weekly', value: 'weekly' },
                { label: 'Monthly', value: 'monthly' },
                { label: 'Yearly', value: 'yearly' },
              ]}
              optionType="button"
            />
          }
        >
          <Bar data={renderChart()} options={options} />
        </Card>
      </div>
      <div className="col-sm-12 col-md-6">
        <Card title="Sales summary">
          <Line data={renderChart()} options={options} />
        </Card>
      </div>
    </div>
  ) : (
    <Empty />
  );
};

export default SalesAndPurchaseStatistic;
