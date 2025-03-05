/** @format */

import axios from "axios";
import queryString from "query-string";
import { localDataNames } from "../constants/appInfos";
import { addAuth } from "../redux/reducers/authReducer";
import store from "../redux/store"; // Import the store

const baseURL = `http://localhost:8080/api/v1/identity-service`;

const getAuthData = () => {
  const res = localStorage.getItem(localDataNames.authData);
  if (res) {
    return JSON.parse(res);
  }
  return null;
};

const getAssetToken = () => {
  const authData = getAuthData();
  return authData?.token || "";
};


const refreshToken = async () => {
  const currentToken = getAssetToken();
  try {
    const response = await axios.post(`${baseURL}/auth/refresh`, {
      token: currentToken, 
    });

    const newToken = response.data.result.token;
    const authData = getAuthData();
    authData.token = newToken;
	
    store.dispatch(addAuth(authData));

    return newToken;
  } catch (error: any) {
    console.error(
      "Failed to refresh token",
      error.response?.data || error.message
    );
    throw error;
  }
};
const axiosClient = axios.create({
  baseURL: baseURL,
  paramsSerializer: (params) => queryString.stringify(params),
});

axiosClient.interceptors.request.use(async (config: any) => {
  const accesstoken = getAssetToken();

  config.headers = {
    Authorization: accesstoken ? `Bearer ${accesstoken}` : "",
    Accept: "application/json",
    ...config.headers,
  };

  return { ...config, data: config.data ?? null };
});

axiosClient.interceptors.response.use(
  (res) => {
    if (res.data && res.status >= 200 && res.status < 300) {
      return res.data;
    } else {
      return Promise.reject(res.data);
    }
  },
  async (error) => {
    const originalRequest = error.config;

	if (error.response.status === 401 && !originalRequest._retry) {
	  originalRequest._retry = true;
	  try {
		const newToken = await refreshToken();
		originalRequest.headers["Authorization"] = `Bearer ${newToken}`;
		return axiosClient(originalRequest);
	  } catch (refreshError) {
		localStorage.removeItem(localDataNames.authData);
		window.location.href = "/";
		return Promise.reject(refreshError);
	  }
	}

    return Promise.reject(error.response.data); 
  }
);

export default axiosClient;
