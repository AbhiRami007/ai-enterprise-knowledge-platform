import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { tokenReceived } from "../features/auth/authSlice.js";

export const api = createApi({
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL ?? "http://localhost:3000/api/v1",
    // Lets the browser store and send the httpOnly refresh cookie.
    credentials: "include",
    prepareHeaders: (headers, { getState }) => {
      const token = getState().auth.accessToken;
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (credentials) => ({
        url: "/auth/login",
        method: "POST",
        body: credentials,
      }),
      async onQueryStarted(_credentials, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(tokenReceived(data.accessToken));
        } catch {
          // The component reads the error from useLoginMutation.
        }
      },
    }),
  }),
});

export const { useLoginMutation } = api;
