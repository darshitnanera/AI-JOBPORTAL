import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  Inbox,
  MessagesSquare,
  RefreshCw,
  Search,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import Navbar from "../../components/Navbar/Navbar";
import { MessageList } from "../../components/Messages/MessageList";
import { MessageInput } from "../../components/Messages/MessageInput";
import { TypingIndicator } from "../../components/Messages/TypingIndicator";
import { ConversationPreview } from "../../components/Messages/ConversationPreview";
import {
  initializeSocket,
  disconnectSocket,
  onReceiveMessage,
  onUserTyping,
  onMessageRead,
  onUserOnline,
  onUserOffline,
  sendMessage,
  joinChat,
  leaveChat,
  sendTyping,
} from "../../services/socketService";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

const initialsOf = (name = "") =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "?";

/* ---------------------------------------------------------------- skeletons */

const ConversationSkeleton = () => (
  <div className="space-y-1 p-2">
    {Array.from({ length: 7 }).map((_, i) => (
      <div key={i} className="flex items-center gap-3 rounded-xl px-3 py-3">
        <div className="h-11 w-11 shrink-0 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="h-3 w-2/3 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
          <div className="h-3 w-full animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
        </div>
      </div>
    ))}
  </div>
);

/* ------------------------------------------------------------------- page */

