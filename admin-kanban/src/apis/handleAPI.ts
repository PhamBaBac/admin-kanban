/** @format */

import axiosClient from './axiosClient';

const handleAPI = async (
  url: string,
  data?: any,
  method?: "post" | "put" | "get" | "delete"
) => {
  try {
    const response = await axiosClient(url, {
      method: method ?? "get",
      data,
      headers: {
        "Content-Type": "application/json", // Đặt Content-Type là application/json
      },
    });
    return response;
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
};
export default handleAPI;