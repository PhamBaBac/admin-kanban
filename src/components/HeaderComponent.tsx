import { useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Cookies from "js-cookie";
import { Avatar, Badge, Button, Dropdown, message, Space, Typography } from "antd";
import { Notification } from "iconsax-react";
import { colors } from "../constants/colors";
import { authSeletor, removeAuth } from "../redux/reducers/authReducer";

const { Text } = Typography;

const HeaderComponent = () => {
  const auth = useSelector(authSeletor);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const socketRef = useRef<any>(null);
  const [notifyCount, setNotifyCount] = useState(0);

  // Tạo initials từ tên nếu không có avatar
  const initials = `${auth.firstName?.[0] ?? ""}${auth.lastName?.[0] ?? ""}`.toUpperCase() || "A";

  const items = [
    {
      key: "info",
      label: (
        <div style={{ padding: "4px 0" }}>
          <div style={{ fontWeight: 600 }}>{auth.firstName} {auth.lastName}</div>
          <div style={{ color: colors.gray600, fontSize: 12 }}>{auth.email}</div>
          <div style={{ color: colors.gray600, fontSize: 11 }}>{auth.role}</div>
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
    <div className="p-2 row bg-white m-0" style={{ borderBottom: "1px solid #f0f0f0" }}>
      <div className="col text-end">
        <Space>
          <Button
            type="text"
            icon={
              <Badge count={notifyCount}>
                <Notification size={22} color={colors.gray600} />
              </Badge>
            }
          />
          <Dropdown menu={{ items }} placement="bottomRight">
            {auth.avatar ? (
              <Avatar src={auth.avatar} size={40} style={{ cursor: "pointer" }} />
            ) : (
              <Avatar
                size={40}
                style={{
                  cursor: "pointer",
                  background: "linear-gradient(135deg, #7c3aed, #db2777)",
                  fontWeight: 700,
                  fontSize: 16,
                }}
              >
                {initials}
              </Avatar>
            )}
          </Dropdown>
        </Space>
      </div>
    </div>
  );
};

export default HeaderComponent;
