/**
 * Maps parsed_json from cv_parsed_data to candidate profile form fields.
 * Safe merge: never overwrites existing non-empty values with empty/null.
 *
 * Source of truth for experience bullets:
 *   1. experience[].bullets (from AI parser)
 *   2. experience[].description (heuristic split fallback)
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
    bullets?: string[] | null;
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

/** Max bullet points per experience entry */
export const MAX_BULLETS = 8;
/** Default number of visible bullet fields */
export const DEFAULT_BULLETS = 6;

/** Fields from parsed_json that are NOT mapped to profile form (for transparency) */
export const UNMAPPED_FIELDS = [
  "email", "phone", "date_of_birth", "country",
  "education", "certifications", "projects", "languages",
  "preferred_job_titles",
] as const;

// ─── Polish experience display formatting ────────────────────────────────────

export function formatExperienceDisplay(totalMonths: number): string {
  if (totalMonths <= 0) return "0 miesięcy";
  if (totalMonths < 24) return `${totalMonths} ${pluralMonths(totalMonths)}`;
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  if (months >= 6) {
    const rounded = years + 1;
    return `${rounded} ${pluralYears(rounded)}`;
  }
  if (months === 0) return `${years} ${pluralYears(years)}`;
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

function parseFuzzyDate(raw: string | null | undefined): Date | null {
  if (!raw || !raw.trim()) return null;
  const s = raw.trim();
  const isoMatch = s.match(/^(\d{4})-(\d{1,2})/);
  if (isoMatch) return new Date(+isoMatch[1], +isoMatch[2] - 1, 1);
  const slashMatch = s.match(/^(\d{1,2})[\/.](\d{4})$/);
  if (slashMatch) return new Date(+slashMatch[2], +slashMatch[1] - 1, 1);
  const monthYearMatch = s.match(/^([a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ]+)\s+(\d{4})$/);
  if (monthYearMatch) {
    const attempt = new Date(`${monthYearMatch[1]} 1, ${monthYearMatch[2]}`);
    if (!isNaN(attempt.getTime())) return new Date(attempt.getFullYear(), attempt.getMonth(), 1);
    return new Date(+monthYearMatch[2], 0, 1);
  }
  const yearOnly = s.match(/^(\d{4})$/);
  if (yearOnly) return new Date(+yearOnly[1], 0, 1);
  return null;
}

function isCurrentEndDate(endDate: string | null | undefined): boolean {
  if (!endDate || !endDate.trim()) return true;
  return CURRENT_MARKERS.includes(endDate.trim().toLowerCase());
}

interface DateRange { start: number; end: number; }

function dateToMonths(d: Date): number {
  return d.getFullYear() * 12 + d.getMonth();
}

export function calculateTotalExperienceYears(
  entries: Array<{ start_date?: string | null; end_date?: string | null }> | null | undefined
): number | null {
  if (!entries || entries.length === 0) return null;
  const now = new Date();
  const nowMonths = dateToMonths(now);
  const ranges: DateRange[] = [];
  for (const entry of entries) {
    const start = parseFuzzyDate(entry.start_date);
    if (!start) continue;
    let endMonths: number;
    if (isCurrentEndDate(entry.end_date)) {
      endMonths = nowMonths;
    } else {
      const end = parseFuzzyDate(entry.end_date);
      endMonths = end ? dateToMonths(end) : nowMonths;
    }
    const startMonths = dateToMonths(start);
    if (endMonths < startMonths) continue;
    ranges.push({ start: startMonths, end: endMonths });
  }
  if (ranges.length === 0) return null;
  ranges.sort((a, b) => a.start - b.start);
  const merged: DateRange[] = [ranges[0]];
  for (let i = 1; i < ranges.length; i++) {
    const last = merged[merged.length - 1];
    if (ranges[i].start <= last.end) {
      last.end = Math.max(last.end, ranges[i].end);
    } else {
      merged.push({ ...ranges[i] });
    }
  }
  const totalMonths = merged.reduce((sum, r) => sum + (r.end - r.start), 0);
  return totalMonths / 12;
}

// ─── Bullet point extraction (unified source of truth) ──────────────────────

/** Pattern for lines that look like bullet points */
const BULLET_LINE = /^[\s]*[-–—•*▪▸►◆]\s+|^[\s]*\d+[.)]\s+/;

