/** @format */

import axios from "axios";
import queryString from "query-string";
import { localDataNames } from "../constants/appInfos";

const baseURL = `http://localhost:8080/api/v1/identity-service`;

// Helper function to get the auth data from local storage
const getAuthData = () => {
  const res = localStorage.getItem(localDataNames.authData);
  if (res) {
    return JSON.parse(res);
  }
  return null;
};

// Helper function to get the access token from the auth data
const getAssetToken = () => {
  const authData = getAuthData();
  return authData?.token || "";
};

// Helper function to update the auth data in local storage
const setAuthData = (authData: any) => {
  localStorage.setItem(localDataNames.authData, JSON.stringify(authData));
};

// Function to refresh the access token
const refreshToken = async () => {
  const currentToken = getAssetToken(); // Get the current token from local storage
  try {
    // Call the refresh endpoint with the current token
    const response = await axios.post(`${baseURL}/auth/refresh`, {
      token: currentToken, // Send the current token in the request body
    });

    // Extract the new token from the response
    const newToken = response.data.result.token;
	console.log("newToken", newToken);

    // Update the auth data in local storage with the new token
    const authData = getAuthData();
	console.log("authData", authData);
    authData.token = newToken;
	
    setAuthData(authData);

    return newToken; // Return the new token
  } catch (error: any) {
    console.error(
      "Failed to refresh token",
      error.response?.data || error.message
    );
    throw error;
  }
};
// Create Axios instance
const axiosClient = axios.create({
  baseURL: baseURL,
  paramsSerializer: (params) => queryString.stringify(params),
});

// Request interceptor to attach the access token to requests
axiosClient.interceptors.request.use(async (config: any) => {
  const accesstoken = getAssetToken();

  config.headers = {
    Authorization: accesstoken ? `Bearer ${accesstoken}` : "",
    Accept: "application/json",
    ...config.headers,
  };

  return { ...config, data: config.data ?? null };
});

// Response interceptor to handle token expiration
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

    // Check if the error is due to an expired token (401 status) and the request hasn't been retried yet
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // Mark the request as retried

      const newToken = await refreshToken(); // Refresh the token
      originalRequest.headers["Authorization"] = `Bearer ${newToken}`; // Update the request headers with the new token
      return axiosClient(originalRequest);
    }

    return Promise.reject(error.response.data); // Reject the error for other cases
  }
);

export default axiosClient;
