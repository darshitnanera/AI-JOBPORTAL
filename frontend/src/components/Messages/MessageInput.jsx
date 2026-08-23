import React, { useRef, useState } from "react";
import { Paperclip, Send, X } from "lucide-react";

export const MessageInput = ({ onSendMessage, onTyping, isLoading, disabled }) => {
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState([]);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  const autoGrow = (el) => {
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  };

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (disabled) return;
    if (!message.trim() && attachments.length === 0) return;

    try {
      await onSendMessage(message.trim(), attachments);
      setMessage("");
      setAttachments([]);
      if (textareaRef.current) textareaRef.current.style.height = "auto";
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleChange = (e) => {
    setMessage(e.target.value);
    autoGrow(e.target);
    onTyping?.(e);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const handleFileAttach = (e) => {
    setAttachments((prev) => [...prev, ...Array.from(e.target.files || [])]);
    e.target.value = "";
  };

  const canSend = (message.trim() || attachments.length > 0) && !isLoading && !disabled;

  return (
    <form
      onSubmit={handleSendMessage}
      className="shrink-0 border-t border-slate-200 bg-white p-3 sm:p-4 dark:border-slate-800 dark:bg-slate-900"
    >
      {attachments.length > 0 && (
        <ul className="mb-2 flex flex-wrap gap-2">
          {attachments.map((file, index) => (
            <li
              key={`${file.name}-${index}`}
              className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700 ring-1 ring-brand-200 dark:bg-brand-500/10 dark:text-brand-300 dark:ring-brand-500/25"
            >
              <Paperclip size={12} className="shrink-0" />
              <span className="truncate">{file.name}</span>
              <button
                type="button"
                aria-label={`Remove ${file.name}`}
                onClick={() =>
                  setAttachments((prev) => prev.filter((_, i) => i !== index))
                }
                className="shrink-0 rounded-full p-0.5 transition hover:bg-brand-100 dark:hover:bg-brand-500/20"
              >
                <X size={12} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-end gap-2">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileAttach}
          multiple
          className="visually-hidden"
          tabIndex={-1}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          title="Attach a file"
          aria-label="Attach a file"
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-600 transition-all hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <Paperclip size={18} />
        </button>

        <label className="visually-hidden" htmlFor="message-composer">
          Write a message
        </label>
        <textarea
          id="message-composer"
          ref={textareaRef}
          value={message}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          rows={1}
          disabled={disabled}
          placeholder="Write a message…  (Enter to send, Shift+Enter for a new line)"
          className="max-h-40 min-h-11 w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30 focus:outline-none disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        />

        <button
          type="submit"
          disabled={!canSend}
          title="Send message"
          aria-label="Send message"
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-brand-600 text-white shadow-sm transition-all hover:bg-brand-700 hover:shadow-md active:scale-[0.98] disabled:opacity-50"
        >
          <Send size={18} />
        </button>
      </div>

      <p className="mt-1.5 hidden px-1 text-xs text-slate-500 sm:block dark:text-slate-400">
        Enter to send · Shift+Enter for a new line
      </p>
    </form>
  );
};

export default MessageInput;
