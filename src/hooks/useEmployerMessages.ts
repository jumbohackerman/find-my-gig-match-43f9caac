/**
 * Employer-side hook for candidate messaging.
 * Uses the message repository — backend-agnostic.
 * Manages per-application chat state and unlock logic.
 */

import { useState, useCallback, useEffect } from "react";
import { getProvider } from "@/providers/registry";
import type { Message } from "@/domain/models";

export interface ChatMessage {
  id: string;
  applicationId: string;
  senderId: string;
  senderName: string;
  content: string;
  createdAt: string;
}

/** Convert domain Message → ChatMessage for the UI */
function toChatMessage(msg: Message, senderName: string): ChatMessage {
  return {
    id: msg.id,
    applicationId: msg.applicationId,
    senderId: msg.senderId,
    senderName,
    content: msg.content,
    createdAt: msg.createdAt,
  };
}

export function useEmployerMessages(employerId: string | undefined) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [unlockedChats, setUnlockedChats] = useState<Set<string>>(new Set());

  const loadMessages = useCallback(
    async (applicationId: string) => {
      const repo = getProvider("messages");
      const msgs = await repo.listByApplication(applicationId);
      const chatMsgs = msgs.map((m) =>
        toChatMessage(m, m.senderId === employerId ? "Ty" : "Kandydat"),
      );
      setMessages((prev) => {
        const other = prev.filter((m) => m.applicationId !== applicationId);
        return [...other, ...chatMsgs];
      });
    },
    [employerId],
  );

  const sendMessage = useCallback(
    async (applicationId: string, content: string) => {
      if (!employerId) return;
      const repo = getProvider("messages");
      const msg = await repo.send(applicationId, employerId, content);
      const chatMsg = toChatMessage(msg, "Ty");
      setMessages((prev) => [...prev, chatMsg]);
    },
    [employerId],
  );

  const unlockChat = useCallback((applicationId: string) => {
    setUnlockedChats((prev) => new Set(prev).add(applicationId));
  }, []);

  const isChatOpen = useCallback(
    (applicationId: string) =>
      unlockedChats.has(applicationId) ||
      messages.some((m) => m.applicationId === applicationId),
    [unlockedChats, messages],
  );

  const getMessages = useCallback(
    (applicationId: string) =>
      messages.filter((m) => m.applicationId === applicationId),
    [messages],
  );

  return {
    messages,
    sendMessage,
    unlockChat,
    isChatOpen,
    getMessages,
    loadMessages,
  };
}
