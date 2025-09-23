import { createSlice } from '@reduxjs/toolkit';
import { localDataNames } from '../../constants/appInfos';

export interface AuthState {
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;
  accessToken?: string;
  avatar?: string;
  userId?: string;
}

const initialState: AuthState = {
  firstName: "",
  lastName: "",
  email: "",
  role: "",
  accessToken: "",
  avatar: "",
  userId: "",
};

const syncLocal = (data: any) => {
  localStorage.setItem(localDataNames.authData, JSON.stringify(data));
};

const authSlice = createSlice({
  name: "auth",
  initialState: {
    data: initialState,
  },
  reducers: {
    addAuth: (state, action) => {
      state.data = action.payload;
      syncLocal(action.payload);
    },
    removeAuth: (state) => {
      state.data = initialState;
      localStorage.removeItem(localDataNames.authData);
    },
    refreshtoken: (state, action) => {
      state.data.accessToken = action.payload;
      syncLocal(state.data);
    },
  },
});

export const authReducer = authSlice.reducer;
export const { addAuth, removeAuth, refreshtoken } = authSlice.actions;
export const authSeletor = (state: any) => state.authReducer.data;
