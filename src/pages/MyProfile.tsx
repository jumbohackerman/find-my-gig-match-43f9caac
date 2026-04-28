import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Briefcase, Save, Plus, X, Upload, FileText,
  Globe, Github, Linkedin, ExternalLink, ChevronDown, Minus, Trash2, Eye, Languages,
  Sparkles, ShieldCheck, ShieldOff, AlertTriangle, CheckCircle2
} from "lucide-react";
import logo from "@/assets/jobswipe-logo.png";
import { getProvider } from "@/providers/registry";
import { useAuth } from "@/hooks/useAuth";
import { useConsent } from "@/hooks/useConsent";
import AIConsentModal from "@/components/AIConsentModal";
import { Progress } from "@/components/ui/progress";
import { ProfileSkeleton } from "@/components/StateViews";
import LocalErrorBoundary from "@/components/LocalErrorBoundary";
import { toast } from "sonner";
import CandidateProfileModal from "@/components/CandidateProfileModal";
import CandidateCvUpload from "@/components/CandidateCvUpload";
import ContactInvitationsList from "@/components/candidate/ContactInvitationsList";
import { downloadCandidateProfilePdf } from "@/lib/downloadProfilePdf";
import type { SkillsByLevel, ExperienceEntry, CandidateLinks, Language, Candidate } from "@/domain/models";
import { emptySkills, emptyLinks, getAllSkills } from "@/domain/models";

const SENIORITY_OPTIONS = ["Junior", "Mid", "Senior", "Lead"];
const WORK_MODE_OPTIONS = ["Zdalnie", "Hybrydowo", "Stacjonarnie"];
const EMPLOYMENT_OPTIONS = ["Full-time", "Contract", "Part-time"];
const AVAILABILITY_OPTIONS = ["Otwarty na oferty", "Pasywny", "Nie szukam"];
const CURRENCY_OPTIONS = ["PLN", "EUR", "USD"];
const LANGUAGE_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2", "native"];

const SKILL_SUGGESTIONS = [
  "React", "TypeScript", "JavaScript", "Node.js", "Python", "Go",
  "GraphQL", "PostgreSQL", "AWS", "Docker", "Kubernetes", "Terraform",
  "Figma", "UI/UX", "Swift", "Kotlin", "React Native", "Next.js",
  "Tailwind CSS", "MongoDB", "Redis", "Machine Learning", "Vue.js",
  "Angular", "Java", "C#", "Ruby", "PHP", "Rust",
];

const INDUSTRY_OPTIONS = [
  "IT / Software", "Finanse / Banking", "E-commerce", "Healthcare",
  "Edukacja", "Marketing / Reklama", "Logistyka / Transport",
  "Produkcja", "Telekomunikacja", "Consulting", "Media / Rozrywka",
  "Real Estate", "Energetyka", "HR / Rekrutacja", "Inne",
];

function computeCompleteness(data: {
  fullName: string;
  title: string;
  location: string;
  summary: string;
  skills: SkillsByLevel;
  experienceEntries: ExperienceEntry[];
  salaryMin: number;
  links: CandidateLinks;
  languages: Language[];
  primaryIndustry: string;
}) {
  const missing: string[] = [];
  let score = 0;
  const total = 9;
  if (data.fullName.trim()) score++; else missing.push("Dodaj imię i nazwisko");
  if (data.title.trim()) score++; else missing.push("Dodaj tytuł zawodowy");
  if (data.location.trim()) score++; else missing.push("Dodaj lokalizację");
  if (data.summary.trim()) score++; else missing.push("Dodaj podsumowanie zawodowe");
  const allSkills = [...data.skills.advanced, ...data.skills.intermediate, ...data.skills.beginner];
  if (allSkills.length >= 3) score++; else missing.push("Dodaj co najmniej 3 umiejętności");
  if (data.experienceEntries.length > 0) score++; else missing.push("Dodaj doświadczenie zawodowe");
  if (data.salaryMin > 0) score++; else missing.push("Ustaw oczekiwania finansowe");
  if (data.links.portfolio_url || data.links.github_url || data.links.linkedin_url || data.links.website_url) score++; else missing.push("Dodaj co najmniej jeden link");
  if (data.languages.length > 0) score++; else missing.push("Dodaj znane języki");

  return {
    score: Math.round((score / total) * 100),
    missing
  };
}

