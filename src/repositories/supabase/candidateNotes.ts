/**
 * Candidate notes repository — internal recruiter notes per application.
 */

import { supabase } from "@/integrations/supabase/client";

export interface CandidateNote {
  id: string;
  employerId: string;
  applicationId: string;
  candidateId: string;
  jobId: string;
  note: string;
  createdAt: string;
  updatedAt: string;
}

function mapNote(row: any): CandidateNote {
  return {
    id: row.id,
    employerId: row.employer_id,
    applicationId: row.application_id,
    candidateId: row.candidate_id,
    jobId: row.job_id,
    note: row.note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const candidateNotesRepository = {
  async listForApplication(applicationId: string): Promise<CandidateNote[]> {
    const { data, error } = await supabase
      .from("candidate_notes")
      .select("*")
      .eq("application_id", applicationId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[candidateNotes] list error:", error);
      return [];
    }
    return (data || []).map(mapNote);
  },

  async create(params: {
    employerId: string;
    applicationId: string;
    candidateId: string;
    jobId: string;
    note: string;
  }): Promise<CandidateNote> {
    const { data, error } = await supabase
      .from("candidate_notes")
      .insert({
        employer_id: params.employerId,
        application_id: params.applicationId,
        candidate_id: params.candidateId,
        job_id: params.jobId,
        note: params.note,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    // Activity log
    await supabase.from("candidate_activity_log").insert({
      employer_id: params.employerId,
      application_id: params.applicationId,
      candidate_id: params.candidateId,
      job_id: params.jobId,
      action: "note_added",
      metadata: { note_id: data.id },
    });

    return mapNote(data);
  },

  async delete(noteId: string): Promise<void> {
    const { error } = await supabase.from("candidate_notes").delete().eq("id", noteId);
    if (error) throw new Error(error.message);
  },
};
