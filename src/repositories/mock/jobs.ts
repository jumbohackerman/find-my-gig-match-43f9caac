/**
 * Mock job repository — backed by static data from src/data/jobs.ts.
 * Drop-in replacement interface; swap for Supabase repo later.
 */

import type { JobRepository, JobFilters } from "@/repositories/interfaces";
import type { Job } from "@/domain/models";
import { jobs as staticJobs } from "@/data/jobs";

/** Map legacy static Job type to domain Job (they're compatible) */
function toDomain(j: typeof staticJobs[number]): Job {
  return { ...j, status: "active" as const };
}

export const mockJobRepository: JobRepository = {
  async list(filters?: JobFilters): Promise<Job[]> {
    let result = staticJobs.map(toDomain);

    if (filters?.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (j) =>
          j.title.toLowerCase().includes(q) ||
          j.company.toLowerCase().includes(q) ||
          j.tags.some((t) => t.toLowerCase().includes(q)),
      );
    }
    if (filters?.location) {
      const loc = filters.location.toLowerCase();
      result = result.filter((j) => j.location.toLowerCase().includes(loc));
    }
    if (filters?.type) {
      result = result.filter((j) => j.type === filters.type);
    }
    if (filters?.tags && filters.tags.length > 0) {
      const tagsLower = filters.tags.map((t) => t.toLowerCase());
      result = result.filter((j) =>
        j.tags.some((t) => tagsLower.includes(t.toLowerCase())),
      );
    }

    return result;
  },

  async listForEmployer(_employerId: string): Promise<Job[]> {
    return staticJobs.map(toDomain);
  },

  async getById(id: string): Promise<Job | null> {
    const found = staticJobs.find((j) => j.id === id);
    return found ? toDomain(found) : null;
  },

  async create(job): Promise<Job> {
    const newJob: Job = {
      ...job,
      id: `mock-${Date.now()}`,
      posted: "Właśnie dodano",
      status: "active",
    };
    // In mock mode, we don't persist — just return the created object
    console.debug("[mockJobRepo] create", newJob);
    return newJob;
  },

  async delete(id: string): Promise<void> {
    console.debug("[mockJobRepo] delete", id);
  },
};
