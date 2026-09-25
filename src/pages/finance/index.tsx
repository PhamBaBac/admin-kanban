/** @format */

import React, { useEffect, useState, useCallback } from "react";
import {
  Table,
  Tag,
  Card,
  Row,
  Col,
  Statistic,
  Space,
  Button,
  Select,
  DatePicker,
  Typography,
  Tooltip,
  Badge,
  Input,
  message,
} from "antd";
import {
  MoneyRecive,
  MoneySend,
  WalletMoney,
  ReceiptItem,
  Refresh,
  Eye,
  FilterSearch,
  DollarCircle,
} from "iconsax-react";
import { PaymentTransactionModel, BillModel } from "../../models/BillModel";
import { orderService } from "../../services/orderService";
import { VND } from "../../utils/handleCurrency";
import { OrderDetailDrawer } from "../../modals";

const FinanceScreen: React.FC = () => {
  const [transactions, setTransactions] = useState<PaymentTransactionModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filterType, setFilterType] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [filterMethod, setFilterMethod] = useState<string>("ALL");

  const [selectedDrawerOrder, setSelectedDrawerOrder] = useState<BillModel | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const fetchTransactions = useCallback(
    async (targetPage = page, targetLimit = pageSize) => {
      setLoading(true);
      try {
        const res = await orderService.getAdminTransactions({
          page: targetPage,
          pageSize: targetLimit,
        });

        const list = res?.data || (Array.isArray(res) ? res : []);
        setTransactions(list);
        setTotal(res?.totalElements || list.length);
      } catch (err: any) {
        console.error("Lỗi khi tải sổ cái tài chính:", err);
        message.error("Không thể tải sổ cái tài chính");
      } finally {
        setLoading(false);
      }
    },
    [page, pageSize]
  );

  useEffect(() => {
    fetchTransactions(page, pageSize);
  }, [page, pageSize, fetchTransactions]);

  const handleOpenOrderDetail = async (orderId: string) => {
    try {
      const orderData: any = await orderService.getOrderById(orderId);
      if (orderData) {
        setSelectedDrawerOrder(orderData);
        setIsDrawerOpen(true);
      }
    } catch (err: any) {
      message.error("Không thể lấy thông tin chi tiết đơn hàng");
    }
  };

  const filteredData = transactions.filter((tx) => {
    if (filterType !== "ALL" && tx.transactionType !== filterType) return false;
    if (filterStatus !== "ALL" && tx.status !== filterStatus) return false;
    const method = tx.paymentType || (tx as any).paymentMethod || "COD";
    if (filterMethod !== "ALL" && method !== filterMethod) return false;
    return true;
  });

  const totalInflow = transactions
    .filter((tx) => tx.transactionType === "PAYMENT" && tx.status === "SUCCESS")
    .reduce((sum, tx) => sum + (tx.amount || 0), 0);

  const totalOutflow = transactions
    .filter((tx) => tx.transactionType === "REFUND" && tx.status === "SUCCESS")
    .reduce((sum, tx) => sum + (tx.amount || 0), 0);

  const netCashflow = totalInflow - totalOutflow;

  const columns = [
    {
      title: "Thời gian ghi sổ",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 160,
      render: (dateStr: string) => (
        <div>
          <div style={{ fontWeight: 500, color: "#1e293b", fontSize: 13 }}>
            {dateStr ? new Date(dateStr).toLocaleDateString("vi-VN") : "—"}
          </div>
          <div style={{ fontSize: 11, color: "#94a3b8" }}>
            {dateStr ? new Date(dateStr).toLocaleTimeString("vi-VN") : ""}
          </div>
        </div>
      ),
      sorter: (a: PaymentTransactionModel, b: PaymentTransactionModel) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },
    {
      title: "Mã giao dịch nội bộ",
      dataIndex: "transactionCode",
      key: "transactionCode",
      width: 180,
      render: (code: string) => (
        <span style={{ fontFamily: "monospace", fontWeight: 600, color: "#1570ef" }}>
          {code}
        </span>
      ),
    },
    {
      title: "Đơn hàng liên quan",
      dataIndex: "orderId",
      key: "orderId",
      width: 170,
      render: (orderId: string) => (
        <Space size={6}>
          <span
            style={{
              fontFamily: "monospace",
              color: "#1570ef",
              fontWeight: 600,
              cursor: "pointer",
              textDecoration: "underline",
              textUnderlineOffset: 3,
            }}
            onClick={() => handleOpenOrderDetail(orderId)}
          >
            #{orderId ? orderId.substring(0, 8) : "—"}
          </span>
          {orderId && (
            <Tooltip title="Xem hồ sơ chi tiết đơn hàng (Drawer 360°)">
              <Button
                type="text"
                size="small"
                icon={<Eye size={15} color="#10b981" />}
                onClick={() => handleOpenOrderDetail(orderId)}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
    {
      title: "Phương thức / Cổng",
      key: "paymentType",
      width: 130,
      align: "center" as const,
      render: (_: any, record: PaymentTransactionModel) => {
        const method = record.paymentType || (record as any).paymentMethod || "COD";
        return (
          <Tag color={method === "COD" ? "orange" : method === "VNPAY" ? "blue" : "pink"}>
            {method}
          </Tag>
        );
      },
    },
    {
      title: "Mã cổng đối soát",
      key: "gatewayTransactionNo",
      width: 160,
      render: (_: any, record: PaymentTransactionModel) => {
        const no = record.gatewayTransactionNo || (record as any).gatewayTransactionId;
        return (
          <span style={{ fontFamily: "monospace", fontSize: 12, color: "#64748b" }}>
            {no || "— (COD / Thủ công)"}
          </span>
        );
      },
    },
    {
      title: "Loại bút toán",
      dataIndex: "transactionType",
      key: "transactionType",
      width: 140,
      align: "center" as const,
      render: (type: string) => {
        if (type === "PAYMENT") {
          return (
            <Tag color="success" icon={<MoneyRecive size={12} style={{ verticalAlign: "middle", marginRight: 4 }} />}>
              THU TIỀN
            </Tag>
          );
        }
        return (
          <Tag color="error" icon={<MoneySend size={12} style={{ verticalAlign: "middle", marginRight: 4 }} />}>
            HOÀN TIỀN
          </Tag>
        );
      },
    },
    {
      title: "Số tiền đối soát",
      dataIndex: "amount",
      key: "amount",
      width: 160,
      align: "right" as const,
      render: (amount: number, record: PaymentTransactionModel) => (
        <span
          style={{
            fontWeight: 700,
            fontSize: 14,
            color: record.transactionType === "PAYMENT" ? "#166534" : "#dc2626",
          }}
        >
          {record.transactionType === "PAYMENT" ? "+" : "-"}
          {VND.format(amount || 0)}
        </span>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 120,
      align: "center" as const,
      render: (status: string) => (
        <Tag color={status === "SUCCESS" ? "green" : status === "PENDING" ? "gold" : "red"}>
          {status}
        </Tag>
      ),
    },
    {
      title: "Ghi chú kiểm toán",
      dataIndex: "note",
      key: "note",
      ellipsis: true,
      render: (note: string | null) => (
        <span style={{ fontSize: 12, color: "#64748b" }}>
          {note || "—"}
        </span>
      ),
    },
  ];

  return (
    <div style={{ padding: "8px 0" }}>
      {/* TIÊU ĐỀ TRANG VÀ THỐNG KÊ DÒNG TIỀN */}
      <Card bordered={false} className="app-card" style={{ marginBottom: 16 }}>
        <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
          <Col>
            <Typography.Title level={4} style={{ margin: 0, fontWeight: 700 }}>
              Sổ cái Dòng tiền & Đối soát Tài chính
            </Typography.Title>
            <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>
              Theo dõi toàn bộ các bút toán Thu tiền (PAYMENT), Hoàn trả (REFUND) và dòng tiền ròng của toàn hệ thống
            </div>
          </Col>
          <Col>
            <Button
              icon={<Refresh size={16} />}
              onClick={() => fetchTransactions(page, pageSize)}
              loading={loading}
              type="primary"
            >
              Làm mới sổ cái
            </Button>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={8}>
            <Card
              bordered={false}
              style={{ borderRadius: 8, background: "#f0fdf4", border: "1px solid #bbf7d0" }}
            >
              <Statistic
                title={<span style={{ color: "#166534", fontWeight: 600 }}>Tổng tiền đã thu (Inflow)</span>}
                value={totalInflow}
                formatter={(val) => VND.format(Number(val))}
                valueStyle={{ color: "#166534", fontWeight: 700, fontSize: 22 }}
                prefix={<MoneyRecive size={24} color="#166534" style={{ marginRight: 8 }} />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card
              bordered={false}
              style={{ borderRadius: 8, background: "#fef2f2", border: "1px solid #fecaca" }}
            >
              <Statistic
                title={<span style={{ color: "#dc2626", fontWeight: 600 }}>Tổng tiền đã hoàn trả (Outflow)</span>}
                value={totalOutflow}
                formatter={(val) => VND.format(Number(val))}
                valueStyle={{ color: "#dc2626", fontWeight: 700, fontSize: 22 }}
                prefix={<MoneySend size={24} color="#dc2626" style={{ marginRight: 8 }} />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card
              bordered={false}
              style={{ borderRadius: 8, background: "#eff6ff", border: "1px solid #bfdbfe" }}
            >
              <Statistic
                title={<span style={{ color: "#1e40af", fontWeight: 600 }}>Dòng tiền ròng thực nhận (Net Cashflow)</span>}
                value={netCashflow}
                formatter={(val) => VND.format(Number(val))}
                valueStyle={{ color: "#1e40af", fontWeight: 700, fontSize: 22 }}
                prefix={<WalletMoney size={24} color="#1e40af" style={{ marginRight: 8 }} />}
              />
            </Card>
          </Col>
        </Row>
      </Card>

      {/* BỘ LỌC ĐỐI SOÁT */}
      <Card bordered={false} className="app-card" style={{ marginBottom: 16 }}>
        <Row justify="space-between" align="middle" gutter={[16, 16]}>
          <Col>
            <Space wrap>
              <Select
                value={filterType}
                onChange={setFilterType}
                style={{ width: 180 }}
                options={[
                  { value: "ALL", label: "Tất cả loại bút toán" },
                  { value: "PAYMENT", label: "Thu tiền (PAYMENT)" },
                  { value: "REFUND", label: "Hoàn tiền (REFUND)" },
                ]}
              />
              <Select
                value={filterMethod}
                onChange={setFilterMethod}
                style={{ width: 170 }}
                options={[
                  { value: "ALL", label: "Tất cả cổng thanh toán" },
                  { value: "COD", label: "Thu hộ COD" },
                  { value: "VNPAY", label: "Cổng VNPAY" },
                  { value: "MOMO", label: "Cổng MoMo" },
                ]}
              />
              <Select
                value={filterStatus}
                onChange={setFilterStatus}
                style={{ width: 160 }}
                options={[
                  { value: "ALL", label: "Tất cả trạng thái" },
                  { value: "SUCCESS", label: "Thành công (SUCCESS)" },
                  { value: "PENDING", label: "Đang chờ (PENDING)" },
                  { value: "FAILED", label: "Thất bại (FAILED)" },
                ]}
              />
            </Space>
          </Col>
          <Col>
            <span style={{ fontSize: 13, color: "#64748b" }}>
              Hiển thị <strong>{filteredData.length}</strong> bút toán
            </span>
          </Col>
        </Row>
      </Card>

      {/* BẢNG SỔ CÁI BÚT TOÁN */}
      <Card bordered={false} className="app-card">
        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={filteredData}
          size="middle"
          scroll={{ x: 1200 }}
          pagination={{
            total,
            pageSize,
            current: page,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50", "100"],
            onShowSizeChange: (_, size) => {
              setPageSize(size);
              setPage(1);
            },
            onChange: (p, l) => {
              setPage(p);
              if (l && l !== pageSize) setPageSize(l);
            },
            showTotal: (totalCount, range) =>
              `${range[0]}-${range[1]} trong tổng số ${totalCount} bút toán`,
          }}
        />
      </Card>

      {/* DRAWER CHI TIẾT ĐƠN HÀNG 360° */}
      <OrderDetailDrawer
        open={isDrawerOpen}
        order={selectedDrawerOrder}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedDrawerOrder(null);
        }}
      />
    </div>
  );
};

export default FinanceScreen;
