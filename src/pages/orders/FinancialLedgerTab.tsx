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
} from "antd";
import {
  MoneyRecive,
  MoneySend,
  WalletMoney,
  ReceiptItem,
  Refresh,
  Eye,
} from "iconsax-react";
import { PaymentTransactionModel, BillModel } from "../../models/BillModel";
import { orderService } from "../../services/orderService";
import { VND } from "../../utils/handleCurrency";

interface Props {
  onViewOrderDetail?: (orderId: string) => void;
}

const FinancialLedgerTab: React.FC<Props> = ({ onViewOrderDetail }) => {
  const [transactions, setTransactions] = useState<PaymentTransactionModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filterType, setFilterType] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");

  const fetchTransactions = useCallback(
    async (targetPage = page, targetLimit = pageSize) => {
      setLoading(true);
      try {
        const res = await orderService.getAdminTransactions({
          page: targetPage,
          pageSize: targetLimit,
        });

        // Hỗ trợ response bọc PageResponse hoặc data trực tiếp
        const list = res?.data || (Array.isArray(res) ? res : []);
        setTransactions(list);
        setTotal(res?.totalElements || list.length);
      } catch (err: any) {
        console.error("Lỗi khi tải sổ cái tài chính:", err);
      } finally {
        setLoading(false);
      }
    },
    [page, pageSize]
  );

  useEffect(() => {
    fetchTransactions(page, pageSize);
  }, [page, pageSize, fetchTransactions]);

  // Lọc local nếu cần cho UI nhanh
  const filteredData = transactions.filter((tx) => {
    if (filterType !== "ALL" && tx.transactionType !== filterType) return false;
    if (filterStatus !== "ALL" && tx.status !== filterStatus) return false;
    return true;
  });

  // Tính toán số liệu thống kê
  const totalInflow = transactions
    .filter((tx) => tx.transactionType === "PAYMENT" && tx.status === "SUCCESS")
    .reduce((sum, tx) => sum + (tx.amount || 0), 0);

  const totalOutflow = transactions
    .filter((tx) => tx.transactionType === "REFUND" && tx.status === "SUCCESS")
    .reduce((sum, tx) => sum + (tx.amount || 0), 0);

  const netCashflow = totalInflow - totalOutflow;

  const columns = [
    {
      title: "Thời gian",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 150,
      render: (dateStr: string) => (
        <span style={{ fontSize: 12, color: "#64748b" }}>
          {dateStr ? new Date(dateStr).toLocaleString("vi-VN") : "—"}
        </span>
      ),
      sorter: (a: PaymentTransactionModel, b: PaymentTransactionModel) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },
    {
      title: "Mã giao dịch nội bộ",
      dataIndex: "transactionCode",
      key: "transactionCode",
      width: 170,
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
        <Space size={4}>
          <span style={{ fontFamily: "monospace", color: "#334155", fontWeight: 500 }}>
            #{orderId ? orderId.substring(0, 8) : "—"}
          </span>
          {onViewOrderDetail && orderId && (
            <Tooltip title="Xem chi tiết đơn hàng">
              <Button
                type="text"
                size="small"
                icon={<Eye size={14} color="#1570ef" />}
                onClick={() => onViewOrderDetail(orderId)}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
    {
      title: "Phương thức",
      key: "paymentType",
      width: 110,
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
      width: 150,
      render: (_: any, record: PaymentTransactionModel) => {
        const no = record.gatewayTransactionNo || (record as any).gatewayTransactionId;
        return (
          <span style={{ fontFamily: "monospace", fontSize: 12, color: "#64748b" }}>
            {no || "— (COD)"}
          </span>
        );
      },
    },
    {
      title: "Loại giao dịch",
      dataIndex: "transactionType",
      key: "transactionType",
      width: 150,
      align: "center" as const,
      render: (type: string) => {
        if (type === "PAYMENT") {
          return (
            <Tag color="success" icon={<MoneyRecive size={12} style={{ verticalAlign: "middle", marginRight: 4 }} />}>
              THANH TOÁN
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
      title: "Số tiền",
      dataIndex: "amount",
      key: "amount",
      width: 150,
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
      title: "Ghi chú đối soát",
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
    <div>
      {/* 3 Thẻ thống kê tài chính */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={8}>
          <Card
            bordered={false}
            className="app-card"
            style={{ borderRadius: 8, background: "#f0fdf4", border: "1px solid #bbf7d0" }}
          >
            <Statistic
              title={<span style={{ color: "#166534", fontWeight: 600 }}>Tổng tiền đã thu (Inflow)</span>}
              value={totalInflow}
              formatter={(val) => VND.format(Number(val))}
              valueStyle={{ color: "#166534", fontWeight: 700, fontSize: 20 }}
              prefix={<MoneyRecive size={22} color="#166534" style={{ marginRight: 6 }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card
            bordered={false}
            className="app-card"
            style={{ borderRadius: 8, background: "#fef2f2", border: "1px solid #fecaca" }}
          >
            <Statistic
              title={<span style={{ color: "#dc2626", fontWeight: 600 }}>Tổng tiền đã hoàn trả (Outflow)</span>}
              value={totalOutflow}
              formatter={(val) => VND.format(Number(val))}
              valueStyle={{ color: "#dc2626", fontWeight: 700, fontSize: 20 }}
              prefix={<MoneySend size={22} color="#dc2626" style={{ marginRight: 6 }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card
            bordered={false}
            className="app-card"
            style={{ borderRadius: 8, background: "#eff6ff", border: "1px solid #bfdbfe" }}
          >
            <Statistic
              title={<span style={{ color: "#1e40af", fontWeight: 600 }}>Dòng tiền thực thu (Net Cashflow)</span>}
              value={netCashflow}
              formatter={(val) => VND.format(Number(val))}
              valueStyle={{ color: "#1e40af", fontWeight: 700, fontSize: 20 }}
              prefix={<WalletMoney size={22} color="#1e40af" style={{ marginRight: 6 }} />}
            />
          </Card>
        </Col>
      </Row>

      {/* Bộ lọc và thao tác */}
      <Card bordered={false} className="app-card" style={{ marginBottom: 16 }}>
        <Row justify="space-between" align="middle" gutter={[16, 16]}>
          <Col>
            <Space wrap>
              <Select
                value={filterType}
                onChange={setFilterType}
                style={{ width: 180 }}
                options={[
                  { value: "ALL", label: "Tất cả loại giao dịch" },
                  { value: "PAYMENT", label: "Thanh toán (Thu)" },
                  { value: "REFUND", label: "Hoàn tiền (Chi)" },
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
            <Space>
              <Button
                icon={<Refresh size={16} />}
                onClick={() => fetchTransactions(page, pageSize)}
                loading={loading}
              >
                Làm mới sổ cái
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Bảng sổ cái */}
      <Card bordered={false} className="app-card">
        <Table
          bordered
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
    </div>
  );
};

export default FinancialLedgerTab;
