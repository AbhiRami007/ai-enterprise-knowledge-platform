import { useEffect, useId, useState } from "react";
import { useSearchTenantsQuery } from "../../app/api.js";

const MIN_CHARS = 2;
const MAX_NAME_LENGTH = 100;
const DEBOUNCE_MS = 250;

// A searchable dropdown (ARIA combobox) of existing companies, plus a
// "Create …" option when the typed name doesn't exist yet.
// onChange receives { type: "existing", tenant } | { type: "new", name } | null.
function CompanyPicker({ value, onChange }) {
  const [text, setText] = useState("");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const listId = useId();
  const optionId = (index) => `${listId}-option-${index}`;

  // Wait until typing pauses, so each keystroke isn't a request.
  useEffect(() => {
    const timer = setTimeout(() => setQuery(text.trim()), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [text]);

  const searchable = query.length >= MIN_CHARS;
  const {
    currentData: tenants = [],
    isFetching,
    isError,
  } = useSearchTenantsQuery(query, { skip: !searchable });

  const trimmed = text.trim();
  const exactMatch = tenants.some(
    (t) => t.name.toLowerCase() === trimmed.toLowerCase(),
  );
  const options = [
    ...tenants.map((tenant) => ({ type: "existing", tenant })),
    ...(searchable && !isFetching && !exactMatch && trimmed === query
      ? [{ type: "new", name: trimmed }]
      : []),
  ];

  function choose(option) {
    onChange(option);
    setText(option.type === "existing" ? option.tenant.name : option.name);
    setOpen(false);
    setActiveIndex(-1);
  }

  function handleChange(event) {
    setText(event.target.value);
    setOpen(true);
    setActiveIndex(-1);
    // Typing again undoes an earlier choice.
    if (value) onChange(null);
  }

  function handleKeyDown(event) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((i) => Math.min(i + 1, options.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (event.key === "Enter" && open && options[activeIndex]) {
      event.preventDefault();
      choose(options[activeIndex]);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  }

  const showList = open && searchable && !value;

  return (
    <div className="combobox">
      <label htmlFor={`${listId}-input`}>Company</label>
      {/* Wrapper so the list opens right under the input. */}
      <div className="combobox-field">
        <input
          id={`${listId}-input`}
          type="text"
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={
            showList && activeIndex >= 0 ? optionId(activeIndex) : undefined
          }
          aria-describedby={`${listId}-hint`}
          autoComplete="off"
          maxLength={MAX_NAME_LENGTH}
          required
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setOpen(true)}
          // Delay so a click on an option lands before the list closes.
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Start typing your company name…"
        />

        {showList && (
          <ul className="combobox-list" id={listId} role="listbox">
            {isFetching && options.length === 0 && (
              <li className="combobox-status">Searching…</li>
            )}
            {isError && (
              <li className="combobox-status">
                Search failed. Keep typing to retry.
              </li>
            )}
            {options.map((option, index) => (
              <li
                key={option.type === "existing" ? option.tenant.id : "new"}
                id={optionId(index)}
                role="option"
                aria-selected={index === activeIndex}
                className={index === activeIndex ? "active" : undefined}
                // mousedown, not click: fires before the input's blur.
                onMouseDown={(e) => {
                  e.preventDefault();
                  choose(option);
                }}
              >
                {option.type === "existing" ? (
                  option.tenant.name
                ) : (
                  <>
                    Create <strong>“{option.name}”</strong> as a new company
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
      <p id={`${listId}-hint`} className="muted small">
        Join your company, or create it if it isn’t listed.
      </p>

      {value?.type === "existing" && (
        <p className="muted small">
          An admin at {value.tenant.name} will need to approve your account.
        </p>
      )}
      {value?.type === "new" && (
        <p className="muted small">
          You’ll be the admin of {value.name} and can invite your colleagues.
        </p>
      )}
    </div>
  );
}

export default CompanyPicker;
