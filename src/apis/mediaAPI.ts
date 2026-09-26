import handleAPI from "./handleAPI";
import { MediaModel, MediaRequest, PageResponse } from "../models/MediaModel";

const MEDIA_URL = "/medias";

export const mediaAPI = {
  getAllMedias: async (params?: { search?: string; page?: number; size?: number }) => {
    const res: any = await handleAPI(MEDIA_URL, params, "get");
    const responseData = res?.data ?? res;
    return responseData as PageResponse<MediaModel>;
  },

  saveMedia: async (data: MediaRequest) => {
    const res: any = await handleAPI(MEDIA_URL, data, "post");
    const responseData = res?.data ?? res;
    return responseData as MediaModel;
  },

  saveBatchMedias: async (data: MediaRequest[]) => {
    const res: any = await handleAPI(`${MEDIA_URL}/batch`, data, "post");
    const responseData = res?.data ?? res;
    return responseData as MediaModel[];
  },

  deleteMedia: async (id: string) => {
    const res: any = await handleAPI(`${MEDIA_URL}/${id}`, undefined, "delete");
    return res?.data ?? res;
  },
};

export default mediaAPI;
