import handleAPI from "./handleAPI";
import { MediaModel, MediaRequest, PageResponse } from "../models/MediaModel";

const MEDIA_URL = "/medias";

export const mediaAPI = {
  // Lấy danh sách media có phân trang và tìm kiếm
  getAllMedias: async (params?: { search?: string; page?: number; size?: number }) => {
    const res: any = await handleAPI(MEDIA_URL, params, "get");
    // axiosClient interceptor trả về res.data (ApiResponse), nên dữ liệu nằm ở res.data
    const responseData = res?.data ?? res;
    return responseData as PageResponse<MediaModel>;
  },

  // Lưu thông tin 1 media vào DB
  saveMedia: async (data: MediaRequest) => {
    const res: any = await handleAPI(MEDIA_URL, data, "post");
    const responseData = res?.data ?? res;
    return responseData as MediaModel;
  },

  // Lưu thông tin nhiều media theo mảng
  saveBatchMedias: async (data: MediaRequest[]) => {
    const res: any = await handleAPI(`${MEDIA_URL}/batch`, data, "post");
    const responseData = res?.data ?? res;
    return responseData as MediaModel[];
  },

  // Xóa mềm media
  deleteMedia: async (id: string) => {
    const res: any = await handleAPI(`${MEDIA_URL}/${id}`, undefined, "delete");
    return res?.data ?? res;
  },
};

export default mediaAPI;
