// Turns "[2]" markers in the answer into links to the matching source in
// the citation list. Rendered as React nodes, never as HTML.
function AnswerText({ text, messageId, citationCount }) {
  const parts = text.split(/(\[\d+\])/);

  return parts.map((part, i) => {
    const match = part.match(/^\[(\d+)\]$/);
    const index = match && Number(match[1]);
    if (!index || index > citationCount) return part;

    return (
      <sup key={i}>
        <a
          href={`#source-${messageId}-${index}`}
          className="citation-marker"
          aria-label={`Source ${index}`}
        >
          {index}
        </a>
      </sup>
    );
  });
}

export default AnswerText;
