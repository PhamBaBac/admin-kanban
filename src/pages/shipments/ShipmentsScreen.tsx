import React, { useEffect, useState } from "react";
import {
  Card,
  Table,
  Tag,
  Typography,
  Space,
  Button,
  Input,
  Select,
  Row,
  Col,
  Statistic,
  Tooltip,
  Modal,
  Spin,
  Descriptions,
  Divider,
  Timeline,
  Steps,
  Alert,
} from "antd";
import { useSearchParams } from "react-router-dom";
import {
  TruckFast,
  SearchNormal1,
  Box,
  DollarCircle,
  Eye,
  Refresh,
  Location,
  Clock,
  FilterSearch,
} from "iconsax-react";
import { ShipmentModel } from "../../models/BillModel";
import { shipmentService } from "../../services/shipmentService";
import { orderService } from "../../services/orderService";
import { colors } from "../../constants/colors";

const { Title, Text } = Typography;

const getShippingStatusColor = (status?: string) => {
  switch ((status || "").toLowerCase()) {
    case "ready_to_pick":
    case "picking":
      return "processing";
    case "picked":
    case "storing":
    case "transporting":
    case "sorting":
      return "warning";
    case "delivering":
    case "money_collect_delivering":
      return "cyan";
    case "delivered":
      return "success";
    case "cancel":
    case "return":
    case "damage":
    case "lost":
      return "error";
    default:
      return "default";
  }
};

