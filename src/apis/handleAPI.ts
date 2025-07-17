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
      // Với GET: truyền data dưới dạng params
      config.params = data;
    } else {
      // Với các method khác: truyền data dưới dạng body
      config.data = data;
      console.log(`=== ${method.toUpperCase()} REQUEST ===`);
      console.log("URL:", url);
      console.log("Request data:", JSON.stringify(data, null, 2));
    }

    const response = await axiosClient(url, config);
    return response;
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
};

export default handleAPI;