export const Messages = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [conversations, setConversations] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [conversationsError, setConversationsError] = useState("");
  const [messagesError, setMessagesError] = useState("");
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  /* ---------------------------------------------------------------- data */

  const fetchConversations = useCallback(async () => {
    try {
      setIsLoadingConversations(true);
      setConversationsError("");

      const response = await axios.get(`${API_BASE_URL}/api/messages/list`, {
        headers: authHeaders(),
      });

      if (response.data.success) {
        setConversations(response.data.data.conversations || []);

        const unreadResponse = await axios.get(
          `${API_BASE_URL}/api/messages/unread-count`,
          { headers: authHeaders() },
        );
        setUnreadCount(unreadResponse.data.data.unreadCount || 0);
      } else {
        setConversationsError("We couldn't load your conversations.");
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
      setConversationsError(
        error?.response?.data?.message ||
          "We couldn't reach the messaging service. Check your connection and try again.",
      );
    } finally {
      setIsLoadingConversations(false);
    }
  }, []);

  // Initialize socket connection
  useEffect(() => {
    // AuthContext hydrates from localStorage in an effect, so `user` is null
    // on the first render. Redirecting before hydration completes bounced
    // every signed-in user back to /login.
    if (authLoading) return;

    if (!user) {
      navigate("/login");
      return;
    }

    initializeSocket(user._id || user.id);

    onReceiveMessage((message) => {
      setMessages((prev) => [...prev, message]);
    });

    onUserTyping((data) => {
      if (data.userId !== user._id) {
        setOtherUserTyping(data.isTyping);
      }
    });

    onMessageRead((data) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === data.messageId
            ? { ...msg, isRead: true, readAt: data.readAt }
            : msg,
        ),
      );
    });

    onUserOnline((data) => {
      setOnlineUsers((prev) =>
        prev.includes(data.userId) ? prev : [...prev, data.userId],
      );
    });

    onUserOffline((data) => {
      setOnlineUsers((prev) => prev.filter((id) => id !== data.userId));
    });

    fetchConversations();

    return () => {
      disconnectSocket();
    };
  }, [user, authLoading, navigate, fetchConversations]);

  const fetchChatMessages = useCallback(
    async (chatId) => {
      try {
        setIsLoadingMessages(true);
        setMessagesError("");
        setMessages([]);

        const chat = conversations.find((c) => c.chatId === chatId);
        if (!chat) return;

        const otherUserId = chat.participants.find((p) => p._id !== user._id)?._id;
        if (!otherUserId) return;

        const response = await axios.get(
          `${API_BASE_URL}/api/messages/chat/${otherUserId}`,
          { headers: authHeaders() },
        );

        if (response.data.success) {
          setMessages(response.data.data.messages || []);

          if (chat.unreadCount > 0) {
            await axios.put(
              `${API_BASE_URL}/api/messages/chat/${chatId}/read`,
              {},
              { headers: authHeaders() },
            );

            setConversations((prev) =>
              prev.map((c) => (c.chatId === chatId ? { ...c, unreadCount: 0 } : c)),
            );
            setUnreadCount((prev) => Math.max(0, prev - chat.unreadCount));
          }
        } else {
          setMessagesError("We couldn't load this conversation.");
        }

        joinChat(chatId);
      } catch (error) {
        console.error("Error fetching chat messages:", error);
        setMessagesError(
          error?.response?.data?.message ||
            "Something went wrong loading these messages.",
        );
      } finally {
        setIsLoadingMessages(false);
      }
    },
    [conversations, user],
  );

  const handleSelectChat = (conversation) => {
    if (selectedChat && selectedChat.chatId !== conversation.chatId) {
      leaveChat(selectedChat.chatId);
    }
    setOtherUserTyping(false);
    setSelectedChat(conversation);
    fetchChatMessages(conversation.chatId);
  };

  const handleBackToList = () => {
    if (selectedChat) leaveChat(selectedChat.chatId);
    setSelectedChat(null);
    setOtherUserTyping(false);
  };

  const handleSendMessage = async (content, attachments) => {
    if (!selectedChat) return;
    try {
      await sendMessage(selectedChat.chatId, content, attachments);
    } catch (error) {
      console.error("Error sending message:", error);
      setMessagesError("Your message couldn't be sent. Please try again.");
    }
  };

  const handleTyping = (e) => {
    if (!selectedChat) return;
    sendTyping(selectedChat.chatId, e.target.value.length > 0);
  };

  /* -------------------------------------------------------------- derived */

  const otherParticipant = selectedChat?.participants?.find(
    (p) => p._id !== user?._id,
  );
  const isOtherOnline = onlineUsers.includes(otherParticipant?._id);

  const filteredConversations = conversations.filter((conv) => {
    const other = conv.participants?.find((p) => p._id !== user?._id);
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      other?.name?.toLowerCase().includes(q) ||
      other?.email?.toLowerCase().includes(q)
    );
  });

  /* ----------------------------------------------------------------- ui */

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-50 dark:bg-slate-950">
      <Navbar />

      <div className="grid h-[calc(100vh-4rem)] lg:h-[calc(100vh-4.5rem)] lg:grid-cols-[320px_1fr]">
        {/* ------------------------------------------------ conversation list */}
        <aside
          className={[
            "min-w-0 flex-col border-slate-200 bg-white lg:flex lg:border-r dark:border-slate-800 dark:bg-slate-900",
            selectedChat ? "hidden" : "flex",
          ].join(" ")}
        >
          <div className="shrink-0 border-b border-slate-200 px-4 py-4 dark:border-slate-800">
            <div className="flex items-center justify-between gap-3">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                Messages
              </h1>
              {unreadCount > 0 && (
                <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-danger-500 px-2 text-xs font-bold text-white">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </div>

            <div className="relative mt-3">
              <Search
                size={16}
                className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-400"
              />
              <label className="visually-hidden" htmlFor="conversation-search">
                Search conversations
              </label>
              <input
                id="conversation-search"
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations"
                className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pr-4 pl-9 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {isLoadingConversations ? (
              <ConversationSkeleton />
            ) : conversationsError ? (
              <div className="flex flex-col items-center gap-3 p-6 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-danger-50 text-danger-600 dark:bg-danger-500/10">
                  <AlertCircle size={20} />
                </span>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-50">
                  Couldn&apos;t load conversations
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {conversationsError}
                </p>
                <button
                  type="button"
                  onClick={fetchConversations}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <RefreshCw size={16} />
                  Retry
                </button>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center gap-3 p-6 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300">
                  <Inbox size={20} />
                </span>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-50">
                  {searchQuery ? "No matches" : "No conversations yet"}
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {searchQuery
                    ? "Try a different name or email address."
                    : "Messages from recruiters and candidates will show up here."}
                </p>
                {!searchQuery && (
                  <button
                    type="button"
                    onClick={() => navigate("/jobs")}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-700 hover:shadow-md active:scale-[0.98]"
                  >
                    Browse jobs
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-1 p-2">
                {filteredConversations.map((conversation) => (
                  <ConversationPreview
                    key={conversation.chatId}
                    conversation={conversation}
                    currentUserId={user?._id}
                    isActive={selectedChat?.chatId === conversation.chatId}
                    onClick={() => handleSelectChat(conversation)}
                    onlineUsers={onlineUsers}
                  />
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* ------------------------------------------------------ message thread */}
        <section
          className={[
            "min-w-0 flex-col bg-slate-50 lg:flex dark:bg-slate-950",
            selectedChat ? "flex" : "hidden",
          ].join(" ")}
        >
          {selectedChat ? (
            <>
              <header className="flex shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
                <button
                  type="button"
                  onClick={handleBackToList}
                  aria-label="Back to conversations"
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-700 transition-all hover:bg-slate-50 lg:hidden dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <ArrowLeft size={18} />
                </button>

                <span className="relative shrink-0">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">
                    {initialsOf(otherParticipant?.name)}
                  </span>
                  {isOtherOnline && (
                    <span className="absolute right-0 bottom-0 h-3 w-3 rounded-full bg-success-500 ring-2 ring-white dark:ring-slate-900" />
                  )}
                </span>

                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-base font-bold text-slate-900 dark:text-slate-50">
                    {otherParticipant?.name || "Conversation"}
                  </h2>
                  <p
                    className={[
                      "text-xs font-medium",
                      isOtherOnline
                        ? "text-success-600"
                        : "text-slate-500 dark:text-slate-400",
                    ].join(" ")}
                  >
                    {isOtherOnline ? "Online" : "Offline"}
                  </p>
                </div>
              </header>

              <MessageList
                messages={messages}
                currentUserId={user?._id}
                isLoading={isLoadingMessages}
                error={messagesError}
                onRetry={() => fetchChatMessages(selectedChat.chatId)}
              />

              <TypingIndicator
                isTyping={otherUserTyping}
                username={otherParticipant?.name || "They"}
              />

              <MessageInput
                onSendMessage={handleSendMessage}
                onTyping={handleTyping}
                isLoading={false}
              />
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300">
                <MessagesSquare size={24} />
              </span>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                Select a conversation
              </h2>
              <p className="max-w-sm text-sm text-slate-600 dark:text-slate-400">
                Pick someone from the list to read the thread and reply.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Messages;
