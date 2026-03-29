/**
 * Maps parsed_json from cv_parsed_data to candidate profile form fields.
 * Safe merge: never overwrites existing non-empty values with empty/null.
 */

interface ParsedCvJson {
  full_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  headline?: string | null;
  current_role?: string | null;
  email?: string | null;
  phone?: string | null;
  city?: string | null;
  country?: string | null;
  summary?: string | null;
  years_of_experience?: number | null;
  skills?: string[] | null;
  links?: {
    linkedin_url?: string | null;
    github_url?: string | null;
    portfolio_url?: string | null;
    other_urls?: string[] | null;
  } | null;
  experience?: Array<{
    job_title?: string | null;
    company?: string | null;
    start_date?: string | null;
    end_date?: string | null;
    description?: string | null;
  }> | null;
  languages?: Array<{ name: string; level?: string | null }> | null;
  education?: Array<{
    school?: string | null;
    degree?: string | null;
    field_of_study?: string | null;
    start_date?: string | null;
    end_date?: string | null;
  }> | null;
  certifications?: string[] | null;
  projects?: Array<{
    name?: string | null;
    description?: string | null;
    technologies?: string[];
  }> | null;
  preferred_job_titles?: string[] | null;
}

export interface ProfileFormFields {
  fullName: string;
  title: string;
  location: string;
  summary: string;
  skills: string[];
  experienceYears: number;
  seniority: string;
  links: {
    portfolio?: string;
    github?: string;
    linkedin?: string;
    website?: string;
  };
  experienceEntries: Array<{
    title: string;
    company: string;
    startDate: string;
    endDate: string;
    isCurrent: boolean;
    description: string;
    bullets: string[];
  }>;
}

/** Fields from parsed_json that are NOT mapped to profile form (for transparency) */
export const UNMAPPED_FIELDS = [
  "email",        // no email field in candidate profile form
  "phone",        // no phone field in candidate profile form
  "date_of_birth",// not used
  "country",      // profile uses single location field; city is mapped
  "education",    // no education section in current form
  "certifications",// no certifications section in current form
  "projects",     // no projects section in current form
  "languages",    // no languages section in current form
  "preferred_job_titles", // not directly mapped
] as const;

/**
 * Extract profile form fields from parsed_json.
 * Returns only fields that have meaningful values.
 */
export function extractProfileFields(parsedJson: unknown): Partial<ProfileFormFields> {
  if (!parsedJson || typeof parsedJson !== "object") return {};
  const p = parsedJson as ParsedCvJson;
  const result: Partial<ProfileFormFields> = {};

  // full_name
  const name = p.full_name || [p.first_name, p.last_name].filter(Boolean).join(" ");
  if (name?.trim()) result.fullName = name.trim();

  // title <- headline or current_role
  const titleVal = p.headline || p.current_role;
  if (titleVal?.trim()) result.title = titleVal.trim();

  // location <- city
  if (p.city?.trim()) result.location = p.city.trim();

  // summary
  if (p.summary?.trim()) result.summary = p.summary.trim().slice(0, 300);

  // skills
  if (p.skills && Array.isArray(p.skills) && p.skills.length > 0) {
    result.skills = p.skills.filter((s) => typeof s === "string" && s.trim()).map((s) => s.trim());
  }

  // years of experience
  if (typeof p.years_of_experience === "number" && p.years_of_experience > 0) {
    result.experienceYears = Math.min(40, Math.round(p.years_of_experience));
  }

  // links
  const cvLinks: ProfileFormFields["links"] = {};
  if (p.links?.linkedin_url?.trim()) cvLinks.linkedin = p.links.linkedin_url.trim();
  if (p.links?.github_url?.trim()) cvLinks.github = p.links.github_url.trim();
  if (p.links?.portfolio_url?.trim()) cvLinks.portfolio = p.links.portfolio_url.trim();
  // other_urls[0] -> website
  if (p.links?.other_urls && p.links.other_urls.length > 0 && p.links.other_urls[0]?.trim()) {
    cvLinks.website = p.links.other_urls[0].trim();
  }
  if (Object.values(cvLinks).some(Boolean)) result.links = cvLinks;

  // experience entries (max 3)
  if (p.experience && Array.isArray(p.experience) && p.experience.length > 0) {
    result.experienceEntries = p.experience.slice(0, 3).map((exp) => {
      const isCurrent = !exp.end_date || exp.end_date.toLowerCase() === "present" || exp.end_date.toLowerCase() === "obecnie";
      return {
        title: exp.job_title?.trim() || "",
        company: exp.company?.trim() || "",
        startDate: exp.start_date?.trim() || "",
        endDate: isCurrent ? "Obecnie" : (exp.end_date?.trim() || ""),
        isCurrent,
        description: exp.description?.trim() || "",
        bullets: [""],
      };
    });
  }

  return result;
}

