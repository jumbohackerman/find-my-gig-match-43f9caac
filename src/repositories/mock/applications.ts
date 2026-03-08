/**
 * Mock application repository — in-memory store for demo mode.
 */

import type { ApplicationRepository } from "@/repositories/interfaces";
import type {
  Application,
  ApplicationStatus,
  ApplicationSource,
  ApplicationWithJob,
  EnrichedEmployerApplication,
  Job,
} from "@/domain/models";

let store: Application[] = [];

export const mockApplicationRepository: ApplicationRepository = {
  async listForCandidate(candidateId: string): Promise<ApplicationWithJob[]> {
    return store
      .filter((a) => a.candidateId === candidateId)
      .map((a) => ({ ...a }));
  },

  async listForEmployer(_employerId: string): Promise<EnrichedEmployerApplication[]> {
    return store.map((a) => ({ ...a }));
  },

  async apply(job: Job, candidateId: string, source = "candidate"): Promise<Application> {
    const app: Application = {
      id: `mock-app-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      jobId: job.id,
      candidateId,
      status: "applied",
      source: source as ApplicationSource,
      appliedAt: new Date().toISOString(),
    };
    store = [app, ...store];
    console.debug("[mockApplicationRepo] apply", app);
    return app;
  },

  async updateStatus(applicationId, status, source): Promise<void> {
    store = store.map((a) =>
      a.id === applicationId
        ? { ...a, status: status as ApplicationStatus, ...(source ? { source } : {}) }
        : a,
    );
    console.debug("[mockApplicationRepo] updateStatus", applicationId, status);
  },

  subscribeForCandidate(_candidateId, _onPayload) {
    return () => {};
  },

  subscribeForEmployer(_employerId, _onChange) {
    return () => {};
  },
};
