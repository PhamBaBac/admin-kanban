import handleAPI from "../apis/handleAPI";

export interface Supplier {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  categoryId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierCreateRequest {
  name: string;
  email: string;
  phone: string;
  address: string;
  categoryId: string;
}

export interface SupplierUpdateRequest extends Partial<SupplierCreateRequest> {
  id: string;
}

export interface SupplierListResponse {
  data: Supplier[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
}

export const supplierService = {
  getSuppliers: async (params?: any): Promise<SupplierListResponse> => {
    const response = await handleAPI("/suppliers/page", params);
    return response.data;
  },

  getSupplierById: async (id: string): Promise<Supplier> => {
    const response = await handleAPI(`/suppliers/${id}`);
    return response.data;
  },

  createSupplier: async (data: SupplierCreateRequest): Promise<Supplier> => {
    const response = await handleAPI("/suppliers/add-new", data, "post");
    return response.data;
  },

  updateSupplier: async (data: SupplierUpdateRequest): Promise<Supplier> => {
    const response = await handleAPI(`/suppliers/update/${data.id}`, data, "put");
    return response.data;
  },

  deleteSupplier: async (id: string): Promise<void> => {
    await handleAPI(`/suppliers/remove?id=${id}`, undefined, "delete");
  },

  toggleSupplierStatus: async (
    id: string,
    isActive: boolean
  ): Promise<Supplier> => {
    const response = await handleAPI(`/suppliers/${id}/toggle`, {
      isActive,
    }, "patch");
    return response.data;
  },
};
