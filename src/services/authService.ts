import handleAPI from "../apis/handleAPI";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignUpRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
}

export interface UserInfo {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  role: string;
  avatarUrl?: string;
}

export const authService = {
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await handleAPI("/auth/authenticate", data, "post");
    return response.data;
  },

  signUp: async (data: SignUpRequest): Promise<AuthResponse> => {
    const response = await handleAPI("/auth/register", data, "post");
    return response.data;
  },

  getUserInfo: async (): Promise<UserInfo> => {
    const response = await handleAPI("/users/me");
    return response.data;
  },

  refreshToken: async (): Promise<AuthResponse> => {
    const response = await handleAPI("/auth/refresh-token", undefined, "post");
    return response.data;
  },
};
