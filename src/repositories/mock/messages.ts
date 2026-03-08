/**
 * Mock message repository — in-memory store for demo mode.
 */

import type { MessageRepository } from "@/repositories/interfaces";
import type { Message } from "@/domain/models";

let store: Message[] = [];

export const mockMessageRepository: MessageRepository = {
  async listByApplication(applicationId: string): Promise<Message[]> {
    return store.filter((m) => m.applicationId === applicationId);
  },

  async send(applicationId, senderId, content): Promise<Message> {
    const msg: Message = {
      id: `mock-msg-${Date.now()}`,
      applicationId,
      senderId,
      content,
      createdAt: new Date().toISOString(),
    };
    store = [...store, msg];
    return msg;
  },

  subscribe(_applicationId, _onMessage) {
    // No-op in mock mode
    return () => {};
  },
};
