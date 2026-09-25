import handleAPI from "../apis/handleAPI";

export interface User {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  role: "ADMIN" | "MANAGER" | "USER" | string;
  avatarUrl?: string;
  mfaEnabled?: boolean;
  provider?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateUserRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: "ADMIN" | "MANAGER" | "USER";
  mfaEnabled?: boolean;
}

export interface UserAuditLog {
  id: string;
  performedByEmail: string;
  performedByRole: string;
  action: string;
  targetUserId?: string;
  targetUserEmail: string;
  details: string;
  createdAt: string;
}

export interface PageResponse<T> {
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalElements: number;
  data: T[];
}

export interface UserUpdateRequest {
  firstname?: string;
  lastname?: string;
  email?: string;
  avatarUrl?: string;
}

export const userService = {
  getCurrentUser: async (): Promise<User> => {
    const response = await handleAPI("/users/me");
    return response.data;
  },

  updateUser: async (data: UserUpdateRequest): Promise<User> => {
    const response = await handleAPI("/users/me", data, "put");
    return response.data;
  },

  changePassword: async (data: {
    oldPassword: string;
    newPassword: string;
  }): Promise<void> => {
    await handleAPI("/users/change-password", data, "post");
  },

  getAdminUsers: async (params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    role?: string;
  }): Promise<PageResponse<User>> => {
    const response = await handleAPI("/users/admin/list", params);
    return response.data;
  },

  adminCreateUser: async (data: CreateUserRequest): Promise<User> => {
    const response = await handleAPI("/users/admin/create", data, "post");
    return response.data;
  },

  updateUserRole: async (userId: string, role: string): Promise<User> => {
    const response = await handleAPI(`/users/admin/${userId}/role`, { role }, "patch");
    return response.data;
  },

  getAuditLogs: async (params?: {
    page?: number;
    pageSize?: number;
    search?: string;
  }): Promise<PageResponse<UserAuditLog>> => {
    const response = await handleAPI("/users/admin/logs", params);
    return response.data;
  },
};