/** Walidacja URL — pusty string OK; w przeciwnym razie wymagany http(s):// */
function isValidUrl(value: string): boolean {
  const v = value.trim();
  if (!v) return true;
  try {
    const u = new URL(v);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

interface ProfileValidationInput {
  fullName: string;
  title: string;
  location: string;
  salaryMin: number;
  salaryMax: number;
  links: CandidateLinks;
}

/** Zwraca listę błędów walidacji formularza profilu kandydata. */
function validateCandidateProfile(input: ProfileValidationInput): string[] {
  const errors: string[] = [];
  if (!input.fullName.trim()) errors.push("Imię i nazwisko są wymagane.");
  if (!input.title.trim()) errors.push("Tytuł zawodowy jest wymagany.");
  if (!input.location.trim()) errors.push("Lokalizacja jest wymagana.");
  if (input.salaryMin < 0 || input.salaryMax < 0) {
    errors.push("Wynagrodzenie nie może być ujemne.");
  }
  if (input.salaryMin > 0 && input.salaryMax > 0 && input.salaryMin > input.salaryMax) {
    errors.push("Minimalne wynagrodzenie nie może być wyższe niż maksymalne.");
  }
  const linkChecks: [string, string | undefined][] = [
    ["Portfolio", input.links.portfolio_url],
    ["GitHub", input.links.github_url],
    ["LinkedIn", input.links.linkedin_url],
    ["Strona osobista", input.links.website_url],
  ];
  for (const [label, val] of linkChecks) {
    if (val && !isValidUrl(val)) {
      errors.push(`Link "${label}" musi być poprawnym adresem URL (np. https://...).`);
    }
  }
  return errors;
}

const MyProfile = () => {
  const { user, profile, loading: authLoading } = useAuth();
  const isEmployer = profile?.role === "employer";
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  /** Block 11: True after AI pre-fills profile from CV; cleared after successful save. */
  const [aiPrefilled, setAiPrefilled] = useState(false);

  // Basic info
  const [fullName, setFullName] = useState("");
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [seniority, setSeniority] = useState("Mid");
  const [summary, setSummary] = useState("");

  // Work preferences
  const [workMode, setWorkMode] = useState("Zdalnie");
  const [employmentType, setEmploymentType] = useState("Full-time");
  const [salaryMin, setSalaryMin] = useState(0);
  const [salaryMax, setSalaryMax] = useState(0);
  const [salaryCurrency, setSalaryCurrency] = useState("PLN");
  const [availability, setAvailability] = useState("Otwarty na oferty");

  // Skills (structured)
  const [skills, setSkills] = useState<SkillsByLevel>(emptySkills());
  const [skillInput, setSkillInput] = useState("");
  const [activeSkillLevel, setActiveSkillLevel] = useState<keyof SkillsByLevel>("advanced");

  // Experience
  const [experienceEntries, setExperienceEntries] = useState<ExperienceEntry[]>([]);
  const [expandedExp, setExpandedExp] = useState<number | null>(null);

  // Links
  const [links, setLinks] = useState<CandidateLinks>(emptyLinks());

  // Languages
  const [languages, setLanguages] = useState<Language[]>([]);
  const [newLangName, setNewLangName] = useState("");
  const [newLangLevel, setNewLangLevel] = useState("B2");

  // Industry
  const [primaryIndustry, setPrimaryIndustry] = useState("");

  // CV
  const [cvUrl, setCvUrl] = useState<string | null>(null);

  // Czy w bazie istnieje już realny rekord candidate (vs. pusty szkielet do uzupełnienia).
  const [profileExists, setProfileExists] = useState(false);

  const [activeSection, setActiveSection] = useState<string>("basic");
  const [showPreview, setShowPreview] = useState(false);

  // ── AI processing consent (Block 4) ───────────────────────────────────────
  const { consent, hasConsent, hasDecided, grantConsent, withdrawConsent, loading: consentLoading } = useConsent();
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [consentBusy, setConsentBusy] = useState(false);
  const [showWithdrawWarning, setShowWithdrawWarning] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    const load = async () => {
      if (!isEmployer) {
        const candidate = await getProvider("candidates").getByUserId(user.id);
        if (candidate) {
          setProfileExists(true);
          setFullName(candidate.fullName || "");
          setTitle(candidate.title || "");
          setLocation(candidate.location || "");
          setSummary(candidate.summary || "");
          setSkills(candidate.skills || emptySkills());
          setSeniority(candidate.seniority || "Mid");
          setWorkMode(candidate.workMode || "Zdalnie");
          setEmploymentType(candidate.employmentType || "Full-time");
          setSalaryMin(candidate.salaryMin || 0);
          setSalaryMax(candidate.salaryMax || 0);
          setSalaryCurrency(candidate.salaryCurrency || "PLN");
          setAvailability(candidate.availability || "Otwarty na oferty");
          setExperienceEntries(candidate.experienceEntries || []);
          setLinks(candidate.links || emptyLinks());
          setLanguages(candidate.languages || []);
          setPrimaryIndustry(candidate.primaryIndustry || "");
          setCvUrl(candidate.cvUrl || null);
        } else {
          // Brak realnego profilu w bazie — UI pokaże baner "Uzupełnij profil",
          // a wartości pól pozostaną domyślnie puste (nie używamy demo profilu jako prawdy).
          setProfileExists(false);
        }
      } else {
        setFullName(profile?.full_name || user.user_metadata?.full_name || "");
      }
      setLoading(false);
    };
    load();
  }, [user, profile, authLoading, isEmployer]);

  const handleSave = async () => {
    if (!user || saving) return;
    setSaving(true);

    try {
      if (!isEmployer) {
        // Walidacja PRZED zapisem — nie zapisujemy cicho złych danych.
        const errors = validateCandidateProfile({
          fullName, title, location, salaryMin, salaryMax, links,
        });
        if (errors.length > 0) {
          toast.error(errors[0], {
            description: errors.length > 1 ? `+${errors.length - 1} kolejnych błędów do poprawienia.` : undefined,
          });
          setSaving(false);
          return;
        }

        const completeness = computeCompleteness({
          fullName, title, location, summary, skills, experienceEntries,
          salaryMin, links, languages, primaryIndustry,
        });

        await getProvider("candidates").upsert(user.id, {
          fullName: fullName.trim(),
          title: title.trim(),
          location: location.trim(),
          summary,
          skills,
          seniority: seniority as Candidate["seniority"],
          workMode: workMode as Candidate["workMode"],
          employmentType: employmentType as Candidate["employmentType"],
          salaryMin,
          salaryMax,
          salaryCurrency,
          availability,
          experienceEntries,
          links,
          languages,
          primaryIndustry,
          profileCompleteness: completeness.score,
          cvUrl,
        });
        setProfileExists(true);
      } else {
        if (!fullName.trim()) {
          toast.error("Podaj nazwę firmy / imię i nazwisko.");
          setSaving(false);
          return;
        }
        await getProvider("profiles").update(user.id, { fullName: fullName.trim() });
      }

      toast.success("Profil zapisany");
      setLastSaved(new Date().toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" }));
      setAiPrefilled(false);

      // Block 4: After first profile save, gate access with the AI consent modal.
      if (!isEmployer && !hasDecided && !consentLoading) {
        setShowConsentModal(true);
      }
    } catch (error) {
      const msg = (error as Error)?.message || "Nie udało się zapisać profilu";
      toast.error(`Nie udało się zapisać profilu: ${msg}`);
    }

    setSaving(false);
  };

  const handleAcceptConsent = async () => {
    setConsentBusy(true);
    try {
      await grantConsent();
      toast.success("Zgoda zapisana — możesz teraz aplikować na oferty.");
      setShowConsentModal(false);
    } catch {
      toast.error("Nie udało się zapisać zgody.");
    } finally {
      setConsentBusy(false);
    }
  };

  const handleDeclineConsent = async () => {
    setConsentBusy(true);
    try {
      await withdrawConsent();
      toast.info("Bez zgody nie możesz aplikować. Możesz przeglądać oferty bez aplikowania.");
      setShowConsentModal(false);
    } catch {
      toast.error("Nie udało się zapisać decyzji.");
    } finally {
      setConsentBusy(false);
    }
  };

  const handleWithdrawConsent = async () => {
    setConsentBusy(true);
    try {
      await withdrawConsent();
      toast.success("Zgoda wycofana. Nie możesz już aplikować na nowe oferty.");
      setShowWithdrawWarning(false);
    } catch {
      toast.error("Nie udało się wycofać zgody.");
    } finally {
      setConsentBusy(false);
    }
  };

  // Skills helpers
  const addSkill = (skill: string, level: keyof SkillsByLevel = activeSkillLevel) => {
    const s = skill.trim();
    if (!s) return;
    const allExisting = [...skills.advanced, ...skills.intermediate, ...skills.beginner];
    if (allExisting.includes(s)) {
      toast.info(`"${s}" jest już na liście umiejętności.`);
      return;
    }
    setSkills(prev => ({ ...prev, [level]: [...prev[level], s] }));
    setSkillInput("");
  };

  const removeSkill = (skill: string, level: keyof SkillsByLevel) => {
    setSkills(prev => ({ ...prev, [level]: prev[level].filter(s => s !== skill) }));
  };

  // Experience helpers
  const addExperience = () => {
    if (experienceEntries.length >= 8) return;
    setExperienceEntries([
      ...experienceEntries,
      { job_title: "", company_name: "", start_date: "", end_date: "", is_current: false, description_points: [""] },
    ]);
    setExpandedExp(experienceEntries.length);
  };

  const updateExperience = (idx: number, field: keyof ExperienceEntry, value: any) => {
    const arr = [...experienceEntries];
    (arr[idx] as any)[field] = value;
    if (field === "is_current" && value === true) {
      arr[idx].end_date = "Obecnie";
    }
    setExperienceEntries(arr);
  };

  const removeExperience = (idx: number) => {
    setExperienceEntries(experienceEntries.filter((_, i) => i !== idx));
    setExpandedExp(null);
  };

  // Language helpers
  const addLanguage = () => {
    if (!newLangName.trim()) return;
    if (languages.some(l => l.name.toLowerCase() === newLangName.trim().toLowerCase())) {
      toast.info("Ten język jest już na liście.");
      return;
    }
    setLanguages([...languages, { name: newLangName.trim(), level: newLangLevel }]);
    setNewLangName("");
  };

  const removeLanguage = (idx: number) => {
    setLanguages(languages.filter((_, i) => i !== idx));
  };

  const updateLanguage = (idx: number, field: keyof Language, value: string) => {
    const arr = [...languages];
    arr[idx] = { ...arr[idx], [field]: value };
    setLanguages(arr);
  };

  // CV upload
  const handleCvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.type !== "application/pdf") { toast.error("Dozwolone tylko pliki PDF"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Plik jest za duży. Maksymalny rozmiar to 5MB."); return; }
    const path = `${user.id}/cv-${Date.now()}.pdf`;
    const result = await getProvider("storage").upload("cvs", path, file);
    if (result.error) { toast.error("Przesyłanie nie powiodło się"); }
    else { setCvUrl(path); toast.success("CV przesłane"); }
  };

  const handleCvParsed = useCallback((parsedJson: unknown) => {
    if (!parsedJson || typeof parsedJson !== "object") {
      toast.error("Brak danych z analizy CV.");
      return;
    }
    const p = parsedJson as {
      // Spec (Block 11) shape
      job_title?: string | null;
      level?: string | null;
      salary_min?: number | null;
      salary_max?: number | null;
      education?: Array<{
        degree?: string | null;
        school?: string | null;
        field?: string | null;
        start_date?: string | null;
        end_date?: string | null;
      }> | null;
      // Legacy/parse-cv-ai shape
      full_name?: string | null;
      first_name?: string | null;
      last_name?: string | null;
      headline?: string | null;
      current_role?: string | null;
      city?: string | null;
      country?: string | null;
      location?: string | null;
      summary?: string | null;
      // Skills can be either string[] (legacy) or { advanced/intermediate/basic } (spec)
      skills?: string[] | { advanced?: string[]; intermediate?: string[]; basic?: string[]; beginner?: string[] } | null;
      languages?: Array<{ name: string; level?: string | null }> | null;
      // Links can be the spec flat shape or legacy *_url shape
      links?: {
        linkedin?: string | null;
        github?: string | null;
        portfolio?: string | null;
        website?: string | null;
        linkedin_url?: string | null;
        github_url?: string | null;
        portfolio_url?: string | null;
        other_urls?: string[] | null;
      } | null;
      experience?: Array<{
        // Spec
        title?: string | null;
        is_current?: boolean | null;
        responsibilities?: string[] | null;
        // Legacy
        job_title?: string | null;
        company?: string | null;
        start_date?: string | null;
        end_date?: string | null;
        description?: string | null;
        bullets?: string[] | null;
      }> | null;
      preferred_job_titles?: string[] | null;
    };

    // fullName
    const name = p.full_name || [p.first_name, p.last_name].filter(Boolean).join(" ");
    if (name?.trim()) setFullName(name.trim());

    // title (job_title from spec, falls back to legacy fields)
    const titleVal = p.job_title || p.current_role || p.headline || (p.preferred_job_titles && p.preferred_job_titles[0]);
    if (titleVal?.trim()) setTitle(titleVal.trim());

    // level / seniority
    if (p.level && typeof p.level === "string" && SENIORITY_OPTIONS.includes(p.level)) {
      setSeniority(p.level);
    }

    // location (spec: top-level "location"; legacy: city + country)
    const loc = p.location?.trim() || [p.city, p.country].filter(Boolean).join(", ");
    if (loc.trim()) setLocation(loc.trim());

    // summary
    if (p.summary?.trim()) setSummary(p.summary.trim().slice(0, 300));

    // salary expectations
    if (typeof p.salary_min === "number" && p.salary_min > 0) setSalaryMin(p.salary_min);
    if (typeof p.salary_max === "number" && p.salary_max > 0) setSalaryMax(p.salary_max);

    // skills — spec shape ({advanced, intermediate, basic}) OR legacy flat string[]
    if (p.skills) {
      if (Array.isArray(p.skills)) {
        const unique = [...new Set(p.skills.filter(s => typeof s === "string" && s.trim()).map(s => s.trim()))];
        if (unique.length > 0) setSkills({ advanced: unique, intermediate: [], beginner: [] });
      } else if (typeof p.skills === "object") {
        const next: SkillsByLevel = {
          advanced: Array.isArray(p.skills.advanced) ? p.skills.advanced.filter(Boolean) : [],
          intermediate: Array.isArray(p.skills.intermediate) ? p.skills.intermediate.filter(Boolean) : [],
          beginner: Array.isArray(p.skills.basic)
            ? p.skills.basic.filter(Boolean)
            : Array.isArray(p.skills.beginner) ? p.skills.beginner.filter(Boolean) : [],
        };
        if (next.advanced.length || next.intermediate.length || next.beginner.length) {
          setSkills(next);
        }
      }
    }

    // languages
    if (p.languages && Array.isArray(p.languages) && p.languages.length > 0) {
      const mapped = p.languages
        .filter(l => l.name && l.name.trim())
        .map(l => ({ name: l.name.trim(), level: l.level?.trim() || "" }));
      if (mapped.length > 0) setLanguages(mapped);
    }

    // links — accept both spec (flat) and legacy (*_url) shapes
    if (p.links) {
      const newLinks: CandidateLinks = { ...emptyLinks() };
      const li = p.links.linkedin || p.links.linkedin_url;
      const gh = p.links.github || p.links.github_url;
      const pf = p.links.portfolio || p.links.portfolio_url;
      const ws = p.links.website || (p.links.other_urls && p.links.other_urls[0]);
      if (li?.trim()) newLinks.linkedin_url = li.trim();
      if (gh?.trim()) newLinks.github_url = gh.trim();
      if (pf?.trim()) newLinks.portfolio_url = pf.trim();
      if (ws?.trim()) newLinks.website_url = ws.trim();
      if (Object.values(newLinks).some(Boolean)) setLinks(newLinks);
    }

    // experience entries — spec uses "title"/"responsibilities", legacy uses "job_title"/"bullets"
    if (p.experience && Array.isArray(p.experience) && p.experience.length > 0) {
      const entries: ExperienceEntry[] = p.experience.slice(0, 8).map(exp => {
        const isCurrent = exp.is_current === true
          || !exp.end_date
          || !exp.end_date.trim()
          || ["present", "current", "now", "obecnie", "aktualnie", "do teraz"].includes(exp.end_date.trim().toLowerCase());

        let descPoints: string[];
        const bulletSource = (Array.isArray(exp.responsibilities) && exp.responsibilities.length > 0)
          ? exp.responsibilities
          : (Array.isArray(exp.bullets) && exp.bullets.length > 0 ? exp.bullets : null);
        if (bulletSource) {
          descPoints = bulletSource.filter(b => typeof b === "string" && b.trim()).map(b => b.trim());
        } else if (exp.description?.trim()) {
          descPoints = [exp.description.trim()];
        } else {
          descPoints = [""];
        }
        if (descPoints.length === 0) descPoints = [""];

        return {
          job_title: (exp.title || exp.job_title)?.trim() || "",
          company_name: exp.company?.trim() || "",
          start_date: exp.start_date?.trim() || "",
          end_date: isCurrent ? "Obecnie" : (exp.end_date?.trim() || ""),
          is_current: isCurrent,
          description_points: descPoints,
        };
      });
      setExperienceEntries(entries);
    }

    setAiPrefilled(true);
    toast.success("Dane z CV zostały wstępnie uzupełnione. Sprawdź każdą sekcję przed zapisaniem.");
  }, []);

  const completeness = computeCompleteness({
    fullName, title, location, summary, skills, experienceEntries,
    salaryMin, links, languages, primaryIndustry,
  });

  const toggleSection = (id: string) => {
    setActiveSection(activeSection === id ? "" : id);
  };

  const allSkillsFlat = [...skills.advanced, ...skills.intermediate, ...skills.beginner];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border flex items-center gap-2">
          <Link to="/" aria-label="JobSwipe — wróć do przeglądania ofert" className="flex items-center gap-2 hover:opacity-80 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg">
            <img src={logo} alt="" className="w-8 h-8 object-contain" />
            <h1 className="font-display text-xl font-bold text-foreground">JobSwipe</h1>
          </Link>
        </header>
        <main className="flex-1 px-4 py-6 max-w-lg mx-auto w-full">
          <ProfileSkeleton />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border flex items-center justify-between gap-2">
        <Link to="/" aria-label="JobSwipe — wróć do przeglądania ofert" className="flex items-center gap-2 shrink-0 hover:opacity-80 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg">
          <img src={logo} alt="" className="w-8 h-8 object-contain" />
          <h1 className="font-display text-xl font-bold text-foreground">JobSwipe</h1>
        </Link>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <Link to="/" className="p-2 sm:px-4 sm:py-2 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium hover:bg-muted transition-colors">
            <span className="hidden sm:inline">Przeglądaj oferty</span>
            <Briefcase className="w-4 h-4 sm:hidden" />
          </Link>
          {!isEmployer && (
            <>
              <button onClick={() => setShowPreview(true)} className="flex items-center gap-2 p-2 sm:px-4 sm:py-2 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium border border-border hover:bg-muted transition-colors">
                <Eye className="w-4 h-4" />
                <span className="hidden sm:inline">Podgląd</span>
              </button>
              <button
                onClick={() => user?.id && downloadCandidateProfilePdf(user.id)}
                className="flex items-center gap-2 p-2 sm:px-4 sm:py-2 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium border border-border hover:bg-muted transition-colors"
                title="Pobierz CV (PDF)"
              >
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">Pobierz CV (PDF)</span>
              </button>
            </>
          )}
          <div className="flex flex-col items-stretch">
            <button onClick={handleSave} disabled={saving} aria-busy={saving} data-testid="profile-save"
              className="flex items-center gap-2 p-2 sm:px-4 sm:py-2 rounded-xl btn-gradient text-primary-foreground text-sm font-medium shadow-glow hover:scale-105 transition-transform disabled:opacity-50 disabled:pointer-events-none">
              <Save className="w-4 h-4" />
              <span className="hidden sm:inline">
                {saving ? "Zapisuję…" : (aiPrefilled ? "Zatwierdź i zapisz profil" : "Zapisz profil")}
              </span>
            </button>
            {lastSaved && (
              <p className="text-[10px] text-muted-foreground text-center mt-1.5">
                Ostatni zapis: {lastSaved}
              </p>
            )}
          </div>
        </div>
      </header>

      <main className={`flex-1 w-full px-4 py-6 ${isEmployer ? "max-w-lg mx-auto" : "max-w-6xl mx-auto lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-8"}`}>
        <LocalErrorBoundary label="Formularz profilu">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="min-w-0">
          <h2 className="font-display text-2xl font-bold text-foreground mb-1">
            {isEmployer ? "Profil pracodawcy" : "Mój profil"}
          </h2>
          <p className="text-muted-foreground text-sm mb-4">
            {isEmployer
              ? "Uzupełnij dane firmy, aby kandydaci mogli Cię lepiej poznać."
              : "Bądź zwięzły — rekruterzy skanują profil w mniej niż 30 sekund."}
          </p>

          {/* Profil nie istnieje jeszcze w bazie — jasny komunikat zamiast cichego pokazywania pustego stanu jako "profilu". */}
          {!isEmployer && !profileExists && (
            <div className="mb-6 p-4 rounded-2xl border border-primary/40 bg-primary/10 flex items-start gap-3" role="status" aria-live="polite">
              <AlertTriangle className="w-5 h-5 text-primary shrink-0 mt-0.5" aria-hidden="true" />
              <div className="text-sm text-foreground">
                <p className="font-semibold mb-1">Uzupełnij swój profil</p>
                <p className="text-muted-foreground">
                  Nie masz jeszcze zapisanego profilu kandydata. Wypełnij wymagane pola (imię i nazwisko, tytuł, lokalizacja) i kliknij <strong>Zapisz</strong>, aby zacząć aplikować na oferty.
                </p>
              </div>
            </div>
          )}

          {/* Block 11: AI prefill banner */}
          {!isEmployer && aiPrefilled && (
            <div className="mb-6 p-4 rounded-2xl border border-yellow-500/40 bg-yellow-500/10 flex items-start gap-3" role="status" aria-live="polite">
              <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-sm text-foreground">
                <span aria-hidden="true">⚠️ </span>
                Dane zostały wstępnie uzupełnione przez AI na podstawie Twojego CV.
                Sprawdź każdą sekcję i popraw błędy przed zapisaniem.
              </p>
            </div>
          )}

          {/* Completeness — mobile only (desktop shows it in sticky right column) */}
          {!isEmployer && (
            <div className="mb-6 p-4 rounded-2xl bg-secondary/50 border border-border lg:hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground">Kompletność profilu</span>
                <span className={`text-sm font-bold ${completeness.score >= 80 ? "text-accent" : completeness.score >= 50 ? "text-yellow-400" : "text-muted-foreground"}`}>
                  {completeness.score}%
                </span>
              </div>
              <Progress value={completeness.score} className="h-2 mb-3" />
              {completeness.missing.length > 0 && (
                <div className="mt-3">
                  <p className="text-[11px] font-semibold text-foreground uppercase tracking-wider mb-2">Kolejne kroki:</p>
                  <ul className="text-xs text-muted-foreground space-y-1.5">
                    {completeness.missing.slice(0, 3).map((item, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-primary" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Accordion sections */}
          <div className="space-y-2">
          {isEmployer ? (
            <AccordionSection id="basic" label="Dane firmy" icon="🏢" isOpen={activeSection === "basic"} onToggle={() => toggleSection("basic")} badge={fullName || undefined}>
              <div className="space-y-4">
                <Field label="Imię i nazwisko / osoba kontaktowa" value={fullName} onChange={setFullName} placeholder="Jan Kowalski" />
                <p className="text-xs text-muted-foreground">
                  Aby zarządzać ofertami pracy i przeglądać kandydatów, przejdź do{" "}
                  <Link to="/employer" className="text-primary hover:underline">Panelu pracodawcy</Link>.
                </p>
              </div>
            </AccordionSection>
          ) : (
            <>
            {/* ── CV + AI — top of profile ── */}
            {!cvUrl ? (
              <div className="rounded-2xl border-2 border-dashed border-primary/30 bg-primary/[0.03] p-5 sm:p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                    <Sparkles className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display text-base font-bold text-foreground mb-1">
                      Uzupełnij profil w sekundę
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                      Wrzuć swoje CV w PDF — AI automatycznie wyciągnie umiejętności, doświadczenie
                      i dane kontaktowe. Nie musisz nic wpisywać ręcznie.
                    </p>
                    <CandidateCvUpload onParsed={handleCvParsed} />
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-accent/30 bg-accent/5 p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-accent shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">CV przesłane i przeanalizowane</p>
                    <p className="text-xs text-muted-foreground">Profil został uzupełniony na podstawie Twojego CV.</p>
                  </div>
                  <button
                    onClick={() => toggleSection("links")}
                    className="text-xs text-primary hover:underline shrink-0"
                  >
                    Zmień CV
                  </button>
                </div>
              </div>
            )}

            {/* BASIC INFO */}
            <AccordionSection id="basic" label="Dane podstawowe" icon="👤" isOpen={activeSection === "basic"} onToggle={() => toggleSection("basic")} badge={title || undefined}>
              <div className="space-y-4">
                <Field label="Imię i nazwisko" value={fullName} onChange={setFullName} placeholder="Jan Kowalski" />
                <Field label="Tytuł zawodowy" value={title} onChange={setTitle} placeholder="Frontend Engineer" />
                <Field label="Lokalizacja" value={location} onChange={setLocation} placeholder="Warszawa" />
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Poziom</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    {SENIORITY_OPTIONS.map((s) => (
                      <button key={s} onClick={() => setSeniority(s)}
                        className={`py-2 rounded-xl text-xs font-medium transition-all ${seniority === s ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-muted"}`}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Podsumowanie zawodowe ({summary.length}/300)</label>
                  <textarea value={summary} onChange={(e) => setSummary(e.target.value.slice(0, 300))}
                    placeholder="Np. Analityk danych z 3-letnim doświadczeniem w przetwarzaniu i wizualizacji danych. Specjalizacja w Power BI, Python i SQL."
                    rows={3} className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Branża</label>
                  <select value={primaryIndustry} onChange={(e) => setPrimaryIndustry(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                    <option value="">Wybierz branżę…</option>
                    {INDUSTRY_OPTIONS.map(ind => <option key={ind} value={ind}>{ind}</option>)}
                  </select>
                </div>
              </div>
            </AccordionSection>

            {/* WORK PREFERENCES */}
            <AccordionSection id="prefs" label="Preferencje pracy" icon="⚙️" isOpen={activeSection === "prefs"} onToggle={() => toggleSection("prefs")} badge={`${workMode} · ${employmentType}`}>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Tryb pracy</label>
                  <div className="grid grid-cols-3 gap-2">
                    {WORK_MODE_OPTIONS.map((w) => (
                      <button key={w} onClick={() => setWorkMode(w)}
                        className={`py-2 rounded-xl text-xs font-medium transition-all ${workMode === w ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-muted"}`}>
                        {w}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Typ zatrudnienia</label>
                  <div className="grid grid-cols-3 gap-2">
                    {EMPLOYMENT_OPTIONS.map((e) => (
                      <button key={e} onClick={() => setEmploymentType(e)}
                        className={`py-2 rounded-xl text-xs font-medium transition-all ${employmentType === e ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-muted"}`}>
                        {e}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Oczekiwania finansowe: {salaryMin > 0 || salaryMax > 0 ? `${salaryMin} 000 – ${salaryMax} 000 ${salaryCurrency} brutto` : "Nie ustawiono"}
                  </label>
                  <div className="flex gap-3 items-center flex-wrap">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setSalaryMin(Math.max(0, salaryMin - 1))} className="w-8 h-8 rounded-lg bg-secondary border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"><Minus className="w-3 h-3" /></button>
                      <div className="w-14 h-8 rounded-lg bg-secondary border border-border flex items-center justify-center text-sm font-semibold text-foreground">{salaryMin || "Min"}</div>
                      <button onClick={() => setSalaryMin(Math.min(100, salaryMin + 1))} className="w-8 h-8 rounded-lg bg-secondary border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"><Plus className="w-3 h-3" /></button>
                    </div>
                    <span className="text-muted-foreground text-sm">–</span>
                    <div className="flex items-center gap-1">
                      <button onClick={() => setSalaryMax(Math.max(0, salaryMax - 1))} className="w-8 h-8 rounded-lg bg-secondary border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"><Minus className="w-3 h-3" /></button>
                      <div className="w-14 h-8 rounded-lg bg-secondary border border-border flex items-center justify-center text-sm font-semibold text-foreground">{salaryMax || "Max"}</div>
                      <button onClick={() => setSalaryMax(Math.min(100, salaryMax + 1))} className="w-8 h-8 rounded-lg bg-secondary border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"><Plus className="w-3 h-3" /></button>
                    </div>
                    <select value={salaryCurrency} onChange={(e) => setSalaryCurrency(e.target.value)}
                      className="px-2 py-1.5 rounded-lg bg-secondary border border-border text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring">
                      {CURRENCY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Dostępność</label>
                  <div className="grid grid-cols-3 gap-2">
                    {AVAILABILITY_OPTIONS.map((a) => (
                      <button key={a} onClick={() => setAvailability(a)}
                        className={`py-2 rounded-xl text-xs font-medium transition-all ${availability === a ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-muted"}`}>
                        {a}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </AccordionSection>

            {/* SKILLS */}
            <AccordionSection id="skills" label="Umiejętności" icon="🚀" isOpen={activeSection === "skills"} onToggle={() => toggleSection("skills")}
              badge={allSkillsFlat.length > 0 ? `${allSkillsFlat.length} umiejętności` : undefined}>
              <div className="space-y-4">
                {/* Level tabs */}
                <div className="grid grid-cols-3 gap-1.5">
                  {(["advanced", "intermediate", "beginner"] as const).map(level => (
                    <button key={level} onClick={() => setActiveSkillLevel(level)}
                      className={`py-2 rounded-xl text-xs font-medium transition-all ${activeSkillLevel === level ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-muted"}`}>
                      {level === "advanced" ? "Zaawansowane" : level === "intermediate" ? "Średniozaawansowane" : "Podstawowe"}
                    </button>
                  ))}
                </div>

                {/* Add skill input */}
                <div className="flex gap-2">
                  <input value={skillInput} onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill(skillInput))}
                    placeholder={`Dodaj umiejętność (${activeSkillLevel === "advanced" ? "zaawansowane" : activeSkillLevel === "intermediate" ? "średnie" : "podstawowe"})...`}
                    className="flex-1 px-3 py-2 rounded-xl bg-secondary border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                  <button onClick={() => addSkill(skillInput)} className="px-3 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium"><Plus className="w-4 h-4" /></button>
                </div>

                {/* Suggestions */}
                <div className="flex flex-wrap gap-1.5">
                  {SKILL_SUGGESTIONS.filter(s => !allSkillsFlat.includes(s)).slice(0, 8).map((s) => (
                    <button key={s} onClick={() => addSkill(s)} className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-secondary text-secondary-foreground hover:bg-muted transition-colors">+ {s}</button>
                  ))}
                </div>

                {/* Display each level */}
                {(["advanced", "intermediate", "beginner"] as const).map(level => (
                  skills[level].length > 0 && (
                    <div key={level} className="space-y-1.5">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                        {level === "advanced" ? "🟢 Zaawansowane" : level === "intermediate" ? "🟡 Średniozaawansowane" : "🔵 Podstawowe"}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {skills[level].map((skill) => (
                          <span key={skill} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium ${
                            level === "advanced" ? "bg-accent/15 text-accent border border-accent/30" :
                            level === "intermediate" ? "bg-yellow-500/15 text-yellow-600 border border-yellow-500/30" :
                            "bg-secondary text-secondary-foreground border border-border"
                          }`}>
                            {skill}
                            <button onClick={() => removeSkill(skill, level)} className="hover:text-destructive transition-colors"><X className="w-3 h-3" /></button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )
                ))}
              </div>
            </AccordionSection>

            {/* EXPERIENCE */}
            <AccordionSection id="experience" label="Doświadczenie zawodowe" icon="💼" isOpen={activeSection === "experience"} onToggle={() => toggleSection("experience")}
              badge={experienceEntries.length > 0 ? `${experienceEntries.length} pozycji` : undefined}>
              <div className="space-y-3">
                {experienceEntries.map((entry, idx) => (
                  <div key={idx} className="rounded-xl border border-border bg-secondary/30 overflow-hidden">
                    <button onClick={() => setExpandedExp(expandedExp === idx ? null : idx)} className="w-full p-3 flex items-center gap-2 text-left">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{entry.job_title || "Nowe stanowisko"}{entry.company_name ? ` — ${entry.company_name}` : ""}</p>
                        <p className="text-xs text-muted-foreground">{entry.start_date || "Początek"} – {entry.is_current ? "Obecnie" : entry.end_date || "Koniec"}</p>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); removeExperience(idx); }} className="p-1 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive"><X className="w-4 h-4" /></button>
                      <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${expandedExp === idx ? "rotate-180" : ""}`} />
                    </button>
                    {expandedExp === idx && (
                      <div className="px-3 pb-3 space-y-3 border-t border-border pt-3">
                        <div className="grid grid-cols-2 gap-3">
                          <Field label="Stanowisko" value={entry.job_title} onChange={(v) => updateExperience(idx, "job_title", v)} placeholder="Senior Frontend Engineer" />
                          <Field label="Firma" value={entry.company_name} onChange={(v) => updateExperience(idx, "company_name", v)} placeholder="Allegro" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <Field label="Data rozpoczęcia" value={entry.start_date} onChange={(v) => updateExperience(idx, "start_date", v)} placeholder="2022-01" />
                          <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground">Data zakończenia</label>
                            {entry.is_current ? (
                              <div className="flex-1 px-3 py-2 rounded-xl bg-accent/15 border border-accent/30 text-accent text-sm font-medium text-center">Obecnie</div>
                            ) : (
                              <input value={entry.end_date} onChange={(e) => updateExperience(idx, "end_date", e.target.value)} placeholder="2024-12"
                                className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                            )}
                            <button onClick={() => updateExperience(idx, "is_current", !entry.is_current)}
                              className={`mt-1 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all ${entry.is_current ? "bg-accent text-accent-foreground" : "bg-secondary text-secondary-foreground hover:bg-muted border border-border"}`}>
                              {entry.is_current ? "✓ Obecnie tu pracuję" : "Obecnie tu pracuję"}
                            </button>
                          </div>
                        </div>
                        {/* Description points */}
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Obowiązki / osiągnięcia</p>
                        {entry.description_points.map((point, pi) => (
                          <div key={pi} className="flex gap-2">
                            <input value={point} onChange={(e) => {
                              const pts = [...entry.description_points];
                              pts[pi] = e.target.value.slice(0, 200);
                              updateExperience(idx, "description_points", pts);
                            }} placeholder="Budowałem dashboard React używany przez 50 tys. użytkowników"
                              className="flex-1 px-3 py-2 rounded-xl bg-secondary border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                            {entry.description_points.length > 1 && (
                              <button onClick={() => {
                                const pts = entry.description_points.filter((_, i) => i !== pi);
                                updateExperience(idx, "description_points", pts);
                              }} className="p-2 rounded-lg hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"><X className="w-3.5 h-3.5" /></button>
                            )}
                          </div>
                        ))}
                        {entry.description_points.length < 8 && (
                          <button onClick={() => updateExperience(idx, "description_points", [...entry.description_points, ""])}
                            className="text-xs text-primary hover:underline flex items-center gap-1"><Plus className="w-3 h-3" /> Dodaj punkt ({entry.description_points.length}/8)</button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                {experienceEntries.length < 8 && (
                  <button onClick={addExperience} className="w-full py-3 rounded-xl border border-dashed border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:border-primary transition-colors flex items-center justify-center gap-2">
                    <Plus className="w-4 h-4" /> Dodaj doświadczenie ({experienceEntries.length}/8)
                  </button>
                )}
              </div>
            </AccordionSection>

            {/* LANGUAGES */}
            <AccordionSection id="languages" label="Języki" icon="🌐" isOpen={activeSection === "languages"} onToggle={() => toggleSection("languages")}
              badge={languages.length > 0 ? `${languages.length} języków` : undefined}>
              <div className="space-y-4">
                {languages.map((lang, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input value={lang.name} onChange={(e) => updateLanguage(idx, "name", e.target.value)} placeholder="Język"
                      className="flex-1 px-3 py-2 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                    <select value={lang.level} onChange={(e) => updateLanguage(idx, "level", e.target.value)}
                      className="px-2 py-2 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                      {LANGUAGE_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                    <button onClick={() => removeLanguage(idx)} className="p-2 rounded-lg hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <div className="flex items-center gap-2">
                  <input value={newLangName} onChange={(e) => setNewLangName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addLanguage())}
                    placeholder="Dodaj język…"
                    className="flex-1 px-3 py-2 rounded-xl bg-secondary border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                  <select value={newLangLevel} onChange={(e) => setNewLangLevel(e.target.value)}
                    className="px-2 py-2 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                    {LANGUAGE_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                  <button onClick={addLanguage} className="px-3 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </AccordionSection>

            {/* LINKS & CV */}
            <AccordionSection id="links" label="Linki" icon="🔗" isOpen={activeSection === "links"} onToggle={() => toggleSection("links")}>
              <div className="space-y-4">
                <LinkField icon={<Globe className="w-4 h-4 text-primary" />} label="Portfolio" value={links.portfolio_url || ""} onChange={(v) => setLinks({ ...links, portfolio_url: v })} placeholder="https://mojeportfolio.pl" />
                <LinkField icon={<Github className="w-4 h-4 text-primary" />} label="GitHub" value={links.github_url || ""} onChange={(v) => setLinks({ ...links, github_url: v })} placeholder="https://github.com/username" />
                <LinkField icon={<Linkedin className="w-4 h-4 text-primary" />} label="LinkedIn" value={links.linkedin_url || ""} onChange={(v) => setLinks({ ...links, linkedin_url: v })} placeholder="https://linkedin.com/in/username" />
                <LinkField icon={<ExternalLink className="w-4 h-4 text-primary" />} label="Strona osobista" value={links.website_url || ""} onChange={(v) => setLinks({ ...links, website_url: v })} placeholder="https://mojastrona.pl" />
              </div>
            </AccordionSection>

            {/* CONTACT INVITATIONS — Block 7B */}
            <AccordionSection
              id="invitations"
              label="Zaproszenia do kontaktu"
              icon="✉️"
              isOpen={activeSection === "invitations"}
              onToggle={() => toggleSection("invitations")}
            >
              <ContactInvitationsList />
            </AccordionSection>

            {/* CONSENTS — Block 4 */}
            <AccordionSection
              id="consents"
              label="Zgody i RODO"
              icon="🛡️"
              isOpen={activeSection === "consents"}
              onToggle={() => toggleSection("consents")}
              badge={consentLoading ? undefined : hasConsent ? "Zgoda na analizę AI — aktywna" : hasDecided ? "Wycofana" : "Nie udzielono"}
            >
              <div className="space-y-4">
                <div className={`p-4 rounded-xl border ${hasConsent ? "bg-accent/10 border-accent/30" : "bg-secondary/40 border-border"}`}>
                  <div className="flex items-start gap-3">
                    {hasConsent ? (
                      <ShieldCheck className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                    ) : (
                      <ShieldOff className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">
                        Zgoda na analizę profilu przez AI
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        {hasConsent
                          ? `Zgoda aktywna od ${consent?.consented_at ? new Date(consent.consented_at).toLocaleDateString("pl-PL") : "—"}. Twój profil może być analizowany przez AI w procesie shortlistowania.`
                          : "Bez zgody nie możesz aplikować na nowe oferty. Możesz przeglądać oferty bez aplikowania."}
                      </p>
                    </div>
                  </div>
                </div>

                {hasConsent ? (
                  showWithdrawWarning ? (
                    <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30 space-y-3">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold text-foreground">Wycofać zgodę?</p>
                          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                            Wycofanie zgody uniemożliwi składanie nowych aplikacji. Twoje istniejące aplikacje pozostają bez zmian.
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setShowWithdrawWarning(false)}
                          disabled={consentBusy}
                          className="flex-1 px-3 py-2 rounded-xl bg-secondary text-secondary-foreground text-xs font-medium hover:bg-muted transition-colors disabled:opacity-50"
                        >
                          Anuluj
                        </button>
                        <button
                          onClick={handleWithdrawConsent}
                          disabled={consentBusy}
                          className="flex-1 px-3 py-2 rounded-xl bg-destructive text-destructive-foreground text-xs font-medium hover:bg-destructive/90 transition-colors disabled:opacity-50"
                        >
                          {consentBusy ? "Wycofuję…" : "Tak, wycofaj"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowWithdrawWarning(true)}
                      className="w-full px-4 py-2.5 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium hover:bg-muted transition-colors flex items-center justify-center gap-2"
                    >
                      <ShieldOff className="w-4 h-4" /> Wycofaj zgodę
                    </button>
                  )
                ) : (
                  <button
                    onClick={() => setShowConsentModal(true)}
                    className="w-full px-4 py-2.5 rounded-xl btn-gradient text-primary-foreground text-sm font-semibold shadow-glow hover:scale-[1.02] transition-transform flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" /> Udziel zgody
                  </button>
                )}
              </div>
            </AccordionSection>
            </>
          )}
          </div>
        </motion.div>
        </LocalErrorBoundary>

        {/* Right sticky panel — desktop only, candidate only */}
        {!isEmployer && (
          <aside className="hidden lg:block">
            <div className="sticky top-6 space-y-4">
              <div className="p-4 rounded-2xl bg-secondary/50 border border-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-muted-foreground">Kompletność profilu</span>
                  <span className={`text-sm font-bold ${completeness.score >= 80 ? "text-accent" : completeness.score >= 50 ? "text-yellow-400" : "text-muted-foreground"}`}>
                    {completeness.score}%
                  </span>
                </div>
                <Progress value={completeness.score} className="h-2 mb-3" />
                <button
                  onClick={() => setShowPreview(true)}
                  className="w-full mt-2 flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-secondary text-secondary-foreground text-xs font-medium border border-border hover:bg-muted transition-colors"
                >
                  <Eye className="w-4 h-4" /> Podgląd profilu
                </button>
              </div>

              {completeness.missing.length > 0 && (
                <div className="p-4 rounded-2xl bg-secondary/30 border border-border">
                  <p className="text-[11px] font-semibold text-foreground uppercase tracking-wider mb-2.5">Brakujące sekcje</p>
                  <ul className="text-xs text-muted-foreground space-y-2">
                    {completeness.missing.map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <div className="w-1 h-1 rounded-full bg-primary mt-1.5 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20">
                <p className="text-[11px] font-semibold text-primary uppercase tracking-wider mb-2">💡 Wskazówki</p>
                <ul className="text-xs text-muted-foreground space-y-1.5 leading-relaxed">
                  <li>• Dodaj 5-10 umiejętności, aby zwiększyć dopasowanie.</li>
                  <li>• Opisz każde stanowisko 3-5 punktami.</li>
                  <li>• Ustaw realistyczne widełki — kluczowe dla scoringu.</li>
                  <li>• Konkretny tytuł zawodowy &gt; ogólny.</li>
                </ul>
              </div>

              <div className="card-gradient rounded-xl border border-border p-4 mt-4">
                <p className="text-xs font-bold text-primary uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Jak działa scoring?
                </p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Każda oferta pokazuje % dopasowania Twojego profilu. Im pełniejszy profil (umiejętności, doświadczenie, oczekiwania), tym trafniejszy scoring i większa szansa na shortlistę.
                </p>
              </div>
            </div>
          </aside>
        )}
      </main>

      {showPreview && (
        <CandidateProfileModal
          candidate={{
            id: user?.id || "preview",
            userId: user?.id || "preview",
            fullName: fullName || "Nie podano imienia",
            title: title || "Brak stanowiska",
            location: location || "Brak lokalizacji",
            summary,
            seniority: seniority as Candidate["seniority"],
            workMode: workMode as Candidate["workMode"],
            employmentType: employmentType as Candidate["employmentType"],
            salaryMin,
            salaryMax,
            salaryCurrency,
            availability,
            skills,
            experienceEntries,
            links,
            languages,
            primaryIndustry,
            profileCompleteness: completeness.score,
            cvUrl,
            lastActive: new Date().toISOString(),
          }}
          onClose={() => setShowPreview(false)}
        />
      )}

      <AIConsentModal
        open={showConsentModal}
        onAccept={handleAcceptConsent}
        onDecline={handleDeclineConsent}
        busy={consentBusy}
      />
    </div>
  );
};

function AccordionSection({ id, label, icon, isOpen, onToggle, badge, children }: {
  id: string; label: string; icon: string; isOpen: boolean; onToggle: () => void; badge?: string; children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <button onClick={onToggle} className={`w-full px-4 py-3.5 flex items-center gap-3 text-left transition-colors ${isOpen ? "bg-primary/5" : "hover:bg-secondary/80"}`}>
        <span className="text-lg">{icon}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">{label}</p>
          {badge && !isOpen && <p className="text-[11px] text-muted-foreground truncate mt-0.5">{badge}</p>}
        </div>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4 pb-4 pt-2 border-t border-border">
          {children}
        </motion.div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
    </div>
  );
}

function LinkField({ icon, label, value, onChange, placeholder }: { icon: React.ReactNode; label: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">{icon} {label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
    </div>
  );
}

export default MyProfile;
