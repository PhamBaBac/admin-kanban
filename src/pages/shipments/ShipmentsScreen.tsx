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
  Pagination,
  Empty,
  message,
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
  ExportSquare,
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
  const carrierFromUrl = searchParams.get("carrier");

  const [shipments, setShipments] = useState<ShipmentModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>(statusFromUrl || "ALL");
  const [carrierFilter, setCarrierFilter] = useState<string>(carrierFromUrl || "ALL");
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (statusFromUrl) {
      setStatusFilter(statusFromUrl);
    }
  }, [statusFromUrl]);

  useEffect(() => {
    if (carrierFromUrl) {
      setCarrierFilter(carrierFromUrl);
    }
  }, [carrierFromUrl]);

  useEffect(() => {
    fetchShipments();
  }, [page, pageSize, statusFilter, carrierFilter]);

  useEffect(() => {
    const handleNewNoti = () => {
      fetchShipments();
    };
    window.addEventListener("new_admin_notification", handleNewNoti);
    return () => {
      window.removeEventListener("new_admin_notification", handleNewNoti);
    };
  }, [page, pageSize, statusFilter, carrierFilter, search]);

  const fetchShipments = async () => {
    try {
      setLoading(true);
      const res = await shipmentService.getShipmentsPage({
        page,
        pageSize,
        status: statusFilter === "ALL" ? undefined : statusFilter,
        carrier: carrierFilter === "ALL" ? undefined : carrierFilter,
        search: search.trim() || undefined,
      });
      if (res) {
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

  const handleOpenTracking = (record: ShipmentModel) => {
    const code = record.trackingCode?.trim();
    const carrier = (record.carrier || "GHN").toUpperCase();
    if (code) {
      if (carrier === "GHN") {
        window.open(`https://tracking.ghn.dev/?order_code=${code}`, "_blank");
      } else if (carrier === "VIETTEL_POST") {
        window.open(`https://viettelpost.com.vn/tra-cuu-hanh-trinh-don/?code=${code}`, "_blank");
      } else if (carrier === "GHTK") {
        window.open(`https://giaohangtietkiem.vn/tra-cuu-don-hang/?order_code=${code}`, "_blank");
      } else {
        navigator.clipboard.writeText(code);
        message.info(`Đã sao chép mã vận đơn: ${code}`);
      }
    } else {
      message.warning("Kiện hàng này chưa có mã vận đơn");
    }
  };

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
      title: "Đơn vị & Vận đơn",
      dataIndex: "trackingCode",
      key: "trackingCode",
      width: 175,
      render: (code: string, record: ShipmentModel) => {
        const carrier = (record.carrier || "GHN").toUpperCase();
        const getCarrierTag = () => {
          switch (carrier) {
            case "GHN":
              return <Tag color="blue" style={{ fontSize: 10, padding: "0 6px", borderRadius: 4 }}>GHN</Tag>;
            case "SHOP_DELIVERY":
              return <Tag color="green" style={{ fontSize: 10, padding: "0 6px", borderRadius: 4 }}>Shop tự ship</Tag>;
            case "VIETTEL_POST":
              return <Tag color="red" style={{ fontSize: 10, padding: "0 6px", borderRadius: 4 }}>ViettelPost</Tag>;
            case "GHTK":
              return <Tag color="cyan" style={{ fontSize: 10, padding: "0 6px", borderRadius: 4 }}>GHTK</Tag>;
            case "J_AND_T":
              return <Tag color="orange" style={{ fontSize: 10, padding: "0 6px", borderRadius: 4 }}>J&T Express</Tag>;
            default:
              return <Tag color="default" style={{ fontSize: 10, padding: "0 6px", borderRadius: 4 }}>{record.carrier || "Khác"}</Tag>;
          }
        };

        return (
          <div>
            <div style={{ marginBottom: 4 }}>{getCarrierTag()}</div>
            {code ? (
              <Tag
                color="orange"
                style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4, margin: 0, fontWeight: 600 }}
                onClick={() => handleOpenTracking(record)}
              >
                <TruckFast size={12} />
                {code}
              </Tag>
            ) : (
              <span style={{ color: "#aaa", fontSize: 12 }}>Chưa có mã</span>
            )}
          </div>
        );
      },
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
      title: "Cước vận chuyển",
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
      title: "Trạng thái vận chuyển",
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
        <Tooltip title="Tra cứu trực tiếp trên GHN (Mở tab mới)">
          <Button
            size="small"
            icon={<ExportSquare size={16} color="#f26522" />}
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
          <Card className="app-card" variant="borderless">
            <Statistic
              title="Tổng kiện hàng"
              value={total}
              prefix={<Box size={22} color="#1570ef" style={{ marginRight: 8 }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card className="app-card" variant="borderless">
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
          <Card className="app-card" variant="borderless">
            <Statistic
              title="Kiện hàng đang xử lý/giao"
              value={deliveringCount}
              prefix={<TruckFast size={22} color="#059669" style={{ marginRight: 8 }} />}
            />
          </Card>
        </Col>
      </Row>

      {/* Filter Bar */}
      <Card className="app-card" style={{ marginBottom: 16 }} variant="borderless">
        <Row justify="space-between" align="middle" gutter={[16, 16]}>
          <Col>
            <Title level={4} style={{ margin: 0, fontWeight: 700 }}>
              Danh sách vận đơn (Shipments)
            </Title>
          </Col>
          <Col>
            <Space wrap style={{ width: "100%" }}>
              <Input.Search
                placeholder="Tìm mã kiện, mã vận đơn, hãng VC, mã đơn..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onSearch={() => fetchShipments()}
                allowClear
                style={{ minWidth: 200, flex: 1, maxWidth: 300, height: 32 }}
              />
              <Select
                value={carrierFilter}
                onChange={(val) => {
                  setCarrierFilter(val);
                  setPage(1);
                  setSearchParams((prev) => {
                    const next = new URLSearchParams(prev);
                    if (val === "ALL") {
                      next.delete("carrier");
                    } else {
                      next.set("carrier", val);
                    }
                    return next;
                  });
                }}
                style={{ minWidth: 150, flex: 1, maxWidth: 180, height: 32 }}
              >
                <Select.Option value="ALL">Tất cả đơn vị VC</Select.Option>
                <Select.Option value="GHN">🚚 GHN</Select.Option>
                <Select.Option value="SHOP_DELIVERY">🛵 Shop tự giao</Select.Option>
                <Select.Option value="VIETTEL_POST">🔴 ViettelPost</Select.Option>
                <Select.Option value="GHTK">🟢 GHTK</Select.Option>
                <Select.Option value="J_AND_T">🟠 J&T Express</Select.Option>
                <Select.Option value="VNPOST">🟡 VNPost</Select.Option>
                <Select.Option value="OTHER">📦 Đối tác khác</Select.Option>
              </Select>
              <Select
                value={statusFilter}
                onChange={(val) => {
                  setStatusFilter(val);
                  setPage(1);
                  setSearchParams((prev) => {
                    const next = new URLSearchParams(prev);
                    if (val === "ALL") {
                      next.delete("status");
                    } else {
                      next.set("status", val);
                    }
                    return next;
                  });
                }}
                style={{ minWidth: 150, flex: 1, maxWidth: 180, height: 32 }}
              >
                <Select.Option value="ALL">Tất cả trạng thái</Select.Option>
                <Select.Option value="ready_to_pick">Chờ lấy hàng</Select.Option>
                <Select.Option value="delivering">Đang giao hàng</Select.Option>
                <Select.Option value="delivered">Giao thành công</Select.Option>
                <Select.Option value="cancel">Đã hủy</Select.Option>
                <Select.Option value="return">Hàng hoàn</Select.Option>
              </Select>
              <Button
                icon={<Refresh size={18} />}
                onClick={() => fetchShipments()}
                style={{ height: 32, display: "inline-flex", alignItems: "center", gap: 6 }}
              >
                Làm mới
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {(statusFilter !== "ALL" || carrierFilter !== "ALL") && (
        <Alert
          message={
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <FilterSearch size={16} color="#1570ef" variant="Bold" />
                Đang lọc:{" "}
                {carrierFilter !== "ALL" && (
                  <span>Đơn vị: <strong>{carrierFilter}</strong>; </span>
                )}
                {statusFilter !== "ALL" && (
                  <span>Trạng thái: <strong>{statusFilter === "ready_to_pick" ? "Chờ bưu tá lấy hàng" : statusFilter}</strong></span>
                )}
                {" "}({total} kiện)
              </span>
              <Button
                size="small"
                type="link"
                onClick={() => {
                  setStatusFilter("ALL");
                  setCarrierFilter("ALL");
                  setSearchParams((prev) => {
                    const next = new URLSearchParams(prev);
                    next.delete("status");
                    next.delete("carrier");
                    return next;
                  });
                }}
              >
                Xóa tất cả bộ lọc
              </Button>
            </div>
          }
          type="info"
          showIcon
          style={{ marginBottom: 16, borderRadius: 8 }}
        />
      )}

      {/* Shipments Display: Mobile Card View vs Desktop Table View */}
      {isMobile ? (
        <div className="d-flex flex-column gap-3">
          {loading ? (
            <div style={{ textAlign: "center", padding: "40px 0", background: "#fff", borderRadius: 12 }}>
              <Spin size="large" />
              <div style={{ marginTop: 12, color: "#64748b", fontSize: 13 }}>Đang tải danh sách kiện hàng...</div>
            </div>
          ) : shipments.length === 0 ? (
            <div style={{ padding: "40px 0", background: "#fff", borderRadius: 12 }}>
              <Empty description="Không tìm thấy kiện hàng nào" />
            </div>
          ) : (
            shipments.map((record) => (
              <div
                key={record.id}
                style={{
                  background: "#ffffff",
                  borderRadius: 12,
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                  padding: "14px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                {/* Header: Mã kiện + Tag trạng thái */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: colors.primary500 }}>
                      {record.shipmentCode}
                    </div>
                    <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                      Đơn hàng: <strong style={{ color: "#334155" }}>#{record.orderId?.substring(0, 8)}</strong>
                      {record.createdAt && (
                        <span style={{ marginLeft: 6 }}>
                          • {new Date(record.createdAt).toLocaleDateString("vi-VN")}
                        </span>
                      )}
                    </div>
                  </div>
                  <Tag
                    color={getShippingStatusColor(record.shippingStatus)}
                    style={{ margin: 0, fontWeight: 600, padding: "2px 8px", borderRadius: 6 }}
                  >
                    {record.shippingStatusName || record.shippingStatus || "Mới tạo"}
                  </Tag>
                </div>

                {/* Tracking & Carrier code */}
                {record.trackingCode && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    {(() => {
                      const c = (record.carrier || "GHN").toUpperCase();
                      switch (c) {
                        case "GHN":
                          return <Tag color="blue" style={{ fontSize: 11, margin: 0, padding: "0 6px", borderRadius: 4 }}>GHN</Tag>;
                        case "SHOP_DELIVERY":
                          return <Tag color="green" style={{ fontSize: 11, margin: 0, padding: "0 6px", borderRadius: 4 }}>Shop tự giao</Tag>;
                        case "VIETTEL_POST":
                          return <Tag color="red" style={{ fontSize: 11, margin: 0, padding: "0 6px", borderRadius: 4 }}>ViettelPost</Tag>;
                        case "GHTK":
                          return <Tag color="cyan" style={{ fontSize: 11, margin: 0, padding: "0 6px", borderRadius: 4 }}>GHTK</Tag>;
                        case "J_AND_T":
                          return <Tag color="orange" style={{ fontSize: 11, margin: 0, padding: "0 6px", borderRadius: 4 }}>J&T</Tag>;
                        default:
                          return <Tag color="default" style={{ fontSize: 11, margin: 0, padding: "0 6px", borderRadius: 4 }}>{record.carrier || "Khác"}</Tag>;
                      }
                    })()}
                    <Tag
                      color="orange"
                      style={{
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        margin: 0,
                        fontSize: 12,
                        fontWeight: 600,
                        padding: "2px 8px",
                      }}
                      onClick={() => handleOpenTracking(record)}
                    >
                      <TruckFast size={14} />
                      {record.trackingCode}
                    </Tag>
                  </div>
                )}

                {/* Sản phẩm trong kiện */}
                <div
                  style={{
                    background: "#f8fafc",
                    borderRadius: 8,
                    padding: "8px 10px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                    border: "1px solid #f1f5f9",
                  }}
                >
                  {(record.items || []).map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        fontSize: 12,
                        color: "#334155",
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 8,
                      }}
                    >
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        • {item.productTitle} {item.variantName ? `(${item.variantName})` : ""}
                      </span>
                      <strong style={{ color: "#1570ef", flexShrink: 0 }}>x{item.quantity}</strong>
                    </div>
                  ))}
                  <div
                    style={{
                      fontSize: 11,
                      color: "#64748b",
                      marginTop: 4,
                      paddingTop: 4,
                      borderTop: "1px dashed #e2e8f0",
                      display: "flex",
                      justifyContent: "space-between",
                    }}
                  >
                    <span>Cân nặng: {record.weight}g</span>
                    <span>KT: {record.length}x{record.width}x{record.height} cm</span>
                  </div>
                </div>

                {/* Chi phí & Thu COD */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, paddingTop: 2 }}>
                  <div>
                    <span style={{ color: "#64748b", fontSize: 12 }}>Cước VC: </span>
                    <strong style={{ color: "#166534" }}>
                      {record.shippingFee ? `${record.shippingFee.toLocaleString("vi-VN")} ₫` : "—"}
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: "#64748b", fontSize: 12 }}>Thu COD: </span>
                    <strong style={{ color: record.codAmount > 0 ? "#e11d48" : "#64748b" }}>
                      {record.codAmount ? `${record.codAmount.toLocaleString("vi-VN")} ₫` : "0 ₫"}
                    </strong>
                  </div>
                </div>

                {/* Nút Tra cứu trực tiếp trên GHN */}
                <div style={{ paddingTop: 4 }}>
                  <Button
                    block
                    size="middle"
                    icon={<ExportSquare size={16} color="#f26522" />}
                    onClick={() => handleOpenTracking(record)}
                    style={{
                      borderRadius: 8,
                      fontWeight: 600,
                      fontSize: 13,
                      borderColor: "#fdba74",
                      color: "#ea580c",
                      background: "#fff7ed",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                    }}
                  >
                    Tra cứu trên GHN (Mở tab mới)
                  </Button>
                </div>
              </div>
            ))
          )}

          {/* Phân trang Mobile */}
          <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 20px 0" }}>
            <Pagination
              current={page}
              pageSize={pageSize}
              total={total}
              size="small"
              showSizeChanger={false}
              onChange={(p, ps) => {
                setPage(p);
                setPageSize(ps);
              }}
              showTotal={(tot, range) => `${range[0]}-${range[1]} / ${tot} kiện`}
            />
          </div>
        </div>
      ) : (
        /* Giao diện Desktop: Bảng dữ liệu đầy đủ cột */
        <Card className="app-card" variant="borderless">
          <Table
            bordered
            rowKey="id"
            dataSource={shipments}
            columns={columns}
            loading={loading}
            size="middle"
            scroll={{ x: 1400 }}
            style={{ minHeight: 450 }}
            pagination={{
              current: page,
              pageSize,
              total,
              showSizeChanger: true,
              responsive: true,
              showTotal: (tot, range) => `${range[0]}-${range[1]} trong tổng số ${tot} kiện hàng`,
              onChange: (p, ps) => {
                setPage(p);
                setPageSize(ps);
              },
            }}
          />
        </Card>
      )}
    </div>
  );
};

export default ShipmentsScreen;
