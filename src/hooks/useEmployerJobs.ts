/**
 * Employer-side hook for job CRUD operations.
 * Uses the provider registry — backend-agnostic.
 */

import { useState, useCallback } from "react";
import { getProvider } from "@/providers/registry";
import type { Job, JobType } from "@/domain/models";
import { toast } from "sonner";
import type { StructuredJobFormData } from "@/components/employer/JobPostForm";

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

  /** Create from legacy simple form */
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

  /** Create from new structured form */
  const createStructuredJob = useCallback(async (form: StructuredJobFormData, employerId: string): Promise<Job | null> => {
    if (submitting) return null;
    setSubmitting(true);
    try {
      const salary = form.salaryFrom && form.salaryTo
        ? `${Number(form.salaryFrom).toLocaleString("pl-PL")} zł - ${Number(form.salaryTo).toLocaleString("pl-PL")} zł`
        : "";

      const type: JobType = form.workMode === "Zdalnie" ? "Remote"
        : form.contractType.includes("B2B") ? "Contract" : "Full-time";

      const description = form.aboutRole || form.summary || "";

      const responsibilities = form.responsibilities.filter(Boolean);
      const requirements = form.requirements.filter(Boolean);
      const niceToHave = form.niceToHave.filter(Boolean);
      const benefits = form.benefits.filter(Boolean);
      const recruitmentSteps = form.recruitmentSteps.filter(Boolean);

      const job = await getProvider("jobs").create({
        title: form.title,
        company: form.company,
        logo: form.logo,
        location: form.location,
        salary,
        type,
        description,
        tags: form.techStack,
        employerId,
        summary: form.summary,
        aboutRole: form.aboutRole,
        responsibilities,
        requirements,
        niceToHave,
        benefits,
        aboutCompany: form.aboutCompany,
        recruitmentSteps,
        workMode: form.workMode,
        contractType: form.contractType,
        experienceLevel: form.experienceLevel,
        seniority: form.experienceLevel,
        highlights: responsibilities.slice(0, 3),
      });
      toast.success("Ogłoszenie opublikowane");
      return job;
    } catch (e) {
      toast.error("Nie udało się opublikować ogłoszenia");
      console.error("[useEmployerJobs] createStructuredJob error", e);
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

  return { createJob, createStructuredJob, editJob, archiveJob, deleteJob, submitting, EMPTY_FORM };
}
