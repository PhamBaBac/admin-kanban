import { useDispatch, useSelector } from "react-redux";
import { localDataNames } from "../constants/appInfos";
import AuthRouter from "./AuthRouter";
import MainRouter from "./MainRouter";

import { Spin } from "antd";
import { useEffect, useState } from "react";
import { addAuth, authSeletor, AuthState } from "../redux/reducers/authReducer";
import handleAPI from "../apis/handleAPI";
const Router = () => {   
  const [isLoading, setIsLoading] = useState(false);

const auth: AuthState = useSelector(authSeletor);
console.log("auth", auth);
const dispatch = useDispatch();

useEffect(() => {
  getData();
  
}, []);

// useEffect(() => {
//   auth.token && handleCheckToken();
// }, [auth.token]);

const getData = async () => {
  const res = localStorage.getItem(localDataNames.authData);
  res && dispatch(addAuth(JSON.parse(res)));
};

// const handleCheckToken = async () => {
//   setIsLoading(true);
//   try {
//     // Gọi API kiểm tra token
//     const res: any = await handleAPI("/auth/introspect", auth.token, "post");
//     if (res.result.valid === false) {
//       const tokenNew: any = await handleAPI("/auth/refresh", auth.token, "post");

//       dispatch(addAuth({ ...auth, token: tokenNew.result }));

//     }
//     setIsLoading(false);
//   } catch (error: any) {
//     console.log("error", error);
//     setIsLoading(false);
//   }
// }

                              
  return isLoading ? <Spin /> : !auth.token ? <AuthRouter /> : <MainRouter />;
}

export default Router