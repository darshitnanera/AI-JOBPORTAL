import React, { useEffect, useRef } from "react";
import { AlertCircle, Check, CheckCheck, MessagesSquare, Paperclip, RefreshCw } from "lucide-react";

const formatTime = (timestamp) => {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "";

  const now = new Date();
  const diffMins = Math.floor((now - date) / 60000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;

  const sameDay = date.toDateString() === now.toDateString();
  if (sameDay) {
    return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  }

  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const initialOf = (name = "") => (name.trim()[0] || "?").toUpperCase();

/** Skeleton rows that mimic the real bubble rhythm. */
const MessagesSkeleton = () => (
  <div className="flex-1 space-y-4 overflow-hidden p-4 sm:p-6">
    {[
      { own: false, w: "w-3/5" },
      { own: true, w: "w-2/5" },
      { own: false, w: "w-1/2" },
      { own: true, w: "w-3/5" },
      { own: false, w: "w-2/5" },
    ].map((row, i) => (
      <div
        key={i}
        className={`flex items-end gap-2 ${row.own ? "justify-end" : "justify-start"}`}
      >
        {!row.own && (
          <div className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
        )}
        <div
          className={`h-14 ${row.w} animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800`}
        />
      </div>
    ))}
  </div>
);

export const MessageList = ({
  messages = [],
  currentUserId,
  isLoading,
  error = "",
  onRetry,
}) => {
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (isLoading) return <MessagesSkeleton />;

  if (error) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-danger-50 text-danger-600 dark:bg-danger-500/10">
          <AlertCircle size={20} />
        </span>
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-50">
          Couldn&apos;t load this conversation
        </h3>
        <p className="max-w-sm text-sm text-slate-600 dark:text-slate-400">{error}</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <RefreshCw size={16} />
            Try again
          </button>
        )}
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300">
          <MessagesSquare size={20} />
        </span>
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-50">
          No messages yet
        </h3>
        <p className="max-w-sm text-sm text-slate-600 dark:text-slate-400">
          Say hello — your first message starts the conversation.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-3 overflow-y-auto overflow-x-hidden p-4 sm:p-6">
      {messages.map((message, index) => {
        const isOwn = message.sender?._id === currentUserId;
        const prev = messages[index - 1];
        const showAvatar = !isOwn && prev?.sender?._id !== message.sender?._id;

        return (
          <div
            key={message._id || index}
            className={`flex items-end gap-2 ${isOwn ? "justify-end" : "justify-start"}`}
          >
            {!isOwn && (
              <span className="h-8 w-8 shrink-0">
                {showAvatar && (
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-700 dark:bg-slate-700 dark:text-slate-100">
                    {initialOf(message.sender?.name)}
                  </span>
                )}
              </span>
            )}

            <div className={`max-w-[80%] sm:max-w-[70%] ${isOwn ? "items-end" : "items-start"}`}>
              {!isOwn && showAvatar && (
                <p className="mb-1 px-1 text-xs font-semibold text-slate-600 dark:text-slate-400">
                  {message.sender?.name}
                </p>
              )}

              <div
                className={[
                  "rounded-2xl px-4 py-2.5 shadow-sm",
                  isOwn
                    ? "rounded-br-md bg-brand-600 text-white"
                    : "rounded-bl-md bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100",
                ].join(" ")}
              >
                {message.content && (
                  <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">
                    {message.content}
                  </p>
                )}

                {message.attachments?.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {message.attachments.map((attachment, idx) => (
                      <a
                        key={idx}
                        href={attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={[
                          "flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-medium underline-offset-2 hover:underline",
                          isOwn
                            ? "bg-brand-700/60 text-white"
                            : "bg-white text-slate-700 dark:bg-slate-900 dark:text-slate-200",
                        ].join(" ")}
                      >
                        <Paperclip size={14} className="shrink-0" />
                        <span className="truncate">{attachment.filename}</span>
                      </a>
                    ))}
                  </div>
                )}

                <div
                  className={[
                    "mt-1 flex items-center gap-1.5",
                    isOwn ? "justify-end" : "justify-start",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "text-[11px]",
                      isOwn ? "text-brand-100" : "text-slate-500 dark:text-slate-400",
                    ].join(" ")}
                  >
                    {formatTime(message.timestamp || message.createdAt)}
                  </span>
                  {isOwn &&
                    (message.isRead ? (
                      <CheckCheck size={14} className="text-brand-100" aria-label="Read" />
                    ) : (
                      <Check size={14} className="text-brand-200" aria-label="Sent" />
                    ))}
                </div>
              </div>
            </div>
          </div>
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;
