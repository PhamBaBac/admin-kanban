import React, { useEffect, useState } from "react";
import {
  Card,
  Row,
  Col,
  Statistic,
  DatePicker,
  Button,
  Select,
  Table,
  Tag,
  Progress,
  Typography,
  Space,
  Divider,
  Spin,
} from "antd";
import {
  Chart,
  MoneyChange,
  Coin,
  Bag2,
  TruckFast,
  ExportSquare,
  Refresh,
  Calendar,
  Wallet3,
  Box,
} from "iconsax-react";
import { Bar, Line, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
} from "chart.js";
import { useStatistics } from "../hooks/useStatistics";
import { orderService } from "../services/orderService";
import { shipmentService } from "../services/shipmentService";
import { VND } from "../utils/handleCurrency";
import { colors } from "../constants/colors";
import { ColorBadge } from "../utils/colorHelper";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement
);

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const ReportScreen: React.FC = () => {
  const { getDashboardStatistics, getTopSellingAndLowQuantity, getSalesAndPurchaseData } = useStatistics();

  const [loading, setLoading] = useState(false);
  const [filterPeriod, setFilterPeriod] = useState<string>("month");
  const [stats, setStats] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [ordersSummary, setOrdersSummary] = useState<any[]>([]);
  const [shipmentsSummary, setShipmentsSummary] = useState<any[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Lấy số liệu dashboard tổng thể
      const dashStats = await getDashboardStatistics();
      setStats(dashStats);

      // 2. Lấy số liệu biểu đồ theo chu kỳ
      const salesData = await getSalesAndPurchaseData({ timeType: filterPeriod === "year" ? "yearly" : "monthly" });
      const salesArr = Array.isArray(salesData) ? salesData : (salesData as any)?.data || [];
      setChartData(salesArr);

      // 3. Lấy top bán chạy & tồn kho thấp
      const topRes = await getTopSellingAndLowQuantity();
      if (topRes) {
        setTopProducts(topRes.topSelling || []);
      }

      // 4. Lấy đơn hàng mới nhất để phân tích tỷ lệ trạng thái
      const ordersRes = await orderService.getOrders({ page: 1, pageSize: 100 });
      if (ordersRes && ordersRes.data) {
        setOrdersSummary(ordersRes.data);
      }

      // 5. Lấy vận đơn để phân tích tỷ lệ giao hàng
      const shipRes = await shipmentService.getShipments({ page: 1, size: 100 });
      const shipmentList = Array.isArray(shipRes)
        ? shipRes
        : shipRes?.data || shipRes?.content || [];
      setShipmentsSummary(shipmentList);
    } catch (err) {
      console.error("Lỗi khi tải dữ liệu báo cáo:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterPeriod]);

  // Phân tích doanh thu & đơn hàng
  const sales = stats?.sales || [];
  const completedOrders = sales.filter((item: any) => item.orderStatus === "COMPLETED");
  const pendingOrders = sales.filter((item: any) => item.orderStatus === "PENDING");
  const cancelledOrders = sales.filter((item: any) => item.orderStatus === "CANCELLED");

  const totalRevenue = completedOrders.reduce((sum: number, item: any) => sum + (item.totalPrice || 0), 0);
  const totalCost = completedOrders.reduce((sum: number, item: any) => sum + (item.cost || 0), 0);
  const totalProfit = totalRevenue - totalCost;
  const profitMargin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : "0";

  // Phân tích trạng thái vận đơn GHN
  const totalShipments = shipmentsSummary.length;
  const deliveredShipments = shipmentsSummary.filter(
    (s) => (s.shippingStatus || "").toLowerCase() === "delivered"
  ).length;
  const deliverySuccessRate =
    totalShipments > 0 ? Math.round((deliveredShipments / totalShipments) * 100) : 100;

  // Biểu đồ Doanh thu & Chi phí (Line Chart)
  const lineChartConfig = {
    labels: chartData.map((d) => d.date || "Kỳ"),
    datasets: [
      {
        label: "Doanh thu bán ra (VNĐ)",
        data: chartData.map((d) => d.data?.purchase || d.purchase || 0),
        borderColor: "#1570ef",
        backgroundColor: "rgba(21, 112, 239, 0.1)",
        tension: 0.35,
        fill: true,
      },
      {
        label: "Giá vốn hàng nhập (VNĐ)",
        data: chartData.map((d) => d.data?.orders || d.orders || 0),
        borderColor: "#f79009",
        backgroundColor: "rgba(247, 144, 9, 0.1)",
        tension: 0.35,
        fill: true,
      },
    ],
  };

  // Biểu đồ Tròn: Tỷ lệ phân bố trạng thái đơn hàng (Doughnut)
  const doughnutData = {
    labels: ["Hoàn thành", "Chờ xử lý", "Đã hủy"],
    datasets: [
      {
        data: [
          completedOrders.length || 1,
          pendingOrders.length || 0,
          cancelledOrders.length || 0,
        ],
        backgroundColor: ["#12b76a", "#f79009", "#f04438"],
        hoverOffset: 4,
      },
    ],
  };

  // Cột cho bảng Top Sản phẩm sinh lời (map đúng SubProductSellingInfo từ API)
  const topColumns = [
    {
      title: "#",
      render: (_: any, __: any, index: number) => (
        <span style={{ fontWeight: 700, color: index < 3 ? "#1570ef" : "#64748b" }}>
          {index + 1}
        </span>
      ),
      width: 50,
      align: "center" as const,
    },
    {
      title: "Tên sản phẩm & Phân loại",
      key: "title",
      render: (_: any, record: any) => {
        const productName = record.title || record.name || "Sản phẩm";
        return (
          <div>
            <Text strong style={{ fontSize: 13 }}>{productName}</Text>
            {(record.color || record.size) && (
              <div style={{ fontSize: 11, color: "#64748b", display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                {record.color && <ColorBadge color={record.color} size={11} />}
                {record.size && <span>Size {record.size}</span>}
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: "Đã bán",
      key: "soldQuantity",
      align: "center" as const,
      width: 120,
      render: (_: any, record: any) => {
        const sold = record.soldQuantity ?? record.totalSold ?? 0;
        return <Tag color="blue">{sold} món</Tag>;
      },
    },
    {
      title: "Doanh thu mang lại",
      key: "revenue",
      align: "right" as const,
      width: 170,
      render: (_: any, record: any) => {
        const sold = record.soldQuantity ?? record.totalSold ?? 0;
        const price = record.price ?? 0;
        const rev = record.revenue ?? (sold * price);
        return (
          <span style={{ fontWeight: 600, color: "#166534" }}>
            {VND.format(rev)}
          </span>
        );
      },
    },
  ];

  return (
    <div style={{ padding: "8px 0" }}>
      {/* Header & Filter Controls */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 20,
        }}
      >
        <div>
          <Title level={4} style={{ margin: 0, fontWeight: 700 }}>
            Báo cáo & Thống kê tài chính
          </Title>
          <Text type="secondary" style={{ fontSize: 13 }}>
            Phân tích số liệu kinh doanh, dòng tiền, chi phí vận chuyển & hiệu suất kho
          </Text>
        </div>

        <Space wrap size={10}>
          <Select
            value={filterPeriod}
            onChange={setFilterPeriod}
            style={{ width: 150 }}
            options={[
              { value: "week", label: "7 ngày qua" },
              { value: "month", label: "Tháng này" },
              { value: "quarter", label: "Quý này" },
              { value: "year", label: "Năm nay" },
            ]}
          />
          <RangePicker style={{ width: 260 }} />
          <Button icon={<Refresh size={16} />} onClick={fetchData} loading={loading}>
            Làm mới
          </Button>
          <Button
            type="primary"
            icon={<ExportSquare size={16} />}
            style={{ background: "#1570ef" }}
            onClick={() => window.print()}
          >
            Xuất báo cáo
          </Button>
        </Space>
      </div>

      <Spin spinning={loading}>
        {/* KPI Financial Cards */}
        <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
          <Col xs={24} sm={12} lg={6}>
            <Card className="app-card" bordered={false} style={{ borderRadius: 12 }}>
              <Statistic
                title="Tổng doanh thu thực nhận"
                value={totalRevenue}
                formatter={(v) => VND.format(Number(v))}
                valueStyle={{ color: "#1570ef", fontWeight: 700 }}
                prefix={<Coin size={24} color="#1570ef" style={{ marginRight: 8 }} />}
              />
              <div style={{ marginTop: 8, fontSize: 12, color: "#64748b" }}>
                Từ {completedOrders.length} đơn hoàn tất
              </div>
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card className="app-card" bordered={false} style={{ borderRadius: 12 }}>
              <Statistic
                title="Ước tính lợi nhuận gộp"
                value={totalProfit}
                formatter={(v) => VND.format(Number(v))}
                valueStyle={{ color: "#12b76a", fontWeight: 700 }}
                prefix={<MoneyChange size={24} color="#12b76a" style={{ marginRight: 8 }} />}
              />
              <div style={{ marginTop: 8, fontSize: 12, color: "#12b76a", fontWeight: 600 }}>
                Biên lợi nhuận: {profitMargin}%
              </div>
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card className="app-card" bordered={false} style={{ borderRadius: 12 }}>
              <Statistic
                title="Chi phí vốn hàng bán"
                value={totalCost}
                formatter={(v) => VND.format(Number(v))}
                valueStyle={{ color: "#f79009", fontWeight: 700 }}
                prefix={<Wallet3 size={24} color="#f79009" style={{ marginRight: 8 }} />}
              />
              <div style={{ marginTop: 8, fontSize: 12, color: "#64748b" }}>
                Giá nhập từ nhà cung cấp
              </div>
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card className="app-card" bordered={false} style={{ borderRadius: 12 }}>
              <Statistic
                title="Tỷ lệ giao hàng thành công"
                value={deliverySuccessRate}
                suffix="%"
                valueStyle={{ color: "#06a561", fontWeight: 700 }}
                prefix={<TruckFast size={24} color="#06a561" style={{ marginRight: 8 }} />}
              />
              <Progress
                percent={deliverySuccessRate}
                showInfo={false}
                strokeColor="#06a561"
                size="small"
                style={{ marginTop: 6, marginBottom: 0 }}
              />
            </Card>
          </Col>
        </Row>

        {/* Biểu đồ Doanh thu & Tỷ lệ đơn */}
        <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
          <Col xs={24} lg={16}>
            <Card
              className="app-card"
              title={<span style={{ fontWeight: 700 }}>Xu hướng doanh thu & Dòng tiền xuất nhập</span>}
              bordered={false}
              style={{ borderRadius: 12 }}
            >
              <div style={{ height: 320 }}>
                {chartData.length > 0 ? (
                  <Line
                    data={lineChartConfig}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { position: "top" as const },
                        tooltip: {
                          callbacks: {
                            label: (context) => {
                              const val = context.raw as number;
                              return `${context.dataset.label}: ${Number(val).toLocaleString("vi-VN")} ₫`;
                            },
                          },
                        },
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          ticks: {
                            callback: (value) => {
                              const val = Number(value);
                              if (val >= 1000000) {
                                return `${(val / 1000000).toLocaleString("vi-VN")} Tr ₫`;
                              } else if (val >= 1000) {
                                return `${(val / 1000).toLocaleString("vi-VN")} K ₫`;
                              }
                              return `${val} ₫`;
                            },
                          },
                        },
                      },
                    }}
                  />
                ) : (
                  <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", color: "#94a3b8" }}>
                    Chưa có dữ liệu thống kê doanh số cho khoảng thời gian này
                  </div>
                )}
              </div>
            </Card>
          </Col>

          <Col xs={24} lg={8}>
            <Card
              className="app-card"
              title={<span style={{ fontWeight: 700 }}>Cơ cấu trạng thái đơn hàng</span>}
              bordered={false}
              style={{ borderRadius: 12 }}
            >
              <div
                style={{
                  height: 250,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Doughnut
                  data={doughnutData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { position: "bottom" as const },
                    },
                  }}
                />
              </div>
              <Divider style={{ margin: "12px 0" }} />
              <Row justify="space-around" style={{ textAlign: "center", fontSize: 12 }}>
                <Col>
                  <Text type="secondary">Hoàn thành</Text>
                  <div style={{ fontWeight: 700, color: "#12b76a" }}>
                    {completedOrders.length}
                  </div>
                </Col>
                <Col>
                  <Text type="secondary">Đang xử lý</Text>
                  <div style={{ fontWeight: 700, color: "#f79009" }}>
                    {pendingOrders.length}
                  </div>
                </Col>
                <Col>
                  <Text type="secondary">Đã hủy</Text>
                  <div style={{ fontWeight: 700, color: "#f04438" }}>
                    {cancelledOrders.length}
                  </div>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>

        {/* Bảng Top Sản phẩm sinh lời cao nhất */}
        <Row gutter={[16, 16]}>
          <Col xs={24}>
            <Card
              className="app-card"
              title={<span style={{ fontWeight: 700 }}>Top sản phẩm đóng góp doanh thu cao nhất</span>}
              bordered={false}
              style={{ borderRadius: 12 }}
            >
              <Table
                dataSource={topProducts}
                columns={topColumns}
                rowKey="id"
                pagination={false}
                size="middle"
              />
            </Card>
          </Col>
        </Row>
      </Spin>
    </div>
  );
};

export default ReportScreen;
