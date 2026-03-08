/**
 * Supabase implementation of StorageService.
 */

import { supabase } from "@/integrations/supabase/client";
import type { StorageService } from "@/services/interfaces";

export const supabaseStorageService: StorageService = {
  async upload(bucket: string, path: string, file: File) {
    const { error } = await supabase.storage.from(bucket).upload(path, file);
    if (error) return { url: "", error: error.message };
    return { url: path };
  },

  getPublicUrl(bucket: string, path: string): string {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  },

  async delete(bucket: string, path: string): Promise<void> {
    const { error } = await supabase.storage.from(bucket).remove([path]);
    if (error) throw new Error(`Failed to delete: ${error.message}`);
  },
};
