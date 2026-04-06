import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Briefcase, Save, Plus, X, Upload, FileText,
  Globe, Github, Linkedin, ExternalLink, ChevronDown, Minus, Trash2, Eye, Languages
} from "lucide-react";
import { getProvider } from "@/providers/registry";
import { useAuth } from "@/hooks/useAuth";
import { Progress } from "@/components/ui/progress";
import { ProfileSkeleton } from "@/components/StateViews";
import LocalErrorBoundary from "@/components/LocalErrorBoundary";
import { toast } from "sonner";
import CandidateProfileModal from "@/components/CandidateProfileModal";
import CandidateCvUpload from "@/components/CandidateCvUpload";
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

const MyProfile = () => {
  const { user, profile, loading: authLoading } = useAuth();
  const isEmployer = profile?.role === "employer";
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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

  const [activeSection, setActiveSection] = useState<string>("basic");
  const [showPreview, setShowPreview] = useState(false);

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
        const allSkillsList = [...skills.advanced, ...skills.intermediate, ...skills.beginner];
        const completeness = computeCompleteness({
          fullName, title, location, summary, skills, experienceEntries,
          salaryMin, links, languages, primaryIndustry,
        });

        await getProvider("candidates").upsert(user.id, {
          fullName,
          title,
          location,
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
      } else {
        await getProvider("profiles").update(user.id, { fullName });
      }

      toast.success("Profil zapisany");
    } catch (error) {
      toast.error("Nie udało się zapisać profilu");
    }

    setSaving(false);
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
      full_name?: string | null;
      first_name?: string | null;
      last_name?: string | null;
      headline?: string | null;
      current_role?: string | null;
      city?: string | null;
      country?: string | null;
      summary?: string | null;
      skills?: string[] | null;
      languages?: Array<{ name: string; level?: string | null }> | null;
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
      preferred_job_titles?: string[] | null;
    };

    // fullName
    const name = p.full_name || [p.first_name, p.last_name].filter(Boolean).join(" ");
    if (name?.trim()) setFullName(name.trim());

    // title
    const titleVal = p.current_role || p.headline || (p.preferred_job_titles && p.preferred_job_titles[0]);
    if (titleVal?.trim()) setTitle(titleVal.trim());

    // location
    const loc = [p.city, p.country].filter(Boolean).join(", ");
    if (loc.trim()) setLocation(loc.trim());

    // summary
    if (p.summary?.trim()) setSummary(p.summary.trim().slice(0, 300));

    // skills → all to advanced
    if (p.skills && Array.isArray(p.skills) && p.skills.length > 0) {
      const unique = [...new Set(p.skills.filter(s => typeof s === "string" && s.trim()).map(s => s.trim()))];
      if (unique.length > 0) {
        setSkills({ advanced: unique, intermediate: [], beginner: [] });
      }
    }

    // languages
    if (p.languages && Array.isArray(p.languages) && p.languages.length > 0) {
      const mapped = p.languages
        .filter(l => l.name && l.name.trim())
        .map(l => ({ name: l.name.trim(), level: l.level?.trim() || "" }));
      if (mapped.length > 0) setLanguages(mapped);
    }

    // links
    if (p.links) {
      const newLinks: CandidateLinks = { ...emptyLinks() };
      if (p.links.linkedin_url?.trim()) newLinks.linkedin_url = p.links.linkedin_url.trim();
      if (p.links.github_url?.trim()) newLinks.github_url = p.links.github_url.trim();
      if (p.links.portfolio_url?.trim()) newLinks.portfolio_url = p.links.portfolio_url.trim();
      if (p.links.other_urls && p.links.other_urls.length > 0 && p.links.other_urls[0]?.trim()) {
        newLinks.website_url = p.links.other_urls[0].trim();
      }
      if (Object.values(newLinks).some(Boolean)) setLinks(newLinks);
    }

    // experience entries
    if (p.experience && Array.isArray(p.experience) && p.experience.length > 0) {
      const entries: ExperienceEntry[] = p.experience.slice(0, 8).map(exp => {
        const isCurrent = !exp.end_date || !exp.end_date.trim() || ["present", "current", "now", "obecnie", "aktualnie", "do teraz"].includes(exp.end_date.trim().toLowerCase());

        let descPoints: string[];
        if (exp.bullets && Array.isArray(exp.bullets) && exp.bullets.length > 0) {
          descPoints = exp.bullets.filter(b => typeof b === "string" && b.trim()).map(b => b.trim());
        } else if (exp.description?.trim()) {
          descPoints = [exp.description.trim()];
        } else {
          descPoints = [""];
        }
        if (descPoints.length === 0) descPoints = [""];

        return {
          job_title: exp.job_title?.trim() || "",
          company_name: exp.company?.trim() || "",
          start_date: exp.start_date?.trim() || "",
          end_date: isCurrent ? "Obecnie" : (exp.end_date?.trim() || ""),
          is_current: isCurrent,
          description_points: descPoints,
        };
      });
      setExperienceEntries(entries);
    }

    toast.success("Dane z CV zostały zaimportowane do formularza.");
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
          <div className="w-8 h-8 rounded-lg btn-gradient flex items-center justify-center">
            <Briefcase className="w-4 h-4 text-primary-foreground" />
          </div>
          <h1 className="font-display text-xl font-bold text-foreground">JobSwipe</h1>
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
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-lg btn-gradient flex items-center justify-center">
            <Briefcase className="w-4 h-4 text-primary-foreground" />
          </div>
          <h1 className="font-display text-xl font-bold text-foreground">JobSwipe</h1>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <Link to="/" className="p-2 sm:px-4 sm:py-2 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium hover:bg-muted transition-colors">
            <span className="hidden sm:inline">Przeglądaj oferty</span>
            <Briefcase className="w-4 h-4 sm:hidden" />
          </Link>
          {!isEmployer && (
            <button onClick={() => setShowPreview(true)} className="flex items-center gap-2 p-2 sm:px-4 sm:py-2 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium border border-border hover:bg-muted transition-colors">
              <Eye className="w-4 h-4" />
              <span className="hidden sm:inline">Podgląd</span>
            </button>
          )}
          <button onClick={handleSave} disabled={saving} aria-busy={saving} data-testid="profile-save"
            className="flex items-center gap-2 p-2 sm:px-4 sm:py-2 rounded-xl btn-gradient text-primary-foreground text-sm font-medium shadow-glow hover:scale-105 transition-transform disabled:opacity-50 disabled:pointer-events-none">
            <Save className="w-4 h-4" />
            <span className="hidden sm:inline">{saving ? "Zapisuję…" : "Zapisz profil"}</span>
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col px-4 py-6 max-w-lg mx-auto w-full">
        <LocalErrorBoundary label="Formularz profilu">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h2 className="font-display text-2xl font-bold text-foreground mb-1">
            {isEmployer ? "Profil pracodawcy" : "Mój profil"}
          </h2>
          <p className="text-muted-foreground text-sm mb-4">
            {isEmployer
              ? "Uzupełnij dane firmy, aby kandydaci mogli Cię lepiej poznać."
              : "Bądź zwięzły — rekruterzy skanują profil w mniej niż 30 sekund."}
          </p>

          {/* Completeness */}
          {!isEmployer && (
            <div className="mb-6 p-4 rounded-2xl bg-secondary/50 border border-border">
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
                    placeholder="Frontend engineer specjalizujący się w React i skalowalnych systemach UI."
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
            <AccordionSection id="links" label="Linki i CV" icon="🔗" isOpen={activeSection === "links"} onToggle={() => toggleSection("links")} badge={cvUrl ? "CV przesłane" : undefined}>
              <div className="space-y-4">
                <LinkField icon={<Globe className="w-4 h-4 text-primary" />} label="Portfolio" value={links.portfolio_url || ""} onChange={(v) => setLinks({ ...links, portfolio_url: v })} placeholder="https://mojeportfolio.pl" />
                <LinkField icon={<Github className="w-4 h-4 text-primary" />} label="GitHub" value={links.github_url || ""} onChange={(v) => setLinks({ ...links, github_url: v })} placeholder="https://github.com/username" />
                <LinkField icon={<Linkedin className="w-4 h-4 text-primary" />} label="LinkedIn" value={links.linkedin_url || ""} onChange={(v) => setLinks({ ...links, linkedin_url: v })} placeholder="https://linkedin.com/in/username" />
                <LinkField icon={<ExternalLink className="w-4 h-4 text-primary" />} label="Strona osobista" value={links.website_url || ""} onChange={(v) => setLinks({ ...links, website_url: v })} placeholder="https://mojastrona.pl" />
                <div className="pt-2 border-t border-border mt-4">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium text-foreground">CV (opcjonalne)</label>
                    <span className="text-xs text-muted-foreground">Tylko PDF, maks. 5 MB</span>
                  </div>
                  <CandidateCvUpload onParsed={handleCvParsed} />
                </div>
              </div>
            </AccordionSection>
            </>
          )}
          </div>
        </motion.div>
        </LocalErrorBoundary>
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
