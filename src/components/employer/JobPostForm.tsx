import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Eye, EyeOff, GripVertical } from "lucide-react";
import type { Job } from "@/domain/models";

export interface StructuredJobFormData {
  title: string;
  company: string;
  logo: string;
  location: string;
  workMode: string;
  contractType: string;
  experienceLevel: string;
  salaryFrom: string;
  salaryTo: string;
  salaryCurrency: string;
  summary: string;
  aboutRole: string;
  responsibilities: string[];
  requirements: string[];
  niceToHave: string[];
  benefits: string[];
  aboutCompany: string;
  techStack: string[];
  recruitmentSteps: string[];
}

const EMPTY_FORM: StructuredJobFormData = {
  title: "", company: "", logo: "🏢", location: "", workMode: "Zdalnie",
  contractType: "B2B", experienceLevel: "Mid", salaryFrom: "", salaryTo: "",
  salaryCurrency: "PLN", summary: "", aboutRole: "",
  responsibilities: [""], requirements: [""], niceToHave: [""],
  benefits: [""], aboutCompany: "", techStack: [], recruitmentSteps: [""],
};

const WORK_MODES = ["Zdalnie", "Hybrydowo", "Stacjonarnie"];
const CONTRACT_TYPES = ["B2B", "UoP", "UZ", "B2B / UoP"];
const EXPERIENCE_LEVELS = ["Junior", "Mid", "Senior", "Lead"];

/* ── Dynamic bullet input ──────────────────────────────────────────────────── */

