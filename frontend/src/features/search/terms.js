export const MIN_QUERY_LENGTH = 2;
export const MAX_QUERY_LENGTH = 200;

// Words too common to be worth matching or highlighting.
const STOP_WORDS = new Set([
  "a", "an", "and", "are", "can", "do", "does", "for", "from", "how", "i",
  "in", "is", "it", "many", "much", "my", "of", "on", "or", "our", "the",
  "to", "we", "what", "when", "where", "who", "with",
]);

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// "Passwords?" -> ["password"]: lowercase words without stop words, with a
// trailing plural "s" dropped so "password" also matches "passwords".
export function searchTerms(query) {
  const words = query.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];
  const terms = words
    .filter((word) => !STOP_WORDS.has(word))
    .map((word) => (word.length > 3 ? word.replace(/s$/, "") : word));
  return [...new Set(terms)];
}

// Matches any term at the start of a word, plus the rest of that word.
// Returns null when there is nothing to match.
export function termsPattern(terms) {
  if (terms.length === 0) return null;
  const alternatives = terms.map(escapeRegExp).join("|");
  return new RegExp(`\\b(?:${alternatives})[\\p{L}\\p{N}]*`, "giu");
}
