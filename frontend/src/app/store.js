import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice.js";
import chatReducer from "../features/ask/chatSlice.js";
import { api } from "./api.js";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    chat: chatReducer,
    [api.reducerPath]: api.reducer,
  },
  middleware: (getDefault) => getDefault().concat(api.middleware),
});
