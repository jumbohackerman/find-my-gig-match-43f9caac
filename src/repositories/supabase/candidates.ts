/**
 * Supabase implementation of CandidateRepository.
 */

import { supabase } from "@/integrations/supabase/client";
import type { CandidateRepository, CandidateFilters } from "@/repositories/interfaces";
import type { Candidate } from "@/domain/models";
import { dbCandidateToCandidate } from "@/domain/mappers";

export const supabaseCandidateRepository: CandidateRepository = {
  async list(filters?: CandidateFilters): Promise<Candidate[]> {
    let query = supabase.from("candidates").select("*");

    if (filters?.skills && filters.skills.length > 0) {
      query = query.overlaps("skills", filters.skills);
    }
    if (filters?.location) {
      query = query.ilike("location", `%${filters.location}%`);
    }
    if (filters?.seniority) {
      query = query.eq("seniority", filters.seniority);
    }

    const { data: candidatesData, error } = await query;
    if (error) {
      console.error("[supabaseCandidateRepo] list error:", error);
      return [];
    }

    // Fetch profile data for display names
    const userIds = (candidatesData || []).map((c: any) => c.user_id);
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("user_id, full_name, avatar")
      .in("user_id", userIds);

    const profileMap: Record<string, { full_name: string; avatar: string | null }> = {};
    (profilesData || []).forEach((p: any) => {
      profileMap[p.user_id] = { full_name: p.full_name, avatar: p.avatar };
    });

    let result = (candidatesData || []).map((c: any) =>
      dbCandidateToCandidate(c, profileMap[c.user_id]),
    );

    // Client-side text search (DB doesn't have full-text index yet)
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.title.toLowerCase().includes(q) ||
          c.skills.some((sk) => sk.toLowerCase().includes(q)) ||
          c.location.toLowerCase().includes(q),
      );
    }

    return result;
  },

  async getByUserId(userId: string): Promise<Candidate | null> {
    const { data: candidateData } = await supabase
      .from("candidates")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (!candidateData) return null;

    const { data: profileData } = await supabase
      .from("profiles")
      .select("full_name, avatar")
      .eq("user_id", userId)
      .maybeSingle();

    return dbCandidateToCandidate(candidateData as any, profileData as any);
  },

  async upsert(userId: string, data: Partial<Candidate>): Promise<Candidate> {
    const dbData: Record<string, unknown> = {};

    if (data.title !== undefined) dbData.title = data.title;
    if (data.location !== undefined) dbData.location = data.location;
    if (data.bio !== undefined) dbData.bio = data.bio;
    if (data.summary !== undefined) dbData.summary = data.summary;
    if (data.skills !== undefined) dbData.skills = data.skills;
    if (data.seniority !== undefined) dbData.seniority = data.seniority;
    if (data.workMode !== undefined) dbData.work_mode = data.workMode;
    if (data.employmentType !== undefined) dbData.employment_type = data.employmentType;
    if (data.salaryMin !== undefined) dbData.salary_min = data.salaryMin;
    if (data.salaryMax !== undefined) dbData.salary_max = data.salaryMax;
    if (data.availability !== undefined) dbData.availability = data.availability;
    if (data.experienceEntries !== undefined) dbData.experience_entries = data.experienceEntries;
    if (data.links !== undefined) dbData.links = data.links;
    if (data.experience !== undefined) dbData.experience = data.experience;
    if (data.cvUrl !== undefined) dbData.cv_url = data.cvUrl;
    dbData.last_active = new Date().toISOString();

    const { error } = await supabase
      .from("candidates")
      .update(dbData)
      .eq("user_id", userId);

    if (error) throw new Error(`Failed to update candidate: ${error.message}`);

    const result = await this.getByUserId(userId);
    if (!result) throw new Error("Candidate not found after update");
    return result;
  },
};