/**
 * Unified bullet extraction: single source of truth for experience points.
 *
 * Priority:
 *   1. `bullets` array from AI parser (already structured)
 *   2. `description` string → heuristic split
 *
 * Returns an array of individual bullet strings (cleaned).
 */
export function normalizeExperienceBullets(
  bullets: string[] | null | undefined,
  description: string | null | undefined,
): string[] {
  // 1. Prefer structured bullets from AI parser, but DON'T trust blindly.
  //    Each bullet may itself contain multiple responsibilities concatenated.
  if (bullets && Array.isArray(bullets) && bullets.length > 0) {
    const cleaned = bullets.map(b => (typeof b === "string" ? b.trim() : "")).filter(Boolean);
    if (cleaned.length > 0) {
      // Post-process: split any "fat" bullet that contains multiple responsibilities
      const expanded = cleaned.flatMap(b => splitFatBullet(b));
      if (expanded.length > 0) return expanded;
      return cleaned;
    }
  }

  // 2. Fallback: extract from description
  if (!description || !description.trim()) return [];
  return splitDescriptionIntoBullets(description);
}

/**
 * Detect and split a single bullet string that actually contains multiple
 * responsibilities glued together by the AI parser or PDF extraction.
 *
 * Heuristics (applied in order):
 *  - Contains newlines → split by newlines then recurse
 *  - Contains inline bullet markers (•, ▸, etc.)
 *  - Contains multiple sentences (". " + uppercase) and total length > 60
 *  - Contains semicolons that look like a list
 *
 * Short, clean bullets (≤80 chars, single sentence) pass through unchanged.
 */
function splitFatBullet(text: string): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];

  // Short bullet — almost certainly a single responsibility
  if (trimmed.length <= 80 && !trimmed.includes("\n") && !/[;•▸►◆]/.test(trimmed)) {
    return [trimmed];
  }

  // Delegate to the existing single-line splitter which handles all patterns
  const parts = splitSingleLineBullets(trimmed);

  // If splitter couldn't break it further but it's still long,
  // try a more aggressive sentence split (lower threshold)
  if (parts.length === 1 && trimmed.length > 100) {
    const sentences = splitBySentencesAggressive(trimmed);
    if (sentences.length >= 2) return sentences;
  }

  return parts;
}

/**
 * More aggressive sentence splitting — also splits on ". " followed by
 * any letter (not just uppercase), and on patterns like "(tech). Next"
 * common in CV descriptions. Minimum segment length lowered to 10 chars.
 */
function splitBySentencesAggressive(text: string): string[] {
  const parts: string[] = [];
  // Split on ". " followed by any letter (upper or lower)
  const sentenceBreak = /\.\s+(?=[A-Za-zĄĆĘŁŃÓŚŹŻąćęłńóśźż])/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = sentenceBreak.exec(text)) !== null) {
    const segment = text.slice(lastIndex, match.index).trim();
    if (segment) parts.push(cleanTrailingPeriod(segment));
    lastIndex = match.index + match[0].length - 1;
  }

  const remaining = text.slice(lastIndex).trim();
  if (remaining) parts.push(cleanTrailingPeriod(remaining));

  if (parts.length >= 2 && parts.every(p => p.length >= 10)) {
    return parts;
  }
  return [];
}

/**
 * Split a raw description string into individual bullet points.
 * Handles: newlines, bullet markers, numbered lists, semicolons,
 * dash separators, and sentence-level splitting for flattened PDF text.
 */
