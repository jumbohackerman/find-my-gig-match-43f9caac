/**
 * Block 7 — Hooks for contact invitations + job closure.
 */
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { ClosureReason } from "@/components/employer/CloseJobModal";

export interface ContactInvitation {
  id: string;
  candidate_id: string;
  employer_id: string;
  job_id: string;
  ai_shortlist_snapshot_id: string;
  status: "pending" | "accepted" | "rejected";
  employer_message: string | null;
  responded_at: string | null;
  created_at: string;
}

// ─── Employer side ────────────────────────────────────────────────────────────
export function useContactInvitations(jobId: string | null) {
  const [invitations, setInvitations] = useState<ContactInvitation[]>([]);

  const reload = useCallback(async () => {
    if (!jobId) return;
    const { data, error } = await supabase
      .from("contact_invitations")
      .select("*")
      .eq("job_id", jobId);
    if (!error && data) setInvitations(data as ContactInvitation[]);
  }, [jobId]);

  useEffect(() => {
    reload();
  }, [reload]);

  const sendInvitation = useCallback(
    async (params: {
      candidate_id: string;
      employer_id: string;
      job_id: string;
      ai_shortlist_snapshot_id: string;
      message: string;
      job_title: string;
      company_name: string;
    }) => {
      const { error } = await supabase.from("contact_invitations").insert({
        candidate_id: params.candidate_id,
        employer_id: params.employer_id,
        job_id: params.job_id,
        ai_shortlist_snapshot_id: params.ai_shortlist_snapshot_id,
        status: "pending",
        employer_message: params.message || null,
      });
      if (error) throw error;

      // Fire-and-forget email (funkcja send-email sama pobiera tytuł/firmę i autoryzuje employer/job/candidate)
      supabase.functions
        .invoke("send-email", {
          body: {
            type: "contact_invitation",
            candidate_id: params.candidate_id,
            job_id: params.job_id,
            employer_message: params.message,
          },
        })
        .catch((e) => { if (import.meta.env.DEV) console.error("[send-email] invoke error:", e); });

      toast.success("Zaproszenie do kontaktu wysłane");
      await reload();
    },
    [reload],
  );

  return { invitations, sendInvitation, reload };
}

// ─── Job closure ──────────────────────────────────────────────────────────────
export async function closeJob(params: {
  job_id: string;
  reason: ClosureReason;
  job_title: string;
  company_name: string;
}) {
  // 1. Mark job closed
  const { error: jobErr } = await supabase
    .from("jobs")
    .update({
      status: "closed",
      closed_at: new Date().toISOString(),
      closure_reason: params.reason,
    })
    .eq("id", params.job_id);
  if (jobErr) throw jobErr;

  // 2. Find shortlisted candidates with no accepted invitation → email + status=position_closed
  const { data: shortlistedApps } = await supabase
    .from("applications")
    .select("id, candidate_id")
    .eq("job_id", params.job_id)
    .eq("status", "shortlisted");

  const { data: invs } = await supabase
    .from("contact_invitations")
    .select("candidate_id, status")
    .eq("job_id", params.job_id);

  const acceptedSet = new Set(
    (invs ?? []).filter((i) => i.status === "accepted").map((i) => i.candidate_id),
  );
  const noContactCandidates = (shortlistedApps ?? [])
    .filter((a) => !acceptedSet.has(a.candidate_id))
    .map((a) => a.candidate_id);

  // 3. Update their applications to position_closed
  if (noContactCandidates.length > 0) {
    await supabase
      .from("applications")
      .update({ status: "position_closed" })
      .eq("job_id", params.job_id)
      .in("candidate_id", noContactCandidates);

    // 4. Email them — UWAGA: typ `position_closed` w edge function `send-email`
    //    jest "server-only" (wymaga service role). Klient nie może go wywołać,
    //    więc tutaj nie udajemy sukcesu wysyłki — przerzucamy odpowiedzialność
    //    do automatycznego maila wewnętrznego (notyfikacja in-app trafia przez
    //    trigger statusu) i ostrzegamy pracodawcę toastem.
    //    TODO: przenieść tę akcję do bezpiecznej edge function wywoływanej
    //    z service role po stronie serwera.
    toast.warning(
      `Zamknięto rekrutację. Powiadomienia in-app zostały utworzone dla ${noContactCandidates.length} kandydatów. Maile do kandydatów wymagają obsługi serwerowej i zostaną wysłane po wdrożeniu mailera.`,
      { duration: 7000 },
    );
  }

  // Also close any other still-open applications (applied/viewed/interview)
  await supabase
    .from("applications")
    .update({ status: "position_closed" })
    .eq("job_id", params.job_id)
    .in("status", ["applied", "viewed"]);

  toast.success("Rekrutacja zakończona i zarchiwizowana");
}

// ─── Candidate side ───────────────────────────────────────────────────────────
export function useCandidateInvitations() {
  const [invitations, setInvitations] = useState<
    (ContactInvitation & { job_title?: string; company?: string })[]
  >([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("contact_invitations")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) {
      // Enrich with job info
      const jobIds = [...new Set(data.map((d) => d.job_id))];
      const { data: jobs } = await supabase
        .from("jobs")
        .select("id, title, company")
        .in("id", jobIds);
      const jobMap = new Map((jobs ?? []).map((j) => [j.id, j]));
      setInvitations(
        (data as ContactInvitation[]).map((inv) => ({
          ...inv,
          job_title: jobMap.get(inv.job_id)?.title,
          company: jobMap.get(inv.job_id)?.company,
        })),
      );
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const accept = useCallback(
    async (invitationId: string) => {
      const { error } = await supabase
        .from("contact_invitations")
        .update({ status: "accepted", responded_at: new Date().toISOString() })
        .eq("id", invitationId);
      if (error) {
        toast.error(`Błąd: ${error.message}`);
        return;
      }
      toast.success("Zaproszenie zaakceptowane — możesz teraz pisać do pracodawcy");
      await reload();
    },
    [reload],
  );

  const reject = useCallback(
    async (invitationId: string, jobId: string, candidateId: string) => {
      const { error } = await supabase
        .from("contact_invitations")
        .update({ status: "rejected", responded_at: new Date().toISOString() })
        .eq("id", invitationId);
      if (error) {
        toast.error(`Błąd: ${error.message}`);
        return;
      }
      // Application status pozostaje shortlisted (był shortlisted od początku)
      void jobId;
      void candidateId;
      toast.info("Zaproszenie odrzucone");
      await reload();
    },
    [reload],
  );

  return { invitations, loading, accept, reject, reload };
}
