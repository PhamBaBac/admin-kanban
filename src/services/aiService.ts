import handleAPI from "../apis/handleAPI";

export interface AiGeneratePayload {
  type:
    | "product_description"
    | "product_content"
    | "category_description"
    | "promotion_description"
    | string;
  title: string;
  context?: string;
}

export const aiService = {
  generateContent: async (data: AiGeneratePayload): Promise<string> => {
    const response = await handleAPI("/ai/generate", data, "post");
    return response.data;
  },
};
