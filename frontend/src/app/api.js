import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import {
  loggedOut,
  sessionChecked,
  tokenReceived,
} from "../features/auth/authSlice.js";

export const API_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:3000/api/v1";

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_URL,
  // Lets the browser store and send the httpOnly refresh cookie.
  credentials: "include",
  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth.accessToken;
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    return headers;
  },
});

// A 401 here means bad credentials or a dead cookie; refreshing would loop.
const NO_REAUTH_URLS = ["/auth/login", "/auth/refresh"];

// Shared by every request that hits a 401 at the same time. Refresh tokens
// are single-use, so a second parallel refresh would revoke every session.
let refreshPromise = null;

async function baseQueryWithReauth(args, api, extraOptions) {
  let result = await rawBaseQuery(args, api, extraOptions);

  const url = typeof args === "string" ? args : args.url;
  if (result.error?.status !== 401 || NO_REAUTH_URLS.includes(url)) {
    return result;
  }

  if (!refreshPromise) {
    refreshPromise = rawBaseQuery(
      { url: "/auth/refresh", method: "POST" },
      api,
      extraOptions
    ).finally(() => {
      refreshPromise = null;
    });
  }
  const refreshResult = await refreshPromise;

  if (refreshResult.data) {
    api.dispatch(tokenReceived(refreshResult.data.accessToken));
    result = await rawBaseQuery(args, api, extraOptions);
  } else {
    api.dispatch(loggedOut());
  }

  return result;
}

export const api = createApi({
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Me", "Document"],
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (credentials) => ({
        url: "/auth/login",
        method: "POST",
        body: credentials,
      }),
      // A different user may log in; drop the previous profile from the cache.
      invalidatesTags: ["Me"],
      async onQueryStarted(_credentials, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(tokenReceived(data.accessToken));
        } catch {
          // The component reads the error from useLoginMutation.
        }
      },
    }),
    // The refresh token is sent automatically as the httpOnly cookie.
    refresh: builder.mutation({
      query: () => ({
        url: "/auth/refresh",
        method: "POST",
      }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(tokenReceived(data.accessToken));
        } catch {
          // No cookie, or it expired or was revoked: the user logs in again.
        } finally {
          dispatch(sessionChecked());
        }
      },
    }),
    // Revokes the refresh token and clears its cookie on the server.
    logout: builder.mutation({
      query: () => ({
        url: "/auth/logout",
        method: "POST",
      }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
        } catch {
          // Log out locally even if the server could not be reached.
        } finally {
          dispatch(loggedOut());
          dispatch(api.util.resetApiState());
        }
      },
    }),
    me: builder.query({
      query: () => "/auth/me",
      providesTags: ["Me"],
    }),
    getDocuments: builder.query({
      query: () => "/documents",
      // The "LIST" tag lets an upload refetch the list without knowing ids.
      providesTags: (documents = []) => [
        ...documents.map(({ id }) => ({ type: "Document", id })),
        { type: "Document", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useLoginMutation,
  useLogoutMutation,
  useMeQuery,
  useGetDocumentsQuery,
} = api;
