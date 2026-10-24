import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router";
import AnswerText from "./AnswerText.jsx";
import {
  MAX_QUESTION_LENGTH,
  ask,
  conversationCleared,
  retry,
  selectMessages,
  selectStreaming,
  stopAnswer,
} from "./chatSlice.js";

const EXAMPLES = [
  "How many vacation days do I get?",
  "What are the password rules?",
  "What should I do in my first week?",
];

function AssistantMessage({ message }) {
  const dispatch = useDispatch();
  const { id, text, citations, status, error } = message;

  return (
    // aria-busy: screen readers wait for the whole answer instead of
    // announcing every streamed word.
    <article
      className="message message-assistant"
      aria-busy={status === "streaming"}
    >
      {status === "streaming" && text === "" ? (
        <p className="muted">Thinking…</p>
      ) : (
        <p className="message-text">
          <AnswerText
            text={text}
            messageId={id}
            citationCount={citations.length}
          />
        </p>
      )}

      {status === "stopped" && <p className="muted small">Stopped.</p>}

      {status === "error" && (
        <div className="callout-error" role="alert">
          <p>{error}</p>
          <button
            type="button"
            className="button-secondary"
            onClick={() => dispatch(retry(message))}
          >
            Retry
          </button>
        </div>
      )}

      {citations.length > 0 && (
        <section aria-label="Sources">
          <h2 className="sources-heading">Sources</h2>
          <ol className="sources">
            {citations.map((source) => (
              <li key={source.index} id={`source-${id}-${source.index}`}>
                <Link
                  to={`/documents/${source.documentId}`}
                  className="doc-title"
                >
                  {source.documentTitle}
                </Link>
                <p className="muted small">{source.snippet}</p>
              </li>
            ))}
          </ol>
        </section>
      )}
    </article>
  );
}

function Composer({ streaming }) {
  const dispatch = useDispatch();
  const [question, setQuestion] = useState("");

  function send() {
    const text = question.trim();
    if (!text || streaming) return;
    dispatch(ask(text));
    setQuestion("");
  }

  function handleKeyDown(event) {
    // Enter sends; Shift+Enter adds a new line.
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      send();
    }
  }

  return (
    <form
      className="composer"
      onSubmit={(event) => {
        event.preventDefault();
        send();
      }}
    >
      <label className="visually-hidden" htmlFor="question">
        Ask a question
      </label>
      <textarea
        id="question"
        rows={2}
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        onKeyDown={handleKeyDown}
        maxLength={MAX_QUESTION_LENGTH}
        placeholder="Ask about your company documents…"
      />
      {streaming ? (
        <button
          type="button"
          className="button-secondary"
          onClick={() => dispatch(stopAnswer())}
        >
          Stop
        </button>
      ) : (
        <button type="submit" disabled={!question.trim()}>
          Send
        </button>
      )}
    </form>
  );
}

function AskPage() {
  const dispatch = useDispatch();
  const messages = useSelector(selectMessages);
  const streaming = useSelector(selectStreaming);
  const endRef = useRef(null);

  // Bring each new question and answer into view.
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  return (
    <div className="ask-page">
      <div className="page-header">
        <h1>Ask</h1>
        {messages.length > 0 && (
          <button
            type="button"
            className="button-secondary"
            onClick={() => dispatch(conversationCleared())}
            disabled={streaming}
          >
            New conversation
          </button>
        )}
      </div>

      {messages.length === 0 && (
        <div className="empty-state">
          <p>Ask a question about your company’s documents.</p>
          <p className="muted">
            Answers are based only on processed documents and link to their
            sources.
          </p>
          <div className="examples">
            {EXAMPLES.map((example) => (
              <button
                key={example}
                type="button"
                className="button-secondary"
                onClick={() => dispatch(ask(example))}
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* role="log": screen readers announce new answers as they arrive. */}
      <div className="messages" role="log" aria-live="polite">
        {messages.map((message) =>
          message.role === "user" ? (
            <p key={message.id} className="message message-user">
              {message.text}
            </p>
          ) : (
            <AssistantMessage key={message.id} message={message} />
          )
        )}
        <div ref={endRef} />
      </div>

      <Composer streaming={streaming} />
    </div>
  );
}

export default AskPage;
