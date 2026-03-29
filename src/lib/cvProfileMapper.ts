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

// ─── Polish experience display formatting ────────────────────────────────────

/**
 * Format total months of experience into a human-readable Polish string.
 *
 * Rules:
 * - Below 24 months → show months only (e.g. "3 miesiące", "11 miesięcy")
 * - 24+ months with remainder ≥ 6 → round up to full years
 * - 24+ months with remainder 1-5 → "X lat Y miesięcy"
 * - 24+ months with remainder 0 → "X lat"
 */
export function formatExperienceDisplay(totalMonths: number): string {
  if (totalMonths <= 0) return "0 miesięcy";

  if (totalMonths < 24) {
    return `${totalMonths} ${pluralMonths(totalMonths)}`;
  }

  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;

  if (months >= 6) {
    const rounded = years + 1;
    return `${rounded} ${pluralYears(rounded)}`;
  }

  if (months === 0) {
    return `${years} ${pluralYears(years)}`;
  }

  return `${years} ${pluralYears(years)} ${months} ${pluralMonths(months)}`;
}

function pluralMonths(n: number): string {
  if (n === 1) return "miesiąc";
  if (n >= 2 && n <= 4) return "miesiące";
  if (n >= 22 && n % 10 >= 2 && n % 10 <= 4) return "miesiące";
  return "miesięcy";
}

function pluralYears(n: number): string {
  if (n === 1) return "rok";
  if (n >= 2 && n <= 4) return "lata";
  if (n >= 22 && n % 10 >= 2 && n % 10 <= 4) return "lata";
  return "lat";
}

/**
 * Calculate total unique months and return both raw months and formatted string.
 */
export function getExperienceDisplay(
  entries: Array<{ start_date?: string | null; end_date?: string | null }> | null | undefined
): { totalMonths: number; display: string } | null {
  const years = calculateTotalExperienceYears(entries);
  if (years === null || years <= 0) return null;
  const totalMonths = Math.round(years * 12);
  return { totalMonths, display: formatExperienceDisplay(totalMonths) };
}

// ─── Date parsing & overlap-aware experience calculation ─────────────────────

const CURRENT_MARKERS = ["present", "current", "now", "obecnie", "aktualnie", "do teraz", "bieżąca", ""];

/**
 * Parse a loose date string (e.g. "2020", "Jan 2020", "01/2020", "2020-03") into a Date
 * representing the 1st of the parsed month. Returns null if unparseable.
 */
function parseFuzzyDate(raw: string | null | undefined): Date | null {
  if (!raw || !raw.trim()) return null;
  const s = raw.trim();

  // "2020-03" or "2020-03-15"
  const isoMatch = s.match(/^(\d{4})-(\d{1,2})/);
  if (isoMatch) return new Date(+isoMatch[1], +isoMatch[2] - 1, 1);

  // "03/2020" or "03.2020"
  const slashMatch = s.match(/^(\d{1,2})[\/.](\d{4})$/);
  if (slashMatch) return new Date(+slashMatch[2], +slashMatch[1] - 1, 1);

  // "Jan 2020", "January 2020", "sty 2020", "styczeń 2020"
  const monthYearMatch = s.match(/^([a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ]+)\s+(\d{4})$/);
  if (monthYearMatch) {
    const attempt = new Date(`${monthYearMatch[1]} 1, ${monthYearMatch[2]}`);
    if (!isNaN(attempt.getTime())) return new Date(attempt.getFullYear(), attempt.getMonth(), 1);
    // Fallback: just use the year
    return new Date(+monthYearMatch[2], 0, 1);
  }

  // Plain year "2020"
  const yearOnly = s.match(/^(\d{4})$/);
  if (yearOnly) return new Date(+yearOnly[1], 0, 1);

  return null;
}

function isCurrentEndDate(endDate: string | null | undefined): boolean {
  if (!endDate || !endDate.trim()) return true;
  return CURRENT_MARKERS.includes(endDate.trim().toLowerCase());
}

interface DateRange { start: number; end: number; } // months since epoch

function dateToMonths(d: Date): number {
  return d.getFullYear() * 12 + d.getMonth();
}

/**
 * Calculate total unique months of experience from a list of experience entries,
 * merging overlapping periods. Returns fractional years.
 */
