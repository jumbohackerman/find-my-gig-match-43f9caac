import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Briefcase, Save, Plus, X, GripVertical, Upload, FileText,
  Globe, Github, Linkedin, ExternalLink, ChevronDown, ChevronUp,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

interface ExperienceEntry {
  title: string;
  company: string;
  startDate: string;
  endDate: string;
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

  const [activeSection, setActiveSection] = useState<string>("basic");

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    const load = async () => {
      const { data } = await supabase
        .from("candidates")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data) {
        setTitle(data.title || "");
        setLocation(data.location || "");
        setSummary(data.summary || "");
        setSkills(data.skills || []);
        setSeniority(data.seniority || "Mid");
        setWorkMode(data.work_mode || "Zdalnie");
        setEmploymentType(data.employment_type || "Full-time");
        setSalaryMin(data.salary_min || 0);
        setSalaryMax(data.salary_max || 0);
        setAvailability(data.availability || "Otwarty na oferty");
        setExperienceEntries((data.experience_entries as any) || []);
        setLinks((data.links as any) || {});
        setCvUrl(data.cv_url || null);

        const expMatch = data.experience?.match(/(\d+)/);
        setExperienceYears(expMatch ? parseInt(expMatch[1]) : 0);
      }

      setFullName(profile?.full_name || user.user_metadata?.full_name || "");
      setLoading(false);
    };
    load();
  }, [user, profile, authLoading]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    await supabase
      .from("profiles")
      .update({ full_name: fullName })
      .eq("user_id", user.id);

    const { error } = await supabase
      .from("candidates")
      .update({
        title,
        location,
        summary,
        skills,
        seniority,
        work_mode: workMode,
        employment_type: employmentType,
        salary_min: salaryMin,
        salary_max: salaryMax,
        availability,
        experience_entries: experienceEntries as any,
        links: links as any,
        experience: `${experienceYears} lat`,
        cv_url: cvUrl,
        last_active: new Date().toISOString(),
      } as any)
      .eq("user_id", user.id);

    setSaving(false);
    if (error) {
      toast.error("Nie udało się zapisać profilu");
    } else {
      toast.success("Profil zapisany");
    }
  };

  const addSkill = (skill: string) => {
    const s = skill.trim();
    if (s && !skills.includes(s)) {
      setSkills([...skills, s]);
    }
    setSkillInput("");
  };

  const removeSkill = (skill: string) => setSkills(skills.filter((s) => s !== skill));

  const moveSkill = (from: number, to: number) => {
    const arr = [...skills];
    const [item] = arr.splice(from, 1);
    arr.splice(to, 0, item);
    setSkills(arr);
  };

  const addExperience = () => {
    if (experienceEntries.length >= 3) return;
    setExperienceEntries([
      ...experienceEntries,
      { title: "", company: "", startDate: "", endDate: "", bullets: [""] },
    ]);
    setExpandedExp(experienceEntries.length);
  };

  const updateExperience = (idx: number, field: keyof ExperienceEntry, value: any) => {
    const arr = [...experienceEntries];
    (arr[idx] as any)[field] = value;
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
    const { error } = await supabase.storage.from("cvs").upload(path, file);
    if (error) {
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

  const coreSkills = skills.slice(0, 5);
  const additionalSkills = skills.slice(5);

  const sections = [
    { id: "basic", label: "Dane podstawowe", icon: "👤" },
    { id: "prefs", label: "Preferencje pracy", icon: "⚙️" },
    { id: "competence", label: "Umiejętności i doświadczenie", icon: "🚀" },
    { id: "links", label: "Linki i CV", icon: "🔗" },
  ];

  const toggleSection = (id: string) => {
    setActiveSection(activeSection === id ? "" : id);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground text-sm">Ładowanie...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="px-6 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg btn-gradient flex items-center justify-center">
            <Briefcase className="w-4 h-4 text-primary-foreground" />
          </div>
          <h1 className="font-display text-xl font-bold text-foreground">JobSwipe</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/"
            className="px-4 py-2 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium hover:bg-muted transition-colors"
          >
            Przeglądaj oferty
          </Link>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 rounded-xl btn-gradient text-primary-foreground text-sm font-medium shadow-glow hover:scale-105 transition-transform disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? "Zapisuję..." : "Zapisz profil"}
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col px-4 py-6 max-w-lg mx-auto w-full">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h2 className="font-display text-2xl font-bold text-foreground mb-1">Mój profil</h2>
          <p className="text-muted-foreground text-sm mb-4">Bądź zwięzły — rekruterzy skanują profil w mniej niż 30 sekund.</p>

          {/* Completeness */}
          <div className="mb-6 p-3 rounded-xl bg-secondary/50 border border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground">Kompletność profilu</span>
              <span className={`text-sm font-bold ${completeness >= 80 ? "text-accent" : completeness >= 50 ? "text-yellow-400" : "text-muted-foreground"}`}>
                {completeness}%
              </span>
            </div>
            <Progress value={completeness} className="h-2" />
          </div>

          {/* Accordion sections */}
          <div className="space-y-2">

          {/* BASIC INFO */}
          {activeSection === "basic" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <Field label="Imię i nazwisko" value={fullName} onChange={setFullName} placeholder="Jan Kowalski" />
              <Field label="Tytuł zawodowy" value={title} onChange={setTitle} placeholder="Frontend Engineer" />
              <Field label="Lokalizacja" value={location} onChange={setLocation} placeholder="Warszawa" />
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Lata doświadczenia</label>
                <input
                  type="number"
                  min={0}
                  max={40}
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(parseInt(e.target.value) || 0)}
                  className="w-24 px-3 py-2 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Poziom doświadczenia</label>
                <div className="grid grid-cols-4 gap-2">
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
            </motion.div>
          )}

          {/* WORK PREFERENCES */}
          {activeSection === "prefs" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
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
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={salaryMin || ""}
                    onChange={(e) => setSalaryMin(parseInt(e.target.value) || 0)}
                    placeholder="Min"
                    className="w-24 px-3 py-2 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <span className="text-muted-foreground text-sm">–</span>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={salaryMax || ""}
                    onChange={(e) => setSalaryMax(parseInt(e.target.value) || 0)}
                    placeholder="Max"
                    className="w-24 px-3 py-2 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <span className="text-xs text-muted-foreground">tys. zł brutto</span>
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
            </motion.div>
          )}

          {/* SKILLS */}
          {activeSection === "skills" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div className="flex gap-2">
                <input
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill(skillInput))}
                  placeholder="Dodaj umiejętność..."
                  className="flex-1 px-3 py-2 rounded-xl bg-secondary border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <button
                  onClick={() => addSkill(skillInput)}
                  className="px-3 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {SKILL_SUGGESTIONS.filter((s) => !skills.includes(s))
                  .slice(0, 12)
                  .map((s) => (
                    <button
                      key={s}
                      onClick={() => addSkill(s)}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-secondary text-secondary-foreground hover:bg-muted transition-colors"
                    >
                      + {s}
                    </button>
                  ))}
              </div>

              {coreSkills.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Kluczowe umiejętności ({coreSkills.length})
                  </p>
                  <div className="space-y-1">
                    {coreSkills.map((skill, i) => (
                      <SkillRow
                        key={skill}
                        skill={skill}
                        index={i}
                        total={skills.length}
                        onRemove={removeSkill}
                        onMove={moveSkill}
                      />
                    ))}
                  </div>
                </div>
              )}

              {additionalSkills.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Dodatkowe umiejętności ({additionalSkills.length})
                  </p>
                  <div className="space-y-1">
                    {additionalSkills.map((skill, i) => (
                      <SkillRow
                        key={skill}
                        skill={skill}
                        index={i + 5}
                        total={skills.length}
                        onRemove={removeSkill}
                        onMove={moveSkill}
                      />
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* EXPERIENCE */}
          {activeSection === "experience" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
              {experienceEntries.map((entry, idx) => (
                <div key={idx} className="rounded-xl border border-border bg-secondary/30 overflow-hidden">
                  <button
                    onClick={() => setExpandedExp(expandedExp === idx ? null : idx)}
                    className="w-full p-3 flex items-center gap-2 text-left"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {entry.title || "Nowe stanowisko"}{entry.company ? ` — ${entry.company}` : ""}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {entry.startDate || "Początek"} – {entry.endDate || "Koniec"}
                      </p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); removeExperience(idx); }}
                      className="p-1 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    {expandedExp === idx ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </button>

                  {expandedExp === idx && (
                    <div className="px-3 pb-3 space-y-3 border-t border-border pt-3">
                      <div className="grid grid-cols-2 gap-3">
                        <Field label="Stanowisko" value={entry.title} onChange={(v) => updateExperience(idx, "title", v)} placeholder="Senior Frontend Engineer" />
                        <Field label="Firma" value={entry.company} onChange={(v) => updateExperience(idx, "company", v)} placeholder="Allegro" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <Field label="Data rozpoczęcia" value={entry.startDate} onChange={(v) => updateExperience(idx, "startDate", v)} placeholder="2022" />
                        <Field label="Data zakończenia" value={entry.endDate} onChange={(v) => updateExperience(idx, "endDate", v)} placeholder="2024 lub Obecnie" />
                      </div>
                      {entry.bullets.map((bullet, bi) => (
                        <div key={bi} className="space-y-1.5">
                          <label className="text-xs font-medium text-muted-foreground">
                            Punkt {bi + 1} ({bullet.length}/200)
                          </label>
                          <input
                            value={bullet}
                            onChange={(e) => {
                              const bullets = [...entry.bullets];
                              bullets[bi] = e.target.value.slice(0, 200);
                              updateExperience(idx, "bullets", bullets);
                            }}
                            placeholder="Budowałem dashboard React używany przez 50 tys. użytkowników"
                            className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                          />
                        </div>
                      ))}
                      {entry.bullets.length < 2 && (
                        <button
                          onClick={() => updateExperience(idx, "bullets", [...entry.bullets, ""])}
                          className="text-xs text-primary hover:underline flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" /> Dodaj punkt
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {experienceEntries.length < 3 && (
                <button
                  onClick={addExperience}
                  className="w-full py-3 rounded-xl border border-dashed border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:border-primary transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Dodaj doświadczenie ({experienceEntries.length}/3)
                </button>
              )}
            </motion.div>
          )}

          {/* LINKS & CV */}
          {activeSection === "links" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <LinkField
                icon={<Globe className="w-4 h-4 text-primary" />}
                label="Portfolio"
                value={links.portfolio || ""}
                onChange={(v) => setLinks({ ...links, portfolio: v })}
                placeholder="https://mojeportfolio.pl"
              />
              <LinkField
                icon={<Github className="w-4 h-4 text-primary" />}
                label="GitHub"
                value={links.github || ""}
                onChange={(v) => setLinks({ ...links, github: v })}
                placeholder="https://github.com/username"
              />
              <LinkField
                icon={<Linkedin className="w-4 h-4 text-primary" />}
                label="LinkedIn"
                value={links.linkedin || ""}
                onChange={(v) => setLinks({ ...links, linkedin: v })}
                placeholder="https://linkedin.com/in/username"
              />
              <LinkField
                icon={<ExternalLink className="w-4 h-4 text-primary" />}
                label="Strona osobista"
                value={links.website || ""}
                onChange={(v) => setLinks({ ...links, website: v })}
                placeholder="https://mojastrona.pl"
              />

              <div className="pt-2 border-t border-border">
                <label className="text-xs font-medium text-muted-foreground mb-2 block">
                  Prześlij CV (opcjonalne, tylko PDF)
                </label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium hover:bg-muted transition-colors cursor-pointer">
                    <Upload className="w-4 h-4" />
                    {uploading ? "Przesyłanie..." : "Prześlij CV"}
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={handleCvUpload}
                      className="hidden"
                      disabled={uploading}
                    />
                  </label>
                  {cvUrl && (
                    <span className="flex items-center gap-1.5 text-xs text-accent">
                      <FileText className="w-3.5 h-3.5" /> CV przesłane
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      </main>
    </div>
  );
};

function Field({
  label, value, onChange, placeholder,
}: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
      />
    </div>
  );
}

function LinkField({
  icon, label, value, onChange, placeholder,
}: {
  icon: React.ReactNode; label: string; value: string; onChange: (v: string) => void; placeholder: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        {icon} {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
      />
    </div>
  );
}

function SkillRow({
  skill, index, total, onRemove, onMove,
}: {
  skill: string; index: number; total: number; onRemove: (s: string) => void; onMove: (from: number, to: number) => void;
}) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/50">
      <GripVertical className="w-3.5 h-3.5 text-muted-foreground" />
      <span className="flex-1 text-sm text-foreground">{skill}</span>
      <div className="flex gap-1">
        {index > 0 && (
          <button onClick={() => onMove(index, index - 1)} className="p-0.5 text-muted-foreground hover:text-foreground">
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
        )}
        {index < total - 1 && (
          <button onClick={() => onMove(index, index + 1)} className="p-0.5 text-muted-foreground hover:text-foreground">
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      <button onClick={() => onRemove(skill)} className="p-0.5 text-muted-foreground hover:text-destructive">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export default MyProfile;
