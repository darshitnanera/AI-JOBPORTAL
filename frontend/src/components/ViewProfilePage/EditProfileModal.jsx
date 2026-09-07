import React, { useState } from "react";
import {
  X,
  Save,
  Loader2,
  Upload,
  Trash2,
  AlertCircle,
  FileText,
} from "lucide-react";

/* ------------------------------------------------------------------ *
 * Owner-only edit dialog.                                             *
 *                                                                     *
 * The request is unchanged from the previous build:                   *
 *   PUT /api/user/profile  (multipart: name, email, phone, resume)    *
 * ------------------------------------------------------------------ */

const INPUT_CLASS =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 shadow-sm transition " +
  "placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 " +
  "dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100";

const LABEL_CLASS =
  "mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-300";

const resumeFileName = (resume) => {
  if (!resume) return "";
  if (resume instanceof File) return resume.name;
  if (typeof resume === "string") {
    const tail = resume.split("/").pop() || "";
    return tail.split("-").slice(1).join("-") || tail;
  }
  return "Resume";
};

const EditProfileModal = ({
  initial,
  saving,
  onCancel,
  onSave,
  showResume = true,
}) => {
  const [form, setForm] = useState({
    name: initial.name || "",
    email: initial.email || "",
    phone: initial.phone || "",
    resume: initial.resume || null,
  });
  const [error, setError] = useState("");

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const validate = () => {
    if (!form.name.trim()) return "Name is required";
    if (!form.email.trim()) return "Email is required";
    if (!/\S+@\S+\.\S+/.test(form.email)) return "Email is invalid";
    if (!form.phone) return "Phone is required";
    if (!/^\d{10}$/.test(form.phone)) return "Phone must be exactly 10 digits";
    return null;
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const message = validate();
    if (message) {
      setError(message);
      return;
    }
    setError("");
    onSave(form);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Edit profile"
      onClick={onCancel}
    >
      <div
        className="my-8 w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">
              Edit profile
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Update your contact details and resume.
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close"
            className="shrink-0 rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
          >
            <X size={18} />
          </button>
        </div>

        {error ? (
          <div className="mt-5 flex items-start gap-3 rounded-xl border border-danger-500/30 bg-danger-50 p-4 dark:border-danger-500/25 dark:bg-danger-500/10">
            <AlertCircle
              size={18}
              className="mt-0.5 shrink-0 text-danger-600 dark:text-danger-500"
            />
            <p className="min-w-0 text-sm font-medium text-danger-700 dark:text-danger-500">
              {error}
            </p>
          </div>
        ) : null}

        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="profile-name" className={LABEL_CLASS}>
              Full name
            </label>
            <input
              id="profile-name"
              type="text"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="Jane Doe"
              className={INPUT_CLASS}
            />
          </div>

          <div>
            <label htmlFor="profile-email" className={LABEL_CLASS}>
              Email
            </label>
            <input
              id="profile-email"
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              placeholder="jane@example.com"
              className={INPUT_CLASS}
            />
          </div>

          <div>
            <label htmlFor="profile-phone" className={LABEL_CLASS}>
              Phone
            </label>
            <input
              id="profile-phone"
              type="tel"
              value={form.phone}
              maxLength={10}
              onChange={(e) =>
                update("phone", e.target.value.replace(/\D/g, "").slice(0, 10))
              }
              placeholder="10 digit number"
              className={INPUT_CLASS}
            />
          </div>

          {showResume && (
            <div>
              <span className={LABEL_CLASS}>Resume (PDF or Word)</span>
              <div className="flex flex-wrap items-center gap-3">
                <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-2.5 text-sm text-slate-700 transition-colors hover:border-brand-400 hover:bg-brand-50/60 dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-300 dark:hover:border-brand-500/40">
                  <Upload size={16} className="shrink-0" />
                  <span className="truncate">
                    {form.resume ? resumeFileName(form.resume) : "Choose a file…"}
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) update("resume", file);
                    }}
                  />
                </label>
                {form.resume ? (
                  <button
                    type="button"
                    onClick={() => update("resume", null)}
                    title="Remove selected resume"
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-danger-500/40 bg-danger-50 px-4 py-2.5 text-sm font-semibold text-danger-700 transition-all hover:bg-danger-500 hover:text-white active:scale-[0.98] dark:border-danger-500/30 dark:bg-danger-500/10 dark:text-danger-500 dark:hover:bg-danger-600 dark:hover:text-white"
                  >
                    <Trash2 size={16} />
                  </button>
                ) : null}
              </div>
              {form.resume instanceof File ? (
                <p className="mt-2 flex items-center gap-1.5 text-xs text-success-700 dark:text-success-500">
                  <FileText size={13} />
                  Ready to upload: {form.resume.name}
                </p>
              ) : null}
            </div>
          )}

          <div className="flex flex-wrap justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50 active:scale-[0.98] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-700 hover:shadow-md active:scale-[0.98] disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <Save size={16} />
                  Save changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfileModal;
