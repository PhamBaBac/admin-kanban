import AuthRouter from "./AuthRouter"
import MainRouter from "./MainRouter"

import { localDataNames } from '../constants/appInfos';
import { useEffect, useState } from "react";
const Router = () => {   
  const [token, setToken] = useState<string>("");
  useEffect(() => {
		getData();
	}, []);
  const getData = async () => {
    const res: string = localStorage.getItem(localDataNames.token) || '';
    res && setToken(res);
		
	};
                                       
  return token ? <MainRouter/> : <AuthRouter />
}

export default Router