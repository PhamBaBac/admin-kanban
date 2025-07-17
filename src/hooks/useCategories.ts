import { useState, useCallback } from "react";
import {
  categoryService,
  Category,
  CategoryCreateRequest,
  CategoryUpdateRequest,
  CategoryListResponse,
} from "../services/categoryService";

export const useCategories = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getCategories = useCallback(
    async (params?: any): Promise<CategoryListResponse> => {
      setLoading(true);
      setError(null);
      try {
        const response = await categoryService.getCategories(params);
        return response;
      } catch (err: any) {
        setError(err.message || "Failed to fetch categories");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const getAllCategories = useCallback(async (): Promise<Category[]> => {
    setLoading(true);
    setError(null);
    try {
      const response = await categoryService.getAllCategories();
      return response;
    } catch (err: any) {
      setError(err.message || "Failed to fetch all categories");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createCategory = useCallback(
    async (data: CategoryCreateRequest): Promise<Category> => {
      setLoading(true);
      setError(null);
      try {
        const response = await categoryService.createCategory(data);
        return response;
      } catch (err: any) {
        setError(err.message || "Failed to create category");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const updateCategory = useCallback(
    async (data: CategoryUpdateRequest): Promise<Category> => {
      setLoading(true);
      setError(null);
      try {
        const response = await categoryService.updateCategory(data);
        return response;
      } catch (err: any) {
        setError(err.message || "Failed to update category");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const deleteCategory = useCallback(async (id: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await categoryService.deleteCategory(id);
    } catch (err: any) {
      setError(err.message || "Failed to delete category");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    getCategories,
    getAllCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    loading,
    error,
  };
};
