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
const dispatch = useDispatch();

useEffect(() => {
  getData();
  
}, []);


const getData = async () => {
  const res = localStorage.getItem(localDataNames.authData);
  res && dispatch(addAuth(JSON.parse(res)));
};

                              
  return isLoading ? <Spin /> : !auth.token ? <AuthRouter /> : <MainRouter />;
}

export default Router