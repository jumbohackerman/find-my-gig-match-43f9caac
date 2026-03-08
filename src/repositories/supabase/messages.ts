/**
 * Supabase implementation of MessageRepository.
 */

import { supabase } from "@/integrations/supabase/client";
import type { MessageRepository } from "@/repositories/interfaces";
import type { Message } from "@/domain/models";

export const supabaseMessageRepository: MessageRepository = {
  async listByApplication(applicationId: string): Promise<Message[]> {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("application_id", applicationId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("[supabaseMessageRepo] listByApplication error:", error);
      return [];
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      applicationId: row.application_id,
      senderId: row.sender_id,
      content: row.content,
      createdAt: row.created_at,
    }));
  },

  async send(applicationId: string, senderId: string, content: string): Promise<Message> {
    const { data, error } = await supabase
      .from("messages")
      .insert({
        application_id: applicationId,
        sender_id: senderId,
        content,
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to send message: ${error.message}`);

    return {
      id: data.id,
      applicationId: data.application_id,
      senderId: data.sender_id,
      content: data.content,
      createdAt: data.created_at,
    };
  },

  subscribe(applicationId: string, onMessage: (msg: Message) => void): () => void {
    const channel = supabase
      .channel(`messages-${applicationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `application_id=eq.${applicationId}`,
        },
        (payload: any) => {
          const row = payload.new;
          onMessage({
            id: row.id,
            applicationId: row.application_id,
            senderId: row.sender_id,
            content: row.content,
            createdAt: row.created_at,
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
};
