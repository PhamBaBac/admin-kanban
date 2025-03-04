import { createSlice } from '@reduxjs/toolkit';
import { localDataNames } from '../../constants/appInfos';

export interface AuthState {
  id: string;
  name: string;
  roles: [{
    name: string;
    description: string;
    permissions: string[];
  }];
  token: string;
}

const initialState: AuthState = {
  id: '',
  name: '',
  roles: [{
    name: '',
    description: '',
    permissions: [],
  }],
  token: '',
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
    removeAuth: (state, _action) => {
      state.data = initialState;
      syncLocal({});
    },
    refreshtoken: (state, action) => {
      state.data.token = action.payload;
    },
  },
});

export const authReducer = authSlice.reducer;
export const { addAuth, removeAuth, refreshtoken } = authSlice.actions;
export const authSeletor = (state: any) => state.authReducer.data;
