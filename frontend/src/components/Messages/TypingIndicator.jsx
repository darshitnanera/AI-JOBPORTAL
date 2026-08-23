import React from "react";

export const TypingIndicator = ({ isTyping, username = "They" }) => {
  if (!isTyping) return null;

  return (
    <div
      className="flex shrink-0 items-center gap-2 px-4 pb-2 sm:px-6"
      role="status"
      aria-live="polite"
    >
      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-2 dark:bg-slate-800">
        {[0, 150, 300].map((delay) => (
          <span
            key={delay}
            className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-500 dark:bg-slate-400"
            style={{ animationDelay: `${delay}ms` }}
          />
        ))}
      </span>
      <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
        {username} is typing…
      </span>
    </div>
  );
};

export default TypingIndicator;
