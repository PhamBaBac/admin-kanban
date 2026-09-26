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
  Typography,
  Tooltip,
  Divider,
} from "antd";
import {
  MoneyRecive,
  MoneySend,
  WalletMoney,
  Refresh,
  Eye,
} from "iconsax-react";
import { PaymentTransactionModel } from "../../models/BillModel";
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
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
      } finally {
        setLoading(false);
      }
    },
    [page, pageSize]
  );

  useEffect(() => {
    fetchTransactions(page, pageSize);
  }, [page, pageSize, fetchTransactions]);

  const filteredData = transactions.filter((tx) => {
    if (filterType !== "ALL" && tx.transactionType !== filterType) return false;
    if (filterStatus !== "ALL" && tx.status !== filterStatus) return false;
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

  /** Render thẻ giao dịch cho mobile */
  const renderMobileCard = (tx: PaymentTransactionModel) => {
    const method = tx.paymentType || (tx as any).paymentMethod || "COD";
    const isPayment = tx.transactionType === "PAYMENT";
    const gatewayNo = tx.gatewayTransactionNo || (tx as any).gatewayTransactionId;
    return (
      <Card
        key={tx.id || tx.transactionCode}
        bordered={false}
        className="app-card"
        style={{
          marginBottom: 10,
          borderRadius: 12,
          border: "1px solid #e2e8f0",
          boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
        }}
        bodyStyle={{ padding: "14px 16px" }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
          <div>
            <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#1570ef", fontSize: 13 }}>
              {tx.transactionCode || "—"}
            </span>
            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
              {tx.createdAt ? new Date(tx.createdAt).toLocaleString("vi-VN") : "—"}
            </div>
          </div>
          <span style={{ fontWeight: 700, fontSize: 16, color: isPayment ? "#166534" : "#dc2626" }}>
            {isPayment ? "+" : "-"}{VND.format(tx.amount || 0)}
          </span>
        </div>
        <Divider style={{ margin: "8px 0" }} />
        <Space wrap size={4} style={{ marginBottom: 8 }}>
          <Tag color={method === "COD" ? "orange" : method === "VNPAY" ? "blue" : "pink"}>{method}</Tag>
          {isPayment ? (
            <Tag color="success" icon={<MoneyRecive size={11} style={{ verticalAlign: "middle", marginRight: 3 }} />}>THANH TOÁN</Tag>
          ) : (
            <Tag color="error" icon={<MoneySend size={11} style={{ verticalAlign: "middle", marginRight: 3 }} />}>HOÀN TIỀN</Tag>
          )}
          <Tag color={tx.status === "SUCCESS" ? "green" : tx.status === "PENDING" ? "gold" : "red"}>{tx.status}</Tag>
        </Space>
        <div style={{ fontSize: 12, color: "#64748b" }}>
          <Space split={<span style={{ color: "#cbd5e1" }}>|</span>} wrap>
            {tx.orderId && (
              <Space size={4}>
                <span>Đơn: <strong style={{ color: "#334155", fontFamily: "monospace" }}>#{tx.orderId.substring(0, 8)}</strong></span>
                {onViewOrderDetail && (
                  <Tooltip title="Xem chi tiết đơn hàng">
                    <Button type="text" size="small" style={{ padding: "0 4px", height: "auto" }}
                      icon={<Eye size={13} color="#1570ef" />}
                      onClick={() => onViewOrderDetail(tx.orderId)}
                    />
                  </Tooltip>
                )}
              </Space>
            )}
            <span>Cổng: <span style={{ fontFamily: "monospace" }}>{gatewayNo || "— (COD)"}</span></span>
          </Space>
        </div>
        {tx.note && (
          <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 6, fontStyle: "italic" }}>{tx.note}</div>
        )}
      </Card>
    );
  };

  return (
    <div>
      {/* 3 Thẻ thống kê tài chính */}
      <Row gutter={[16, 12]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={8}>
          <Card
            bordered={false}
            className="app-card"
            style={{ borderRadius: 8, background: "#f0fdf4", border: "1px solid #bbf7d0" }}
          >
            <Statistic
              title={<span style={{ color: "#166534", fontWeight: 600, fontSize: isMobile ? 12 : 14 }}>Tổng tiền đã thu (Inflow)</span>}
              value={totalInflow}
              formatter={(val) => VND.format(Number(val))}
              valueStyle={{ color: "#166534", fontWeight: 700, fontSize: isMobile ? 16 : 20 }}
              prefix={<MoneyRecive size={isMobile ? 18 : 22} color="#166534" style={{ marginRight: 6 }} />}
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
              title={<span style={{ color: "#dc2626", fontWeight: 600, fontSize: isMobile ? 12 : 14 }}>Tổng tiền đã hoàn trả (Outflow)</span>}
              value={totalOutflow}
              formatter={(val) => VND.format(Number(val))}
              valueStyle={{ color: "#dc2626", fontWeight: 700, fontSize: isMobile ? 16 : 20 }}
              prefix={<MoneySend size={isMobile ? 18 : 22} color="#dc2626" style={{ marginRight: 6 }} />}
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
              title={<span style={{ color: "#1e40af", fontWeight: 600, fontSize: isMobile ? 12 : 14 }}>Dòng tiền thực thu (Net Cashflow)</span>}
              value={netCashflow}
              formatter={(val) => VND.format(Number(val))}
              valueStyle={{ color: "#1e40af", fontWeight: 700, fontSize: isMobile ? 16 : 20 }}
              prefix={<WalletMoney size={isMobile ? 18 : 22} color="#1e40af" style={{ marginRight: 6 }} />}
            />
          </Card>
        </Col>
      </Row>

      {/* Bộ lọc và thao tác */}
      <Card bordered={false} className="app-card" style={{ marginBottom: 16 }}>
        <Row justify="space-between" align="middle" gutter={[12, 12]}>
          <Col xs={24} sm="auto">
            <Space wrap style={isMobile ? { width: "100%" } : undefined}>
              <Select
                value={filterType}
                onChange={setFilterType}
                style={{ width: isMobile ? "100%" : 180 }}
                options={[
                  { value: "ALL", label: "Tất cả loại giao dịch" },
                  { value: "PAYMENT", label: "Thanh toán (Thu)" },
                  { value: "REFUND", label: "Hoàn tiền (Chi)" },
                ]}
              />
              <Select
                value={filterStatus}
                onChange={setFilterStatus}
                style={{ width: isMobile ? "100%" : 160 }}
                options={[
                  { value: "ALL", label: "Tất cả trạng thái" },
                  { value: "SUCCESS", label: "Thành công" },
                  { value: "PENDING", label: "Đang chờ" },
                  { value: "FAILED", label: "Thất bại" },
                ]}
              />
            </Space>
          </Col>
          <Col xs={24} sm="auto">
            <Button
              icon={<Refresh size={16} />}
              onClick={() => fetchTransactions(page, pageSize)}
              loading={loading}
              style={isMobile ? { width: "100%" } : undefined}
            >
              Làm mới sổ cái
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Bảng / Thẻ sổ cái */}
      {isMobile ? (
        <div>
          {loading ? (
            <Card bordered={false} className="app-card" style={{ textAlign: "center", padding: "32px 0" }}>
              <Typography.Text type="secondary">Đang tải...</Typography.Text>
            </Card>
          ) : filteredData.length === 0 ? (
            <Card bordered={false} className="app-card" style={{ textAlign: "center", padding: "32px 0" }}>
              <Typography.Text type="secondary">Không có giao dịch nào</Typography.Text>
            </Card>
          ) : (
            filteredData.map(renderMobileCard)
          )}
          {filteredData.length > 0 && (
            <div style={{ display: "flex", justifyContent: "center", marginTop: 12 }}>
              <Space>
                <Button size="small" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>← Trước</Button>
                <Typography.Text style={{ fontSize: 13 }}>Trang {page}</Typography.Text>
                <Button size="small" disabled={filteredData.length < pageSize} onClick={() => setPage((p) => p + 1)}>Sau →</Button>
              </Space>
            </div>
          )}
        </div>
      ) : (
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
      )}
    </div>
  );
};

export default FinancialLedgerTab;
