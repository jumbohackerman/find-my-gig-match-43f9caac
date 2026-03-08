/**
 * Mock notification repository — in-memory, always empty in demo mode.
 */

import type { NotificationRepository } from "@/repositories/interfaces";
import type { Notification } from "@/domain/models";

let store: Notification[] = [];

export const mockNotificationRepository: NotificationRepository = {
  async listForUser(userId: string): Promise<Notification[]> {
    return store.filter((n) => n.userId === userId);
  },

  async markRead(notificationId: string): Promise<void> {
    store = store.map((n) =>
      n.id === notificationId ? { ...n, read: true } : n,
    );
  },

  async markAllRead(userId: string): Promise<void> {
    store = store.map((n) =>
      n.userId === userId ? { ...n, read: true } : n,
    );
  },

  async countUnread(userId: string): Promise<number> {
    return store.filter((n) => n.userId === userId && !n.read).length;
  },

  subscribe(_userId, _onNotification) {
    return () => {};
  },
};