function splitDescriptionIntoBullets(text: string): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];

  // 1. Try splitting by newlines first
  const lines = trimmed.split(/\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length >= 2) {
    const bulletCount = lines.filter(l => BULLET_LINE.test(l)).length;
    if (bulletCount / lines.length >= 0.4) {
      return lines.map(l => l.replace(BULLET_LINE, "").trim()).filter(Boolean);
    }
    const avgLen = lines.reduce((sum, l) => sum + l.length, 0) / lines.length;
    if (avgLen < 120) {
      return lines;
    }
    // Multi-line but long lines: recursively split each line
    const subResults = lines.flatMap(l => splitSingleLineBullets(l));
    if (subResults.length > lines.length) return subResults;
    return lines;
  }

  // 2. Single line — use dedicated single-line splitter
  return splitSingleLineBullets(trimmed);
}

/**
 * Split a single line (no newlines) into bullet points using various heuristics.
 * Handles inline markers, semicolons, dashes, and sentence-level splitting.
 */
function splitSingleLineBullets(text: string): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];

  // Inline bullet markers: "• task1 • task2"
  const inlineBulletSplit = trimmed.split(/\s*[•▸►◆]\s+/).filter(Boolean);
  if (inlineBulletSplit.length >= 2) return inlineBulletSplit.map(s => s.trim());

  // Inline dash/em-dash markers: "– task1 – task2"  
  const inlineDashMarker = trimmed.split(/\s*[–—]\s+/).filter(Boolean);
  if (inlineDashMarker.length >= 3) return inlineDashMarker.map(s => s.trim());

  // Numbered list in one line: "1. task1 2. task2 3. task3"
  const numberedSplit = trimmed.split(/\s*\d+[.)]\s+/).filter(Boolean);
  if (numberedSplit.length >= 2) return numberedSplit.map(s => s.trim());

  // Semicolons: "task1; task2; task3"
  const semiSplit = trimmed.split(/;\s*/).filter(Boolean);
  if (semiSplit.length >= 3 && semiSplit.every(s => s.length < 150)) {
    return semiSplit.map(s => s.trim());
  }

  // Dash separator: "task1 - task2 - task3"
  const dashSplit = trimmed.split(/\s+-\s+/).filter(Boolean);
  if (dashSplit.length >= 3 && dashSplit.every(s => s.length < 150)) {
    return dashSplit.map(s => s.trim());
  }

  // Sentence-level splitting for flattened PDF text:
  // "Designing models in Power BI. Integrating data from sources. Building reports."
  // Split on ". " but preserve abbreviations and decimals
  if (trimmed.length > 80) {
    const sentences = splitBySentences(trimmed);
    if (sentences.length >= 2) return sentences;
  }

  return [trimmed];
}

/**
 * Split text by sentence boundaries (". " followed by uppercase letter).
 * Avoids splitting on abbreviations, decimals, URLs, etc.
 */
function splitBySentences(text: string): string[] {
  // Split on period followed by space and uppercase letter (sentence boundary)
  // Also handle period at end followed by space
  const parts: string[] = [];
  // Regex: period followed by 1+ spaces and an uppercase letter
  const sentenceBreak = /\.\s+(?=[A-ZĄĆĘŁŃÓŚŹŻ])/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = sentenceBreak.exec(text)) !== null) {
    const segment = text.slice(lastIndex, match.index).trim();
    if (segment) parts.push(cleanTrailingPeriod(segment));
    lastIndex = match.index + match[0].length - 1; // keep the uppercase letter
  }

  // Remaining text
  const remaining = text.slice(lastIndex).trim();
  if (remaining) parts.push(cleanTrailingPeriod(remaining));

  // Only return if we got meaningful splits (each part >= 15 chars)
  if (parts.length >= 2 && parts.every(p => p.length >= 15)) {
    return parts;
  }
  return [];
}

function cleanTrailingPeriod(s: string): string {
  return s.replace(/\.\s*$/, "").trim();
}

/**
 * Pad bullets array to have at least `min` entries, cap at `max`.
 * Returns { visible: string[], overflow: string[] }
 */
