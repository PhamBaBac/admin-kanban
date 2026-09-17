import { useDispatch, useSelector } from "react-redux";
import { localDataNames } from "../constants/appInfos";
import AuthRouter from "./AuthRouter";
import MainRouter from "./MainRouter";
import { Spin } from "antd";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { addAuth, authSeletor, AuthState } from "../redux/reducers/authReducer";
import { useAuth } from "../hooks/useAuth";

const Router = () => {
  const auth: AuthState = useSelector(authSeletor);
  const dispatch = useDispatch();
  const location = useLocation();
  const { getUserInfo } = useAuth();

  const urlParams = new URLSearchParams(location.search);
  const accessToken = urlParams.get("accessToken");
  const [isLoading, setIsLoading] = useState(Boolean(accessToken));

  useEffect(() => {
    const fetchData = async () => {
      if (accessToken) {
        setIsLoading(true);
        try {
          localStorage.setItem(
            localDataNames.authData,
            JSON.stringify({ accessToken: accessToken })
          );
          dispatch(addAuth({ accessToken: accessToken }));

          const userRes = await getUserInfo();
          dispatch(
            addAuth({
              accessToken: accessToken,
              firstName: userRes.firstname,
              lastName: userRes.lastname,
              email: userRes.email,
              role: userRes.role,
              avatar: userRes.avatarUrl,
            })
          );
        } catch (e) {
          console.error("Lỗi trong quá trình xác thực:", e);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchData();
  }, [accessToken]);

  return isLoading ? (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
      }}
    >
      <Spin size="large" />
    </div>
  ) : !auth.accessToken ? (
    <AuthRouter />
  ) : (
    <MainRouter />
  );
};

export default Router;
