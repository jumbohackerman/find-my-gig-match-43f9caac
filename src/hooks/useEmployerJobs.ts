/**
 * Employer-side hook for job CRUD operations.
 * Uses the provider registry — backend-agnostic.
 */

import { useState, useCallback } from "react";
import { getProvider } from "@/providers/registry";
import type { Job, JobType } from "@/domain/models";
import { toast } from "sonner";

export interface JobFormData {
  title: string;
  company: string;
  logo: string;
  location: string;
  salary: string;
  type: JobType;
  description: string;
  tags: string[];
}

const EMPTY_FORM: JobFormData = {
  title: "",
  company: "",
  logo: "🏢",
  location: "",
  salary: "",
  type: "Full-time",
  description: "",
  tags: [],
};

export function useEmployerJobs() {
  const [submitting, setSubmitting] = useState(false);

  const createJob = useCallback(async (form: JobFormData, employerId: string): Promise<Job | null> => {
    if (submitting) return null;
    setSubmitting(true);
    try {
      const job = await getProvider("jobs").create({
        ...form,
        employerId,
      });
      toast.success("Ogłoszenie opublikowane");
      return job;
    } catch (e) {
      toast.error("Nie udało się opublikować ogłoszenia");
      console.error("[useEmployerJobs] createJob error", e);
      return null;
    } finally {
      setSubmitting(false);
    }
  }, []);

  const editJob = useCallback(async (jobId: string, data: Partial<JobFormData>): Promise<Job | null> => {
    setSubmitting(true);
    try {
      const job = await getProvider("jobs").update(jobId, data);
      toast.success("Ogłoszenie zaktualizowane");
      return job;
    } catch (e) {
      toast.error("Nie udało się zaktualizować ogłoszenia");
      console.error("[useEmployerJobs] editJob error", e);
      return null;
    } finally {
      setSubmitting(false);
    }
  }, []);

  const archiveJob = useCallback(async (jobId: string): Promise<void> => {
    try {
      await getProvider("jobs").archive(jobId);
      toast.success("Ogłoszenie zamknięte");
    } catch (e) {
      toast.error("Nie udało się zamknąć ogłoszenia");
      console.error("[useEmployerJobs] archiveJob error", e);
    }
  }, []);

  const deleteJob = useCallback(async (jobId: string): Promise<void> => {
    try {
      await getProvider("jobs").delete(jobId);
      toast.success("Ogłoszenie usunięte");
    } catch (e) {
      toast.error("Nie udało się usunąć ogłoszenia");
      console.error("[useEmployerJobs] deleteJob error", e);
    }
  }, []);

  return { createJob, editJob, archiveJob, deleteJob, submitting, EMPTY_FORM };
}
