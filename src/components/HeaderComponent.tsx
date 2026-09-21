import { useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import Cookies from "js-cookie";
import { Avatar, Badge, Button, Dropdown, Space, Typography, Tooltip } from "antd";
import { Notification, SearchNormal1, HambergerMenu } from "iconsax-react";
import { colors } from "../constants/colors";
import { authSeletor, removeAuth } from "../redux/reducers/authReducer";

const { Text } = Typography;

interface Props {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

const HeaderComponent = ({ collapsed, onToggleCollapse }: Props) => {
  const auth = useSelector(authSeletor);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const socketRef = useRef<any>(null);
  const [notifyCount, setNotifyCount] = useState(0);

  // Tạo Breadcrumb text tiếng Việt từ path
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
    return "Hệ thống quản trị";
  };

  const initials = `${auth.firstName?.[0] ?? ""}${auth.lastName?.[0] ?? ""}`.toUpperCase() || "A";

  const items = [
    {
      key: "info",
      label: (
        <div style={{ padding: "6px 4px" }}>
          <div style={{ fontWeight: 600, color: "#0f172a" }}>{auth.firstName} {auth.lastName}</div>
          <div style={{ color: "#64748b", fontSize: 12 }}>{auth.email}</div>
          <div style={{ color: colors.primary500, fontSize: 11, fontWeight: 600, marginTop: 2 }}>{auth.role || "ADMIN"}</div>
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
      className="d-flex align-items-center justify-content-between px-4 bg-white"
      style={{
        height: 64,
        borderBottom: "1px solid #f1f5f9",
        position: "sticky",
        top: 0,
        zIndex: 9,
      }}
    >
      {/* Left: Collapse toggle + Page Title */}
      <div className="d-flex align-items-center gap-3">
        {onToggleCollapse && (
          <Button
            type="text"
            icon={<HambergerMenu size={20} color="#64748b" />}
            onClick={onToggleCollapse}
            style={{ width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center" }}
          />
        )}
        <div>
          <Text style={{ fontWeight: 600, fontSize: 16, color: "#0f172a" }}>
            {getPageTitle()}
          </Text>
        </div>
      </div>

      {/* Right: Actions & Profile */}
      <div className="d-flex align-items-center gap-3">
        <Tooltip title="Thông báo">
          <Button
            type="text"
            shape="circle"
            icon={
              <Badge count={notifyCount} size="small" offset={[2, -2]}>
                <Notification size={20} color="#64748b" />
              </Badge>
            }
            style={{ width: 38, height: 38 }}
          />
        </Tooltip>

        <Dropdown menu={{ items }} placement="bottomRight" trigger={["click"]}>
          <div className="d-flex align-items-center gap-2" style={{ cursor: "pointer", padding: "2px 6px", borderRadius: 8 }}>
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
              <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b", lineHeight: 1.2 }}>
                {auth.firstName ? `${auth.firstName} ${auth.lastName || ""}` : "Administrator"}
              </div>
              <div style={{ fontSize: 11, color: "#94a3b8" }}>{auth.role || "Super Admin"}</div>
            </div>
          </div>
        </Dropdown>
      </div>
    </div>
  );
};

export default HeaderComponent;
