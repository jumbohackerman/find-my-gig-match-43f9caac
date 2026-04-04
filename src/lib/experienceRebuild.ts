import {
  DEFAULT_BULLETS,
  MAX_BULLETS,
  extractProfileFields,
  normalizeExperienceBullets,
  padAndCapBullets,
} from "@/lib/cvProfileMapper";

export interface ExperienceEntryDraft {
  title: string;
  company: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  description: string;
  bullets: string[];
}

export interface ExperienceRebuildAssessment {
  shouldRebuild: boolean;
  matchedEntries: number;
  compressedEntries: number;
  savedBullets: number;
  rebuiltBullets: number;
}

function normalizeText(value: string | undefined | null): string {
  return (value || "").trim().toLowerCase().replace(/\s+/g, " ");
}

function roleSignature(entry: Pick<ExperienceEntryDraft, "title" | "company" | "startDate">): string {
  return `${normalizeText(entry.title)}|${normalizeText(entry.company)}|${normalizeText(entry.startDate)}`;
}

function countMeaningfulBullets(entry: ExperienceEntryDraft): number {
  return entry.bullets.filter((b) => typeof b === "string" && b.trim().length > 0).length;
}

function findSavedMatchIndex(
  savedEntries: ExperienceEntryDraft[],
  rebuiltEntry: ExperienceEntryDraft,
  used: Set<number>,
  fallbackIndex: number,
): number {
  const rebuiltSig = roleSignature(rebuiltEntry);
  if (rebuiltSig !== "|") {
    const exactIdx = savedEntries.findIndex((saved, idx) => !used.has(idx) && roleSignature(saved) === rebuiltSig);
    if (exactIdx >= 0) return exactIdx;
  }

  if (fallbackIndex < savedEntries.length && !used.has(fallbackIndex)) {
    return fallbackIndex;
  }

  return savedEntries.findIndex((_, idx) => !used.has(idx));
}

export function hasParsedCvJson(parsedJson: unknown): parsedJson is Record<string, unknown> {
  return !!(
    parsedJson &&
    typeof parsedJson === "object" &&
    Object.keys(parsedJson as Record<string, unknown>).length > 0
  );
}

export function normalizeExperienceEntries(
  entries: ExperienceEntryDraft[] | null | undefined,
): ExperienceEntryDraft[] {
  if (!entries || entries.length === 0) return [];

  return entries.slice(0, 8).map((entry) => {
    const allBullets = normalizeExperienceBullets(entry.bullets, entry.description);
    const { visible, overflow } = padAndCapBullets(allBullets, DEFAULT_BULLETS, MAX_BULLETS);

    const overflowDescription = overflow.length > 0
      ? overflow.map((b) => `• ${b}`).join("\n")
      : (entry.description || "").trim();

    return {
      ...entry,
      title: (entry.title || "").trim(),
      company: (entry.company || "").trim(),
      startDate: (entry.startDate || "").trim(),
      endDate: (entry.endDate || "").trim(),
      isCurrent: Boolean(entry.isCurrent),
      description: overflowDescription,
      bullets: visible,
    };
  });
}

export function rebuildExperienceEntriesFromParsedJson(parsedJson: unknown): ExperienceEntryDraft[] {
  if (!hasParsedCvJson(parsedJson)) return [];
  const fromCv = extractProfileFields(parsedJson);
  return normalizeExperienceEntries((fromCv.experienceEntries || []) as ExperienceEntryDraft[]);
}

export function assessLegacyExperienceRebuild(
  savedEntries: ExperienceEntryDraft[] | null | undefined,
  rebuiltEntries: ExperienceEntryDraft[] | null | undefined,
): ExperienceRebuildAssessment {
  const saved = normalizeExperienceEntries(savedEntries);
  const rebuilt = normalizeExperienceEntries(rebuiltEntries);

  if (rebuilt.length === 0) {
    return {
      shouldRebuild: false,
      matchedEntries: 0,
      compressedEntries: 0,
      savedBullets: 0,
      rebuiltBullets: 0,
    };
  }

  if (saved.length === 0) {
    return {
      shouldRebuild: true,
      matchedEntries: 0,
      compressedEntries: rebuilt.length,
      savedBullets: 0,
      rebuiltBullets: rebuilt.reduce((sum, entry) => sum + countMeaningfulBullets(entry), 0),
    };
  }

  const usedSaved = new Set<number>();
  let matchedEntries = 0;
  let compressedEntries = 0;

  for (let idx = 0; idx < rebuilt.length; idx += 1) {
    const rebuiltEntry = rebuilt[idx];
    const savedIdx = findSavedMatchIndex(saved, rebuiltEntry, usedSaved, idx);
    if (savedIdx < 0) continue;

    usedSaved.add(savedIdx);
    matchedEntries += 1;

    const savedBullets = countMeaningfulBullets(saved[savedIdx]);
    const rebuiltBullets = countMeaningfulBullets(rebuiltEntry);

    if (savedBullets <= 2 && rebuiltBullets >= 4 && rebuiltBullets >= savedBullets + 2) {
      compressedEntries += 1;
    }
  }

  const savedBullets = saved.reduce((sum, entry) => sum + countMeaningfulBullets(entry), 0);
  const rebuiltBullets = rebuilt.reduce((sum, entry) => sum + countMeaningfulBullets(entry), 0);
  const enoughMatches = matchedEntries >= Math.max(1, Math.ceil(rebuilt.length / 2));

  return {
    shouldRebuild:
      compressedEntries > 0 &&
      enoughMatches &&
      rebuiltBullets >= savedBullets + 2,
    matchedEntries,
    compressedEntries,
    savedBullets,
    rebuiltBullets,
  };
}