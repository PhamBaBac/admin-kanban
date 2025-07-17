import handleAPI from "../apis/handleAPI";
import { PromotionModel } from "../models/PromotionModel";

export interface PromotionCreateRequest {
  title: string;
  description: string;
  code: string;
  value: number;
  numOfAvailable: number;
  type: string;
  startAt: string;
  endAt: string;
  imageURL: string;
}

export interface PromotionUpdateRequest
  extends Partial<PromotionCreateRequest> {
  id: string;
}

export const promotionService = {
  getPromotions: async (): Promise<PromotionModel[]> => {
    const response = await handleAPI("/promotions");
    return response.data;
  },

  getPromotionById: async (id: string): Promise<PromotionModel> => {
    const response = await handleAPI(`/promotions/${id}`);
    return response.data;
  },

  createPromotion: async (
    data: PromotionCreateRequest
  ): Promise<PromotionModel> => {
    const response = await handleAPI("/promotions", data, "post");
    return response.data;
  },

  updatePromotion: async (
    data: PromotionUpdateRequest
  ): Promise<PromotionModel> => {
    const response = await handleAPI(`/promotions/${data.id}`, data, "put");
    return response.data;
  },

  deletePromotion: async (id: string): Promise<void> => {
    await handleAPI(`/promotions/${id}`, undefined, "delete");
  },
};
