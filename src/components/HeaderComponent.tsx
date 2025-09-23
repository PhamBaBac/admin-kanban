import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Cookies from "js-cookie";
import { Avatar, Badge, Button, Dropdown, message, Space } from "antd";
import { Notification } from "iconsax-react";
import { colors } from "../constants/colors";
import { authSeletor, removeAuth } from "../redux/reducers/authReducer";
import { initSocket } from "../connect/SocketIO";

const HeaderComponent = () => {
  const auth = useSelector(authSeletor);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const socketRef = useRef<any>(null);
  const [notifyCount, setNotifyCount] = useState(0);

  useEffect(() => {
    if (!auth?.userId || !auth?.role) return;

    socketRef.current = initSocket(auth.accessToken, auth.userId, auth.role);

    socketRef.current.on("connect", () => {
      console.log(socketRef.current.id, auth.role);
    });

    socketRef.current.on("disconnect", () => {
      console.log("Disconnected from Socket.IO server");
    });

    socketRef.current.on("orderCancelled", (data: any) => {
      // Mỗi lần nhận thông báo, tăng số lượng lên 1
      setNotifyCount((prev) => prev + 1);
      console.log("Order Cancelled:", data);
      // Hiển thị thông báoử dụng thư viện như antd message
      message.info(`Order Cancelled: ${data.orderId}`);
    });

    return () => {
      if (socketRef.current) {
        console.log("Disconnecting old socket:", socketRef.current.id);
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [auth?.userId, auth?.role]);

  const items = [
    {
      key: "logout",
      label: "Đăng xuất",
      onClick: async () => {
        await axios.post(`http://localhost:8080/api/v1/auth/logout`, null, {
          headers: { Authorization: `Bearer ${auth.accessToken}` },
          withCredentials: true,
        });
        if (socketRef.current) {
          socketRef.current.disconnect();
          socketRef.current = null;
        }
        localStorage.clear();
        Cookies.remove("refreshTokenAdmin");
        navigate("/login");
        dispatch(removeAuth());
      },
    },
  ];

  return (
    <div className="p-2 row bg-white m-0">
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
          <Dropdown menu={{ items }}>
            <Avatar src={auth.avatar} size={40} />
          </Dropdown>
        </Space>
      </div>
    </div>
  );
};

export default HeaderComponent;
