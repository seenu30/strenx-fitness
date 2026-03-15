"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Search,
  MessageSquare,
  CheckCheck,
  Send,
  Loader2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { NotificationToggle } from "@/components/NotificationToggle";
import type { RealtimeChannel, SupabaseClient, RealtimePostgresChangesPayload } from "@supabase/supabase-js";

interface ConversationRow {
  id: string;
  client_id: string;
  last_message_preview: string | null;
  last_message_at: string | null;
  clients: {
    id: string;
    users: {
      first_name: string;
      last_name: string;
    };
    subscriptions: Array<{
      subscription_plans: {
        name: string;
      };
    }>;
  };
}

interface ClientRow {
  user_id: string;
}

interface Conversation {
  id: string;
  client_id: string;
  client_name: string;
  client_initials: string;
  last_message: string;
  last_message_at: Date;
  unread_count: number;
  plan_name: string;
}

interface Message {
  id: string;
  sender_id: string;
  sender_role: string;
  content: string;
  created_at: string;
  status: "sent" | "delivered" | "read" | null;
  message_type: string;
}

type FilterType = "all" | "unread";

export default function AdminMessagesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [clientUserId, setClientUserId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Load conversations
  useEffect(() => {
    async function loadConversations() {
      const supabase = createClient();

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

      setCurrentUserId(user.id);

      const { data: coach } = await (supabase as SupabaseClient)
        .from("coaches")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!coach) {
        setIsLoading(false);
        return;
      }

      const { data: convs } = await (supabase as SupabaseClient)
        .from("conversations")
        .select(`
          id,
          client_id,
          last_message_preview,
          last_message_at,
          clients!inner (
            id,
            users!inner (
              first_name,
              last_name
            ),
            subscriptions (
              subscription_plans (
                name
              )
            )
          )
        `)
        .eq("coach_id", coach.id)
        .order("last_message_at", { ascending: false, nullsFirst: false });

      if (convs) {
        const typedConvs = convs as unknown as ConversationRow[];
        const mappedConvs: Conversation[] = typedConvs.map((conv) => {
          const firstName = conv.clients?.users?.first_name || "";
          const lastName = conv.clients?.users?.last_name || "";
          const name = `${firstName} ${lastName}`.trim() || "Client";
          const initials = name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase();
          const planName = conv.clients?.subscriptions?.[0]?.subscription_plans?.name || "No Plan";

          return {
            id: conv.id,
            client_id: conv.client_id,
            client_name: name,
            client_initials: initials,
            last_message: conv.last_message_preview || "No messages yet",
            last_message_at: conv.last_message_at ? new Date(conv.last_message_at) : new Date(),
            unread_count: 0,
            plan_name: planName,
          };
        });

        for (const conv of mappedConvs) {
          const { count } = await (supabase as SupabaseClient)
            .from("messages")
            .select("*", { count: "exact", head: true })
            .eq("conversation_id", conv.id)
            .neq("sender_id", user.id)
            .neq("status", "read");
          conv.unread_count = count || 0;
        }

        setConversations(mappedConvs);
        if (mappedConvs.length > 0 && !selectedConversation) {
          setSelectedConversation(mappedConvs[0]);
        }
      }

      setIsLoading(false);
    }

    loadConversations();
  }, [selectedConversation]);

  useEffect(() => {
    if (!selectedConversation) return;

    const conversation = selectedConversation;
    const supabaseForEffect = createClient();

    async function loadMessages() {
      setIsLoadingMessages(true);
      const supabase = createClient();

      const { data: client } = await (supabase as SupabaseClient)
        .from("clients")
        .select("user_id")
        .eq("id", conversation.client_id)
        .single();

      if (client) {
        const typedClient = client as unknown as ClientRow;
        setClientUserId(typedClient.user_id);
      }

      const { data: msgs } = await (supabase as SupabaseClient)
        .from("messages")
        .select("*")
        .eq("conversation_id", conversation.id)
        .order("created_at", { ascending: true });

      if (msgs) {
        setMessages(msgs as Message[]);
      }

      if (currentUserId) {
        await (supabase as SupabaseClient)
          .from("messages")
          .update({ status: "read" })
          .eq("conversation_id", conversation.id)
          .neq("sender_id", currentUserId)
          .neq("status", "read");

        setConversations(prev =>
          prev.map(c =>
            c.id === conversation.id ? { ...c, unread_count: 0 } : c
          )
        );
      }

      setIsLoadingMessages(false);
    }

    loadMessages();

    if (supabaseForEffect && selectedConversation) {
      if (channelRef.current) {
        supabaseForEffect.removeChannel(channelRef.current);
      }

      channelRef.current = supabaseForEffect
        .channel(`messages:${selectedConversation.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `conversation_id=eq.${selectedConversation.id}`,
          },
          (payload: RealtimePostgresChangesPayload<Message>) => {
            const newMsg = payload.new as Message;
            setMessages((prev) => [...prev, newMsg]);
          }
        )
        .subscribe();
    }

    return () => {
      if (channelRef.current && supabaseForEffect) {
        supabaseForEffect.removeChannel(channelRef.current);
      }
    };
  }, [selectedConversation, currentUserId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedConversation || !currentUserId) return;

    setIsSending(true);
    const supabase = createClient();

    const messageContent = newMessage;
    setNewMessage("");

    const { data, error } = await (supabase as SupabaseClient)
      .from("messages")
      .insert({
        conversation_id: selectedConversation.id,
        sender_id: currentUserId,
        content: messageContent,
        message_type: "text",
        sender_role: "coach",
        status: "sent",
      })
      .select()
      .single();

    if (error) {
      console.error("Error sending message:", error);
      setNewMessage(messageContent);
    } else if (data) {
      await (supabase as SupabaseClient)
        .from("conversations")
        .update({
          last_message_preview: messageContent,
          last_message_at: new Date().toISOString(),
        })
        .eq("id", selectedConversation.id);

      setConversations(prev =>
        prev.map(c =>
          c.id === selectedConversation.id
            ? { ...c, last_message: messageContent, last_message_at: new Date() }
            : c
        )
      );

      if (clientUserId) {
        try {
          await fetch("/api/messages/notify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              conversationId: selectedConversation.id,
              messageContent,
              recipientId: clientUserId,
            }),
          });
        } catch (err) {
          console.error("Failed to send push notification:", err);
        }
      }
    }

    setIsSending(false);
  };

  const filteredConversations = conversations.filter((conv) => {
    const matchesSearch = conv.client_name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesFilter =
      filter === "all" || (filter === "unread" && conv.unread_count > 0);
    return matchesSearch && matchesFilter;
  });

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } else if (days === 1) {
      return "Yesterday";
    } else if (days < 7) {
      return date.toLocaleDateString("en-US", { weekday: "short" });
    } else {
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }
  };

  const formatMessageTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const totalUnread = conversations.reduce(
    (sum, conv) => sum + conv.unread_count,
    0
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <Loader2 className="w-8 h-8 text-brown-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 overflow-hidden">
      {/* Conversations List */}
      <div className="w-full md:w-80 lg:w-96 border-r border-stone-200 dark:border-stone-800 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-stone-200 dark:border-stone-800">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-lg font-semibold text-stone-800 dark:text-stone-100">
              Messages
              {totalUnread > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs font-bold bg-brown-500 text-white rounded-full">
                  {totalUnread}
                </span>
              )}
            </h1>
            <NotificationToggle compact />
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-stone-300 dark:border-stone-600 bg-stone-50 dark:bg-stone-800 text-stone-800 dark:text-stone-200 text-sm focus:ring-2 focus:ring-brown-500 focus:border-transparent"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            {(["all", "unread"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 text-xs font-medium rounded-full capitalize ${
                  filter === f
                    ? "bg-brown-500 text-white"
                    : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400"
                }`}
              >
                {f}
                {f === "unread" && totalUnread > 0 && ` (${totalUnread})`}
              </button>
            ))}
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-stone-500">
              {conversations.length === 0
                ? "No conversations yet"
                : "No conversations found"}
            </div>
          ) : (
            filteredConversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setSelectedConversation(conv)}
                className={`w-full p-4 flex items-start gap-3 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors ${
                  selectedConversation?.id === conv.id
                    ? "bg-brown-50 dark:bg-brown-900/20 border-l-2 border-brown-500"
                    : ""
                }`}
              >
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full bg-brown-100 dark:bg-brown-900/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-brown-600 dark:text-brown-400 font-semibold">
                    {conv.client_initials}
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-stone-800 dark:text-stone-100 truncate">
                      {conv.client_name}
                    </span>
                    <span className="text-xs text-stone-500 flex-shrink-0 ml-2">
                      {formatTime(conv.last_message_at)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-stone-600 dark:text-stone-400 truncate">
                      {conv.last_message}
                    </p>
                    {conv.unread_count > 0 && (
                      <span className="ml-2 px-1.5 py-0.5 text-xs font-bold bg-brown-500 text-white rounded-full min-w-[20px] text-center">
                        {conv.unread_count}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-stone-400 mt-1">{conv.plan_name}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat Area - Desktop */}
      <div className="hidden md:flex flex-1 flex-col">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 dark:border-stone-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brown-100 dark:bg-brown-900/30 flex items-center justify-center">
                  <span className="text-brown-600 dark:text-brown-400 font-semibold">
                    {selectedConversation.client_initials}
                  </span>
                </div>
                <div>
                  <h2 className="font-semibold text-stone-800 dark:text-stone-100">
                    {selectedConversation.client_name}
                  </h2>
                  <p className="text-xs text-stone-500">{selectedConversation.plan_name}</p>
                </div>
              </div>
              <Link
                href={`/admin/clients/${selectedConversation.client_id}`}
                className="px-3 py-1.5 text-sm text-brown-500 border border-brown-500 rounded-lg hover:bg-brown-50 dark:hover:bg-brown-900/20"
              >
                View Profile
              </Link>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {isLoadingMessages ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-8 h-8 text-brown-500 animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-stone-500">
                  <MessageSquare className="w-12 h-12 mb-4 text-stone-300" />
                  <p>No messages yet</p>
                  <p className="text-sm mt-1">Start the conversation!</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isOwn = msg.sender_id === currentUserId;
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[75%] ${
                          isOwn
                            ? "bg-brown-500 text-white rounded-2xl rounded-br-md"
                            : "bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 rounded-2xl rounded-bl-md"
                        }`}
                      >
                        <p className="px-4 py-2 whitespace-pre-wrap">{msg.content}</p>
                        <div
                          className={`flex items-center gap-1 px-4 pb-2 ${
                            isOwn ? "justify-end" : ""
                          }`}
                        >
                          <span
                            className={`text-xs ${
                              isOwn ? "text-brown-200" : "text-stone-500"
                            }`}
                          >
                            {formatMessageTime(msg.created_at)}
                          </span>
                          {isOwn && (
                            msg.status === "read" ? (
                              <CheckCheck className="w-3 h-3 text-blue-300" />
                            ) : (
                              <CheckCheck className="w-3 h-3 text-brown-200" />
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-stone-200 dark:border-stone-800">
              <div className="flex items-center gap-2">
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
                  disabled={!newMessage.trim() || isSending}
                  className="p-2.5 bg-brown-500 text-white rounded-full hover:bg-brown-600 disabled:bg-stone-300 disabled:cursor-not-allowed transition-colors"
                >
                  {isSending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-stone-500">
            <div className="text-center">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 text-stone-300" />
              <p>Select a conversation to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
