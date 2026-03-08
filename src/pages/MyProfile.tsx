import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Briefcase, Save, Plus, X, Upload, FileText,
  Globe, Github, Linkedin, ExternalLink, ChevronDown, Minus, Trash2
} from "lucide-react";
import { getProvider } from "@/providers/registry";
import { useAuth } from "@/hooks/useAuth";
import { Progress } from "@/components/ui/progress";
import { ProfileSkeleton } from "@/components/StateViews";
import LocalErrorBoundary from "@/components/LocalErrorBoundary";
import { toast } from "sonner";

interface ExperienceEntry {
  title: string;
  company: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  description: string;
  bullets: string[];
}

interface Links {
  portfolio?: string;
  github?: string;
  linkedin?: string;
  website?: string;
}

const SENIORITY_OPTIONS = ["Junior", "Mid", "Senior", "Lead"];
const WORK_MODE_OPTIONS = ["Zdalnie", "Hybrydowo", "Stacjonarnie"];
const EMPLOYMENT_OPTIONS = ["Full-time", "Contract", "Part-time"];
const AVAILABILITY_OPTIONS = ["Otwarty na oferty", "Pasywny", "Nie szukam"];

const SKILL_SUGGESTIONS = [
  "React", "TypeScript", "JavaScript", "Node.js", "Python", "Go",
  "GraphQL", "PostgreSQL", "AWS", "Docker", "Kubernetes", "Terraform",
  "Figma", "UI/UX", "Swift", "Kotlin", "React Native", "Next.js",
  "Tailwind CSS", "MongoDB", "Redis", "Machine Learning", "Vue.js",
  "Angular", "Java", "C#", "Ruby", "PHP", "Rust",
];

function computeCompleteness(data: {
  summary: string;
  skills: string[];
  experience_entries: ExperienceEntry[];
  salary_min: number;
  links: Links;
  title: string;
  location: string;
}) {
  let score = 0;
  const total = 7;
  if (data.title.trim()) score++;
  if (data.location.trim()) score++;
  if (data.summary.trim()) score++;
  if (data.skills.length >= 3) score++;
  if (data.experience_entries.length > 0) score++;
  if (data.salary_min > 0) score++;
  if (data.links.portfolio || data.links.github || data.links.linkedin || data.links.website) score++;
  return Math.round((score / total) * 100);
}

