import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Cookies from "js-cookie";
import { Avatar, Badge, Button, Dropdown, message, Space } from "antd";
import { Notification } from "iconsax-react";
import { colors } from "../constants/colors";
import { authSeletor, removeAuth } from "../redux/reducers/authReducer";

const HeaderComponent = () => {
  const auth = useSelector(authSeletor);
  console.log("HeaderComponent - auth from Redux:", auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const socketRef = useRef<any>(null);
  const [notifyCount, setNotifyCount] = useState(0);


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
