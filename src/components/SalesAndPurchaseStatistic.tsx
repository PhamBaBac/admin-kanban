/** @format */

import { Card, Empty, Radio, Spin } from "antd";
import { useEffect, useState, useMemo } from "react";
import { Bar, Line } from "react-chartjs-2";
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
    maintainAspectRatio: false,
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
      const dataArray = Array.isArray(res)
        ? res
        : Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.result)
        ? res.result
        : [];
      setDatas(dataArray);
    } catch (error) {
      console.error("Failed to load statistics:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const chartData = useMemo(() => {
    const list = Array.isArray(datas) ? datas : [];
    return {
      labels: list.map((item) => {
        if (!item || !item.date) return "";
        if (timeTypeSelected === "yearly") {
          return item.date; // "2025"
        } else if (timeTypeSelected === "weekly") {
          const parts = String(item.date).split("-W");
          return parts[1] ? `Week ${parts[1]}` : item.date;
        } else {
          return item.date; // monthly: "YYYY-MM"
        }
      }),
      datasets: [
        {
          label: "Sales",
          data: list.map((item) => item?.data?.purchase ?? 0),
          backgroundColor: "rgba(255, 99, 132, 0.2)",
          borderColor: "rgba(255, 99, 132, 1)",
          borderWidth: 1,
        },
        {
          label: "Orders",
          data: list.map((item) => item?.data?.orders ?? 0),
          backgroundColor: "rgba(54, 162, 235, 0.2)",
          borderColor: "rgba(54, 162, 235, 1)",
          borderWidth: 1,
        },
      ],
    };
  }, [datas, timeTypeSelected]);

  const loading = isLoading || statisticsLoading;
  const hasData = datas && datas.length > 0;

  return (
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
          <Spin spinning={loading}>
            <div style={{ height: 320, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {hasData ? (
                <div style={{ width: "100%", height: "100%" }}>
                  <Bar data={chartData} options={options} />
                </div>
              ) : (
                <Empty description="No data" />
              )}
            </div>
          </Spin>
        </Card>
      </div>
      <div className="col-sm-12 col-md-6">
        <Card title="Sales summary">
          <Spin spinning={loading}>
            <div style={{ height: 320, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {hasData ? (
                <div style={{ width: "100%", height: "100%" }}>
                  <Line data={chartData} options={options} />
                </div>
              ) : (
                <Empty description="No data" />
              )}
            </div>
          </Spin>
        </Card>
      </div>
    </div>
  );
};

export default SalesAndPurchaseStatistic;
