import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { API_URL, api } from "../../app/api.js";
import { readEventStream } from "../../utils/sse.js";
import { loggedOut } from "../auth/authSlice.js";

export const MAX_QUESTION_LENGTH = 2000;

// Kept in Redux, not in the page, so the conversation survives navigating
// away (e.g. to open a cited document) and back. Cleared on logout.
const initialState = {
  // { id, role: "user", text }
  // { id, role: "assistant", question, text, citations, status, error }
  // status: "streaming" | "done" | "stopped" | "error"
  messages: [],
  streaming: false,
};

function postQuestion(question, token, signal) {
  return fetch(`${API_URL}/ask`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
      Authorization: `Bearer ${token}`,
    },
    credentials: "include",
    body: JSON.stringify({ question }),
    signal,
  });
}

// Not an RTK Query endpoint: those expect one response per request, while
// this one arrives as a stream of events.
const askQuestion = createAsyncThunk(
  "chat/ask",
  async (question, { dispatch, getState, signal, requestId, rejectWithValue }) => {
    let response = await postQuestion(
      question,
      getState().auth.accessToken,
      signal
    );

    if (response.status === 401) {
      // Goes through the same refresh lock as every other request.
      const refreshed = await dispatch(api.endpoints.refresh.initiate());
      if (refreshed.error) {
        dispatch(loggedOut());
        return rejectWithValue("Your session expired. Log in again.");
      }
      response = await postQuestion(
        question,
        getState().auth.accessToken,
        signal
      );
    }

    if (response.status === 429) {
      return rejectWithValue("Too many questions. Wait a moment and retry.");
    }
    if (!response.ok) {
      return rejectWithValue("The assistant is unavailable. Try again.");
    }

    let failure = null;
    await readEventStream(response.body, (event, data) => {
      if (event === "token") {
        dispatch(answerChunkReceived({ id: requestId, text: data.text }));
      } else if (event === "citations") {
        dispatch(citationsReceived({ id: requestId, citations: data }));
      } else if (event === "error") {
        failure = data.message;
      }
    });
    if (failure) return rejectWithValue(failure);
  }
);

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    answerChunkReceived(state, action) {
      const message = state.messages.find((m) => m.id === action.payload.id);
      if (message) message.text += action.payload.text;
    },
    citationsReceived(state, action) {
      const message = state.messages.find((m) => m.id === action.payload.id);
      if (message) message.citations = action.payload.citations;
    },
    // Removes a failed answer and the question before it, so Retry can ask
    // again without leaving the failed attempt in the conversation.
    exchangeRemoved(state, action) {
      const index = state.messages.findIndex((m) => m.id === action.payload);
      if (index > 0) state.messages.splice(index - 1, 2);
    },
    conversationCleared() {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(askQuestion.pending, (state, action) => {
        const { requestId, arg: question } = action.meta;
        state.streaming = true;
        state.messages.push(
          { id: `${requestId}-q`, role: "user", text: question },
          {
            id: requestId,
            role: "assistant",
            question,
            text: "",
            citations: [],
            status: "streaming",
            error: null,
          }
        );
      })
      .addCase(askQuestion.fulfilled, (state, action) => {
        state.streaming = false;
        const message = state.messages.find(
          (m) => m.id === action.meta.requestId
        );
        if (message) message.status = "done";
      })
      .addCase(askQuestion.rejected, (state, action) => {
        state.streaming = false;
        const message = state.messages.find(
          (m) => m.id === action.meta.requestId
        );
        if (!message) return;
        if (action.meta.aborted) {
          message.status = "stopped";
        } else {
          message.status = "error";
          message.error =
            action.payload ?? "Could not reach the assistant. Try again.";
        }
      })
      .addCase(loggedOut, () => initialState);
  },
});

const { answerChunkReceived, citationsReceived, exchangeRemoved } =
  chatSlice.actions;
export const { conversationCleared } = chatSlice.actions;
export default chatSlice.reducer;

// The running request, so Stop works even after leaving and returning to
// the page. Kept outside Redux because a promise isn't serializable.
let inFlight = null;

export const ask = (question) => (dispatch) => {
  inFlight = dispatch(askQuestion(question));
  inFlight.finally(() => {
    inFlight = null;
  });
};

export const stopAnswer = () => () => {
  inFlight?.abort();
};

export const retry = (message) => (dispatch) => {
  dispatch(exchangeRemoved(message.id));
  dispatch(ask(message.question));
};

export const selectMessages = (state) => state.chat.messages;
export const selectStreaming = (state) => state.chat.streaming;