export function padAndCapBullets(
  bullets: string[],
  min = DEFAULT_BULLETS,
  max = MAX_BULLETS,
): { visible: string[]; overflow: string[] } {
  const overflow = bullets.length > max ? bullets.slice(max) : [];
  const capped = bullets.slice(0, max);
  const padded = capped.length >= min
    ? capped
    : [...capped, ...Array(min - capped.length).fill("")];
  return { visible: padded, overflow };
}

// ─── Main extraction ─────────────────────────────────────────────────────────

export function extractProfileFields(parsedJson: unknown): Partial<ProfileFormFields> {
  if (!parsedJson || typeof parsedJson !== "object") return {};
  const p = parsedJson as ParsedCvJson;
  const result: Partial<ProfileFormFields> = {};

  const name = p.full_name || [p.first_name, p.last_name].filter(Boolean).join(" ");
  if (name?.trim()) result.fullName = name.trim();

  const titleVal = p.headline || p.current_role;
  if (titleVal?.trim()) result.title = titleVal.trim();

  if (p.city?.trim()) result.location = p.city.trim();

  if (p.summary?.trim()) result.summary = p.summary.trim().slice(0, 300);

  if (p.skills && Array.isArray(p.skills) && p.skills.length > 0) {
    result.skills = p.skills.filter((s) => typeof s === "string" && s.trim()).map((s) => s.trim());
  }

  const calculatedYears = calculateTotalExperienceYears(p.experience);
  if (calculatedYears !== null && calculatedYears > 0) {
    result.experienceYears = Math.min(480, Math.round(calculatedYears * 12));
  } else if (typeof p.years_of_experience === "number" && p.years_of_experience > 0) {
    result.experienceYears = Math.min(480, Math.round(p.years_of_experience * 12));
  }

  const cvLinks: ProfileFormFields["links"] = {};
  if (p.links?.linkedin_url?.trim()) cvLinks.linkedin = p.links.linkedin_url.trim();
  if (p.links?.github_url?.trim()) cvLinks.github = p.links.github_url.trim();
  if (p.links?.portfolio_url?.trim()) cvLinks.portfolio = p.links.portfolio_url.trim();
  if (p.links?.other_urls && p.links.other_urls.length > 0 && p.links.other_urls[0]?.trim()) {
    cvLinks.website = p.links.other_urls[0].trim();
  }
  if (Object.values(cvLinks).some(Boolean)) result.links = cvLinks;

  // Experience entries — unified bullet source of truth
  if (p.experience && Array.isArray(p.experience) && p.experience.length > 0) {
    result.experienceEntries = p.experience.slice(0, 8).map((exp) => {
      const isCurrent = isCurrentEndDate(exp.end_date);

      // Unified bullet extraction
      const allBullets = normalizeExperienceBullets(exp.bullets, exp.description);
      const { visible, overflow } = padAndCapBullets(allBullets);

      // If there's overflow, store in description so nothing is lost
      const overflowText = overflow.length > 0
        ? overflow.map(b => `• ${b}`).join("\n")
        : "";

      return {
        title: exp.job_title?.trim() || "",
        company: exp.company?.trim() || "",
        startDate: exp.start_date?.trim() || "",
        endDate: isCurrent ? "Obecnie" : (exp.end_date?.trim() || ""),
        isCurrent,
        description: overflowText,
        bullets: visible,
      };
    });
  }

  return result;
}

/**
 * Safe merge: only fills empty/missing fields from CV data.
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
    if (fromCv.links.linkedin && !existing.links.linkedin?.trim()) { mergedLinks.linkedin = fromCv.links.linkedin; linksChanged = true; }
    if (fromCv.links.github && !existing.links.github?.trim()) { mergedLinks.github = fromCv.links.github; linksChanged = true; }
    if (fromCv.links.portfolio && !existing.links.portfolio?.trim()) { mergedLinks.portfolio = fromCv.links.portfolio; linksChanged = true; }
    if (fromCv.links.website && !existing.links.website?.trim()) { mergedLinks.website = fromCv.links.website; linksChanged = true; }
    if (linksChanged) { merged.links = mergedLinks; fieldsUpdated.push("Linki"); }
  }

  return { merged, fieldsUpdated };
}

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
