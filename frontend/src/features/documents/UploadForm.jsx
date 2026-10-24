import { useRef, useState } from "react";
import { useUploadDocumentMutation } from "../../app/api.js";
import {
  ACCEPT_ATTRIBUTE,
  MAX_TITLE_LENGTH,
  titleFromFilename,
  validateFile,
} from "./uploadRules.js";

function serverErrorMessage(error) {
  if (error.status === 413) return "The file is larger than 20 MB.";
  if (error.status === 415) return "This file type is not supported.";
  if (error.status === 400) return "Check the file and title and try again.";
  return "Upload failed. Try again.";
}

function UploadForm({ onUploaded }) {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [fileError, setFileError] = useState(null);
  const [upload, { isLoading, error, reset }] = useUploadDocumentMutation();
  const fileInput = useRef(null);

  function handleFileChange(event) {
    const picked = event.target.files[0] ?? null;
    reset();
    setFile(picked);
    setFileError(picked ? validateFile(picked) : null);
    if (picked) setTitle(titleFromFilename(picked.name));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!file || fileError) return;
    try {
      const document = await upload({ file, title: title.trim() }).unwrap();
      setFile(null);
      setTitle("");
      // A file input can't be cleared through state, only through the DOM.
      fileInput.current.value = "";
      onUploaded?.(document);
    } catch {
      // Shown below via `error`.
    }
  }

  const message = fileError ?? (error && serverErrorMessage(error));

  return (
    <form className="stacked-form" onSubmit={handleSubmit}>
      <label>
        File
        <input
          ref={fileInput}
          type="file"
          accept={ACCEPT_ATTRIBUTE}
          onChange={handleFileChange}
          aria-describedby="upload-hint"
          required
        />
      </label>
      <p id="upload-hint" className="muted small">
        PDF, Word, Markdown or text. Up to 20 MB.
      </p>

      <label>
        Title
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={MAX_TITLE_LENGTH}
          placeholder="Defaults to the file name"
        />
      </label>

      {message && (
        <p className="form-error" role="alert">
          {message}
        </p>
      )}

      <div className="form-actions">
        <button type="submit" disabled={!file || !!fileError || isLoading}>
          {isLoading ? "Uploading…" : "Upload"}
        </button>
      </div>
    </form>
  );
}

export default UploadForm;
