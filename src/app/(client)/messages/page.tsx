"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Send,
  Paperclip,
  Image as ImageIcon,
  MoreVertical,
  Check,
  CheckCheck,
  Clock,
  Loader2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRealtimeMessages, type Message as RealtimeMessage } from "@/hooks/useRealtime";
import { NotificationToggle } from "@/components/NotificationToggle";

interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: Date;
  status: "sending" | "sent" | "delivered" | "read";
  type: "text" | "image";
  imageUrl?: string;
}

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [coachId, setCoachId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Use realtime messages hook
  const {
    messages: realtimeMessages,
    sendMessage: sendRealtimeMessage,
  } = useRealtimeMessages(conversationId);

  // Transform realtime message to our Message format
  const transformMessage = useCallback((msg: RealtimeMessage, userId: string | null): Message => ({
    id: msg.id,
    senderId: msg.sender_id === userId ? "client" : "coach",
    content: msg.content,
    timestamp: new Date(msg.created_at),
    status: msg.status === "read" ? "read" : "delivered",
    type: (msg.message_type === "image" ? "image" : "text") as "text" | "image",
    imageUrl: msg.attachment_url,
  }), []);

  // Load conversation and messages on mount
  useEffect(() => {
    async function loadConversation() {
      const supabase = createClient();

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

      setCurrentUserId(user.id);

      // Get client info to find coach
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: client } = await (supabase as any)
        .from("clients")
        .select("id, coach_id")
        .eq("user_id", user.id)
        .single();

      if (!client?.coach_id) {
        setIsLoading(false);
        return;
      }

      setCoachId(client.coach_id);

      // Find or create conversation with coach
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let { data: conversation } = await (supabase as any)
        .from("conversations")
        .select("id")
        .eq("client_id", client.id)
        .eq("coach_id", client.coach_id)
        .single();

      if (!conversation) {
        // Create conversation
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: newConv, error } = await (supabase as any)
          .from("conversations")
          .insert({
            client_id: client.id,
            coach_id: client.coach_id,
            tenant_id: "00000000-0000-0000-0000-000000000001",
          })
          .select()
          .single();

        if (error) {
          console.error("Error creating conversation:", error);
          setIsLoading(false);
          return;
        }
        conversation = newConv;
      }

      setConversationId(conversation.id);

      // Load existing messages
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: existingMessages } = await (supabase as any)
        .from("messages")
        .select("*")
        .eq("conversation_id", conversation.id)
        .order("created_at", { ascending: true });

      if (existingMessages) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setMessages(existingMessages.map((msg: any) => transformMessage(msg as RealtimeMessage, user.id)));
      }

      setIsLoading(false);
    }

    loadConversation();
  }, [transformMessage]);

  // Update messages when realtime messages arrive
  useEffect(() => {
    if (realtimeMessages.length > 0 && currentUserId) {
      const transformedNew = realtimeMessages.map(msg => transformMessage(msg, currentUserId));
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMessages(prev => {
        // Avoid duplicates
        const existingIds = new Set(prev.map(m => m.id));
        const newMsgs = transformedNew.filter(m => !existingIds.has(m.id));
        return [...prev, ...newMsgs];
      });
    }
  }, [realtimeMessages, currentUserId, transformMessage]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }
  };

  const shouldShowDateHeader = (index: number) => {
    if (index === 0) return true;
    const currentDate = messages[index].timestamp.toDateString();
    const prevDate = messages[index - 1].timestamp.toDateString();
    return currentDate !== prevDate;
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !conversationId) return;

    const tempId = Date.now().toString();
    const message: Message = {
      id: tempId,
      senderId: "client",
      content: newMessage,
      timestamp: new Date(),
      status: "sending",
      type: "text",
    };

    // Optimistically add message
    setMessages((prev) => [...prev, message]);
    setNewMessage("");

    // Send to Supabase with recipient ID for push notification
    const sentMessage = await sendRealtimeMessage(newMessage, "text", undefined, coachId || undefined);

    if (sentMessage) {
      // Update with real message data
      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempId
            ? { ...m, id: sentMessage.id, status: "delivered" as const }
            : m
        )
      );
    } else {
      // Mark as failed
      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempId ? { ...m, status: "sent" as const } : m
        )
      );
    }
  };

  const renderStatusIcon = (status: Message["status"]) => {
    switch (status) {
      case "sending":
        return <Clock className="w-3 h-3 text-stone-400" />;
      case "sent":
        return <Check className="w-3 h-3 text-stone-400" />;
      case "delivered":
        return <CheckCheck className="w-3 h-3 text-stone-400" />;
      case "read":
        return <CheckCheck className="w-3 h-3 text-blue-500" />;
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] lg:h-[calc(100vh-6rem)] flex flex-col bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 overflow-hidden">
      {/* Chat Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-stone-200 dark:border-stone-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-brown-100 dark:bg-brown-900/30 flex items-center justify-center">
            <span className="text-brown-500 font-semibold">C</span>
          </div>
          <div>
            <h2 className="font-semibold text-stone-800 dark:text-stone-100">
              Your Coach
            </h2>
            <p className="text-xs text-green-500">Online</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <NotificationToggle compact />
          <button className="p-2 text-stone-500 hover:text-stone-700 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 text-brown-500 animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-stone-500">
            <p>No messages yet.</p>
            <p className="text-sm">Send a message to start the conversation!</p>
          </div>
        ) : null}
        {messages.map((message, index) => {
          const isOwnMessage = message.senderId === "client";

          return (
            <div key={message.id}>
              {/* Date Header */}
              {shouldShowDateHeader(index) && (
                <div className="flex justify-center my-4">
                  <span className="px-3 py-1 text-xs text-stone-500 bg-stone-100 dark:bg-stone-800 rounded-full">
                    {formatDate(message.timestamp)}
                  </span>
                </div>
              )}

              {/* Message Bubble */}
              <div
                className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[75%] ${
                    isOwnMessage
                      ? "bg-brown-500 text-white rounded-2xl rounded-br-md"
                      : "bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 rounded-2xl rounded-bl-md"
                  }`}
                >
                  {message.type === "image" ? (
                    <div className="p-1">
                      <div className="w-48 h-48 bg-stone-200 dark:bg-stone-700 rounded-xl flex items-center justify-center">
                        <ImageIcon className="w-8 h-8 text-stone-400" />
                      </div>
                    </div>
                  ) : (
                    <p className="px-4 py-2 whitespace-pre-wrap">{message.content}</p>
                  )}

                  {/* Time and Status */}
                  <div
                    className={`flex items-center gap-1 px-4 pb-2 ${
                      isOwnMessage ? "justify-end" : ""
                    }`}
                  >
                    <span
                      className={`text-xs ${
                        isOwnMessage
                          ? "text-brown-200"
                          : "text-stone-500"
                      }`}
                    >
                      {formatTime(message.timestamp)}
                    </span>
                    {isOwnMessage && renderStatusIcon(message.status)}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-stone-100 dark:bg-stone-800 rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-stone-400 rounded-full animate-bounce" />
                <span
                  className="w-2 h-2 bg-stone-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                />
                <span
                  className="w-2 h-2 bg-stone-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-stone-200 dark:border-stone-800">
        <div className="flex items-center gap-2">
          <button className="p-2 text-stone-500 hover:text-stone-700 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800">
            <Paperclip className="w-5 h-5" />
          </button>
          <button className="p-2 text-stone-500 hover:text-stone-700 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800">
            <ImageIcon className="w-5 h-5" />
          </button>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2.5 rounded-full border border-stone-300 dark:border-stone-600 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-brown-500"
          />
          <button
            onClick={handleSend}
            disabled={!newMessage.trim()}
            className="p-2.5 bg-brown-500 text-white rounded-full hover:bg-brown-600 disabled:bg-stone-300 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