/**
 * Safe merge: only fills empty/missing fields from CV data.
 * Never overwrites non-empty existing values.
 */
export function mergeWithExisting(
  existing: ProfileFormFields,
  fromCv: Partial<ProfileFormFields>
): { merged: ProfileFormFields; fieldsUpdated: string[] } {
  const merged = { ...existing };
  const fieldsUpdated: string[] = [];

  if (fromCv.fullName && !existing.fullName.trim()) {
    merged.fullName = fromCv.fullName;
    fieldsUpdated.push("Imię i nazwisko");
  }
  if (fromCv.title && !existing.title.trim()) {
    merged.title = fromCv.title;
    fieldsUpdated.push("Tytuł zawodowy");
  }
  if (fromCv.location && !existing.location.trim()) {
    merged.location = fromCv.location;
    fieldsUpdated.push("Lokalizacja");
  }
  if (fromCv.summary && !existing.summary.trim()) {
    merged.summary = fromCv.summary;
    fieldsUpdated.push("Podsumowanie");
  }
  if (fromCv.skills && fromCv.skills.length > 0 && existing.skills.length === 0) {
    merged.skills = fromCv.skills;
    fieldsUpdated.push("Umiejętności");
  }
  if (fromCv.experienceYears && existing.experienceYears === 0) {
    merged.experienceYears = fromCv.experienceYears;
    fieldsUpdated.push("Lata doświadczenia");
  }
  if (fromCv.experienceEntries && fromCv.experienceEntries.length > 0 && existing.experienceEntries.length === 0) {
    merged.experienceEntries = fromCv.experienceEntries;
    fieldsUpdated.push("Doświadczenie zawodowe");
  }
  if (fromCv.links) {
    const mergedLinks = { ...existing.links };
    let linksChanged = false;
    if (fromCv.links.linkedin && !existing.links.linkedin?.trim()) {
      mergedLinks.linkedin = fromCv.links.linkedin;
      linksChanged = true;
    }
    if (fromCv.links.github && !existing.links.github?.trim()) {
      mergedLinks.github = fromCv.links.github;
      linksChanged = true;
    }
    if (fromCv.links.portfolio && !existing.links.portfolio?.trim()) {
      mergedLinks.portfolio = fromCv.links.portfolio;
      linksChanged = true;
    }
    if (fromCv.links.website && !existing.links.website?.trim()) {
      mergedLinks.website = fromCv.links.website;
      linksChanged = true;
    }
    if (linksChanged) {
      merged.links = mergedLinks;
      fieldsUpdated.push("Linki");
    }
  }

  return { merged, fieldsUpdated };
}

/**
 * Count how many mappable fields have data in parsed_json.
 */
export function countMappableFields(fromCv: Partial<ProfileFormFields>): number {
  let count = 0;
  if (fromCv.fullName) count++;
  if (fromCv.title) count++;
  if (fromCv.location) count++;
  if (fromCv.summary) count++;
  if (fromCv.skills && fromCv.skills.length > 0) count++;
  if (fromCv.experienceYears) count++;
  if (fromCv.experienceEntries && fromCv.experienceEntries.length > 0) count++;
  if (fromCv.links && Object.values(fromCv.links).some(Boolean)) count++;
  return count;
}
