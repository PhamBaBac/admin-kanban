/** @format */

import { Card, DatePicker, Dropdown, Empty, Radio, Spin } from "antd";
import React, { useEffect, useState } from "react";
import { Bar, Line } from "react-chartjs-2";
import handleAPI from "../apis/handleAPI";
import { DateTime } from "../utils/dateTime";
import { add0toNumber } from "../utils/add0toNumber";
import { useStatistics } from "../hooks/useStatistics";

const SalesAndPurchaseStatistic = () => {
  const [timeTypeSelected, setTimeTypeSelected] = useState("monthly");
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
  const { getSalesAndPurchaseData, loading: statisticsLoading } =
    useStatistics();

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "bottom" as const,
      },
      title: {
        display: false,
      },
    },
  };

  useEffect(() => {
    getSalseAndPurchase();
  }, [timeTypeSelected]);

  const getSalseAndPurchase = async () => {
    setIsLoading(true);
    try {
      const res: any = await getSalesAndPurchaseData({
        timeType: timeTypeSelected,
      });
      setDatas(res.result || res);
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderChart = () => {
    return {
      labels: datas.map((item) => {
        if (timeTypeSelected === "yearly") {
          return item.date; // "2025"
        } else if (timeTypeSelected === "weekly") {
          const weekNumber = item.date.split("-W")[1];
          return `Week ${weekNumber}`;
        } else {
          return item.date; // monthly: "YYYY-MM"
        }
      }),
      datasets: [
        {
          label: "Sales",
          data: datas.map((item) => item.data.purchase),
          backgroundColor: "rgba(255, 99, 132, 0.2)",
          borderColor: "rgba(255, 99, 132, 1)",
          borderWidth: 1,
        },
        {
          label: "Orders",
          data: datas.map((item) => item.data.orders),
          backgroundColor: "rgba(54, 162, 235, 0.2)",
          borderColor: "rgba(54, 162, 235, 1)",
          borderWidth: 1,
        },
      ],
    };
  };

  return isLoading || statisticsLoading ? (
    <div className="text-center">
      <Spin />
    </div>
  ) : datas ? (
    <div className="row mt-4">
      <div className="col-sm-12 col-md-6">
        <Card
          title="Purchase & Order"
          extra={
            <Radio.Group
              value={timeTypeSelected}
              onChange={(e) => setTimeTypeSelected(e.target.value)}
              options={[
                { label: "Weekly", value: "weekly" },
                {
                  label: "Monthly",
                  value: "monthly",
                },
                {
                  label: "Yearly",
                  value: "yearly",
                },
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
