/** @format */

import React, { useEffect, useState } from "react";
import {
  BillModel,
  PaymentStatusColor,
  PaymentTypeColor,
} from "../../models/BillModel";
import handleAPI from "../../apis/handleAPI";
import { ColumnProps, TableProps } from "antd/es/table";
import {
  DatePicker,
  Input,
  Table,
  Tag,
  Typography,
  Avatar,
  Space,
  Button,
  Tooltip,
  Modal,
  message,
  Card,
  Row,
  Col,
  Statistic,
  Select,
} from "antd";
import {
  Edit2,
  Trash,
  Eye,
  ShoppingCart,
  DollarCircle,
  Clock,
} from "iconsax-react";
import { colors } from "../../constants/colors";

const { confirm } = Modal;

const OrdersScreen = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [bills, setBills] = useState<BillModel[]>([]);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(1);
  const [api, setApi] = useState("");
  const [selectedRowKeys, setSelectedRowKeys] = useState<any[]>([]);
  const [searchKey, setSearchKey] = useState("");
  const [isModalStatusOpen, setIsModalStatusOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [editingStatus, setEditingStatus] = useState<string>("");
  const orderStatusOptions = [
    "PENDING",
    "PROCESSING",
    "COMPLETED",
    "CANCELLED",
    "REFUNDED",
  ];

  useEffect(() => {
    if (!searchKey) {
      setApi(`/orders/all?page=${page}&pageSize=${limit}`);
    }
  }, [searchKey, page, limit]);

  useEffect(() => {
    api && getBills(api);
  }, [api]);

  const getBills = async (url: string) => {
    setIsLoading(true);
    try {
      const res: any = await handleAPI(url);
      const billsData = res.result.data.map((item: any) => ({
        ...item,
        key: item.id,
      }));
      setBills(billsData);
      setTotal(res.result.totalElements);
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchBills = async () => {
    setIsLoading(true);
    try {
      const res: any = await handleAPI(
        `/orders/all?page=${page}&pageSize=${limit}&search=${searchKey}`
      );
      const billsData = res.result.data.map((item: any) => ({
        ...item,
        key: item.id,
      }));
      setBills(billsData);
      setTotal(res.result.totalElements);
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveBill = async (id: string) => {
    try {
      await handleAPI(`/orders/${id}`, undefined, "delete");
      setBills((prev) => prev.filter((bill) => bill.id !== id));
      message.success("Bill removed successfully");
    } catch (error: any) {
      message.error(error.message || "Failed to remove bill");
    }
  };

  const handleUpdateStatusOrder = async () => {
    if (!selectedOrderId || !selectedStatus) return;
    try {
      await handleAPI(
        `/orders/${selectedOrderId}/status`,
        {orderStatus:selectedStatus },
        "patch"
      );
      message.success("Order status updated successfully");
      setIsModalStatusOpen(false);
      setSelectedOrderId(null);
      setSelectedStatus("");
      // reload bills
      getBills(api || `/orders/all?page=${page}&pageSize=${limit}`);
    } catch (error: any) {
      message.error(error.message || "Failed to update order status");
    }
  };

  const rowSelection: TableProps<BillModel>["rowSelection"] = {
    selectedRowKeys,
    onChange: setSelectedRowKeys,
  };

  const getPaymentTypeColor = (paymentType: string) => {
    switch (paymentType) {
      case "COD":
        return "orange";
      case "VNPAY":
        return "blue";
      case "MOMO":
        return "pink";
      default:
        return "default";
    }
  };

  const getOrderStatusColor = (orderStatus: string) => {
    switch (orderStatus) {
      case "PENDING":
        return "processing";
      case "CONFIRMED":
        return "warning";
      case "SHIPPING":
        return "processing";
      case "DELIVERED":
        return "success";
      case "CANCELLED":
        return "error";
      default:
        return "default";
    }
  };

  const columns: ColumnProps<BillModel>[] = [
    {
      title: "Customer",
      dataIndex: "userName",
      key: "customer",
      width: 200,
      render: (userName: string, record: BillModel) => (
        <div>
          <div>
            <strong>{userName}</strong>
          </div>
          <div style={{ fontSize: "12px", color: "#666" }}>{record.email}</div>
        </div>
      ),
    },
    {
      title: "Recipient",
      dataIndex: "nameRecipient",
      key: "recipient",
      width: 180,
      render: (nameRecipient: string | null, record: BillModel) => (
        <div>
          <div>{nameRecipient || "N/A"}</div>
          <div style={{ fontSize: "12px", color: "#666" }}>
            {record.phoneNumber || "N/A"}
          </div>
        </div>
      ),
    },
    {
      title: "Shipping Address",
      dataIndex: "address",
      key: "shippingAddress",
      width: 250,
      render: (address: string | null) => (
        <Tooltip title={address || "N/A"}>
          <div className="text-2-line">{address || "N/A"}</div>
        </Tooltip>
      ),
      ellipsis: true,
    },
    {
      title: "Products",
      dataIndex: "orderResponses",
      key: "products",
      width: 300,
      render: (orderResponses: any[]) => (
        <Space direction="vertical" size="small">
          {orderResponses.map((item, index) => (
            <div
              key={index}
              style={{ display: "flex", alignItems: "center", gap: "8px" }}
            >
              <Avatar size="small" src={item.image} />
              <div style={{ fontSize: "12px" }}>
                <Tooltip title={item.title}>
                  <div className="text-2-line">
                    {item.title.length > 30
                      ? `${item.title.substring(0, 30)}...`
                      : item.title}
                  </div>
                </Tooltip>
                <div style={{ color: "#666" }}>
                  {item.size} - Qty: {item.qty}
                </div>
              </div>
            </div>
          ))}
        </Space>
      ),
    },
    {
      title: "Payment Type",
      dataIndex: "paymentType",
      key: "paymentType",
      width: 120,
      align: "center",
      render: (paymentType: string) => (
        <Tag color={getPaymentTypeColor(paymentType)}>{paymentType}</Tag>
      ),
    },
    {
      title: "Order Status",
      dataIndex: "orderStatus",
      key: "orderStatus",
      width: 120,
      align: "center",
      render: (orderStatus: string, record: BillModel) =>
        editingOrderId === record.id ? (
          <Select
            value={editingStatus}
            onChange={setEditingStatus}
            style={{ width: 120 }}
            size="small"
            onBlur={() => setEditingOrderId(null)}
            dropdownMatchSelectWidth={false}
            autoFocus
            onSelect={async (status) => {
              try {
                await handleAPI(
                  `/orders/${record.id}/status`,
                  { orderStatus: status },
                  "patch"
                );
                message.success("Order status updated successfully");
                setEditingOrderId(null);
                setEditingStatus("");
                getBills(api || `/orders/all?page=${page}&pageSize=${limit}`);
              } catch (error: any) {
                message.error(error.message || "Failed to update order status");
              }
            }}
          >
            {orderStatusOptions.map((status) => (
              <Select.Option key={status} value={status}>
                {status}
              </Select.Option>
            ))}
          </Select>
        ) : (
          <Tag
            color={getOrderStatusColor(orderStatus)}
            style={{ cursor: "pointer" }}
            onClick={() => {
              setEditingOrderId(record.id);
              setEditingStatus(orderStatus);
            }}
          >
            {orderStatus}
          </Tag>
        ),
    },
    {
      title: "Total Amount",
      key: "total",
      width: 150,
      align: "right",
      render: (_, record: BillModel) => {
        const total = record.orderResponses.reduce(
          (sum, item) => sum + item.totalPrice,
          0
        );
        return (
          <Typography.Text strong style={{ color: colors.primary500 }}>
            {total.toLocaleString("vi-VN")} ₫
          </Typography.Text>
        );
      },
      sorter: (a: BillModel, b: BillModel) => {
        const totalA = a.orderResponses.reduce(
          (sum, item) => sum + item.totalPrice,
          0
        );
        const totalB = b.orderResponses.reduce(
          (sum, item) => sum + item.totalPrice,
          0
        );
        return totalA - totalB;
      },
    },
    {
      title: "Created Date",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 120,
      align: "center",
      render: (createdAt: string) => (
        <div>
          <div>{new Date(createdAt).toLocaleDateString("vi-VN")}</div>
          <div style={{ fontSize: "11px", color: "#999" }}>
            {new Date(createdAt).toLocaleTimeString("vi-VN", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </div>
      ),
      sorter: (a: BillModel, b: BillModel) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },
    {
      key: "actions",
      title: "Actions",
      dataIndex: "",
      fixed: "right",
      width: 120,
      align: "center",
      render: (item: BillModel) => (
        <Space>
          <Tooltip title="Edit Status Order">
            <Button
              icon={<Edit2 color={colors.primary500} size={18} />}
              type="text"
              onClick={() => {
                setSelectedOrderId(item.id);
                setSelectedStatus(item.orderStatus);
                setIsModalStatusOpen(true);
              }}
            />
          </Tooltip>
          <Tooltip title="Delete bill">
            <Button
              icon={<Trash className="text-danger" size={18} />}
              type="text"
              onClick={() =>
                confirm({
                  title: "Confirm Delete",
                  content: "Are you sure you want to delete this bill?",
                  okText: "Delete",
                  okType: "danger",
                  cancelText: "Cancel",
                  onOk: () => handleRemoveBill(item.id),
                })
              }
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const totalRevenue = bills.reduce((sum, bill) => {
    return (
      sum +
      bill.orderResponses.reduce(
        (itemSum, item) => itemSum + item.totalPrice,
        0
      )
    );
  }, 0);

  const pendingOrders = bills.filter(
    (bill) => bill.orderStatus === "PENDING"
  ).length;

  return (
    <div style={{ padding: "24px" }}>
      <Card style={{ marginBottom: "16px" }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Typography.Title level={4} style={{ margin: 0 }}>
              Orders Management
            </Typography.Title>
          </Col>
          <Col>
            <Space>
              {selectedRowKeys.length > 0 && (
                <Space>
                  <Tooltip title="Delete selected orders">
                    <Button
                      danger
                      icon={<Trash size={16} />}
                      onClick={() =>
                        confirm({
                          title: "Confirm Delete",
                          content: `Are you sure you want to delete ${selectedRowKeys.length} selected orders?`,
                          okText: "Delete",
                          okType: "danger",
                          cancelText: "Cancel",
                          onOk: async () => {
                            await Promise.all(
                              selectedRowKeys.map((id) => handleRemoveBill(id))
                            );
                            setSelectedRowKeys([]);
                            await getBills(
                              `/orders/all?page=${page}&pageSize=${limit}`
                            );
                          },
                          onCancel: () => setSelectedRowKeys([]),
                        })
                      }
                    >
                      Delete ({selectedRowKeys.length})
                    </Button>
                  </Tooltip>
                </Space>
              )}
              <Input.Search
                value={searchKey}
                onChange={(e) => setSearchKey(e.target.value)}
                onSearch={handleSearchBills}
                placeholder="Search orders by customer name, email..."
                allowClear
                style={{ width: 300 }}
              />
              <DatePicker.RangePicker
                placeholder={["Start Date", "End Date"]}
                style={{ width: 250 }}
              />
            </Space>
          </Col>
        </Row>
      </Card>

      <Card>
        <Table
          rowKey={(record) => record.id}
          rowSelection={rowSelection}
          loading={isLoading}
          dataSource={bills}
          columns={columns}
          size="middle"
          scroll={{ x: 1400 }}
          bordered
          pagination={{
            total,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50", "100"],
            onShowSizeChange(current, size) {
              setLimit(size);
            },
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} orders`,
            pageSize: limit,
            current: page,
            onChange: (page, limit) => {
              setPage(page);
              setLimit(limit);
            },
            showQuickJumper: true,
          }}
        />
      </Card>

      <Modal
        title="Edit Order Status"
        open={isModalStatusOpen}
        onCancel={() => setIsModalStatusOpen(false)}
        onOk={handleUpdateStatusOrder}
        okText="Update"
        cancelText="Cancel"
      >
        <Select
          value={selectedStatus}
          onChange={setSelectedStatus}
          style={{ width: "100%" }}
        >
          {orderStatusOptions.map((status) => (
            <Select.Option key={status} value={status}>
              {status}
            </Select.Option>
          ))}
        </Select>
      </Modal>
    </div>
  );
};

export default OrdersScreen;
