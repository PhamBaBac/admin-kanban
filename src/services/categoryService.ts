import handleAPI from "../apis/handleAPI";

export interface Category {
  id: string;
  title: string; // Backend trả về 'title' thay vì 'name'
  name?: string; // Giữ lại để backward compatibility
  description?: string;
  parentId?: string;
  children?: Category[];
  createdAt?: string;
  updatedAt?: string;
  slug?: string;
}

export interface CategoryCreateRequest {
  name: string;
  description?: string;
  parentId?: string;
}

export interface CategoryUpdateRequest extends Partial<CategoryCreateRequest> {
  id: string;
}

export interface CategoryListResponse {
  data: Category[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
}

export const categoryService = {
  getCategories: async (params?: any): Promise<CategoryListResponse> => {
    console.log("CategoryService - getCategories params:", params);
    // Format params theo chuẩn backend
    const formattedParams = {
      page: params?.page || 1,
      pageSize: params?.pageSize || 10, // Backend expect 'pageSize'
    };
    console.log("CategoryService - formatted params:", formattedParams);
    const response = await handleAPI(
      "/public/categories/page",
      formattedParams
    );
    console.log("CategoryService - getCategories response:", response);
    return response.data;
  },

  getAllCategories: async (): Promise<Category[]> => {
    const response = await handleAPI("/public/categories/all");
    return response.data;
  },

  getCategoryById: async (id: string): Promise<Category> => {
    const response = await handleAPI(`/admin/categories/${id}`);
    return response.data;
  },

  createCategory: async (data: CategoryCreateRequest): Promise<Category> => {
    const response = await handleAPI("/admin/categories", data, "post");
    return response.data;
  },

  updateCategory: async (data: CategoryUpdateRequest): Promise<Category> => {
    const response = await handleAPI(
      `/admin/categories/${data.id}`,
      data,
      "put"
    );
    return response.data;
  },

  deleteCategory: async (id: string): Promise<void> => {
    await handleAPI(`/admin/categories/${id}`, undefined, "delete");
  },
};