const ShipmentsScreen: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const statusFromUrl = searchParams.get("status");

  const [shipments, setShipments] = useState<ShipmentModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>(statusFromUrl || "ALL");

  useEffect(() => {
    if (statusFromUrl) {
      setStatusFilter(statusFromUrl);
    }
  }, [statusFromUrl]);

  // Tracking Modal State
  const [selectedShipment, setSelectedShipment] = useState<ShipmentModel | null>(null);
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingData, setTrackingData] = useState<any>(null);

  useEffect(() => {
    fetchShipments();
  }, [page, pageSize, statusFilter]);

  const fetchShipments = async () => {
    try {
      setLoading(true);
      const res = await shipmentService.getShipmentsPage({
        page,
        pageSize,
        status: statusFilter === "ALL" ? undefined : statusFilter,
        search: search.trim() || undefined,
      });
      if (res) {
        // Hỗ trợ cả 2 trường hợp: res.data là mảng hoặc res.data.data là mảng
        const list = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res?.data?.data)
          ? res.data.data
          : Array.isArray(res)
          ? res
          : [];
        const totalCount = res.totalElements ?? res?.data?.totalElements ?? list.length;
        setShipments(list);
        setTotal(totalCount);
      }
    } catch (error) {
      console.error("Failed to fetch shipments", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenTracking = async (record: ShipmentModel) => {
    setSelectedShipment(record);
    setIsTrackingModalOpen(true);
    setTrackingLoading(true);

    try {
      if (record.trackingCode) {
        const data = await orderService.getTrackingByCode(record.trackingCode);
        setTrackingData(data);
      } else {
        setTrackingData(null);
      }
    } catch (error) {
      console.error("Get tracking error", error);
      setTrackingData(null);
    } finally {
      setTrackingLoading(false);
    }
  };

  // Tính thống kê nhanh
  const totalCod = shipments.reduce((sum, s) => sum + (s.codAmount || 0), 0);
  const totalShippingFee = shipments.reduce((sum, s) => sum + (s.shippingFee || 0), 0);
  const deliveringCount = shipments.filter((s) =>
    ["delivering", "transporting", "ready_to_pick"].includes((s.shippingStatus || "").toLowerCase())
  ).length;

  const columns = [
    {
      title: "Mã kiện hàng",
      dataIndex: "shipmentCode",
      key: "shipmentCode",
      width: 170,
      render: (code: string, record: ShipmentModel) => (
        <div>
          <div style={{ fontWeight: 600, color: colors.primary500 }}>{code}</div>
          <div style={{ fontSize: 11, color: "#888" }}>
            Đơn hàng: #{record.orderId?.substring(0, 8)}
          </div>
        </div>
      ),
    },
    {
      title: "Mã vận đơn GHN",
      dataIndex: "trackingCode",
      key: "trackingCode",
      width: 150,
      render: (code: string, record: ShipmentModel) =>
        code ? (
          <Tag
            color="cyan"
            style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4 }}
            onClick={() => handleOpenTracking(record)}
          >
            <TruckFast size={14} />
            {code}
          </Tag>
        ) : (
          <span style={{ color: "#aaa" }}>Chưa có mã</span>
        ),
    },
    {
      title: "Thông số đóng gói",
      key: "dimensions",
      width: 170,
      render: (_: any, record: ShipmentModel) => (
        <div style={{ fontSize: 12 }}>
          <div>
            <Text strong>Cân nặng:</Text> {record.weight}g
          </div>
          <div style={{ color: "#666" }}>
            {record.length} x {record.width} x {record.height} cm
          </div>
        </div>
      ),
    },
    {
      title: "Sản phẩm",
      key: "items",
      width: 220,
      render: (_: any, record: ShipmentModel) => (
        <div>
          {(record.items || []).map((item, idx) => (
            <div key={idx} style={{ fontSize: 12, marginBottom: 2 }}>
              • {item.productTitle} {item.variantName ? `(${item.variantName})` : ""}{" "}
              <strong style={{ color: "#1570ef" }}>x{item.quantity}</strong>
            </div>
          ))}
        </div>
      ),
    },
    {
      title: "Tiền thu COD",
      dataIndex: "codAmount",
      key: "codAmount",
      width: 130,
      align: "right" as const,
      render: (val: number) => (
        <span style={{ fontWeight: 600, color: val > 0 ? "#e11d48" : "#64748b" }}>
          {val ? `${val.toLocaleString("vi-VN")} ₫` : "0 ₫"}
        </span>
      ),
    },
    {
      title: "Cước phí GHN",
      dataIndex: "shippingFee",
      key: "shippingFee",
      width: 130,
      align: "right" as const,
      render: (fee: number) => (
        <span style={{ fontWeight: 500, color: "#166534" }}>
          {fee ? `${fee.toLocaleString("vi-VN")} ₫` : "—"}
        </span>
      ),
    },
    {
      title: "Trạng thái GHN",
      dataIndex: "shippingStatusName",
      key: "shippingStatusName",
      width: 160,
      align: "center" as const,
      render: (statusName: string, record: ShipmentModel) => (
        <Tag color={getShippingStatusColor(record.shippingStatus)} style={{ margin: 0 }}>
          {statusName || record.shippingStatus || "Mới tạo"}
        </Tag>
      ),
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 140,
      align: "center" as const,
      render: (date: string) => (
        <div style={{ fontSize: 12 }}>
          <div>{new Date(date).toLocaleDateString("vi-VN")}</div>
          <div style={{ color: "#888", fontSize: 11 }}>
            {new Date(date).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
          </div>
        </div>
      ),
    },
    {
      title: "Thao tác",
      key: "actions",
      fixed: "right" as const,
      width: 80,
      align: "center" as const,
      render: (_: any, record: ShipmentModel) => (
        <Tooltip title="Xem chi tiết hành trình GHN">
          <Button
            size="small"
            icon={<Eye size={16} color="#1570ef" />}
            type="text"
            onClick={() => handleOpenTracking(record)}
          />
        </Tooltip>
      ),
    },
  ];

  return (
    <div style={{ padding: "8px 0" }}>
      {/* KPI Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={8}>
          <Card className="app-card" bordered={false}>
            <Statistic
              title="Tổng kiện hàng"
              value={total}
              prefix={<Box size={22} color="#1570ef" style={{ marginRight: 8 }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card className="app-card" bordered={false}>
            <Statistic
              title="Tổng tiền COD cần thu"
              value={totalCod}
              suffix="₫"
              prefix={<DollarCircle size={22} color="#e11d48" style={{ marginRight: 8 }} />}
              formatter={(v) => Number(v).toLocaleString("vi-VN")}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card className="app-card" bordered={false}>
            <Statistic
              title="Kiện hàng đang xử lý/giao"
              value={deliveringCount}
              prefix={<TruckFast size={22} color="#059669" style={{ marginRight: 8 }} />}
            />
          </Card>
        </Col>
      </Row>

      {/* Filter Bar */}
      <Card className="app-card" style={{ marginBottom: 16 }} bordered={false}>
        <Row justify="space-between" align="middle" gutter={[16, 16]}>
          <Col>
            <Title level={4} style={{ margin: 0, fontWeight: 700 }}>
              Danh sách vận đơn (Shipments)
            </Title>
          </Col>
          <Col>
            <Space wrap>
              <Input.Search
                placeholder="Tìm mã kiện hàng, mã GHN, mã đơn..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onSearch={() => fetchShipments()}
                allowClear
                style={{ width: 280 }}
              />
              <Select
                value={statusFilter}
                onChange={(val) => {
                  setStatusFilter(val);
                  if (val === "ALL") {
                    searchParams.delete("status");
                    setSearchParams(searchParams);
                  } else {
                    setSearchParams({ status: val });
                  }
                }}
                style={{ width: 180 }}
              >
                <Select.Option value="ALL">Tất cả trạng thái</Select.Option>
                <Select.Option value="ready_to_pick">Chờ lấy hàng</Select.Option>
                <Select.Option value="delivering">Đang giao hàng</Select.Option>
                <Select.Option value="delivered">Giao thành công</Select.Option>
                <Select.Option value="cancel">Đã hủy</Select.Option>
                <Select.Option value="return">Hàng hoàn</Select.Option>
              </Select>
              <Button icon={<Refresh size={18} />} onClick={() => fetchShipments()}>
                Làm mới
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {statusFilter !== "ALL" && (
        <Alert
          message={
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <FilterSearch size={16} color="#1570ef" variant="Bold" />
                Đang lọc kiện hàng theo trạng thái:{" "}
                <strong>{statusFilter === "ready_to_pick" ? "Chờ bưu tá GHN đến lấy hàng" : statusFilter}</strong> ({total} kiện)
              </span>
              <Button
                size="small"
                type="link"
                onClick={() => {
                  setStatusFilter("ALL");
                  searchParams.delete("status");
                  setSearchParams(searchParams);
                }}
              >
                Xóa bộ lọc (Xem tất cả)
              </Button>
            </div>
          }
          type="info"
          showIcon
          style={{ marginBottom: 16, borderRadius: 8 }}
        />
      )}

      {/* Shipments Table */}
      <Card className="app-card" bordered={false}>
        <Table
          bordered
          rowKey="id"
          dataSource={shipments}
          columns={columns}
          loading={loading}
          size="middle"
          scroll={{ x: 1400 }}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showTotal: (tot, range) => `${range[0]}-${range[1]} trong tổng số ${tot} kiện hàng`,
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
            },
          }}
        />
      </Card>

      {/* Modal Tracking GHN */}
      <Modal
        title={
          <Space>
            <TruckFast color="#13c2c2" size={22} />
            <span>Chi tiết lộ trình vận chuyển GHN</span>
            {selectedShipment?.trackingCode && (
              <Tag color="cyan">{selectedShipment.trackingCode}</Tag>
            )}
          </Space>
        }
        open={isTrackingModalOpen}
        onCancel={() => {
          setIsTrackingModalOpen(false);
          setTrackingData(null);
          setSelectedShipment(null);
        }}
        footer={[
          <Button
            key="ghnLink"
            type="default"
            onClick={() => {
              if (selectedShipment?.trackingCode) {
                window.open(`https://tracking.ghn.dev/?order_code=${selectedShipment.trackingCode}`, "_blank");
              }
            }}
          >
            Mở trên GHN Tracking
          </Button>,
          <Button
            key="close"
            type="primary"
            onClick={() => {
              setIsTrackingModalOpen(false);
              setTrackingData(null);
              setSelectedShipment(null);
            }}
          >
            Đóng
          </Button>,
        ]}
        width={680}
      >
        {trackingLoading ? (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <Spin tip="Đang lấy dữ liệu từ hệ thống GHN..." size="large" />
          </div>
        ) : trackingData ? (
          <div>
            <Descriptions bordered size="small" column={2} style={{ marginBottom: 16 }}>
              <Descriptions.Item label="Mã vận đơn">
                <strong>{trackingData.orderCode || selectedShipment?.trackingCode}</strong>
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                <Tag color={getShippingStatusColor(trackingData.status)}>
                  {trackingData.statusName || trackingData.status}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Tiền thu hộ COD">
                {selectedShipment?.codAmount ? `${selectedShipment.codAmount.toLocaleString("vi-VN")} ₫` : "0 ₫"}
              </Descriptions.Item>
              <Descriptions.Item label="Cước phí GHN">
                {selectedShipment?.shippingFee ? `${selectedShipment.shippingFee.toLocaleString("vi-VN")} ₫` : "—"}
              </Descriptions.Item>
            </Descriptions>

            <Divider orientation="left" style={{ fontSize: 14 }}>
              Lịch sử hành trình (Timeline)
            </Divider>

            <Timeline
              mode="left"
              items={
                trackingData.logs && trackingData.logs.length > 0
                  ? trackingData.logs.map((log: any, idx: number) => ({
                      color: idx === 0 ? "green" : "blue",
                      children: (
                        <div>
                          <div style={{ fontWeight: idx === 0 ? 600 : 500 }}>
                            {log.statusName || log.status}
                          </div>
                          {log.location && (
                            <div style={{ fontSize: 12, color: "#666" }}>
                              <Location size={12} style={{ marginRight: 4 }} />
                              {log.location}
                            </div>
                          )}
                          {log.updatedDate && (
                            <div style={{ fontSize: 11, color: "#999" }}>
                              {new Date(log.updatedDate).toLocaleString("vi-VN")}
                            </div>
                          )}
                        </div>
                      ),
                    }))
                  : [
                      {
                        color: "green",
                        children: (
                          <div>
                            <div style={{ fontWeight: 600, color: "#52c41a" }}>
                              {trackingData.statusName || "Mới tạo đơn - Chờ lấy hàng"}
                            </div>
                            <div style={{ fontSize: 12, color: "#666" }}>
                              Đơn hàng đã được tạo thành công trên hệ thống GHN.
                            </div>
                          </div>
                        ),
                      },
                    ]
              }
            />
          </div>
        ) : (
          <div style={{ textAlign: "center", color: "#888", padding: "30px 0" }}>
            Không tìm thấy thông tin vận đơn trên GHN hoặc mã không hợp lệ.
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ShipmentsScreen;
