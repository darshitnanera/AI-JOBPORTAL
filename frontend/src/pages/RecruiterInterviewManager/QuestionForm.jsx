import React, { useState } from "react";
import { AlertCircle, Loader2, Save, X } from "lucide-react";
import KeyPointsInput from "./KeyPointsInput";
import {
  CATEGORIES,
  DIFFICULTIES,
  INPUT,
  LABEL,
  PRIMARY_BTN,
  SECONDARY_BTN,
  TEXTAREA,
} from "./ui";

const EMPTY = {
  companyName: "",
  targetRole: "",
  questionText: "",
  category: "Technical",
  difficulty: "Medium",
  modelAnswer: "",
  keyPoints: [],
};

/**
 * Shared create/edit form. The same component backs the "Add a question" card
 * and the inline editor that opens inside a question row, so both paths
 * validate identically.
 */
export default function QuestionForm({
  initial,
  submitLabel = "Publish question",
  onSubmit,
  onCancel,
  idPrefix = "q",
  compact = false,
}) {
  const [form, setForm] = useState(() => ({ ...EMPTY, ...(initial || {}) }));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const setField = (field) => (event) =>
    setForm((prev) => ({ ...prev, [field]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!form.companyName.trim()) return setError("Company name is required.");
    if (!form.targetRole.trim()) return setError("Target role is required.");
    if (!form.questionText.trim()) return setError("Question text is required.");
    if (form.keyPoints.length === 0) {
      return setError(
        "Add at least one key point — answers are scored against them."
      );
    }

    setSaving(true);
    try {
      await onSubmit({
        companyName: form.companyName.trim(),
        targetRole: form.targetRole.trim(),
        questionText: form.questionText.trim(),
        category: form.category,
        difficulty: form.difficulty,
        modelAnswer: form.modelAnswer.trim(),
        keyPoints: form.keyPoints,
      });
      if (!initial) setForm({ ...EMPTY });
    } catch (submitError) {
      setError(
        submitError?.response?.data?.message ||
          submitError?.message ||
          "We couldn't save this question. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className={compact ? "grid gap-4 sm:grid-cols-2" : "grid gap-4"}>
        <div>
          <label className={LABEL} htmlFor={`${idPrefix}-company`}>
            Company name <span className="text-danger-600 dark:text-danger-500">*</span>
          </label>
          <input
            id={`${idPrefix}-company`}
            type="text"
            value={form.companyName}
            onChange={setField("companyName")}
            placeholder="e.g. Acme Corp"
            className={INPUT}
          />
        </div>

        <div>
          <label className={LABEL} htmlFor={`${idPrefix}-role`}>
            Target role <span className="text-danger-600 dark:text-danger-500">*</span>
          </label>
          <input
            id={`${idPrefix}-role`}
            type="text"
            value={form.targetRole}
            onChange={setField("targetRole")}
            placeholder="e.g. Frontend Engineer"
            className={INPUT}
          />
        </div>
      </div>

      <div>
        <label className={LABEL} htmlFor={`${idPrefix}-text`}>
          Question <span className="text-danger-600 dark:text-danger-500">*</span>
        </label>
        <textarea
          id={`${idPrefix}-text`}
          value={form.questionText}
          onChange={setField("questionText")}
          placeholder="What question should the candidate answer?"
          className={TEXTAREA}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={LABEL} htmlFor={`${idPrefix}-category`}>
            Category
          </label>
          <select
            id={`${idPrefix}-category`}
            value={form.category}
            onChange={setField("category")}
            className={INPUT}
          >
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={LABEL} htmlFor={`${idPrefix}-difficulty`}>
            Difficulty
          </label>
          <select
            id={`${idPrefix}-difficulty`}
            value={form.difficulty}
            onChange={setField("difficulty")}
            className={INPUT}
          >
            {DIFFICULTIES.map((difficulty) => (
              <option key={difficulty} value={difficulty}>
                {difficulty}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className={LABEL} htmlFor={`${idPrefix}-model-answer`}>
          Model answer
        </label>
        <textarea
          id={`${idPrefix}-model-answer`}
          value={form.modelAnswer}
          onChange={setField("modelAnswer")}
          placeholder="Optional. Shown to the candidate only after they finish."
          className={TEXTAREA}
        />
      </div>

      <KeyPointsInput
        idPrefix={`${idPrefix}-keypoints`}
        value={form.keyPoints}
        onChange={(keyPoints) => {
          setForm((prev) => ({ ...prev, keyPoints }));
          if (error) setError("");
        }}
      />

      {error ? (
        <div className="flex items-start gap-2 rounded-xl border border-danger-500/40 bg-danger-50 px-4 py-3 text-sm font-medium text-danger-700 dark:border-danger-500/30 dark:bg-danger-500/10 dark:text-danger-500">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={saving} className={PRIMARY_BTN}>
          {saving ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Save size={16} />
          )}
          {saving ? "Saving…" : submitLabel}
        </button>

        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className={SECONDARY_BTN}
          >
            <X size={16} />
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  );
}
