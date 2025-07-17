import { useState, useCallback } from 'react';
import { userService, User, UserUpdateRequest } from '../services/userService';

export const useUsers = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getCurrentUser = useCallback(async (): Promise<User> => {
    setLoading(true);
    setError(null);
    try {
      const response = await userService.getCurrentUser();
      return response;
    } catch (err: any) {
      setError(err.message || 'Failed to fetch current user');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateUser = useCallback(async (data: UserUpdateRequest): Promise<User> => {
    setLoading(true);
    setError(null);
    try {
      const response = await userService.updateUser(data);
      return response;
    } catch (err: any) {
      setError(err.message || 'Failed to update user');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const changePassword = useCallback(async (data: { oldPassword: string; newPassword: string }): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await userService.changePassword(data);
    } catch (err: any) {
      setError(err.message || 'Failed to change password');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    getCurrentUser,
    updateUser,
    changePassword,
    loading,
    error
  };
}; 