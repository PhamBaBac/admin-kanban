import { useState, useCallback } from 'react';
import { orderService, Order, OrderListResponse } from '../services/orderService';

export const useOrders = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getOrders = useCallback(async (params?: any): Promise<OrderListResponse> => {
    setLoading(true);
    setError(null);
    try {
      const response = await orderService.getOrders(params);
      return response;
    } catch (err: any) {
      setError(err.message || 'Failed to fetch orders');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const filterOrders = useCallback(async (params?: any): Promise<OrderListResponse> => {
    setLoading(true);
    setError(null);
    try {
      const response = await orderService.filterOrders(params);
      return response;
    } catch (err: any) {
      setError(err.message || 'Failed to filter orders');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateOrderStatus = useCallback(
    async (
      id: string,
      status: string,
      cancelReason?: string,
      trackingCode?: string
    ): Promise<Order> => {
      setLoading(true);
      setError(null);
      try {
        const response = await orderService.updateOrderStatus(
          id,
          status,
          cancelReason,
          trackingCode
        );
        return response;
      } catch (err: any) {
        setError(err.message || 'Failed to update order status');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const deleteOrder = useCallback(async (id: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await orderService.deleteOrder(id);
    } catch (err: any) {
      setError(err.message || 'Failed to delete order');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const exportOrders = useCallback(async (data: any) => {
    setLoading(true);
    setError(null);
    try {
      const response = await orderService.exportOrders(data);
      return response;
    } catch (err: any) {
      setError(err.message || 'Failed to export orders');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    getOrders,
    filterOrders,
    updateOrderStatus,
    deleteOrder,
    exportOrders,
    loading,
    error
  };
}; 