import React from "react";

/** Short, relative-ish timestamp that never wraps the row. */
const formatPreviewTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();

  if (sameDay) {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  const diffDays = Math.floor((now - date) / 86400000);
  if (diffDays < 7) {
    return date.toLocaleDateString("en-US", { weekday: "short" });
  }

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const initialsOf = (name = "") =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "?";

export const ConversationPreview = ({
  conversation,
  currentUserId,
  isActive,
  onClick,
  onlineUsers = [],
}) => {
  const otherParticipant = conversation.participants?.find(
    (p) => p._id !== currentUserId,
  );

  const name = otherParticipant?.name || "Unknown user";
  const isOnline = onlineUsers.includes(otherParticipant?._id);
  const unread = conversation.unreadCount || 0;

  const sentByMe = conversation.lastMessage?.sender?._id === currentUserId;
  const previewText = conversation.lastMessage?.content
    ? `${sentByMe ? "You: " : ""}${conversation.lastMessage.content}`
    : "No messages yet";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={isActive ? "true" : undefined}
      className={[
        "flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-all",
        isActive
          ? "bg-brand-50 ring-1 ring-brand-200 dark:bg-brand-500/10 dark:ring-brand-500/25"
          : "hover:bg-slate-100 dark:hover:bg-slate-800",
      ].join(" ")}
    >
      <span className="relative shrink-0">
        {otherParticipant?.avatar ? (
          <img
            src={otherParticipant.avatar}
            alt=""
            className="h-11 w-11 rounded-full object-cover"
          />
        ) : (
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">
            {initialsOf(name)}
          </span>
        )}
        {isOnline && (
          <span
            className="absolute right-0 bottom-0 h-3 w-3 rounded-full bg-success-500 ring-2 ring-white dark:ring-slate-900"
            aria-label="Online"
          />
        )}
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-2">
          <span
            className={[
              "truncate text-sm font-semibold",
              isActive
                ? "text-brand-700 dark:text-brand-300"
                : "text-slate-900 dark:text-slate-50",
            ].join(" ")}
          >
            {name}
          </span>
          <span className="shrink-0 text-xs text-slate-500 dark:text-slate-400">
            {formatPreviewTime(conversation.lastMessageAt)}
          </span>
        </span>

        <span className="mt-0.5 flex items-center justify-between gap-2">
          <span
            className={[
              "truncate text-xs",
              unread > 0
                ? "font-semibold text-slate-700 dark:text-slate-200"
                : "text-slate-500 dark:text-slate-400",
            ].join(" ")}
          >
            {previewText}
          </span>
          {unread > 0 && (
            <span className="inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-danger-500 px-1.5 text-[11px] font-bold text-white">
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </span>
      </span>
    </button>
  );
};

export default ConversationPreview;
