/**
 * Supabase implementation of NotificationRepository.
 */

import { supabase } from "@/integrations/supabase/client";
import type { NotificationRepository } from "@/repositories/interfaces";
import type { Notification, NotificationType } from "@/domain/models";

interface DbNotification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  reference_id: string | null;
  created_at: string;
}

function toDomain(row: DbNotification): Notification {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type as NotificationType,
    title: row.title,
    body: row.body,
    read: row.read,
    referenceId: row.reference_id ?? undefined,
    createdAt: row.created_at,
  };
}

export const supabaseNotificationRepository: NotificationRepository = {
  async listForUser(userId) {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[supabaseNotificationRepo] listForUser error:", error);
      return [];
    }
    return (data as unknown as DbNotification[]).map(toDomain);
  },

  async markRead(notificationId) {
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", notificationId);

    if (error) {
      console.error("[supabaseNotificationRepo] markRead error:", error);
      throw new Error(`Failed to mark notification read: ${error.message}`);
    }
  },

  async markAllRead(userId) {
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", userId)
      .eq("read", false);

    if (error) {
      console.error("[supabaseNotificationRepo] markAllRead error:", error);
      throw new Error(`Failed to mark all read: ${error.message}`);
    }
  },

  async countUnread(userId) {
    const { count, error } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("read", false);

    if (error) {
      console.error("[supabaseNotificationRepo] countUnread error:", error);
      return 0;
    }
    return count ?? 0;
  },

  subscribe(userId, onNotification) {
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          onNotification(toDomain(payload.new as DbNotification));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
};
