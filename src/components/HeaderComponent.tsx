/** @format */

import { Avatar, Badge, Button, Dropdown, Input, MenuProps, Space } from "antd";
import { Notification, SearchNormal1 } from "iconsax-react";
import { colors } from "../constants/colors";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import handleAPI from "../apis/handleAPI";
import {
  addAuth,
  authSeletor,
  removeAuth,
} from "../redux/reducers/authReducer";
import axios from "axios";
import Cookies from "js-cookie";

const HeaderComponent = () => {
  const auth = useSelector(authSeletor);
  useEffect(() => {
    getMyInfo();
  }, []);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const getMyInfo = async () => {
    // const res: any = await handleAPI("/users/my-info");
    // dispatch(addAuth(res.result));
  };
  const items: MenuProps["items"] = [
    {
      key: "logout",
      label: "Đăng xuất",

      onClick: async () => {
        await axios.post(`http://localhost:8080/api/v1/auth/logout`, null, {
          headers: {
            Authorization: `Bearer ${auth.token}`,
          },
          withCredentials: true,
        });

        localStorage.clear();
        Cookies.remove("refreshToken");
        navigate("/login");
        dispatch(removeAuth());
      },
    },
  ];

  return (
    <div className="p-2 row bg-white m-0">
      <div className="col">
        <Input
          placeholder="Search product, supplier, order"
          style={{
            borderRadius: 100,
            width: "100%",
          }}
          size="large"
          prefix={<SearchNormal1 className="text-muted" size={20} />}
        />
      </div>
      <div className="col text-end">
        <Space>
          <Button
            onClick={() => {}}
            type="text"
            icon={
              <Badge count={5}>
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
