import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Building2, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
}

interface CompanyForm {
  company: string;
  company_description: string;
  company_website: string;
  company_location: string;
  company_industry: string;
  company_size: string;
}

const EMPTY: CompanyForm = {
  company: "",
  company_description: "",
  company_website: "",
  company_location: "",
  company_industry: "",
  company_size: "",
};

const EmployerProfileModal = ({ open, onClose }: Props) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [form, setForm] = useState<CompanyForm>(EMPTY);

  // Load latest company data from DB whenever the modal opens
  useEffect(() => {
    if (!open || !user) return;
    let cancelled = false;
    setFetching(true);
    (async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("company, company_description, company_website, company_location, company_industry, company_size")
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancelled) return;
      if (error) {
        toast.error("Nie udało się wczytać profilu firmy");
      } else if (data) {
        setForm({
          company: data.company || "",
          company_description: data.company_description || "",
          company_website: data.company_website || "",
          company_location: data.company_location || "",
          company_industry: data.company_industry || "",
          company_size: data.company_size || "",
        });
      }
      setFetching(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [open, user]);

  // ESC to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const handleSave = async () => {
    if (!user) return;
    if (!form.company.trim()) {
      toast.error("Podaj nazwę firmy");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          company: form.company.trim(),
          company_description: form.company_description.trim(),
          company_website: form.company_website.trim(),
          company_location: form.company_location.trim(),
          company_industry: form.company_industry.trim(),
          company_size: form.company_size,
        })
        .eq("user_id", user.id);
      if (error) throw error;
      toast.success("Profil firmy zapisany");
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Nie udało się zapisać";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const set = <K extends keyof CompanyForm>(key: K, value: CompanyForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-50 bg-background/70 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="employer-profile-title"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col rounded-2xl border border-border bg-card shadow-elevated"
          >
            <div className="p-5 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
                  <Building2 className="w-5 h-5 text-primary-foreground" aria-hidden="true" />
                </div>
                <h2 id="employer-profile-title" className="text-lg font-display font-semibold text-foreground">
                  Profil firmy
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Zamknij"
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto">
              {fetching ? (
                <div className="py-8 flex items-center justify-center text-muted-foreground text-sm">
                  <Loader2 className="w-4 h-4 animate-spin mr-2" /> Ładowanie...
                </div>
              ) : (
                <>
                  <div>
                    <label className="text-xs text-muted-foreground font-medium mb-1 block">Nazwa firmy *</label>
                    <input
                      type="text"
                      value={form.company}
                      onChange={(e) => set("company", e.target.value)}
                      placeholder="Np. SGH Tech"
                      className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground font-medium mb-1 block">Opis firmy</label>
                    <textarea
                      value={form.company_description}
                      onChange={(e) => set("company_description", e.target.value)}
                      placeholder="Krótki opis firmy — co robicie, dla kogo, jaka kultura"
                      rows={3}
                      className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-muted-foreground font-medium mb-1 block">Lokalizacja</label>
                      <input
                        type="text"
                        value={form.company_location}
                        onChange={(e) => set("company_location", e.target.value)}
                        placeholder="Np. Warszawa"
                        className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground font-medium mb-1 block">Branża</label>
                      <input
                        type="text"
                        value={form.company_industry}
                        onChange={(e) => set("company_industry", e.target.value)}
                        placeholder="Np. Fintech / SaaS"
                        className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-muted-foreground font-medium mb-1 block">Strona www</label>
                      <input
                        type="url"
                        value={form.company_website}
                        onChange={(e) => set("company_website", e.target.value)}
                        placeholder="https://..."
                        className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground font-medium mb-1 block">Wielkość firmy</label>
                      <select
                        value={form.company_size}
                        onChange={(e) => set("company_size", e.target.value)}
                        className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        <option value="">Wybierz...</option>
                        <option value="1-10">1–10 osób</option>
                        <option value="11-50">11–50 osób</option>
                        <option value="51-200">51–200 osób</option>
                        <option value="201-1000">201–1000 osób</option>
                        <option value="1000+">1000+ osób</option>
                      </select>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="p-5 border-t border-border flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                Anuluj
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={loading || fetching || !form.company.trim()}
                className="px-5 py-2 rounded-lg btn-gradient text-primary-foreground text-sm font-medium shadow-glow hover:scale-105 transition-transform disabled:opacity-50 disabled:pointer-events-none flex items-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
                Zapisz
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default EmployerProfileModal;
