import React, { useState } from "react";
import { Plus, X } from "lucide-react";
import { INPUT, LABEL, BADGE_BRAND } from "./ui";

/**
 * Removable chip input for a question's key points.
 *
 * Key points are what the deterministic scorer matches a candidate's answer
 * against, so a question with none of them could never be graded — the parent
 * form blocks submission until there is at least one.
 */
export default function KeyPointsInput({ value = [], onChange, idPrefix = "kp" }) {
  const [draft, setDraft] = useState("");
  const [notice, setNotice] = useState("");

  const addPoint = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    const exists = value.some(
      (point) => point.toLowerCase() === trimmed.toLowerCase()
    );
    if (exists) {
      setNotice("That key point is already in the list.");
      return;
    }
    onChange([...value, trimmed]);
    setDraft("");
    setNotice("");
  };

  const removePoint = (index) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      // Enter must add a chip, never submit the surrounding form.
      event.preventDefault();
      addPoint();
    }
  };

  return (
    <div>
      <label className={LABEL} htmlFor={`${idPrefix}-input`}>
        Key points <span className="text-danger-600 dark:text-danger-500">*</span>
      </label>
      <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">
        Answers are scored by how many of these a candidate covers. Add at least
        one — short phrases work best.
      </p>

      <div className="flex gap-2">
        <input
          id={`${idPrefix}-input`}
          type="text"
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value);
            if (notice) setNotice("");
          }}
          onKeyDown={handleKeyDown}
          placeholder="e.g. Explains the event loop"
          className={INPUT}
        />
        <button
          type="button"
          onClick={addPoint}
          disabled={!draft.trim()}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-700 hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">Add</span>
        </button>
      </div>

      {notice ? (
        <p className="mt-2 text-xs font-medium text-warning-700 dark:text-warning-500">
          {notice}
        </p>
      ) : null}

      {value.length > 0 ? (
        <ul className="mt-3 flex flex-wrap gap-2">
          {value.map((point, index) => (
            <li key={`${point}-${index}`}>
              <span className={BADGE_BRAND}>
                <span className="max-w-60 truncate">{point}</span>
                <button
                  type="button"
                  onClick={() => removePoint(index)}
                  aria-label={`Remove key point ${point}`}
                  className="ml-0.5 rounded-full p-0.5 transition hover:bg-brand-200/70 dark:hover:bg-brand-500/25"
                >
                  <X size={12} />
                </button>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
          No key points added yet.
        </p>
      )}
    </div>
  );
}
