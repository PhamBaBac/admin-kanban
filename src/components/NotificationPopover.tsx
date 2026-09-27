import React, { useEffect, useState, useMemo } from "react";
import {
  Badge,
  Button,
  Empty,
  Popover,
  Spin,
  Tabs,
  Tag,
  Tooltip,
  Typography,
  message,
} from "antd";
import {
  CheckOutlined,
  ArrowRightOutlined,
  ShoppingOutlined,
  CloseCircleOutlined,
  WarningOutlined,
  MessageOutlined,
  StarOutlined,
  InfoCircleOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { Notification } from "iconsax-react";
import { useNavigate } from "react-router-dom";
import {
  AdminNotification,
  NotificationType,
  notificationService,
} from "../services/notificationService";
import { productService } from "../services/productService";
import { postNotificationSync } from "../utils/notificationBroadcast";

const { Text } = Typography;

interface Props {
  unreadCount: number;
  setUnreadCount: React.Dispatch<React.SetStateAction<number>>;
  latestNotification?: AdminNotification | null;
}

export const formatRelativeTime = (dateStr?: string) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "";
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffSec < 45) return "Vừa xong";
  if (diffSec < 3600) return `${Math.max(1, Math.floor(diffSec / 60))} phút trước`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} giờ trước`;
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)} ngày trước`;

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  if (year === now.getFullYear()) {
    return `${day}/${month}`;
  }
  return `${day}/${month}/${year}`;
};

export const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case "ORDER_NEW":
      return {
        icon: <ShoppingOutlined style={{ fontSize: 16, color: "#059669" }} />,
        bg: "#ecfdf5",
        border: "#a7f3d0",
      };
    case "ORDER_CANCEL":
      return {
        icon: <CloseCircleOutlined style={{ fontSize: 16, color: "#dc2626" }} />,
        bg: "#fef2f2",
        border: "#fecaca",
      };
    case "LOW_STOCK":
      return {
        icon: <WarningOutlined style={{ fontSize: 16, color: "#d97706" }} />,
        bg: "#fffbeb",
        border: "#fde68a",
      };
    case "OUT_OF_STOCK":
      return {
        icon: <WarningOutlined style={{ fontSize: 16, color: "#b91c1c" }} />,
        bg: "#fef2f2",
        border: "#fca5a5",
      };
    case "SUPPORT_MESSAGE":
      return {
        icon: <MessageOutlined style={{ fontSize: 16, color: "#2563eb" }} />,
        bg: "#eff6ff",
        border: "#bfdbfe",
      };
    case "NEW_REVIEW":
      return {
        icon: <StarOutlined style={{ fontSize: 16, color: "#ca8a04" }} />,
        bg: "#fefce8",
        border: "#fef08a",
      };
    case "SYSTEM_ALERT":
    default:
      return {
        icon: <InfoCircleOutlined style={{ fontSize: 16, color: "#7c3aed" }} />,
        bg: "#faf5ff",
        border: "#e9d5ff",
      };
  }
};

