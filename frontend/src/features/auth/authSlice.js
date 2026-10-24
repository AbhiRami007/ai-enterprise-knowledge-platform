import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  accessToken: null,
  user: null,
  // False until the startup refresh has finished, successful or not.
  sessionChecked: false,
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
    sessionChecked(state) {
      state.sessionChecked = true;
    },
    loggedOut() {
      // Keep sessionChecked so the app shows the login page, not "Loading…".
      return { ...initialState, sessionChecked: true };
    },
  },
});

export const { tokenReceived, userLoaded, sessionChecked, loggedOut } =
  authSlice.actions;
export default authSlice.reducer;

export const selectAccessToken = (state) => state.auth.accessToken;
export const selectCurrentUser = (state) => state.auth.user;
export const selectSessionChecked = (state) => state.auth.sessionChecked;
