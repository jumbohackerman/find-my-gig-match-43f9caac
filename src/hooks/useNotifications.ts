/**
 * Hook for notifications through the provider registry.
 * Supports realtime updates and per-item mark-as-read.
 */

import { useState, useEffect, useCallback } from "react";
import { getProvider } from "@/providers/registry";
import { useAuth } from "@/hooks/useAuth";
import type { Notification } from "@/domain/models";

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const result = await getProvider("notifications").listForUser(user.id);
    setNotifications(result.slice(0, 20));
    setLoading(false);
  }, [user]);

  useEffect(() => { fetch(); }, [fetch]);

  // Realtime subscription
  useEffect(() => {
    if (!user) return;
    const repo = getProvider("notifications");
    const unsub = repo.subscribe?.(user.id, (n) => {
      setNotifications((prev) => [n, ...prev].slice(0, 20));
    });
    return () => { unsub?.(); };
  }, [user]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = useCallback(async () => {
    if (!user) return;
    await getProvider("notifications").markAllRead(user.id);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, [user]);

  const markRead = useCallback(async (id: string) => {
    await getProvider("notifications").markRead(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  return { notifications, unreadCount, loading, markAllRead, markRead, refetch: fetch };
}