export function calculateTotalExperienceYears(
  entries: Array<{ start_date?: string | null; end_date?: string | null }> | null | undefined
): number | null {
  if (!entries || entries.length === 0) return null;

  const now = new Date();
  const nowMonths = dateToMonths(now);

  const ranges: DateRange[] = [];

  for (const entry of entries) {
    const start = parseFuzzyDate(entry.start_date);
    if (!start) continue; // skip entries with unparseable start dates

    let endMonths: number;
    if (isCurrentEndDate(entry.end_date)) {
      endMonths = nowMonths;
    } else {
      const end = parseFuzzyDate(entry.end_date);
      if (!end) {
        endMonths = nowMonths; // fallback: treat as current
      } else {
        endMonths = dateToMonths(end);
      }
    }

    const startMonths = dateToMonths(start);
    if (endMonths < startMonths) continue; // invalid range, skip

    ranges.push({ start: startMonths, end: endMonths });
  }

  if (ranges.length === 0) return null;

  // Merge overlapping ranges
  ranges.sort((a, b) => a.start - b.start);
  const merged: DateRange[] = [ranges[0]];

  for (let i = 1; i < ranges.length; i++) {
    const last = merged[merged.length - 1];
    if (ranges[i].start <= last.end) {
      // Overlap — extend the end
      last.end = Math.max(last.end, ranges[i].end);
    } else {
      merged.push({ ...ranges[i] });
    }
  }

  // Sum unique months
  const totalMonths = merged.reduce((sum, r) => sum + (r.end - r.start), 0);
  return totalMonths / 12;
}

// ─── Bullet point detection & extraction ─────────────────────────────────────

const BULLET_PATTERN = /^[\s]*[-–—•*▪▸►◆]\s+|^[\s]*\d+[.)]\s+/;

/**
 * Detect if a description string contains bullet-point-like lines.
 * Returns { isBulletList: true, bullets: string[] } or { isBulletList: false }.
 */
export function extractBullets(description: string | null | undefined): {
  isBulletList: boolean;
  bullets: string[];
  plainText: string;
} {
  if (!description || !description.trim()) {
    return { isBulletList: false, bullets: [], plainText: "" };
  }

  const lines = description.split(/\n/).map(l => l.trim()).filter(Boolean);

  if (lines.length <= 1) {
    return { isBulletList: false, bullets: [], plainText: description.trim() };
  }

  // Count how many lines match bullet patterns
  const bulletLines = lines.filter(l => BULLET_PATTERN.test(l));
  const ratio = bulletLines.length / lines.length;

  // If >=50% of lines look like bullets, treat as a bullet list
  if (ratio >= 0.5 && bulletLines.length >= 2) {
    const cleaned = lines.map(l => l.replace(BULLET_PATTERN, "").trim()).filter(Boolean);
    return { isBulletList: true, bullets: cleaned, plainText: "" };
  }

  return { isBulletList: false, bullets: [], plainText: description.trim() };
}

// ─── Main extraction ─────────────────────────────────────────────────────────

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

  // experience in months — prefer calculated from experience[], fallback to years_of_experience
  const calculatedYears = calculateTotalExperienceYears(p.experience);
  if (calculatedYears !== null && calculatedYears > 0) {
    result.experienceYears = Math.min(480, Math.round(calculatedYears * 12));
  } else if (typeof p.years_of_experience === "number" && p.years_of_experience > 0) {
    result.experienceYears = Math.min(480, Math.round(p.years_of_experience * 12));
  }

  // links
  const cvLinks: ProfileFormFields["links"] = {};
  if (p.links?.linkedin_url?.trim()) cvLinks.linkedin = p.links.linkedin_url.trim();
  if (p.links?.github_url?.trim()) cvLinks.github = p.links.github_url.trim();
  if (p.links?.portfolio_url?.trim()) cvLinks.portfolio = p.links.portfolio_url.trim();
  if (p.links?.other_urls && p.links.other_urls.length > 0 && p.links.other_urls[0]?.trim()) {
    cvLinks.website = p.links.other_urls[0].trim();
  }
  if (Object.values(cvLinks).some(Boolean)) result.links = cvLinks;

  // experience entries (max 5) — with bullet point preservation
  if (p.experience && Array.isArray(p.experience) && p.experience.length > 0) {
    result.experienceEntries = p.experience.slice(0, 5).map((exp) => {
      const isCurrent = isCurrentEndDate(exp.end_date);

      // Extract bullets from description
      const { isBulletList, bullets: extractedBullets, plainText } = extractBullets(exp.description);

      let description = "";
      let bullets: string[] = [""];

      if (isBulletList && extractedBullets.length > 0) {
        // Each bullet goes to its own entry — up to 8
        bullets = extractedBullets.slice(0, 8);
        // If more than 8, keep remaining as description fallback
        if (extractedBullets.length > 8) {
          description = extractedBullets.slice(8).map(b => `• ${b}`).join("\n");
        }
      } else if (plainText) {
        // Plain text → first bullet, no description field
        bullets = [plainText.slice(0, 200)];
      }

      return {
        title: exp.job_title?.trim() || "",
        company: exp.company?.trim() || "",
        startDate: exp.start_date?.trim() || "",
        endDate: isCurrent ? "Obecnie" : (exp.end_date?.trim() || ""),
        isCurrent,
        description,
        bullets,
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