const NotificationPopover: React.FC<Props> = ({
  unreadCount,
  setUnreadCount,
  latestNotification,
}) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"ALL" | "UNREAD">("ALL");
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await notificationService.getNotifications({
        page: 1,
        size: 15,
        unreadOnly: activeTab === "UNREAD",
      });
      setNotifications(res.data || []);
    } catch (error) {
      console.error("Lỗi khi tải thông báo:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchNotifications();
    }
  }, [open, activeTab]);

  useEffect(() => {
    const handleDeleted = (e: any) => {
      const id = e.detail?.id;
      if (id) {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }
    };
    const handleClearRead = () => {
      setNotifications((prev) => prev.filter((n) => !n.isRead));
    };
    const handleReadAll = () => {
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    };
    const handleReadOne = (e: any) => {
      const id = e.detail?.id;
      if (id) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        );
      }
    };

    window.addEventListener("admin_notification_deleted", handleDeleted);
    window.addEventListener("admin_notification_clear_read", handleClearRead);
    window.addEventListener("admin_notification_read_all", handleReadAll);
    window.addEventListener("admin_notification_read", handleReadOne);

    return () => {
      window.removeEventListener("admin_notification_deleted", handleDeleted);
      window.removeEventListener("admin_notification_clear_read", handleClearRead);
      window.removeEventListener("admin_notification_read_all", handleReadAll);
      window.removeEventListener("admin_notification_read", handleReadOne);
    };
  }, []);

  useEffect(() => {
    if (!latestNotification) return;

    setNotifications((prev) => {
      const exists = prev.some((n) => n.id === latestNotification.id);
      if (exists) return prev;
      return [latestNotification, ...prev];
    });
  }, [latestNotification]);

  const handleItemClick = async (item: AdminNotification) => {
    if (!item.isRead) {
      try {
        await notificationService.markAsRead(item.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
        window.dispatchEvent(
          new CustomEvent("admin_notification_read", { detail: { id: item.id } })
        );
        postNotificationSync({ type: "READ", payload: { id: item.id } });
      } catch (err) {
        console.error("Lỗi khi đánh dấu đã đọc:", err);
      }
    }

    setOpen(false);

    if (item.type === "LOW_STOCK" || item.type === "OUT_OF_STOCK") {
      if (item.targetUrl && item.targetUrl.startsWith("/inventory/detail/")) {
        navigate(item.targetUrl);
        return;
      }

      if (item.referenceId) {
        try {
          const detail = await productService.getSubProductDetail(item.referenceId);
          if (detail && detail.productId) {
            navigate(
              `/inventory/detail/${detail.productSlug || "product"}?id=${detail.productId}&subId=${item.referenceId}`
            );
            return;
          }
        } catch (e) {
          console.error("Lỗi khi tìm sản phẩm theo biến thể:", e);
        }
      }

      const match = item.content?.match(
        /Biến thể\s+([^(\n\r]+?)(?:\s*\(|\s+chỉ còn lại|\s+đã hết hàng)/i
      );
      const productName = match ? match[1].trim() : "";
      if (productName) {
        navigate(`/inventory?search=${encodeURIComponent(productName)}`);
        return;
      }

      navigate(item.targetUrl || "/inventory");
      return;
    }

    if (item.targetUrl) {
      navigate(item.targetUrl);
    }
  };

  const handleMarkAllAsRead = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      window.dispatchEvent(new CustomEvent("admin_notification_read_all"));
      postNotificationSync({ type: "READ_ALL" });
      message.success("Đã đánh dấu tất cả thông báo là đã đọc");
    } catch (err) {
      message.error("Không thể đánh dấu đọc tất cả");
    }
  };
  
  const handleDeleteItem = async (e: React.MouseEvent, id: string, isRead: boolean) => {
    e.stopPropagation();
    try {
      await notificationService.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      if (!isRead) {
        setUnreadCount((c) => Math.max(0, c - 1));
      }
      window.dispatchEvent(
        new CustomEvent("admin_notification_deleted", { detail: { id } })
      );
      postNotificationSync({ type: "DELETED", payload: { id } });
      message.success("Đã xóa thông báo");
    } catch (err) {
      message.error("Lỗi khi xóa thông báo");
    }
  };

  const displayedList = useMemo(() => {
    if (activeTab === "UNREAD") {
      return notifications.filter((n) => !n.isRead);
    }
    return notifications;
  }, [notifications, activeTab]);

  const popoverContent = (
    <div style={{ width: 380, maxHeight: 520, display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div
        className="d-flex align-items-center justify-content-between px-3 py-2"
        style={{ borderBottom: "1px solid #f1f5f9" }}
      >
        <div className="d-flex align-items-center gap-2">
          <Text strong style={{ fontSize: 16, color: "#0f172a" }}>
            Thông báo
          </Text>
          {unreadCount > 0 && (
            <Tag
              color="blue"
              style={{
                borderRadius: 12,
                padding: "0 8px",
                fontSize: 11,
                fontWeight: 600,
                border: "none",
              }}
            >
              {unreadCount} mới
            </Tag>
          )}
        </div>

        {unreadCount > 0 && (
          <Button
            type="link"
            size="small"
            icon={<CheckOutlined style={{ fontSize: 12 }} />}
            onClick={handleMarkAllAsRead}
            style={{ fontSize: 12, color: "#2563eb", padding: 0 }}
          >
            Đọc tất cả
          </Button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="px-3" style={{ borderBottom: "1px solid #f8fafc" }}>
        <Tabs
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key as "ALL" | "UNREAD")}
          size="small"
          items={[
            { key: "ALL", label: `Tất cả (${notifications.length})` },
            {
              key: "UNREAD",
              label: `Chưa đọc (${notifications.filter((n) => !n.isRead).length})`,
            },
          ]}
          style={{ marginBottom: 0 }}
        />
      </div>

      {/* List Body */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          maxHeight: 360,
          padding: "4px 0",
        }}
      >
        {loading ? (
          <div className="d-flex justify-content-center align-items-center py-5">
            <Spin size="default" />
          </div>
        ) : displayedList.length === 0 ? (
          <div className="py-5 text-center">
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                activeTab === "UNREAD"
                  ? "Không có thông báo chưa đọc"
                  : "Chưa có thông báo nào"
              }
            />
          </div>
        ) : (
          displayedList.map((item) => {
            const config = getNotificationIcon(item.type);
            return (
              <div
                key={item.id}
                onClick={() => handleItemClick(item)}
                className="notification-popover-item position-relative d-flex align-items-start gap-3 px-3 py-2"
                style={{
                  cursor: "pointer",
                  backgroundColor: item.isRead ? "transparent" : "#f0f7ff",
                  borderBottom: "1px solid #f8fafc",
                  transition: "background-color 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = item.isRead
                    ? "#f8fafc"
                    : "#e0f2fe";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = item.isRead
                    ? "transparent"
                    : "#f0f7ff";
                }}
              >
                {/* Icon */}
                <div
                  style={{
                    width: 36,
                    height: 36,
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

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0, paddingRight: 16 }}>
                  <div className="d-flex align-items-center justify-content-between mb-1">
                    <Text
                      strong
                      ellipsis
                      style={{
                        fontSize: 13,
                        color: item.isRead ? "#334155" : "#0f172a",
                        fontWeight: item.isRead ? 500 : 700,
                        maxWidth: 200,
                      }}
                    >
                      {item.title}
                    </Text>

                    {item.priority === "URGENT" && (
                      <Tag color="error" style={{ fontSize: 10, lineHeight: "16px", padding: "0 4px", margin: 0 }}>
                        Khẩn cấp
                      </Tag>
                    )}
                    {item.priority === "HIGH" && (
                      <Tag color="warning" style={{ fontSize: 10, lineHeight: "16px", padding: "0 4px", margin: 0 }}>
                        Quan trọng
                      </Tag>
                    )}
                  </div>

                  <div
                    style={{
                      fontSize: 12,
                      color: "#64748b",
                      lineHeight: 1.4,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {item.content}
                  </div>

                  <div className="d-flex align-items-center justify-content-between mt-1">
                    <span style={{ fontSize: 11, color: "#94a3b8" }}>
                      {formatRelativeTime(item.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Unread indicator dot */}
                {!item.isRead && (
                  <span
                    style={{
                      position: "absolute",
                      right: 12,
                      top: 14,
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      backgroundColor: "#2563eb",
                    }}
                  />
                )}

                {/* Delete button on hover */}
                <button
                  type="button"
                  title="Xóa thông báo"
                  onClick={(e) => handleDeleteItem(e, item.id, item.isRead)}
                  style={{
                    position: "absolute",
                    right: 8,
                    bottom: 8,
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#94a3b8",
                    padding: "2px 4px",
                    borderRadius: 4,
                    fontSize: 11,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#ef4444")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#94a3b8")}
                >
                  <DeleteOutlined />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div
        className="px-3 py-2 text-center"
        style={{
          borderTop: "1px solid #f1f5f9",
          backgroundColor: "#fafafa",
          borderBottomLeftRadius: 8,
          borderBottomRightRadius: 8,
        }}
      >
        <Button
          type="link"
          block
          size="small"
          onClick={() => {
            setOpen(false);
            navigate("/notifications");
          }}
          style={{ fontSize: 13, fontWeight: 600, color: "#2563eb" }}
        >
          Xem tất cả thông báo <ArrowRightOutlined style={{ fontSize: 11, marginLeft: 4 }} />
        </Button>
      </div>
    </div>
  );

  return (
    <Popover
      content={popoverContent}
      trigger="click"
      open={open}
      onOpenChange={setOpen}
      placement="bottomRight"
      overlayInnerStyle={{ padding: 0, borderRadius: 12 }}
    >
      <Tooltip title="Thông báo hệ thống">
        <Button
          type="text"
          shape="circle"
          icon={
            <Badge
              count={unreadCount}
              overflowCount={99}
              size="small"
              offset={[2, -2]}
              style={{
                backgroundColor: "#ef4444",
                boxShadow: "0 0 0 2px #fff",
                fontWeight: 600,
                fontSize: 10,
              }}
            >
              <Notification
                size={20}
                color={unreadCount > 0 ? "#1e293b" : "#64748b"}
                variant={unreadCount > 0 ? "Bold" : "Linear"}
              />
            </Badge>
          }
          style={{
            width: 38,
            height: 38,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: open ? "#f1f5f9" : "transparent",
            transition: "background-color 0.2s ease",
          }}
        />
      </Tooltip>
    </Popover>
  );
};

export default NotificationPopover;
