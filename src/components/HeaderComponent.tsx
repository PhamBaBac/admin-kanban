import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import Cookies from "js-cookie";
import {
  Avatar,
  Button,
  Dropdown,
  notification as antNotification,
  Typography,
} from "antd";
import { HambergerMenu } from "iconsax-react";
import { colors } from "../constants/colors";
import { authSeletor, removeAuth } from "../redux/reducers/authReducer";
import { initSocket } from "../connect/SocketIO";
import {
  notificationService,
  AdminNotification,
} from "../services/notificationService";
import NotificationPopover, { getNotificationIcon } from "./NotificationPopover";
import { playNotificationSound } from "../utils/notificationSound";

const { Text } = Typography;

interface Props {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  isMobile?: boolean;
}

const HeaderComponent = ({ collapsed, onToggleCollapse, isMobile }: Props) => {
  const auth = useSelector(authSeletor);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const socketRef = useRef<any>(null);
  const [notifyCount, setNotifyCount] = useState(0);
  const [latestNotification, setLatestNotification] =
    useState<AdminNotification | null>(null);

  const [notiApi, contextHolder] = antNotification.useNotification();

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === "/") return "Tổng quan hệ thống";
    if (path.startsWith("/inventory/add-product")) return "Sản phẩm / Thêm mới";
    if (path.startsWith("/inventory")) return "Quản lý sản phẩm";
    if (path.startsWith("/categories")) return "Quản lý danh mục";
    if (path.startsWith("/media")) return "Thư viện hình ảnh";
    if (path.startsWith("/suppliers")) return "Quản lý nhà cung cấp";
    if (path.startsWith("/orders")) return "Quản lý đơn hàng";
    if (path.startsWith("/shipments")) return "Vận đơn & Giao hàng";
    if (path.startsWith("/promotions")) return "Chương trình khuyến mãi";
    if (path.startsWith("/report")) return "Báo cáo thống kê";
    if (path.startsWith("/support")) return "Hỗ trợ khách hàng";
    if (path.startsWith("/accounts")) return "Quản lý tài khoản & Phân quyền";
    if (path.startsWith("/notifications")) return "Trung tâm thông báo";
    return "Hệ thống quản trị";
  };

  const initials =
    `${auth.firstName?.[0] ?? ""}${auth.lastName?.[0] ?? ""}`.toUpperCase() ||
    "A";

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const count = await notificationService.getUnreadCount();
        setNotifyCount(count);
      } catch (err) {
        console.error("Không thể lấy số lượng thông báo chưa đọc:", err);
      }
    };

    if (auth?.accessToken) {
      fetchUnreadCount();
    }
  }, [auth?.accessToken]);

  useEffect(() => {
    if (!auth?.accessToken) return;

    const socket = initSocket(auth.accessToken);
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("join_admin_channel", {
        userId: auth.id,
        username:
          `${auth.firstName || ""} ${auth.lastName || ""}`.trim() ||
          auth.email,
        role: auth.role || "ADMIN",
      });
    });

    socket.on("admin_notification", (data: AdminNotification) => {
      setNotifyCount((prev) => prev + 1);
      setLatestNotification(data);
      window.dispatchEvent(new CustomEvent("new_admin_notification", { detail: data }));

      if (location.pathname.startsWith("/support") && data.type === "SUPPORT_MESSAGE") {
        return;
      }

      playNotificationSound();

      const config = getNotificationIcon(data.type);
      const notiKey =
        data.type === "SUPPORT_MESSAGE" && data.referenceId
          ? `support_${data.referenceId}`
          : data.id || Date.now().toString();

      notiApi.open({
        message: (
          <span style={{ fontWeight: 600, color: "#0f172a", fontSize: 14 }}>
            {data.title}
          </span>
        ),
        description: (
          <span style={{ fontSize: 13, color: "#475569", lineHeight: 1.4 }}>
            {data.content}
          </span>
        ),
        icon: config.icon,
        placement: "topRight",
        duration: 6,
        btn: data.targetUrl ? (
          <Button
            type="primary"
            size="small"
            style={{ borderRadius: 6, backgroundColor: "#2563eb" }}
            onClick={() => {
              notiApi.destroy(notiKey);
              navigate(data.targetUrl!);
            }}
          >
            Xem ngay
          </Button>
        ) : undefined,
        key: notiKey,
      });
    });

    return () => {
      socket.off("admin_notification");
    };
  }, [auth?.accessToken]);

  const items = [
    {
      key: "info",
      label: (
        <div style={{ padding: "6px 4px" }}>
          <div style={{ fontWeight: 600, color: "#0f172a" }}>
            {auth.firstName} {auth.lastName}
          </div>
          <div style={{ color: "#64748b", fontSize: 12 }}>{auth.email}</div>
          <div
            style={{
              color: colors.primary500,
              fontSize: 11,
              fontWeight: 600,
              marginTop: 2,
            }}
          >
            {auth.role || "ADMIN"}
          </div>
        </div>
      ),
      disabled: true,
    },
    { type: "divider" as const },
    {
      key: "logout",
      label: "Đăng xuất",
      danger: true,
      onClick: async () => {
        try {
          await axios.post(`http://localhost:8080/api/v1/auth/logout`, null, {
            headers: { Authorization: `Bearer ${auth.accessToken}` },
            withCredentials: true,
          });
        } catch {}
        if (socketRef.current) {
          socketRef.current.disconnect();
          socketRef.current = null;
        }
        localStorage.clear();
        Cookies.remove("refreshTokenAdmin");
        dispatch(removeAuth());
        navigate("/login");
      },
    },
  ];

  return (
    <div
      className="d-flex align-items-center justify-content-between px-2 px-sm-3 px-md-4 bg-white"
      style={{
        height: 64,
        borderBottom: "1px solid #f1f5f9",
        position: "sticky",
        top: 0,
        zIndex: 9,
      }}
    >
      {/* Toast popup holder */}
      {contextHolder}

      {/* Left: Collapse toggle + Page Title */}
      <div
        className="d-flex align-items-center gap-2 gap-sm-3"
        style={{ minWidth: 0, flex: 1, marginRight: 8 }}
      >
        {onToggleCollapse && (
          <Button
            type="text"
            icon={<HambergerMenu size={20} color="#64748b" />}
            onClick={onToggleCollapse}
            style={{
              width: 36,
              height: 36,
              minWidth: 36,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          />
        )}
        <div style={{ minWidth: 0, overflow: "hidden" }}>
          <Text
            ellipsis
            style={{
              fontWeight: 600,
              fontSize: isMobile ? 14 : 16,
              color: "#0f172a",
              display: "block",
            }}
          >
            {getPageTitle()}
          </Text>
        </div>
      </div>

      {/* Right: Actions & Profile */}
      <div className="d-flex align-items-center gap-3">
        {/* Notification Popover Dropdown */}
        <NotificationPopover
          unreadCount={notifyCount}
          setUnreadCount={setNotifyCount}
          latestNotification={latestNotification}
        />

        {/* User Profile Dropdown */}
        <Dropdown menu={{ items }} placement="bottomRight" trigger={["click"]}>
          <div
            className="d-flex align-items-center gap-2"
            style={{
              cursor: "pointer",
              padding: "2px 6px",
              borderRadius: 8,
            }}
          >
            {auth.avatar ? (
              <Avatar src={auth.avatar} size={36} />
            ) : (
              <Avatar
                size={36}
                style={{
                  background: "linear-gradient(135deg, #1570EF, #6172F3)",
                  fontWeight: 600,
                  fontSize: 14,
                }}
              >
                {initials}
              </Avatar>
            )}
            <div className="d-none d-md-block text-start">
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#1e293b",
                  lineHeight: 1.2,
                }}
              >
                {auth.firstName
                  ? `${auth.firstName} ${auth.lastName || ""}`
                  : "Administrator"}
              </div>
              <div style={{ fontSize: 11, color: "#94a3b8" }}>
                {auth.role || "Super Admin"}
              </div>
            </div>
          </div>
        </Dropdown>
      </div>
    </div>
  );
};

export default HeaderComponent;
