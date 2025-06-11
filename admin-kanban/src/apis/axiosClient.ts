/** @format */

import axios from "axios";
import queryString from "query-string";
import { localDataNames } from "../constants/appInfos";
import { addAuth, removeAuth } from "../redux/reducers/authReducer";
import store from "../redux/store";

const baseURL = `http://localhost:8080/api/v1`;

const getAuthData = () => {
  const res = localStorage.getItem(localDataNames.authData);
  if (res) return JSON.parse(res);
  return null;
};

const getAccessToken = () => {
  const authData = getAuthData();
  return authData?.token || "";
};

let isRefreshing = false;
let failedQueue: {
  resolve: (token: string) => void;
  reject: (error: any) => void;
}[] = [];

const processQueue = (error: any = null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token!);
  });
  failedQueue = [];
};

const refreshToken = async (): Promise<string | null> => {
  if (isRefreshing) {
    return new Promise((resolve, reject) => {
      failedQueue.push({ resolve, reject });
    });
  }

  isRefreshing = true;

  try {
    const response: any = await axios.post(
      `${baseURL}/auth/refresh-token`,
      {},
      { withCredentials: true }
    );

    const newToken = response.data.accessToken;
    const currentAuthData = getAuthData();

    if (currentAuthData) {
      const updatedAuthData = {
        ...currentAuthData,
        token: newToken,
      };
      localStorage.setItem(
        localDataNames.authData,
        JSON.stringify(updatedAuthData)
      );
      store.dispatch(addAuth(updatedAuthData));
    }

    processQueue(null, newToken);
    return newToken;
  } catch (error) {
     alert("Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.");
    localStorage.removeItem(localDataNames.authData);
    store.dispatch(removeAuth());
    window.location.href = "/login";
    return null;
  } finally {
    isRefreshing = false;
  }
};

const axiosClient = axios.create({
  baseURL,
  paramsSerializer: (params) => queryString.stringify(params),
});

axiosClient.interceptors.request.use((config: any) => {
  const token = getAccessToken();

  if (token) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    };
  }

  return { ...config, data: config.data ?? null };
});

axiosClient.interceptors.response.use(
  (res) => {
    if (res.data && res.status >= 200 && res.status < 300) {
      return res.data;
    }
    throw new Error("Request failed");
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const newToken = await refreshToken();
        if (!newToken) return Promise.reject("Unable to refresh token");

        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return axiosClient(originalRequest); 
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error.response?.data || error.message);
  }
);

export default axiosClient;
