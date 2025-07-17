import { useState, useCallback } from "react";
import {
  productService,
  ProductCreateRequest,
  ProductUpdateRequest,
  ProductListResponse,
} from "../services/productService";
import { ProductModel } from "../models/Products";

export const useProducts = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getProducts = useCallback(
    async (params?: any): Promise<ProductListResponse> => {
      setLoading(true);
      setError(null);
      try {
        const response = await productService.getProducts(params);
        return response;
      } catch (err: any) {
        setError(err.message || "Failed to fetch products");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const getProductById = useCallback(async (slug: string, id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await productService.getProductById(slug, id);
      return response;
    } catch (err: any) {
      setError(err.message || "Failed to fetch product");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createProduct = useCallback(
    async (data: ProductCreateRequest): Promise<ProductModel> => {
      setLoading(true);
      setError(null);
      try {
        const response = await productService.createProduct(data);
        return response;
      } catch (err: any) {
        setError(err.message || "Failed to create product");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const updateProduct = useCallback(
    async (
      data: ProductUpdateRequest,
      slug?: string
    ): Promise<ProductModel> => {
      setLoading(true);
      setError(null);
      try {
        const response = await productService.updateProduct(data, slug);
        return response;
      } catch (err: any) {
        setError(err.message || "Failed to update product");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const deleteProduct = useCallback(async (id: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await productService.deleteProduct(id);
    } catch (err: any) {
      setError(err.message || "Failed to delete product");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getFilterValues = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await productService.getFilterValues();
      return response;
    } catch (err: any) {
      setError(err.message || "Failed to fetch filter values");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getSubProducts = useCallback(
    async (productId: string): Promise<any> => {
      setLoading(true);
      setError(null);
      try {
        const response = await productService.getSubProducts(productId);
        return response;
      } catch (err: any) {
        setError(err.message || "Failed to fetch sub products");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const createSubProduct = useCallback(async (data: any) => {
    setLoading(true);
    setError(null);
    try {
      const response = await productService.createSubProduct(data);
      return response;
    } catch (err: any) {
      setError(err.message || "Failed to create sub product");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSubProduct = useCallback(async (data: any) => {
    setLoading(true);
    setError(null);
    try {
      const response = await productService.updateSubProduct(data);
      return response;
    } catch (err: any) {
      setError(err.message || "Failed to update sub product");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteSubProduct = useCallback(
    async (subProductId: string): Promise<void> => {
      setLoading(true);
      setError(null);
      try {
        await productService.deleteSubProduct(subProductId);
      } catch (err: any) {
        setError(err.message || "Failed to delete sub product");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    getFilterValues,
    getSubProducts,
    createSubProduct,
    updateSubProduct,
    deleteSubProduct,
    loading,
    error,
  };
};
