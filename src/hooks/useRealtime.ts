import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: "text" | "image";
  image_url?: string;
  created_at: string;
  read_at?: string;
}

export interface Conversation {
  id: string;
  client_id: string;
  coach_id: string;
  last_message?: string;
  last_message_at?: string;
  unread_count: number;
}

/**
 * Hook for subscribing to real-time message updates
 */
export function useRealtimeMessages(conversationId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!conversationId) return;

    const supabase = createClient();
    if (!supabase) {
      setError(new Error("Supabase client not available"));
      return;
    }

    let channel: RealtimeChannel;

    const setupSubscription = async () => {
      try {
        // Subscribe to new messages in this conversation
        channel = supabase
          .channel(`messages:${conversationId}`)
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "messages",
              filter: `conversation_id=eq.${conversationId}`,
            },
            (payload) => {
              const newMessage = payload.new as Message;
              setMessages((prev) => [...prev, newMessage]);
            }
          )
          .on(
            "postgres_changes",
            {
              event: "UPDATE",
              schema: "public",
              table: "messages",
              filter: `conversation_id=eq.${conversationId}`,
            },
            (payload) => {
              const updatedMessage = payload.new as Message;
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === updatedMessage.id ? updatedMessage : msg
                )
              );
            }
          )
          .subscribe((status) => {
            setIsConnected(status === "SUBSCRIBED");
          });
      } catch (err) {
        setError(err as Error);
      }
    };

    setupSubscription();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [conversationId]);

  const sendMessage = useCallback(
    async (
      content: string,
      messageType: "text" | "image" = "text",
      imageUrl?: string,
      recipientId?: string
    ) => {
      if (!conversationId) return null;

      const supabase = createClient();
      if (!supabase) return null;

      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return null;

      // Get user role from metadata
      const userRole = user.user.app_metadata?.role || "client";

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("messages")
        .insert({
          conversation_id: conversationId,
          sender_id: user.user.id,
          content,
          message_type: messageType,
          image_url: imageUrl,
          topic: "chat",
          sender_role: userRole,
          extension: "realtime:broadcast",
        })
        .select()
        .single();

      if (error) {
        console.error("Error sending message:", error);
        return null;
      }

      // Send push notification to recipient
      if (recipientId && data) {
        try {
          await fetch("/api/messages/notify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              conversationId,
              messageContent: content,
              recipientId,
            }),
          });
        } catch (notifyError) {
          // Don't fail the message send if notification fails
          console.error("Failed to send push notification:", notifyError);
        }
      }

      return data;
    },
    [conversationId]
  );

  const markAsRead = useCallback(
    async (messageId: string) => {
      const supabase = createClient();
      if (!supabase) return;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from("messages")
        .update({ read_at: new Date().toISOString() })
        .eq("id", messageId);
    },
    []
  );

  return {
    messages,
    setMessages,
    isConnected,
    error,
    sendMessage,
    markAsRead,
  };
}

/**
 * Hook for subscribing to conversation list updates
 */
export function useRealtimeConversations(userId: string | null) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!userId) return;

    const supabase = createClient();
    if (!supabase) return;

    let channel: RealtimeChannel;

    const setupSubscription = async () => {
      channel = supabase
        .channel(`conversations:${userId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "conversations",
          },
          (payload) => {
            if (payload.eventType === "INSERT") {
              setConversations((prev) => [payload.new as Conversation, ...prev]);
            } else if (payload.eventType === "UPDATE") {
              setConversations((prev) =>
                prev.map((conv) =>
                  conv.id === (payload.new as Conversation).id
                    ? (payload.new as Conversation)
                    : conv
                )
              );
            }
          }
        )
        .subscribe((status) => {
          setIsConnected(status === "SUBSCRIBED");
        });
    };

    setupSubscription();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [userId]);

  return { conversations, setConversations, isConnected };
}

/**
 * Hook for real-time notifications
 */
export function useRealtimeNotifications(userId: string | null) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!userId) return;

    const supabase = createClient();
    if (!supabase) return;

    let channel: RealtimeChannel;

    const setupSubscription = async () => {
      channel = supabase
        .channel(`notifications:${userId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notification_queue",
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            setNotifications((prev) => [payload.new as Notification, ...prev]);
            setUnreadCount((prev) => prev + 1);
          }
        )
        .subscribe();
    };

    setupSubscription();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [userId]);

  const markAllRead = useCallback(async () => {
    const supabase = createClient();
    if (!supabase || !userId) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from("notification_queue")
      .update({ read_at: new Date().toISOString() })
      .eq("user_id", userId)
      .is("read_at", null);

    setUnreadCount(0);
  }, [userId]);

  return { notifications, unreadCount, markAllRead };
}

/**
 * Hook for typing indicators
 */
export function useTypingIndicator(conversationId: string | null) {
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  useEffect(() => {
    if (!conversationId) return;

    const supabase = createClient();
    if (!supabase) return;

    let channel: RealtimeChannel;

    const setupSubscription = async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      channel = supabase
        .channel(`typing:${conversationId}`)
        .on("presence", { event: "sync" }, () => {
          const state = channel.presenceState();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const presenceData = Object.values(state).flat() as any[];
          const users = presenceData
            .filter((p) => p.typing && p.user_id !== user.user?.id)
            .map((p) => p.user_id as string);
          setTypingUsers(users);
        })
        .subscribe();
    };

    setupSubscription();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [conversationId]);

  const setTyping = useCallback(
    async (isTyping: boolean) => {
      if (!conversationId) return;

      const supabase = createClient();
      if (!supabase) return;

      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const channel = supabase.channel(`typing:${conversationId}`);
      await channel.track({ user_id: user.user.id, typing: isTyping });
    },
    [conversationId]
  );

  return { typingUsers, setTyping };
}
