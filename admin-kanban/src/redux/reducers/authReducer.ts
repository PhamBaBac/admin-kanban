import { createSlice } from '@reduxjs/toolkit';
import { localDataNames } from '../../constants/appInfos';

export interface AuthState {
  firstName?: string;
  lastName?: string;  
  email?: string;
  role?: string
  token?: string;
  avatar?: string;
}

const initialState: AuthState = {
  firstName: "",
  lastName: "",
  email: "",
  role: "",
  token: "",
  avatar: "",
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
      state.data.token = action.payload;
      syncLocal(state.data);
    },
  },
});

export const authReducer = authSlice.reducer;
export const { addAuth, removeAuth, refreshtoken } = authSlice.actions;
export const authSeletor = (state: any) => state.authReducer.data;
