import { useState, useCallback } from "react";
import {
  authService,
  LoginRequest,
  SignUpRequest,
  UserInfo,
} from "../services/authService";
import { addAuth, removeAuth } from "../redux/reducers/authReducer";
import { useDispatch } from "react-redux";

export const useAuth = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dispatch = useDispatch();

  const login = useCallback(
    async (data: LoginRequest) => {
      setLoading(true);
      setError(null);
      try {
        const response = await authService.login(data);
        const userInfo = await authService.getUserInfo();

        const authData = {
          token: response.accessToken,
          refreshToken: response.refreshToken,
          user: userInfo,
        };

        dispatch(addAuth(authData));
        return authData;
      } catch (err: any) {
        setError(err.message || "Login failed");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [dispatch]
  );

  const signUp = useCallback(
    async (data: SignUpRequest) => {
      setLoading(true);
      setError(null);
      try {
        const response = await authService.signUp(data);
        const userInfo = await authService.getUserInfo();

        const authData = {
          token: response.accessToken,
          refreshToken: response.refreshToken,
          user: userInfo,
        };

        dispatch(addAuth(authData));
        return authData;
      } catch (err: any) {
        setError(err.message || "Sign up failed");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [dispatch]
  );

  const logout = useCallback(() => {
    dispatch(removeAuth());
  }, [dispatch]);

  const getUserInfo = useCallback(async (): Promise<UserInfo> => {
    setLoading(true);
    setError(null);
    try {
      const userInfo = await authService.getUserInfo();
      return userInfo;
    } catch (err: any) {
      setError(err.message || "Failed to get user info");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    login,
    signUp,
    logout,
    getUserInfo,
    loading,
    error,
  };
};
