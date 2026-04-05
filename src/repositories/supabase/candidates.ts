/**
 * Supabase implementation of CandidateRepository.
 */

import { supabase } from "@/integrations/supabase/client";
import type { CandidateRepository, CandidateFilters } from "@/repositories/interfaces";
import type { Candidate } from "@/domain/models";
import { getAllSkills } from "@/domain/models";
import { dbCandidateToCandidate } from "@/domain/mappers";

export const supabaseCandidateRepository: CandidateRepository = {
  async list(filters?: CandidateFilters): Promise<Candidate[]> {
    const { data: candidatesData, error } = await (supabase as any).from("candidates").select("*");
    if (error) {
      console.error("[supabaseCandidateRepo] list error:", error);
      return [];
    }

    let result = (candidatesData || []).map((c: any) => dbCandidateToCandidate(c));

    if (filters?.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (c) =>
          c.fullName.toLowerCase().includes(q) ||
          c.title.toLowerCase().includes(q) ||
          getAllSkills(c).some((sk) => sk.toLowerCase().includes(q)) ||
          c.location.toLowerCase().includes(q),
      );
    }
    if (filters?.skills && filters.skills.length > 0) {
      const skillsLower = filters.skills.map((s) => s.toLowerCase());
      result = result.filter((c) =>
        getAllSkills(c).some((s) => skillsLower.includes(s.toLowerCase())),
      );
    }
    if (filters?.location) {
      const loc = filters.location.toLowerCase();
      result = result.filter((c) => c.location.toLowerCase().includes(loc));
    }
    if (filters?.seniority) {
      result = result.filter((c) => c.seniority === filters.seniority);
    }

    return result;
  },

  async getByUserId(userId: string): Promise<Candidate | null> {
    const { data } = await (supabase as any)
      .from("candidates")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (!data) return null;
    return dbCandidateToCandidate(data);
  },

  async upsert(userId: string, data: Partial<Candidate>): Promise<Candidate> {
    const dbData: Record<string, unknown> = {};

    if (data.fullName !== undefined) dbData.full_name = data.fullName;
    if (data.title !== undefined) dbData.title = data.title;
    if (data.location !== undefined) dbData.location = data.location;
    if (data.summary !== undefined) dbData.summary = data.summary;
    if (data.seniority !== undefined) dbData.seniority = data.seniority;
    if (data.workMode !== undefined) dbData.work_mode = data.workMode;
    if (data.employmentType !== undefined) dbData.employment_type = data.employmentType;
    if (data.salaryMin !== undefined) dbData.salary_min = data.salaryMin;
    if (data.salaryMax !== undefined) dbData.salary_max = data.salaryMax;
    if (data.salaryCurrency !== undefined) dbData.salary_currency = data.salaryCurrency;
    if (data.availability !== undefined) dbData.availability = data.availability;
    if (data.skills !== undefined) dbData.skills = data.skills;
    if (data.experienceEntries !== undefined) dbData.experience_entries = data.experienceEntries;
    if (data.links !== undefined) dbData.links = data.links;
    if (data.languages !== undefined) dbData.languages = data.languages;
    if (data.primaryIndustry !== undefined) dbData.primary_industry = data.primaryIndustry;
    if (data.profileCompleteness !== undefined) dbData.profile_completeness = data.profileCompleteness;
    if (data.cvUrl !== undefined) dbData.cv_url = data.cvUrl;
    dbData.last_active = new Date().toISOString();

    const { error } = await (supabase as any)
      .from("candidates")
      .update(dbData)
      .eq("user_id", userId);

    if (error) throw new Error(`Failed to update candidate: ${error.message}`);

    const result = await this.getByUserId(userId);
    if (!result) throw new Error("Candidate not found after update");
    return result;
  },
};
