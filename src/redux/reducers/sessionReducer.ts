/** @format */

import { createSlice } from "@reduxjs/toolkit";

interface SessionState {
  isExpired: boolean;
}

const initialState: SessionState = {
  isExpired: false,
};

const sessionSlice = createSlice({
  name: "session",
  initialState,
  reducers: {
    setSessionExpired: (state) => {
      state.isExpired = true;
    },
    clearSessionExpired: (state) => {
      state.isExpired = false;
    },
  },
});

export const sessionReducer = sessionSlice.reducer;
export const { setSessionExpired, clearSessionExpired } = sessionSlice.actions;
export const sessionSelector = (state: any) => state.sessionReducer;
