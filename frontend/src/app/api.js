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

const REFRESH_URL = "/auth/refresh";

// Shared by every refresh in flight at the same time: 401 retries, the
// startup refresh and the chat stream's. Refresh tokens are single-use, so a
// second parallel refresh would revoke every session.
let refreshPromise = null;

function sharedRefresh(api, extraOptions) {
  if (!refreshPromise) {
    refreshPromise = rawBaseQuery(
      { url: REFRESH_URL, method: "POST" },
      api,
      extraOptions
    ).finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

async function baseQueryWithReauth(args, api, extraOptions) {
  const url = typeof args === "string" ? args : args.url;
  if (url === REFRESH_URL) {
    return sharedRefresh(api, extraOptions);
  }

  let result = await rawBaseQuery(args, api, extraOptions);

  // A 401 from login means wrong credentials, not an expired token.
  if (result.error?.status !== 401 || url === "/auth/login") {
    return result;
  }

  const refreshResult = await sharedRefresh(api, extraOptions);

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
  tagTypes: ["Me", "Document", "User"],
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
        url: REFRESH_URL,
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
    // Real backend endpoint. It revokes every refresh token of the user and
    // returns a new pair, so this session continues and all others end.
    changePassword: builder.mutation({
      query: (body) => ({ url: "/auth/password", method: "PATCH", body }),
      async onQueryStarted(_body, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(tokenReceived(data.accessToken));
        } catch {
          // The component reads the error from useChangePasswordMutation.
        }
      },
    }),
    me: builder.query({
      query: () => "/auth/me",
      providesTags: ["Me"],
    }),
    // Real backend endpoints, admin only. Both are scoped to the admin's
    // tenant by the server, based on the access token.
    getUsers: builder.query({
      query: () => "/users",
      providesTags: [{ type: "User", id: "LIST" }],
    }),
    createUser: builder.mutation({
      query: (body) => ({ url: "/users", method: "POST", body }),
      invalidatesTags: [{ type: "User", id: "LIST" }],
    }),
    getDocuments: builder.query({
      query: () => "/documents",
      // The "LIST" tag lets an upload refetch the list without knowing ids.
      providesTags: (documents = []) => [
        ...documents.map(({ id }) => ({ type: "Document", id })),
        { type: "Document", id: "LIST" },
      ],
    }),
    getDocument: builder.query({
      query: (id) => `/documents/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Document", id }],
    }),
    deleteDocument: builder.mutation({
      query: (id) => ({ url: `/documents/${id}`, method: "DELETE" }),
      // Only the list: refetching the deleted document itself would 404
      // while the detail page is still on screen.
      invalidatesTags: [{ type: "Document", id: "LIST" }],
    }),
    search: builder.query({
      query: (q) => ({ url: "/search", params: { q, limit: 20 } }),
    }),
    uploadDocument: builder.mutation({
      query: ({ file, title }) => {
        const body = new FormData();
        body.append("file", file);
        if (title) body.append("title", title);
        // fetchBaseQuery leaves Content-Type unset for FormData, so the
        // browser adds the multipart boundary itself.
        return { url: "/documents", method: "POST", body };
      },
      invalidatesTags: [{ type: "Document", id: "LIST" }],
    }),
  }),
});

export const {
  useLoginMutation,
  useLogoutMutation,
  useChangePasswordMutation,
  useMeQuery,
  useGetUsersQuery,
  useCreateUserMutation,
  useGetDocumentsQuery,
  useGetDocumentQuery,
  useDeleteDocumentMutation,
  useUploadDocumentMutation,
  useSearchQuery,
} = api;
