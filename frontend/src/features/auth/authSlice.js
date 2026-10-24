import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  accessToken: null,
  user: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    tokenReceived(state, action) {
      state.accessToken = action.payload;
    },
    userLoaded(state, action) {
      state.user = action.payload;
    },
    loggedOut() {
      return initialState;
    },
  },
});

export const { tokenReceived, userLoaded, loggedOut } = authSlice.actions;
export default authSlice.reducer;

export const selectAccessToken = (state) => state.auth.accessToken;
export const selectCurrentUser = (state) => state.auth.user;