const MyProfile = () => {
  const { user, profile, loading: authLoading } = useAuth();
  const isEmployer = profile?.role === "employer";
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [fullName, setFullName] = useState("");
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [experienceYears, setExperienceYears] = useState(0);
  const [seniority, setSeniority] = useState("Mid");
  const [summary, setSummary] = useState("");

  const [workMode, setWorkMode] = useState("Zdalnie");
  const [employmentType, setEmploymentType] = useState("Full-time");
  const [salaryMin, setSalaryMin] = useState(0);
  const [salaryMax, setSalaryMax] = useState(0);
  const [availability, setAvailability] = useState("Otwarty na oferty");

  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");

  const [experienceEntries, setExperienceEntries] = useState<ExperienceEntry[]>([]);
  const [expandedExp, setExpandedExp] = useState<number | null>(null);

  const [links, setLinks] = useState<Links>({});

  const [cvUrl, setCvUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [activeSection, setActiveSection] = useState<string>("basic");

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
          setTitle(candidate.title || "");
          setLocation(candidate.location || "");
          setSummary(candidate.summary || "");
          setSkills(candidate.skills || []);
          setSeniority(candidate.seniority || "Mid");
          setWorkMode(candidate.workMode || "Zdalnie");
          setEmploymentType(candidate.employmentType || "Full-time");
          setSalaryMin(candidate.salaryMin || 0);
          setSalaryMax(candidate.salaryMax || 0);
          setAvailability(candidate.availability || "Otwarty na oferty");
          setExperienceEntries(candidate.experienceEntries as ExperienceEntry[] || []);
          setLinks(candidate.links as Links || {});
          setCvUrl(candidate.cvUrl || null);
          const expMatch = candidate.experience?.match(/(\d+)/);
          setExperienceYears(expMatch ? parseInt(expMatch[1]) : 0);
        }
      }
      setFullName(profile?.full_name || user.user_metadata?.full_name || "");
      setLoading(false);
    };
    load();
  }, [user, profile, authLoading, isEmployer]);

  const handleSave = async () => {
    if (!user || saving) return;
    setSaving(true);

    try {
      await getProvider("profiles").update(user.id, { fullName });

      if (!isEmployer) {
        await getProvider("candidates").upsert(user.id, {
          title,
          location,
          summary,
          skills,
          seniority: seniority as any,
          workMode: workMode as any,
          employmentType: employmentType as any,
          salaryMin,
          salaryMax,
          availability,
          experienceEntries: experienceEntries as any,
          links: links as any,
          experience: `${experienceYears} lat`,
          cvUrl,
        });
      }

      toast.success("Profil zapisany");
    } catch (error) {
      toast.error("Nie udało się zapisać profilu");
    }

    setSaving(false);
  };

  const addSkill = (skill: string) => {
    const s = skill.trim();
    if (s && !skills.includes(s)) {
      setSkills([...skills, s]);
    }
    setSkillInput("");
  };

  const removeSkill = (skill: string) => setSkills(skills.filter((s) => s !== skill));

  const addExperience = () => {
    if (experienceEntries.length >= 3) return;
    setExperienceEntries([
      ...experienceEntries,
      { title: "", company: "", startDate: "", endDate: "", isCurrent: false, description: "", bullets: [""] },
    ]);
    setExpandedExp(experienceEntries.length);
  };

  const updateExperience = (idx: number, field: keyof ExperienceEntry, value: any) => {
    const arr = [...experienceEntries];
    (arr[idx] as any)[field] = value;
    if (field === "isCurrent" && value === true) {
      arr[idx].endDate = "Obecnie";
    }
    setExperienceEntries(arr);
  };

  const removeExperience = (idx: number) => {
    setExperienceEntries(experienceEntries.filter((_, i) => i !== idx));
    setExpandedExp(null);
  };

  const handleCvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.type !== "application/pdf") {
      toast.error("Dozwolone tylko pliki PDF");
      return;
    }
    setUploading(true);
    const path = `${user.id}/cv-${Date.now()}.pdf`;
    const result = await getProvider("storage").upload("cvs", path, file);
    if (result.error) {
      toast.error("Przesyłanie nie powiodło się");
    } else {
      setCvUrl(path);
      toast.success("CV przesłane");
    }
    setUploading(false);
  };

  const completeness = computeCompleteness({
    summary, skills, experience_entries: experienceEntries,
    salary_min: salaryMin, links, title, location,
  });

  const toggleSection = (id: string) => {
    setActiveSection(activeSection === id ? "" : id);
  };

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
          <Link
            to="/"
            className="p-2 sm:px-4 sm:py-2 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium hover:bg-muted transition-colors"
          >
            <span className="hidden sm:inline">Przeglądaj oferty</span>
            <Briefcase className="w-4 h-4 sm:hidden" />
          </Link>
          <button
            onClick={handleSave}
            disabled={saving}
            aria-busy={saving}
            data-testid="profile-save"
            className="flex items-center gap-2 p-2 sm:px-4 sm:py-2 rounded-xl btn-gradient text-primary-foreground text-sm font-medium shadow-glow hover:scale-105 transition-transform disabled:opacity-50 disabled:pointer-events-none"
          >
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

          {/* Completeness - only for candidates */}
          {!isEmployer && (
            <div className="mb-6 p-3 rounded-xl bg-secondary/50 border border-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground">Kompletność profilu</span>
                <span className={`text-sm font-bold ${completeness >= 80 ? "text-accent" : completeness >= 50 ? "text-yellow-400" : "text-muted-foreground"}`}>
                  {completeness}%
                </span>
              </div>
              <Progress value={completeness} className="h-2" />
            </div>
          )}

          {/* Accordion sections */}
          <div className="space-y-2">
          {isEmployer ? (
            /* ═══ EMPLOYER PROFILE ═══ */
            <AccordionSection
              id="basic"
              label="Dane firmy"
              icon="🏢"
              isOpen={activeSection === "basic"}
              onToggle={() => toggleSection("basic")}
              badge={fullName || undefined}
            >
              <div className="space-y-4">
                <Field label="Imię i nazwisko / osoba kontaktowa" value={fullName} onChange={setFullName} placeholder="Jan Kowalski" />
                <p className="text-xs text-muted-foreground">
                  Aby zarządzać ofertami pracy i przeglądać kandydatów, przejdź do{" "}
                  <Link to="/employer" className="text-primary hover:underline">Panelu pracodawcy</Link>.
                </p>
              </div>
            </AccordionSection>
          ) : (
            /* ═══ CANDIDATE PROFILE ═══ */
            <>
            {/* BASIC INFO */}
            <AccordionSection
              id="basic"
              label="Dane podstawowe"
              icon="👤"
              isOpen={activeSection === "basic"}
              onToggle={() => toggleSection("basic")}
              badge={title ? `${title}` : undefined}
            >
              <div className="space-y-4">
                <Field label="Imię i nazwisko" value={fullName} onChange={setFullName} placeholder="Jan Kowalski" />
                <Field label="Tytuł zawodowy" value={title} onChange={setTitle} placeholder="Frontend Engineer" />
                <Field label="Lokalizacja" value={location} onChange={setLocation} placeholder="Warszawa" />
                <div className="flex gap-4 items-end">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Lata doświadczenia</label>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setExperienceYears(Math.max(0, experienceYears - 1))}
                        className="w-9 h-9 rounded-lg bg-secondary border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <div className="w-12 h-9 rounded-lg bg-secondary border border-border flex items-center justify-center text-sm font-semibold text-foreground">
                        {experienceYears}
                      </div>
                      <button
                        onClick={() => setExperienceYears(Math.min(40, experienceYears + 1))}
                        className="w-9 h-9 rounded-lg bg-secondary border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Poziom</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                      {SENIORITY_OPTIONS.map((s) => (
                        <button
                          key={s}
                          onClick={() => setSeniority(s)}
                          className={`py-2 rounded-xl text-xs font-medium transition-all ${
                            seniority === s ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-muted"
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Podsumowanie zawodowe ({summary.length}/300)
                  </label>
                  <textarea
                    value={summary}
                    onChange={(e) => setSummary(e.target.value.slice(0, 300))}
                    placeholder="Frontend engineer specjalizujący się w React i skalowalnych systemach UI."
                    rows={3}
                    className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                  />
                </div>
              </div>
            </AccordionSection>

            {/* WORK PREFERENCES */}
            <AccordionSection
              id="prefs"
              label="Preferencje pracy"
              icon="⚙️"
              isOpen={activeSection === "prefs"}
              onToggle={() => toggleSection("prefs")}
              badge={`${workMode} · ${employmentType}`}
            >
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Tryb pracy</label>
                  <div className="grid grid-cols-3 gap-2">
                    {WORK_MODE_OPTIONS.map((w) => (
                      <button
                        key={w}
                        onClick={() => setWorkMode(w)}
                        className={`py-2 rounded-xl text-xs font-medium transition-all ${
                          workMode === w ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-muted"
                        }`}
                      >
                        {w}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Typ zatrudnienia</label>
                  <div className="grid grid-cols-3 gap-2">
                    {EMPLOYMENT_OPTIONS.map((e) => (
                      <button
                        key={e}
                        onClick={() => setEmploymentType(e)}
                        className={`py-2 rounded-xl text-xs font-medium transition-all ${
                          employmentType === e ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-muted"
                        }`}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Oczekiwania finansowe: {salaryMin > 0 || salaryMax > 0 ? `${salaryMin} 000 zł – ${salaryMax} 000 zł brutto` : "Nie ustawiono"}
                  </label>
                  <div className="flex gap-3 items-center">
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
                    <span className="text-xs text-muted-foreground">tys. zł</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Dostępność</label>
                  <div className="grid grid-cols-3 gap-2">
                    {AVAILABILITY_OPTIONS.map((a) => (
                      <button
                        key={a}
                        onClick={() => setAvailability(a)}
                        className={`py-2 rounded-xl text-xs font-medium transition-all ${
                          availability === a ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-muted"
                        }`}
                      >
                        {a}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </AccordionSection>

            {/* SKILLS & EXPERIENCE */}
            <AccordionSection
              id="competence"
              label="Umiejętności i doświadczenie"
              icon="🚀"
              isOpen={activeSection === "competence"}
              onToggle={() => toggleSection("competence")}
              badge={skills.length > 0 ? `${skills.length} umiejętności · ${experienceEntries.length} pozycje` : undefined}
            >
              <div className="space-y-6">
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-accent uppercase tracking-wider">Umiejętności</p>
                  <div className="flex gap-2">
                    <input value={skillInput} onChange={(e) => setSkillInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill(skillInput))} placeholder="Dodaj umiejętność..." className="flex-1 px-3 py-2 rounded-xl bg-secondary border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                    <button onClick={() => addSkill(skillInput)} className="px-3 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium"><Plus className="w-4 h-4" /></button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {SKILL_SUGGESTIONS.filter((s) => !skills.includes(s)).slice(0, 10).map((s) => (
                      <button key={s} onClick={() => addSkill(s)} className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-secondary text-secondary-foreground hover:bg-muted transition-colors">+ {s}</button>
                    ))}
                  </div>
                  {skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {skills.map((skill, i) => (
                        <span key={skill} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium ${i < 5 ? "bg-accent/15 text-accent border border-accent/30" : "bg-secondary text-secondary-foreground border border-border"}`}>
                          {skill}
                          <button onClick={() => removeSkill(skill)} className="hover:text-destructive transition-colors"><X className="w-3 h-3" /></button>
                        </span>
                      ))}
                    </div>
                  )}
                  {skills.length > 0 && <p className="text-[10px] text-muted-foreground">Pierwsze 5 umiejętności są wyróżnione jako kluczowe.</p>}
                </div>

                <div className="border-t border-border" />

                <div className="space-y-3">
                  <p className="text-xs font-semibold text-accent uppercase tracking-wider">Doświadczenie zawodowe</p>
                  {experienceEntries.map((entry, idx) => (
                    <div key={idx} className="rounded-xl border border-border bg-secondary/30 overflow-hidden">
                      <button onClick={() => setExpandedExp(expandedExp === idx ? null : idx)} className="w-full p-3 flex items-center gap-2 text-left">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{entry.title || "Nowe stanowisko"}{entry.company ? ` — ${entry.company}` : ""}</p>
                          <p className="text-xs text-muted-foreground">{entry.startDate || "Początek"} – {entry.isCurrent ? "Obecnie" : entry.endDate || "Koniec"}</p>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); removeExperience(idx); }} className="p-1 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive"><X className="w-4 h-4" /></button>
                        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${expandedExp === idx ? "rotate-180" : ""}`} />
                      </button>
                      {expandedExp === idx && (
                        <div className="px-3 pb-3 space-y-3 border-t border-border pt-3">
                          <div className="grid grid-cols-2 gap-3">
                            <Field label="Stanowisko" value={entry.title} onChange={(v) => updateExperience(idx, "title", v)} placeholder="Senior Frontend Engineer" />
                            <Field label="Firma" value={entry.company} onChange={(v) => updateExperience(idx, "company", v)} placeholder="Allegro" />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <Field label="Data rozpoczęcia" value={entry.startDate} onChange={(v) => updateExperience(idx, "startDate", v)} placeholder="2022" />
                            <div className="space-y-1.5">
                              <label className="text-xs font-medium text-muted-foreground">Data zakończenia</label>
                              {entry.isCurrent ? (
                                <div className="flex-1 px-3 py-2 rounded-xl bg-accent/15 border border-accent/30 text-accent text-sm font-medium text-center">Obecnie</div>
                              ) : (
                                <input value={entry.endDate} onChange={(e) => updateExperience(idx, "endDate", e.target.value)} placeholder="2024" className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                              )}
                              <button onClick={() => updateExperience(idx, "isCurrent", !entry.isCurrent)} className={`mt-1 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all ${entry.isCurrent ? "bg-accent text-accent-foreground" : "bg-secondary text-secondary-foreground hover:bg-muted border border-border"}`}>
                                {entry.isCurrent ? "✓ Obecnie tu pracuję" : "Obecnie tu pracuję"}
                              </button>
                            </div>
                          </div>
                          {entry.bullets.map((bullet, bi) => (
                            <div key={bi} className="space-y-1.5">
                              <label className="text-xs font-medium text-muted-foreground">Punkt {bi + 1} ({bullet.length}/200)</label>
                              <input value={bullet} onChange={(e) => { const bullets = [...entry.bullets]; bullets[bi] = e.target.value.slice(0, 200); updateExperience(idx, "bullets", bullets); }} placeholder="Budowałem dashboard React używany przez 50 tys. użytkowników" className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                            </div>
                          ))}
                          {entry.bullets.length < 3 && (
                            <button onClick={() => updateExperience(idx, "bullets", [...entry.bullets, ""])} className="text-xs text-primary hover:underline flex items-center gap-1"><Plus className="w-3 h-3" /> Dodaj punkt</button>
                          )}
                          <div className="space-y-1.5 pt-2 border-t border-border">
                            <label className="text-xs font-medium text-muted-foreground">Opis stanowiska ({(entry.description || "").length}/500)</label>
                            <textarea value={entry.description || ""} onChange={(e) => updateExperience(idx, "description", e.target.value.slice(0, 500))} placeholder="Opisz szczegółowo swoje obowiązki, osiągnięcia i wpływ na organizację..." rows={4} className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  {experienceEntries.length < 3 && (
                    <button onClick={addExperience} className="w-full py-3 rounded-xl border border-dashed border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:border-primary transition-colors flex items-center justify-center gap-2">
                      <Plus className="w-4 h-4" /> Dodaj doświadczenie ({experienceEntries.length}/3)
                    </button>
                  )}
                </div>
              </div>
            </AccordionSection>

            {/* LINKS & CV */}
            <AccordionSection
              id="links"
              label="Linki i CV"
              icon="🔗"
              isOpen={activeSection === "links"}
              onToggle={() => toggleSection("links")}
              badge={cvUrl ? "CV przesłane" : undefined}
            >
              <div className="space-y-4">
                <LinkField icon={<Globe className="w-4 h-4 text-primary" />} label="Portfolio" value={links.portfolio || ""} onChange={(v) => setLinks({ ...links, portfolio: v })} placeholder="https://mojeportfolio.pl" />
                <LinkField icon={<Github className="w-4 h-4 text-primary" />} label="GitHub" value={links.github || ""} onChange={(v) => setLinks({ ...links, github: v })} placeholder="https://github.com/username" />
                <LinkField icon={<Linkedin className="w-4 h-4 text-primary" />} label="LinkedIn" value={links.linkedin || ""} onChange={(v) => setLinks({ ...links, linkedin: v })} placeholder="https://linkedin.com/in/username" />
                <LinkField icon={<ExternalLink className="w-4 h-4 text-primary" />} label="Strona osobista" value={links.website || ""} onChange={(v) => setLinks({ ...links, website: v })} placeholder="https://mojastrona.pl" />
                <div className="pt-2 border-t border-border">
                  <label className="text-xs font-medium text-muted-foreground mb-2 block">Prześlij CV (opcjonalne, tylko PDF)</label>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium hover:bg-muted transition-colors cursor-pointer">
                      <Upload className="w-4 h-4" />
                      {uploading ? "Przesyłanie..." : "Prześlij CV"}
                      <input type="file" accept="application/pdf" onChange={handleCvUpload} className="hidden" disabled={uploading} />
                    </label>
                    {cvUrl && (
                      <span className="flex items-center gap-1.5 text-xs text-accent">
                        <FileText className="w-3.5 h-3.5" /> CV przesłane
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </AccordionSection>
            </>
          )}
          </div>
        </motion.div>
        </LocalErrorBoundary>
      </main>
    </div>
  );
};

function AccordionSection({
  id, label, icon, isOpen, onToggle, badge, children,
}: {
  id: string; label: string; icon: string; isOpen: boolean; onToggle: () => void; badge?: string; children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <button
        onClick={onToggle}
        className={`w-full px-4 py-3.5 flex items-center gap-3 text-left transition-colors ${
          isOpen ? "bg-primary/5" : "hover:bg-secondary/80"
        }`}
      >
        <span className="text-lg">{icon}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">{label}</p>
          {badge && !isOpen && (
            <p className="text-[11px] text-muted-foreground truncate mt-0.5">{badge}</p>
          )}
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
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
    </div>
  );
}

function LinkField({ icon, label, value, onChange, placeholder }: { icon: React.ReactNode; label: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">{icon} {label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
    </div>
  );
}

export default MyProfile;
