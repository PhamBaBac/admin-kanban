import handleAPI from "../apis/handleAPI";
import { ProductModel, SubProductModel } from "../models/Products";

export interface ProductCreateRequest {
  title: string;
  description: string;
  content?: string;
  categories: string[];
  supplierId: string | null;
  images?: string[];
  slug?: string;
  price?: number[];
}

export interface ProductUpdateRequest extends Partial<ProductCreateRequest> {
  id: string;
}

export interface ProductListResponse {
  data: ProductModel[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
}

export interface ProductDetailResponse {
  product: ProductModel;
  subProducts: SubProductModel[];
}

export const productService = {
  getProducts: async (params?: any): Promise<ProductListResponse> => {
    const response = await handleAPI("/public/products/page", params);
    return response.data;
  },

  getProductById: async (
    slug: string,
    id: string
  ): Promise<ProductDetailResponse> => {
    const response = await handleAPI(`/public/products/${slug}/${id}`);
    return response.data;
  },

  createProduct: async (data: ProductCreateRequest): Promise<ProductModel> => {
    console.log("Data being sent:", JSON.stringify(data, null, 2));
    const response = await handleAPI("/admin/products", data, "post");
    return response.data;
  },

  updateProduct: async (
    data: ProductUpdateRequest,
    slug?: string
  ): Promise<ProductModel> => {
    const url = `/admin/products/${slug}/${data.id}`;
    console.log("URL:", url);
    const response = await handleAPI(url, data, "put");
    console.log("Update response:", response);
    return response.data;
  },

  deleteProduct: async (id: string): Promise<void> => {
    await handleAPI(`/admin/products/${id}`, undefined, "delete");
  },

  getSubProducts: async (productId: string): Promise<any> => {
    const response = await handleAPI(
      `/subProducts/get-all-sub-product/${productId}`
    );
    return response.data;
  },

  createSubProduct: async (data: any): Promise<any> => {
    const response = await handleAPI(`/subProducts/create`, data, "post");
    return response.data;
  },

  updateSubProduct: async (data: any): Promise<any> => {
    const response = await handleAPI(`/subProducts/update`, data, "put");
    return response.data;
  },

  deleteSubProduct: async (subProductId: string): Promise<void> => {
    await handleAPI(
      `/subProducts/remove-sub-product/${subProductId}`,
      undefined,
      "delete"
    );
  },

  getFilterValues: async (): Promise<any> => {
    const response = await handleAPI("/subProducts/get-filter-values");
    return response.data;
  },

  filterProducts: async (filters: any): Promise<ProductListResponse> => {
    const params = new URLSearchParams();

    if (filters.search && filters.search.trim()) {
      params.append("search", filters.search.trim());
    }

    if (filters.catIds && filters.catIds.length > 0) {
      filters.catIds.forEach((id: string) => params.append("catIds", id));
    }

    if (filters.sizes && filters.sizes.length > 0) {
      filters.sizes.forEach((size: string) => params.append("sizes", size));
    } else if (filters.size) {
      params.append("sizes", filters.size);
    }

    if (filters.colors && filters.colors.length > 0) {
      filters.colors.forEach((color: string) => params.append("colors", color));
    }

    if (filters.price && filters.price.length === 2) {
      params.append("price", filters.price[0].toString());
      params.append("price", filters.price[1].toString());
    }

    if (filters.page) {
      params.append("page", filters.page.toString());
    }

    if (filters.pageSize) {
      params.append("pageSize", filters.pageSize.toString());
    }

    const queryString = params.toString();
    const url = `/public/products/filter${queryString ? `?${queryString}` : ""}`;
    const response = await handleAPI(url, undefined, "post");
    return response.data;
  },
};