const DynamicList = ({
  label, items, onChange, placeholder, helperText,
}: {
  label: string; items: string[]; onChange: (items: string[]) => void;
  placeholder: string; helperText?: string;
}) => {
  const updateItem = (index: number, value: string) => {
    const next = [...items];
    next[index] = value;
    onChange(next);
  };
  const addItem = () => onChange([...items, ""]);
  const removeItem = (index: number) => {
    if (items.length <= 1) { onChange([""]); return; }
    onChange(items.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      <label className="text-xs text-muted-foreground font-medium">{label}</label>
      {helperText && <p className="text-[10px] text-muted-foreground/70">{helperText}</p>}
      <div className="space-y-1.5">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <GripVertical className="w-3 h-3 text-muted-foreground/40 shrink-0" />
            <input
              value={item}
              onChange={(e) => updateItem(i, e.target.value)}
              placeholder={placeholder}
              className="flex-1 px-3 py-1.5 rounded-lg bg-secondary border border-border text-foreground text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              type="button" onClick={() => removeItem(i)}
              className="p-1 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
      <button
        type="button" onClick={addItem}
        className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-medium"
      >
        <Plus className="w-3 h-3" /> Dodaj punkt
      </button>
    </div>
  );
};

/* ── Tags input ────────────────────────────────────────────────────────────── */

const TagsInput = ({ tags, onChange }: { tags: string[]; onChange: (tags: string[]) => void }) => {
  const [input, setInput] = useState("");

  const addTag = () => {
    const tag = input.trim();
    if (tag && !tags.includes(tag)) {
      onChange([...tags, tag]);
    }
    setInput("");
  };

  return (
    <div className="space-y-2">
      <label className="text-xs text-muted-foreground font-medium">Tech Stack / Tagi</label>
      <div className="flex flex-wrap gap-1.5 mb-1.5">
        {tags.map((tag) => (
          <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-accent/15 text-accent text-xs font-medium">
            {tag}
            <button type="button" onClick={() => onChange(tags.filter((t) => t !== tag))} className="hover:text-destructive">
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-1.5">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
          placeholder="np. React, TypeScript"
          className="flex-1 px-3 py-1.5 rounded-lg bg-secondary border border-border text-foreground text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <button type="button" onClick={addTag} className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium">
          Dodaj
        </button>
      </div>
    </div>
  );
};

/* ── Main form ─────────────────────────────────────────────────────────────── */

interface Props {
  onSubmit: (data: StructuredJobFormData) => void;
  onCancel: () => void;
  submitting: boolean;
  initialData?: Partial<StructuredJobFormData>;
}

const JobPostForm = ({ onSubmit, onCancel, submitting, initialData }: Props) => {
  const [form, setForm] = useState<StructuredJobFormData>(() =>
    initialData ? { ...EMPTY_FORM, ...initialData } : EMPTY_FORM
  );
  const [showPreview, setShowPreview] = useState(false);

  const set = <K extends keyof StructuredJobFormData>(key: K, val: StructuredJobFormData[K]) =>
    setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  const salaryDisplay = form.salaryFrom && form.salaryTo
    ? `${Number(form.salaryFrom).toLocaleString("pl-PL")} zł - ${Number(form.salaryTo).toLocaleString("pl-PL")} zł`
    : "";

  return (
    <motion.form
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="overflow-hidden"
      onSubmit={handleSubmit}
    >
      <div className="card-gradient rounded-2xl border border-border p-5 mb-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display text-lg font-semibold text-foreground">Nowe ogłoszenie</h3>
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground text-xs font-medium hover:bg-muted transition-colors"
          >
            {showPreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {showPreview ? "Edytuj" : "Podgląd"}
          </button>
        </div>

        {showPreview ? (
          <PreviewPanel form={form} salary={salaryDisplay} />
        ) : (
          <div className="space-y-5">
            {/* Basic info */}
            <div className="space-y-3">
              <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Podstawowe informacje</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Stanowisko *" required value={form.title} onChange={(v) => set("title", v)} placeholder="np. Frontend Developer" />
                <Field label="Firma *" required value={form.company} onChange={(v) => set("company", v)} placeholder="np. TechNova" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Field label="Lokalizacja *" required value={form.location} onChange={(v) => set("location", v)} placeholder="np. Warszawa / Zdalnie" />
                <Select label="Tryb pracy" value={form.workMode} options={WORK_MODES} onChange={(v) => set("workMode", v)} />
                <Select label="Typ umowy" value={form.contractType} options={CONTRACT_TYPES} onChange={(v) => set("contractType", v)} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <Select label="Poziom" value={form.experienceLevel} options={EXPERIENCE_LEVELS} onChange={(v) => set("experienceLevel", v)} />
                <Field label="Wynagrodzenie od" value={form.salaryFrom} onChange={(v) => set("salaryFrom", v)} placeholder="np. 15000" type="number" />
                <Field label="Wynagrodzenie do" value={form.salaryTo} onChange={(v) => set("salaryTo", v)} placeholder="np. 25000" type="number" />
                <Field label="Logo (emoji)" value={form.logo} onChange={(v) => set("logo", v)} placeholder="🏢" />
              </div>
            </div>

            {/* Summary */}
            <div className="space-y-3">
              <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Treść ogłoszenia</p>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground font-medium">
                  Krótki opis (teaser) <span className="text-muted-foreground/60 font-normal">— wyświetlany na karcie, max 300 znaków</span>
                </label>
                <textarea
                  value={form.summary}
                  onChange={(e) => set("summary", e.target.value.slice(0, 300))}
                  placeholder="np. Dołącz do zespołu budującego platformę SaaS nowej generacji. React, TypeScript, GraphQL — ambitne wyzwania i świetny team."
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-foreground text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                />
                <p className="text-[10px] text-muted-foreground text-right">{form.summary.length}/300</p>
              </div>

              <TextArea label="O roli" value={form.aboutRole} onChange={(v) => set("aboutRole", v)} placeholder="Opisz rolę, zespół i kontekst pracy. Co będzie robić ta osoba na co dzień?" rows={3} />
            </div>

            {/* Structured lists */}
            <div className="space-y-4">
              <DynamicList label="Zakres obowiązków *" items={form.responsibilities} onChange={(v) => set("responsibilities", v)} placeholder="np. Rozwijanie głównej aplikacji SaaS" helperText="Dodaj 5-8 konkretnych punktów" />
              <DynamicList label="Wymagania *" items={form.requirements} onChange={(v) => set("requirements", v)} placeholder="np. Min. 3 lata doświadczenia z React" helperText="Kluczowe umiejętności i doświadczenie" />
              <DynamicList label="Mile widziane" items={form.niceToHave} onChange={(v) => set("niceToHave", v)} placeholder="np. Doświadczenie z Next.js" helperText="Dodatkowe atuty, opcjonalne" />
              <DynamicList label="Benefity" items={form.benefits} onChange={(v) => set("benefits", v)} placeholder="np. Prywatna opieka medyczna" helperText="Co oferujesz pracownikowi?" />
              <DynamicList label="Etapy rekrutacji" items={form.recruitmentSteps} onChange={(v) => set("recruitmentSteps", v)} placeholder="np. Rozmowa techniczna (60 min)" helperText="Opisz proces krok po kroku" />
            </div>

            {/* Company & tech */}
            <div className="space-y-3">
              <TextArea label="O firmie" value={form.aboutCompany} onChange={(v) => set("aboutCompany", v)} placeholder="Krótko o firmie — czym się zajmujecie, jaka jest kultura, ile osób w zespole." rows={2} />
              <TagsInput tags={form.techStack} onChange={(v) => set("techStack", v)} />
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-end pt-2">
              <button type="button" onClick={onCancel} className="px-4 py-2 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium hover:bg-muted transition-colors">
                Anuluj
              </button>
              <button type="submit" disabled={submitting} data-testid="employer-submit-job" className="px-5 py-2 rounded-xl btn-gradient text-primary-foreground text-sm font-medium shadow-glow hover:scale-105 transition-transform disabled:opacity-50">
                {submitting ? "Publikuję…" : "Opublikuj"}
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.form>
  );
};

/* ── Reusable field components ─────────────────────────────────────────────── */

const Field = ({ label, value, onChange, placeholder, required, type = "text" }: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string; required?: boolean; type?: string;
}) => (
  <div className="space-y-1.5">
    <label className="text-xs text-muted-foreground font-medium">{label}</label>
    <input
      required={required} type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
      className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-foreground text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring"
    />
  </div>
);

const Select = ({ label, value, options, onChange }: {
  label: string; value: string; options: string[]; onChange: (v: string) => void;
}) => (
  <div className="space-y-1.5">
    <label className="text-xs text-muted-foreground font-medium">{label}</label>
    <select
      value={value} onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
    >
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  </div>
);

const TextArea = ({ label, value, onChange, placeholder, rows = 3 }: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string; rows?: number;
}) => (
  <div className="space-y-1.5">
    <label className="text-xs text-muted-foreground font-medium">{label}</label>
    <textarea
      value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={rows}
      className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-foreground text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring resize-none"
    />
  </div>
);

/* ── Preview panel ─────────────────────────────────────────────────────────── */

const PreviewPanel = ({ form, salary }: { form: StructuredJobFormData; salary: string }) => {
  const filledResponsibilities = form.responsibilities.filter(Boolean);
  const filledRequirements = form.requirements.filter(Boolean);
  const filledNiceToHave = form.niceToHave.filter(Boolean);
  const filledBenefits = form.benefits.filter(Boolean);
  const filledSteps = form.recruitmentSteps.filter(Boolean);

  return (
    <div className="space-y-4 p-4 rounded-xl bg-background/50 border border-border">
      <p className="text-[10px] uppercase tracking-wider font-semibold text-accent">Podgląd oferty</p>

      <div>
        <h2 className="font-display text-lg font-bold text-foreground">{form.title || "Stanowisko"}</h2>
        <p className="text-sm text-primary">{form.company || "Firma"}</p>
        <div className="flex flex-wrap gap-1.5 mt-2 text-[11px]">
          {form.location && <span className="px-2 py-0.5 rounded bg-secondary text-secondary-foreground">{form.location}</span>}
          <span className="px-2 py-0.5 rounded bg-secondary text-secondary-foreground">{form.workMode}</span>
          <span className="px-2 py-0.5 rounded bg-secondary text-secondary-foreground">{form.contractType}</span>
          <span className="px-2 py-0.5 rounded bg-secondary text-secondary-foreground">{form.experienceLevel}</span>
        </div>
        {salary && <p className="text-sm font-bold text-accent mt-2">{salary}</p>}
      </div>

      {form.summary && (
        <div>
          <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-1">Teaser</p>
          <p className="text-sm text-foreground">{form.summary}</p>
        </div>
      )}

      {form.aboutRole && (
        <div>
          <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-1">O roli</p>
          <p className="text-sm text-foreground">{form.aboutRole}</p>
        </div>
      )}

      {filledResponsibilities.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-1">Obowiązki</p>
          <ul className="space-y-1">{filledResponsibilities.map((r, i) => <li key={i} className="text-sm text-foreground flex gap-2"><span className="text-accent">•</span>{r}</li>)}</ul>
        </div>
      )}

      {filledRequirements.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-1">Wymagania</p>
          <ul className="space-y-1">{filledRequirements.map((r, i) => <li key={i} className="text-sm text-foreground flex gap-2"><span className="text-accent">✓</span>{r}</li>)}</ul>
        </div>
      )}

      {filledNiceToHave.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-1">Mile widziane</p>
          <ul className="space-y-1">{filledNiceToHave.map((r, i) => <li key={i} className="text-sm text-muted-foreground flex gap-2"><span>○</span>{r}</li>)}</ul>
        </div>
      )}

      {filledBenefits.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-1">Benefity</p>
          <div className="flex flex-wrap gap-1.5">{filledBenefits.map((b, i) => <span key={i} className="px-2 py-0.5 rounded-md bg-accent/10 text-accent text-xs">{b}</span>)}</div>
        </div>
      )}

      {filledSteps.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-1">Etapy rekrutacji</p>
          <ol className="space-y-1">{filledSteps.map((s, i) => <li key={i} className="text-sm text-foreground flex gap-2"><span className="text-primary font-bold text-xs">{i+1}.</span>{s}</li>)}</ol>
        </div>
      )}

      {form.techStack.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-1">Tech Stack</p>
          <div className="flex flex-wrap gap-1.5">{form.techStack.map((t) => <span key={t} className="px-2 py-0.5 rounded-md bg-muted text-muted-foreground text-xs">{t}</span>)}</div>
        </div>
      )}

      {form.aboutCompany && (
        <div>
          <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-1">O firmie</p>
          <p className="text-sm text-foreground">{form.aboutCompany}</p>
        </div>
      )}
    </div>
  );
};

export { JobPostForm, EMPTY_FORM as EMPTY_STRUCTURED_FORM };
export default JobPostForm;
