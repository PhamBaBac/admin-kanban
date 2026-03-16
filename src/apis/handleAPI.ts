import axiosClient from "./axiosClient";

const handleAPI = async (
  url: string,
  data?: any,
  method: "post" | "put" | "get" | "delete" | "patch" = "get"
) => {
  try {
    let config: any = {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      withCredentials: true,
      credentials: "include",
    };

    if (method === "get") {
      config.params = data;
    } else {
      config.data = data;
    }

    const response = await axiosClient(url, config);
    return response;
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
};

export default handleAPI;
