import { useSelector } from "react-redux";
import { api, useGetDocumentsQuery } from "../../app/api.js";

const POLL_MS = 3000;
const selectDocumentsResult = api.endpoints.getDocuments.select();

export function isInProgress(doc) {
  return doc.status === "pending" || doc.status === "processing";
}

// The documents list, refetched every few seconds while any document is
// still being processed. Polling stops once all are ready or failed.
export function useDocuments() {
  // Read the cached list first: the polling interval has to be known before
  // the query hook runs.
  const cached = useSelector(selectDocumentsResult);
  const polling = cached.data?.some(isInProgress) ?? false;

  return useGetDocumentsQuery(undefined, {
    pollingInterval: polling ? POLL_MS : 0,
    skipPollingIfUnfocused: true,
  });
}
