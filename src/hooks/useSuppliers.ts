import { useState, useCallback } from "react";
import {
  supplierService,
  Supplier,
  SupplierCreateRequest,
  SupplierUpdateRequest,
  SupplierListResponse,
} from "../services/supplierService";
import handleAPI from "../apis/handleAPI";

export const useSuppliers = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getSuppliers = useCallback(
    async (params?: any): Promise<SupplierListResponse> => {
      setLoading(true);
      setError(null);
      try {
        const response = await supplierService.getSuppliers(params);
        return response;
      } catch (err: any) {
        setError(err.message || "Failed to fetch suppliers");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const createSupplier = useCallback(
    async (data: SupplierCreateRequest): Promise<Supplier> => {
      setLoading(true);
      setError(null);
      try {
        const response = await supplierService.createSupplier(data);
        return response;
      } catch (err: any) {
        setError(err.message || "Failed to create supplier");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const updateSupplier = useCallback(
    async (data: SupplierUpdateRequest): Promise<Supplier> => {
      setLoading(true);
      setError(null);
      try {
        const response = await supplierService.updateSupplier(data);
        return response;
      } catch (err: any) {
        setError(err.message || "Failed to update supplier");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const deleteSupplier = useCallback(async (id: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await supplierService.deleteSupplier(id);
    } catch (err: any) {
      setError(err.message || "Failed to delete supplier");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleSupplierStatus = useCallback(
    async (id: string, isActive: boolean): Promise<Supplier> => {
      setLoading(true);
      setError(null);
      try {
        const response = await supplierService.toggleSupplierStatus(
          id,
          isActive
        );
        return response;
      } catch (err: any) {
        setError(err.message || "Failed to toggle supplier status");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Lấy form cấu hình supplier
  const getSupplierForm = useCallback(async () => {
    try {
      const res: any = await handleAPI("/suppliers/get-form");
      return res;
    } catch (err: any) {
      throw err;
    }
  }, []);

  return {
    getSuppliers,
    createSupplier,
    updateSupplier,
    deleteSupplier,
    toggleSupplierStatus,
    getSupplierForm,
    loading,
    error,
  };
};
