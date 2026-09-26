import {
  Card,
  Skeleton,
  Typography,
  Row,
  Col,
  Space,
  Button,
  Table,
  Tag,
  Badge,
  Avatar,
  Tooltip,
} from "antd";
import { useEffect, useState } from "react";
import {
  Clock,
  TruckFast,
  Warning2,
  Box,
  AddCircle,
  TagUser,
  TicketDiscount,
  DocumentText,
  Eye,
  ArrowRight,
  Flash,
  TickCircle,
} from "iconsax-react";
import { Link, useNavigate } from "react-router-dom";
import { useStatistics } from "../hooks/useStatistics";
import { orderService, Order } from "../services/orderService";
import { shipmentService } from "../services/shipmentService";
import { VND } from "../utils/handleCurrency";
import { colors } from "../constants/colors";

const { Title, Text } = Typography;

const HomeScreen = () => {
  const navigate = useNavigate();
  const { getDashboardStatistics, getTopSellingAndLowQuantity, loading: statsLoading } = useStatistics();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [lowStockItems, setLowStockItems] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [pendingShipmentsCount, setPendingShipmentsCount] = useState(0);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Thống kê dashboard
      const dashStats = await getDashboardStatistics();
      setStats(dashStats);

      // 2. Hàng sắp hết trong kho
      const topAndLow = await getTopSellingAndLowQuantity();
      if (topAndLow && topAndLow.lowQuantity) {
        setLowStockItems(topAndLow.lowQuantity.slice(0, 5));
      }

      // 3. 5 Đơn hàng mới nhất cần theo dõi
      const ordersRes = await orderService.getOrders({ page: 1, pageSize: 5 });
      if (ordersRes && ordersRes.data) {
        setRecentOrders(ordersRes.data);
      }

      // 4. Số lượng kiện hàng chờ bưu tá GHN lấy
      const shipRes = await shipmentService.getShipmentsPage({
        page: 1,
        pageSize: 1,
        status: "ready_to_pick",
      });
      const pending =
        shipRes?.totalElements !== undefined
          ? shipRes.totalElements
          : Array.isArray(shipRes?.data)
          ? shipRes.data.length
          : Array.isArray(shipRes)
          ? shipRes.length
          : 0;
      setPendingShipmentsCount(Number(pending) || 0);
    } catch (error) {
      console.error("Lỗi khi tải dữ liệu tổng quan:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const sales = stats?.sales || [];
  const pendingOrdersCount = sales.filter((item: any) => item.orderStatus === "PENDING").length;

  // Cột cho bảng Đơn hàng mới nhất - Map đúng trường từ backend OrderDetailResponse
  const orderColumns = [
    {
      title: "Mã đơn hàng",
      dataIndex: "id",
      key: "id",
      render: (id: string) => (
        <Link to="/orders" style={{ fontWeight: 600, color: "#1570ef" }}>
          #{id ? id.substring(0, 8) : "—"}
        </Link>
      ),
    },
    {
      title: "Khách hàng",
      key: "customer",
      render: (_: any, record: any) => (
        <div>
          <Text strong>{record.userName || record.nameRecipient || "Khách mua hàng"}</Text>
          {record.email && (
            <div style={{ fontSize: 11, color: "#888" }}>{record.email}</div>
          )}
        </div>
      ),
    },
    {
      title: "Tổng tiền",
      key: "total",
      align: "right" as const,
      render: (_: any, record: any) => {
        // Tính tổng tiền từ danh sách sản phẩm trong đơn
        const calculatedTotal = Array.isArray(record.orderResponses)
          ? record.orderResponses.reduce((sum: number, it: any) => sum + (it.totalPrice || 0), 0)
          : record.totalAmount || record.total || 0;

        return (
          <span style={{ fontWeight: 600, color: "#166534" }}>
            {calculatedTotal ? `${calculatedTotal.toLocaleString("vi-VN")} ₫` : "0 ₫"}
          </span>
        );
      },
    },
    {
      title: "Trạng thái",
      dataIndex: "orderStatus",
      key: "orderStatus",
      align: "center" as const,
      render: (status: string, record: any) => {
        const currentStatus = status || record.status;
        let color = "default";
        let label = currentStatus || "Mới";
        if (currentStatus === "PENDING") {
          color = "warning";
          label = "Chờ xử lý";
        } else if (currentStatus === "PROCESSING") {
          color = "processing";
          label = "Đang chuẩn bị";
        } else if (currentStatus === "COMPLETED") {
          color = "success";
          label = "Hoàn thành";
        } else if (currentStatus === "CANCELLED") {
          color = "error";
          label = "Đã hủy";
        }
        return <Tag color={color}>{label}</Tag>;
      },
    },
    {
      title: "Thao tác",
      key: "action",
      align: "center" as const,
      render: () => (
        <Button
          type="link"
          size="small"
          icon={<Eye size={16} />}
          onClick={() => navigate("/orders")}
        >
          Chi tiết
        </Button>
      ),
    },
  ];

  if (loading && !stats) {
    return (
      <div className="py-4">
        <Row gutter={[16, 16]} className="mb-4">
          <Col xs={24} sm={8}>
            <Card className="app-card"><Skeleton active paragraph={{ rows: 2 }} /></Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card className="app-card"><Skeleton active paragraph={{ rows: 2 }} /></Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card className="app-card"><Skeleton active paragraph={{ rows: 2 }} /></Card>
          </Col>
        </Row>
        <Card className="app-card"><Skeleton active paragraph={{ rows: 6 }} /></Card>
      </div>
    );
  }

  return (
    <div style={{ padding: "8px 0" }}>
      {/* Welcome Header */}
      <div style={{ marginBottom: 20 }}>
        <Title level={4} style={{ margin: 0, fontWeight: 700, color: "#0f172a" }}>
          Trung tâm điều hành hôm nay
        </Title>
        <Text type="secondary" style={{ fontSize: 13 }}>
          Nắm bắt công việc cần xử lý ngay, cảnh báo tồn kho và các đơn hàng mới phát sinh
        </Text>
      </div>

      {/* 1. VIỆC CẦN LÀM NGAY (Action Required Alert Cards) */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} sm={8}>
          <Card
            className="app-card"
            bordered={false}
            style={{
              borderRadius: 12,
              borderLeft: "4px solid #f79009",
              background: "#fffbf5",
              cursor: "pointer",
            }}
            onClick={() => navigate("/orders?status=PENDING")}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 13, color: "#92400e", fontWeight: 600 }}>
                  Đơn hàng chờ xác nhận
                </div>
                <div style={{ fontSize: 26, fontWeight: 700, color: "#b45309", marginTop: 4 }}>
                  {pendingOrdersCount} <span style={{ fontSize: 14, fontWeight: 500 }}>đơn</span>
                </div>
                <div style={{ fontSize: 12, color: "#b45309", marginTop: 4 }}>
                  Cần duyệt & đóng gói hàng →
                </div>
              </div>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  background: "#ffeed5",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Clock size={24} color="#f79009" variant="Bulk" />
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={8}>
          <Card
            className="app-card"
            bordered={false}
            style={{
              borderRadius: 12,
              borderLeft: "4px solid #1570ef",
              background: "#f5f9ff",
              cursor: "pointer",
            }}
            onClick={() => navigate("/shipments?status=ready_to_pick")}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 13, color: "#1e40af", fontWeight: 600 }}>
                  Vận đơn chờ bưu tá lấy
                </div>
                <div style={{ fontSize: 26, fontWeight: 700, color: "#1d4ed8", marginTop: 4 }}>
                  {pendingShipmentsCount} <span style={{ fontSize: 14, fontWeight: 500 }}>kiện</span>
                </div>
                <div style={{ fontSize: 12, color: "#1d4ed8", marginTop: 4 }}>
                  Theo dõi lấy hàng GHN →
                </div>
              </div>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  background: "#dbeafe",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <TruckFast size={24} color="#1570ef" variant="Bulk" />
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={8}>
          <Card
            className="app-card"
            bordered={false}
            style={{
              borderRadius: 12,
              borderLeft: "4px solid #f04438",
              background: "#fff6f5",
              cursor: "pointer",
            }}
            onClick={() => {
              if (lowStockItems.length === 1 && lowStockItems[0].id) {
                const item = lowStockItems[0];
                navigate(`/inventory/detail/${item.slug || "product"}?id=${item.id}`);
              } else if (lowStockItems.length > 0 && lowStockItems[0].id) {
                // Nếu có nhiều mặt hàng, cuộn xuống bảng chi tiết hàng sắp hết hoặc đến trang chi tiết mặt hàng đầu tiên
                const item = lowStockItems[0];
                navigate(`/inventory/detail/${item.slug || "product"}?id=${item.id}`);
              } else {
                navigate("/inventory");
              }
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 13, color: "#991b1b", fontWeight: 600 }}>
                  Cảnh báo cạn kho
                </div>
                <div style={{ fontSize: 26, fontWeight: 700, color: "#b91c1c", marginTop: 4 }}>
                  {lowStockItems.length} <span style={{ fontSize: 14, fontWeight: 500 }}>mặt hàng</span>
                </div>
                <div style={{ fontSize: 12, color: "#b91c1c", marginTop: 4 }}>
                  Cần liên hệ nhà cung cấp →
                </div>
              </div>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  background: "#fee4e2",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Warning2 size={24} color="#f04438" variant="Bulk" />
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 2. LỐI TẮT THAO TÁC NHANH (Quick Action Hub) */}
      <Card
        className="app-card"
        bordered={false}
        style={{ borderRadius: 12, marginBottom: 20 }}
      >
        <div
          style={{
            marginBottom: 14,
            fontWeight: 700,
            fontSize: 13,
            color: "#475467",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 24,
              height: 24,
              borderRadius: 6,
              backgroundColor: "#fef3f2",
              color: "#f04438",
            }}
          >
            <Flash size={15} variant="Bold" color="#f04438" />
          </span>
          Lối tắt thao tác nhanh
        </div>
        <Row gutter={[12, 12]}>
          <Col xs={12} sm={6}>
            <Button
              block
              size="large"
              icon={<AddCircle size={18} color="#1570ef" />}
              style={{
                height: 48,
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 600,
              }}
              onClick={() => navigate("/inventory/add-product")}
            >
              Thêm sản phẩm mới
            </Button>
          </Col>
          <Col xs={12} sm={6}>
            <Button
              block
              size="large"
              icon={<TicketDiscount size={18} color="#12b76a" />}
              style={{
                height: 48,
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 600,
              }}
              onClick={() => navigate("/promotions")}
            >
              Tạo mã giảm giá
            </Button>
          </Col>
          <Col xs={12} sm={6}>
            <Button
              block
              size="large"
              icon={<TruckFast size={18} color="#f79009" />}
              style={{
                height: 48,
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 600,
              }}
              onClick={() => navigate("/shipments")}
            >
              Kiểm tra vận đơn GHN
            </Button>
          </Col>
          <Col xs={12} sm={6}>
            <Button
              block
              size="large"
              type="primary"
              icon={<DocumentText size={18} />}
              style={{
                height: 48,
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 600,
                background: "#1570ef",
              }}
              onClick={() => navigate("/report")}
            >
              Xem báo cáo & tài chính →
            </Button>
          </Col>
        </Row>
      </Card>

      {/* 3. ĐƠN HÀNG GẦN ĐÂY VÀ DANH SÁCH HÀNG SẮP HẾT */}
      <Row gutter={[16, 16]}>
        {/* Đơn hàng mới nhất */}
        <Col xs={24} lg={15}>
          <Card
            className="app-card"
            title={
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 700 }}>Đơn hàng mới nhận gần đây</span>
                <Link to="/orders" style={{ fontSize: 13, fontWeight: 500, color: "#1570ef" }}>
                  Xem tất cả đơn →
                </Link>
              </div>
            }
            bordered={false}
            style={{ borderRadius: 12 }}
          >
          {isMobile ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {recentOrders.length === 0 ? (
                <div style={{ textAlign: "center", padding: "20px 0", color: "#64748b" }}>
                  Chưa có đơn hàng nào
                </div>
              ) : (
                recentOrders.map((record) => {
                  const calculatedTotal = Array.isArray(record.orderResponses)
                    ? record.orderResponses.reduce((sum: number, it: any) => sum + (it.totalPrice || 0), 0)
                    : record.totalAmount || record.total || 0;

                  const currentStatus = record.orderStatus || record.status;
                  let color = "default";
                  let label = currentStatus || "Mới";
                  if (currentStatus === "PENDING") {
                    color = "warning";
                    label = "Chờ xử lý";
                  } else if (currentStatus === "PROCESSING") {
                    color = "processing";
                    label = "Đang chuẩn bị";
                  } else if (currentStatus === "COMPLETED") {
                    color = "success";
                    label = "Hoàn thành";
                  } else if (currentStatus === "CANCELLED") {
                    color = "error";
                    label = "Đã hủy";
                  }

                  return (
                    <div
                      key={record.id}
                      onClick={() => navigate("/orders")}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "10px 12px",
                        borderRadius: 10,
                        background: "#f8fafc",
                        border: "1px solid #e2e8f0",
                        cursor: "pointer",
                      }}
                    >
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontWeight: 700, color: "#1570ef", fontSize: 13 }}>
                            #{record.id ? record.id.substring(0, 8) : "—"}
                          </span>
                          <Tag color={color} style={{ margin: 0, fontSize: 10, padding: "0 6px" }}>
                            {label}
                          </Tag>
                        </div>
                        <div style={{ fontSize: 12, color: "#334155", fontWeight: 500, marginTop: 4 }}>
                          {record.userName || record.nameRecipient || "Khách mua hàng"}
                        </div>
                      </div>

                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontWeight: 700, color: "#166534", fontSize: 13 }}>
                          {calculatedTotal ? `${calculatedTotal.toLocaleString("vi-VN")} ₫` : "0 ₫"}
                        </div>
                        <div style={{ fontSize: 11, color: "#1570ef", marginTop: 2 }}>
                          Chi tiết →
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            <Table
              bordered
              dataSource={recentOrders}
              columns={orderColumns}
              rowKey="id"
              pagination={false}
              size="middle"
              scroll={{ x: 600 }}
            />
          )}
        </Card>
        </Col>

        {/* Hàng sắp hết kho */}
        <Col xs={24} lg={9}>
          <Card
            className="app-card"
            title={
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 700, color: "#dc2626", display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <Warning2 size={18} variant="Bold" color="#dc2626" /> Cảnh báo tồn kho thấp
                </span>
                <Link to="/inventory" style={{ fontSize: 13, fontWeight: 500, color: "#1570ef" }}>
                  Kho hàng →
                </Link>
              </div>
            }
            bordered={false}
            style={{ borderRadius: 12 }}
          >
            {lowStockItems.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {lowStockItems.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 12px",
                      borderRadius: 8,
                      background: "#fef2f2",
                      border: "1px solid #fee2e2",
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                    onClick={() => {
                      if (item.id) {
                        navigate(`/inventory/detail/${item.slug || "product"}?id=${item.id}`);
                      } else {
                        navigate(`/inventory?search=${encodeURIComponent(item.name || "")}`);
                      }
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10, maxWidth: "70%" }}>
                      <Avatar
                        src={item.images && item.images.length > 0 ? item.images[0] : ""}
                        icon={<Box size={16} />}
                        shape="square"
                        size={36}
                      />
                      <div style={{ overflow: "hidden" }}>
                        <Text strong style={{ fontSize: 13, display: "block" }} ellipsis>
                          {item.name}
                        </Text>
                        <Text type="secondary" style={{ fontSize: 11, color: "#1570ef" }}>
                          Xem chi tiết các phân loại (SubProduct) →
                        </Text>
                      </div>
                    </div>
                    <div>
                      <Tag color="error" style={{ fontWeight: 700, margin: 0 }}>
                        Còn: {item.remainingQuantity}
                      </Tag>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "30px 0", color: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <TickCircle size={18} variant="Bold" color="#16a34a" /> Tất cả sản phẩm trong kho đều ở mức an toàn!
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default HomeScreen;
