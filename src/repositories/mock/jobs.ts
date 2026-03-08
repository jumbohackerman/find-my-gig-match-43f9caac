/**
 * Mock job repository — backed by static data from src/data/jobs.ts.
 */

import type { JobRepository, JobFilters } from "@/repositories/interfaces";
import type { Job } from "@/domain/models";
import { jobs as staticJobs } from "@/data/jobs";

function toDomain(j: typeof staticJobs[number]): Job {
  return { ...j, status: "active" as const };
}

let dynamicJobs: Job[] = [];

export const mockJobRepository: JobRepository = {
  async list(filters?: JobFilters): Promise<Job[]> {
    let result = [...staticJobs.map(toDomain), ...dynamicJobs].filter(
      (j) => j.status === "active",
    );

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
    return [...staticJobs.map(toDomain), ...dynamicJobs];
  },

  async getById(id: string): Promise<Job | null> {
    const found = staticJobs.find((j) => j.id === id);
    if (found) return toDomain(found);
    return dynamicJobs.find((j) => j.id === id) || null;
  },

  async create(job): Promise<Job> {
    const newJob: Job = {
      ...job,
      id: `mock-${Date.now()}`,
      posted: "Właśnie dodano",
      status: "active",
    };
    dynamicJobs = [newJob, ...dynamicJobs];
    return newJob;
  },

  async update(id, data): Promise<Job> {
    const idx = dynamicJobs.findIndex((j) => j.id === id);
    if (idx >= 0) {
      dynamicJobs[idx] = { ...dynamicJobs[idx], ...data };
      return dynamicJobs[idx];
    }
    const staticJob = staticJobs.find((j) => j.id === id);
    if (staticJob) {
      const updated: Job = { ...toDomain(staticJob), ...data };
      dynamicJobs.push(updated);
      return updated;
    }
    throw new Error(`Job ${id} not found`);
  },

  async archive(id: string): Promise<void> {
    const idx = dynamicJobs.findIndex((j) => j.id === id);
    if (idx >= 0) {
      dynamicJobs[idx] = { ...dynamicJobs[idx], status: "closed" };
    }
    console.debug("[mockJobRepo] archive", id);
  },

  async delete(id: string): Promise<void> {
    dynamicJobs = dynamicJobs.filter((j) => j.id !== id);
    console.debug("[mockJobRepo] delete", id);
  },
};
