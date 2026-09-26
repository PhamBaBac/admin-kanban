import React, { useEffect, useState, useMemo } from "react";
import {
  Button,
  Card,
  Col,
  Empty,
  Input,
  Pagination,
  Popconfirm,
  Row,
  Select,
  Segmented,
  Space,
  Spin,
  Tag,
  Typography,
  message,
  Tooltip,
} from "antd";
import {
  CheckOutlined,
  DeleteOutlined,
  ReloadOutlined,
  SearchOutlined,
  ArrowRightOutlined,
  EyeOutlined,
  FilterOutlined,
  ShoppingOutlined,
  CloseCircleOutlined,
  WarningOutlined,
  StopOutlined,
  MessageOutlined,
  StarOutlined,
  BellOutlined,
  AppstoreOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import {
  AdminNotification,
  NotificationType,
  notificationService,
} from "../services/notificationService";
import {
  formatRelativeTime,
  getNotificationIcon,
} from "../components/NotificationPopover";

const { Title, Text, Paragraph } = Typography;

const NotificationScreen: React.FC = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalElements, setTotalElements] = useState(0);

  const [selectedType, setSelectedType] = useState<NotificationType | "ALL">("ALL");
  const [filterReadStatus, setFilterReadStatus] = useState<"ALL" | "UNREAD" | "READ">("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  const [overviewTotal, setOverviewTotal] = useState<number>(0);
  const [overviewOrders, setOverviewOrders] = useState<number>(0);
  const [overviewStock, setOverviewStock] = useState<number>(0);

  const fetchUnreadCount = async () => {
    try {
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch (err) {
      console.error("Lỗi khi lấy số lượng chưa đọc:", err);
    }
  };

  const fetchNotifications = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await notificationService.getNotifications({
        page,
        size: pageSize,
        type: selectedType === "ALL" ? undefined : selectedType,
        unreadOnly: filterReadStatus === "UNREAD",
      });

      setNotifications(res.data || []);
      setTotalElements(res.totalElements || 0);

      if (selectedType === "ALL" && filterReadStatus === "ALL") {
        setOverviewTotal(res.totalElements || 0);
        const items = res.data || [];
        setOverviewOrders(
          items.filter((n) => n.type === "ORDER_NEW" || n.type === "ORDER_CANCEL").length
        );
        setOverviewStock(
          items.filter((n) => n.type === "LOW_STOCK" || n.type === "OUT_OF_STOCK").length
        );
      }
    } catch (err) {
      console.error("Lỗi khi tải thông báo:", err);
      message.error("Không thể tải danh sách thông báo");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnreadCount();

    const handleNewNoti = () => {
      fetchNotifications(true);
      fetchUnreadCount();
    };
    window.addEventListener("new_admin_notification", handleNewNoti);
    return () => {
      window.removeEventListener("new_admin_notification", handleNewNoti);
    };
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [page, pageSize, selectedType, filterReadStatus]);

  const handleMarkAsRead = async (item: AdminNotification) => {
    if (item.isRead) return;
    try {
      await notificationService.markAsRead(item.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
      message.success("Đã đánh dấu là đã đọc");
    } catch (err) {
      message.error("Lỗi khi đánh dấu đã đọc");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      message.success("Đã đánh dấu tất cả thông báo là đã đọc");
    } catch (err) {
      message.error("Không thể đánh dấu đọc tất cả");
    }
  };

  const handleDelete = async (id: string, isRead: boolean) => {
    try {
      await notificationService.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      setTotalElements((t) => Math.max(0, t - 1));
      if (!isRead) {
        setUnreadCount((c) => Math.max(0, c - 1));
      }
      message.success("Đã xóa thông báo");
    } catch (err) {
      message.error("Lỗi khi xóa thông báo");
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await Promise.all([
        fetchNotifications(true),
        fetchUnreadCount(),
      ]);
      message.success("Đã làm mới danh sách");
    } catch (err) {
      message.error("Lỗi khi làm mới thông báo");
    } finally {
      setRefreshing(false);
    }
  };

  const handleClearAllRead = async () => {
    try {
      const deleted = await notificationService.clearAllRead();
      message.success(`Đã xóa ${deleted} thông báo đã đọc`);
      setNotifications((prev) => prev.filter((n) => !n.isRead));
      setTotalElements((prev) => Math.max(0, prev - deleted));
      fetchUnreadCount();
    } catch (err) {
      message.error("Lỗi khi dọn dẹp thông báo");
    }
  };

  const handleItemClick = async (item: AdminNotification) => {
    if (!item.isRead) {
      handleMarkAsRead(item);
    }
    if (item.targetUrl) {
      navigate(item.targetUrl);
    }
  };

  const filteredNotifications = useMemo(() => {
    let list = notifications;

    if (filterReadStatus === "READ") {
      list = list.filter((n) => n.isRead);
    }

    if (!searchTerm.trim()) return list;

    const term = searchTerm.toLowerCase();
    return list.filter(
      (n) =>
        n.title.toLowerCase().includes(term) ||
        n.content.toLowerCase().includes(term)
    );
  }, [notifications, searchTerm, filterReadStatus]);

  const orderCount = useMemo(
    () =>
      notifications.filter(
        (n) => n.type === "ORDER_NEW" || n.type === "ORDER_CANCEL"
      ).length,
    [notifications]
  );
  const stockCount = useMemo(
    () =>
      notifications.filter(
        (n) => n.type === "LOW_STOCK" || n.type === "OUT_OF_STOCK"
      ).length,
    [notifications]
  );

  return (
    <div className="p-3 p-md-4" style={{ minHeight: "100%", backgroundColor: "#f8fafc" }}>
      {/* Header bar */}
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <Title level={4} style={{ margin: 0, color: "#0f172a", fontWeight: 700 }}>
              Trung tâm thông báo
            </Title>
            {unreadCount > 0 && (
              <Tag
                color="red"
                style={{
                  borderRadius: 12,
                  fontWeight: 600,
                  fontSize: 12,
                  padding: "1px 10px",
                }}
              >
                {unreadCount} chưa đọc
              </Tag>
            )}
          </div>
          <Text style={{ color: "#64748b", fontSize: 13 }}>
            Theo dõi sự kiện thời gian thực: Đơn hàng mới, hủy đơn, tồn kho, đánh giá và tin nhắn hỗ trợ.
          </Text>
        </div>

        {/* Global Action Buttons */}
        <Space wrap>
          <Button
            htmlType="button"
            icon={<ReloadOutlined />}
            onClick={handleRefresh}
            loading={refreshing}
          >
            Làm mới
          </Button>

          <Button
            htmlType="button"
            type="primary"
            icon={<CheckOutlined />}
            onClick={handleMarkAllAsRead}
            disabled={unreadCount === 0}
            style={{ borderRadius: 8 }}
          >
            Đánh dấu tất cả đã đọc
          </Button>

          <Popconfirm
            title="Dọn dẹp thông báo"
            description="Bạn có chắc chắn muốn xóa toàn bộ các thông báo đã đọc không?"
            onConfirm={handleClearAllRead}
            okText="Đồng ý xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Button htmlType="button" danger icon={<DeleteOutlined />} style={{ borderRadius: 8 }}>
              Xóa đã đọc
            </Button>
          </Popconfirm>
        </Space>
      </div>

      {/* 4 Metric Overview Cards */}
      <Row gutter={[16, 16]} className="mb-4">
        <Col xs={12} sm={6}>
          <Card
            bordered={false}
            style={{
              borderRadius: 12,
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              background: "#fff",
            }}
            bodyStyle={{ padding: "16px 20px" }}
          >
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <Text style={{ fontSize: 12, color: "#64748b" }}>Tổng thông báo</Text>
                <div style={{ fontSize: 24, fontWeight: 700, color: "#0f172a", marginTop: 4 }}>
                  {overviewTotal > 0 ? overviewTotal : totalElements}
                </div>
              </div>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  backgroundColor: "#eff8ff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <BellOutlined style={{ fontSize: 22, color: "#1570ef" }} />
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={12} sm={6}>
          <Card
            bordered={false}
            style={{
              borderRadius: 12,
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              background: "#fff",
            }}
            bodyStyle={{ padding: "16px 20px" }}
          >
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <Text style={{ fontSize: 12, color: "#64748b" }}>Chưa xử lý</Text>
                <div style={{ fontSize: 24, fontWeight: 700, color: "#dc2626", marginTop: 4 }}>
                  {unreadCount}
                </div>
              </div>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  backgroundColor: "#fef2f2",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ExclamationCircleOutlined style={{ fontSize: 22, color: "#f04438" }} />
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={12} sm={6}>
          <Card
            bordered={false}
            style={{
              borderRadius: 12,
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              background: "#fff",
            }}
            bodyStyle={{ padding: "16px 20px" }}
          >
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <Text style={{ fontSize: 12, color: "#64748b" }}>Đơn hàng</Text>
                <div style={{ fontSize: 24, fontWeight: 700, color: "#059669", marginTop: 4 }}>
                  {overviewOrders > 0 ? overviewOrders : orderCount}
                </div>
              </div>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  backgroundColor: "#ecfdf5",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ShoppingOutlined style={{ fontSize: 22, color: "#12b76a" }} />
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={12} sm={6}>
          <Card
            bordered={false}
            style={{
              borderRadius: 12,
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              background: "#fff",
            }}
            bodyStyle={{ padding: "16px 20px" }}
          >
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <Text style={{ fontSize: 12, color: "#64748b" }}>Cảnh báo kho</Text>
                <div style={{ fontSize: 24, fontWeight: 700, color: "#d97706", marginTop: 4 }}>
                  {overviewStock > 0 ? overviewStock : stockCount}
                </div>
              </div>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  backgroundColor: "#fffbeb",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <WarningOutlined style={{ fontSize: 22, color: "#f79009" }} />
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Main Container Card: Filters & List */}
      <Card
        bordered={false}
        style={{
          borderRadius: 12,
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          background: "#fff",
        }}
        bodyStyle={{ padding: "20px" }}
      >
        {/* Filter bar */}
        <div className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3 mb-3 pb-3 border-bottom">
          <div className="d-flex flex-wrap align-items-center gap-2">
            {/* Read status segmented */}
            <Segmented
              size="middle"
              value={filterReadStatus}
              onChange={(val) => {
                setFilterReadStatus(val as any);
                setPage(1);
              }}
              options={[
                { label: "Tất cả", value: "ALL" },
                { label: `Chưa đọc (${unreadCount})`, value: "UNREAD" },
                { label: "Đã đọc", value: "READ" },
              ]}
              style={{ fontWeight: 500 }}
            />

            {/* Type selector */}
            <Select
              size="middle"
              value={selectedType}
              onChange={(val) => {
                setSelectedType(val);
                setPage(1);
              }}
              style={{ minWidth: 210, verticalAlign: "middle" }}
              options={[
                {
                  value: "ALL",
                  label: (
                    <Space size={6}>
                      <AppstoreOutlined style={{ color: "#64748b" }} />
                      <span>Tất cả phân loại</span>
                    </Space>
                  ),
                },
                {
                  value: "ORDER_NEW",
                  label: (
                    <Space size={6}>
                      <ShoppingOutlined style={{ color: "#12b76a" }} />
                      <span>Đơn hàng mới</span>
                    </Space>
                  ),
                },
                {
                  value: "ORDER_CANCEL",
                  label: (
                    <Space size={6}>
                      <CloseCircleOutlined style={{ color: "#f04438" }} />
                      <span>Hủy đơn hàng</span>
                    </Space>
                  ),
                },
                {
                  value: "LOW_STOCK",
                  label: (
                    <Space size={6}>
                      <WarningOutlined style={{ color: "#f79009" }} />
                      <span>Sắp hết hàng</span>
                    </Space>
                  ),
                },
                {
                  value: "OUT_OF_STOCK",
                  label: (
                    <Space size={6}>
                      <StopOutlined style={{ color: "#d92d20" }} />
                      <span>Hết hàng trong kho</span>
                    </Space>
                  ),
                },
                {
                  value: "SUPPORT_MESSAGE",
                  label: (
                    <Space size={6}>
                      <MessageOutlined style={{ color: "#1570ef" }} />
                      <span>Tin nhắn hỗ trợ</span>
                    </Space>
                  ),
                },
                {
                  value: "NEW_REVIEW",
                  label: (
                    <Space size={6}>
                      <StarOutlined style={{ color: "#eaaa08" }} />
                      <span>Đánh giá mới</span>
                    </Space>
                  ),
                },
                {
                  value: "SYSTEM_ALERT",
                  label: (
                    <Space size={6}>
                      <BellOutlined style={{ color: "#64748b" }} />
                      <span>Hệ thống</span>
                    </Space>
                  ),
                },
              ]}
              suffixIcon={<FilterOutlined />}
            />
          </div>

          {/* Search input */}
          <div style={{ maxWidth: 320, width: "100%" }}>
            <Input
              placeholder="Tìm theo tiêu đề, nội dung..."
              prefix={<SearchOutlined style={{ color: "#94a3b8" }} />}
              allowClear
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ borderRadius: 8 }}
            />
          </div>
        </div>

        <style>{`
          html {
            scrollbar-gutter: stable;
          }
          .notification-spin {
            min-height: 480px;
          }
          .notification-spin .ant-spin-nested-loading {
            min-height: 480px;
          }
          .notification-spin .ant-spin-container {
            min-height: 480px;
            display: flex;
            flex-direction: column;
          }
          .notification-spin .ant-spin-blur {
            opacity: 0.6;
            filter: blur(0.5px);
            transition: opacity 0.15s ease;
          }
          .notification-item {
            cursor: pointer;
          }
          .notification-item .noti-delete-btn {
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.2s ease;
          }
          .notification-item:hover .noti-delete-btn {
            opacity: 1;
            pointer-events: auto;
          }
          .notification-item:hover .noti-time-text {
            opacity: 0;
            transition: opacity 0.2s ease;
          }
        `}</style>

        {/* Notifications List */}
        <Spin spinning={loading} size="default" wrapperClassName="notification-spin">
          <div style={{ minHeight: 480, display: "flex", flexDirection: "column" }}>
            {filteredNotifications.length === 0 ? (
              <div
                className="d-flex flex-column align-items-center justify-content-center"
                style={{ flex: 1, minHeight: 480, padding: "40px 0" }}
              >
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    loading
                      ? "Đang tải dữ liệu..."
                      : searchTerm
                      ? "Không tìm thấy thông báo phù hợp"
                      : filterReadStatus === "UNREAD"
                      ? "Không có thông báo chưa đọc nào"
                      : filterReadStatus === "READ"
                      ? "Không có thông báo đã đọc nào"
                      : "Chưa có thông báo nào trong hệ thống"
                  }
                />
              </div>
            ) : (
              <div className="d-flex flex-column gap-2" style={{ flex: 1 }}>
              {filteredNotifications.map((item) => {
              const config = getNotificationIcon(item.type);
              return (
                <div
                  key={item.id}
                  className="notification-item p-3 rounded-3 position-relative"
                  style={{
                    backgroundColor: item.isRead ? "#ffffff" : "#f0f7ff",
                    border: item.isRead ? "1px solid #f1f5f9" : "1px solid #bfdbfe",
                    transition: "all 0.2s ease",
                  }}
                  onClick={() => handleItemClick(item)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = "0 4px 14px rgba(0,0,0,0.06)";
                    e.currentTarget.style.borderColor = "#93c5fd";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = "none";
                    e.currentTarget.style.borderColor = item.isRead ? "#f1f5f9" : "#bfdbfe";
                  }}
                >
                  <div className="d-flex align-items-start gap-3">
                    {/* Icon Container */}
                    <div
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: 10,
                        backgroundColor: config.bg,
                        border: `1px solid ${config.border}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        marginTop: 2,
                      }}
                    >
                      {config.icon}
                    </div>

                    {/* Content Section */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="d-flex align-items-center gap-2 mb-1">
                        {!item.isRead && (
                          <span
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: "50%",
                              backgroundColor: "#1570ef",
                              display: "inline-block",
                              flexShrink: 0,
                            }}
                          />
                        )}
                        <Text
                          strong
                          style={{
                            fontSize: 15,
                            color: item.isRead ? "#1e293b" : "#0f172a",
                          }}
                        >
                          {item.title}
                        </Text>
                      </div>

                      {/* Content Description */}
                      <Paragraph
                        style={{
                          margin: 0,
                          color: "#475569",
                          fontSize: 13,
                          lineHeight: 1.5,
                        }}
                      >
                        {item.content}
                      </Paragraph>
                    </div>

                    {/* Right Side: Meta & Smart Time / Hover Delete */}
                    <div
                      className="d-flex align-items-center gap-2"
                      style={{ flexShrink: 0, marginTop: 2 }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Priority Tags */}
                      {item.priority === "URGENT" && (
                        <Tag color="error" style={{ borderRadius: 6, fontWeight: 600, margin: 0 }}>
                          Khẩn cấp
                        </Tag>
                      )}
                      {item.priority === "HIGH" && (
                        <Tag color="warning" style={{ borderRadius: 6, fontWeight: 600, margin: 0 }}>
                          Quan trọng
                        </Tag>
                      )}

                      {/* Smart Time / Hover Delete Container */}
                      <div
                        className="position-relative d-flex align-items-center justify-content-end"
                        style={{ minWidth: 95, height: 26 }}
                      >
                        <Tooltip title={item.createdAt ? new Date(item.createdAt).toLocaleString("vi-VN") : ""}>
                          <span
                            className="noti-time-text"
                            style={{
                              fontSize: 12,
                              color: "#94a3b8",
                              fontWeight: 500,
                              whiteSpace: "nowrap",
                            }}
                          >
                            {formatRelativeTime(item.createdAt)}
                          </span>
                        </Tooltip>

                        <div
                          className="noti-delete-btn position-absolute"
                          style={{
                            right: 0,
                            top: "50%",
                            transform: "translateY(-50%)",
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Popconfirm
                            title="Xóa thông báo này?"
                            onConfirm={(e) => {
                              e?.stopPropagation();
                              handleDelete(item.id, item.isRead);
                            }}
                            onCancel={(e) => e?.stopPropagation()}
                            okText="Xóa"
                            cancelText="Hủy"
                            okButtonProps={{ danger: true }}
                          >
                            <Tooltip title="Xóa thông báo">
                              <Button
                                type="text"
                                size="small"
                                danger
                                icon={<DeleteOutlined style={{ fontSize: 14 }} />}
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                  borderRadius: 6,
                                  height: 26,
                                  width: 26,
                                  padding: 0,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  backgroundColor: "#fee2e2",
                                }}
                              />
                            </Tooltip>
                          </Popconfirm>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
              </div>
            )}
          </div>
        </Spin>

        {/* Pagination bar - always mounted with stable height to prevent layout shift */}
        <div 
          className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-2 mt-4 pt-3 border-top"
          style={{ minHeight: 52 }}
        >
          <Text style={{ fontSize: 13, color: "#64748b" }}>
            {totalElements > 0
              ? `Hiển thị ${Math.min((page - 1) * pageSize + 1, totalElements)}-${Math.min(
                  page * pageSize,
                  totalElements
                )} trong tổng số ${totalElements} thông báo`
              : "0 thông báo"}
          </Text>
          {totalElements > pageSize && (
            <Pagination
              current={page}
              pageSize={pageSize}
              total={totalElements}
              showSizeChanger
              pageSizeOptions={["10", "20", "50"]}
              onChange={(newPage, newPageSize) => {
                setPage(newPage);
                setPageSize(newPageSize);
              }}
            />
          )}
        </div>
      </Card>
    </div>
  );
};

export default NotificationScreen;
