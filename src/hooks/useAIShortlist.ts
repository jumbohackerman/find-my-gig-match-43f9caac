/**
 * useAIShortlist — Block 5
 * One AI shortlist per job. Tracks existence, status, snapshots, and the run action.
 */
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ShortlistRecord {
  id: string;
  job_id: string;
  employer_id: string;
  status: "processing" | "completed" | "failed";
  ai_model_used: string | null;
  total_candidates_analyzed: number | null;
  triggered_at: string;
  completed_at: string | null;
}

export interface ShortlistSnapshot {
  id: string;
  shortlist_id: string;
  candidate_id: string;
  job_id: string;
  rank: number;
  shortlist_score: number;
  ai_justification: string;
  snapshot_full_name: string | null;
  snapshot_job_title: string | null;
  snapshot_location: string | null;
  snapshot_summary: string | null;
  snapshot_skills: any;
  snapshot_experience: any;
  snapshot_languages: any;
  snapshot_salary_min: number | null;
  snapshot_salary_max: number | null;
  snapshot_level: string | null;
  snapshot_links: any;
}

export function useAIShortlist(jobId: string | undefined) {
  const [shortlist, setShortlist] = useState<ShortlistRecord | null>(null);
  const [snapshots, setSnapshots] = useState<ShortlistSnapshot[]>([]);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);

  const reload = useCallback(async () => {
    if (!jobId) return;
    setLoading(true);
    const { data: sl } = await supabase
      .from("shortlists" as any)
      .select("*")
      .eq("job_id", jobId)
      .maybeSingle();
    setShortlist((sl as any) ?? null);

    if (sl) {
      const { data: snaps } = await (supabase as any)
        .from("ai_shortlist_snapshots")
        .select("*")
        .eq("shortlist_id", (sl as any).id)
        .order("rank", { ascending: true });
      setSnapshots((snaps as any) ?? []);
    } else {
      setSnapshots([]);
    }
    setLoading(false);
  }, [jobId]);

  useEffect(() => {
    reload();
  }, [reload]);

  const run = useCallback(async (): Promise<boolean> => {
    if (!jobId || running) return false;
    setRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke("run-shortlist", {
        body: { job_id: jobId },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      toast.success("Shortlista AI wygenerowana");
      await reload();
      return true;
    } catch (e: any) {
      toast.error(`Nie udało się uruchomić shortlisty: ${e?.message || "błąd"}`);
      return false;
    } finally {
      setRunning(false);
    }
  }, [jobId, running, reload]);

  return { shortlist, snapshots, loading, running, run, reload };
}
