import { useDispatch, useSelector } from "react-redux";
import { localDataNames } from "../constants/appInfos";
import AuthRouter from "./AuthRouter";
import MainRouter from "./MainRouter";
import { Spin } from "antd";
import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { addAuth, authSeletor, AuthState } from "../redux/reducers/authReducer";
import handleAPI from "../apis/handleAPI";
import { useAuth } from "../hooks/useAuth";

const Router = () => {
  const [isLoading, setIsLoading] = useState(false);
  const auth: AuthState = useSelector(authSeletor);
  const dispatch = useDispatch();
  const location = useLocation();
  const { getUserInfo } = useAuth();

  const urlParams = new URLSearchParams(location.search);
  const accessToken = urlParams.get("accessToken");
  console.log("accessToken", accessToken)

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);

      try {
        if (accessToken) {
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

  return isLoading ? <Spin /> : !auth.accessToken ? <AuthRouter /> : <MainRouter />;
};

export default Router;
