import { useDispatch, useSelector } from "react-redux";
import { localDataNames } from "../constants/appInfos";
import AuthRouter from "./AuthRouter";
import MainRouter from "./MainRouter";
import { Spin } from "antd";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { addAuth, authSeletor, AuthState } from "../redux/reducers/authReducer";
import handleAPI from "../apis/handleAPI";

const Router = () => {
  const [isLoading, setIsLoading] = useState(false);
  const auth: AuthState = useSelector(authSeletor);
  const dispatch = useDispatch();
  const location = useLocation();

  const urlParams = new URLSearchParams(location.search);
  const accessToken = urlParams.get("accessToken");

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);

      try {
        if (accessToken) {
          localStorage.setItem(
            localDataNames.authData,
            JSON.stringify({ token: accessToken })
          );
          dispatch(addAuth({ token: accessToken }));

          const userRes: any = await handleAPI("/users/me");
          dispatch(
            addAuth({
              token: accessToken,
              firstName: userRes.result.firstname,
              lastName: userRes.result.lastname,
              email: userRes.result.email,
              role: userRes.result.role,
              avatar: userRes.result.avatarUrl,
            })
          );
        } else {
          const res = localStorage.getItem(localDataNames.authData);
          res && dispatch(addAuth(JSON.parse(res)));
        }
      } catch (e) {
        console.error("Lỗi trong quá trình xác thực:", e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [accessToken]);

  return isLoading ? <Spin /> : !auth.token ? <AuthRouter /> : <MainRouter />;
};

export default Router;
