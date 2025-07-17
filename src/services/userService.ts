import handleAPI from "../apis/handleAPI";

export interface User {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  role: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
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
};
