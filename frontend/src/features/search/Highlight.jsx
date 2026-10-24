import { searchTerms, termsPattern } from "./terms.js";

// Wraps the words of `text` that match `query` in <mark>. Builds React
// elements instead of an HTML string, so document text can never inject
// markup into the page.
function Highlight({ text, query }) {
  const pattern = termsPattern(searchTerms(query));
  if (!pattern) return text;

  const parts = [];
  let last = 0;
  for (const match of text.matchAll(pattern)) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    parts.push(<mark key={match.index}>{match[0]}</mark>);
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));

  return parts;
}

export default Highlight;
