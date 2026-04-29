import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, ChevronDown, ChevronUp, Pencil } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import EmployerProfileModal from "./EmployerProfileModal";

const FIELDS: { key: string; label: string }[] = [
  { key: "company", label: "Nazwa firmy" },
  { key: "company_description", label: "Opis firmy" },
  { key: "company_website", label: "Strona WWW" },
  { key: "company_location", label: "Lokalizacja" },
  { key: "company_industry", label: "Branża" },
  { key: "company_size", label: "Rozmiar firmy" },
];

type CompanyProfile = Record<string, string>;

const EmployerProfileSidebar = () => {
  const { user, profile } = useAuth();
  const [data, setData] = useState<CompanyProfile>({});
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const loadProfile = async () => {
    if (!user) return;
    setLoading(true);
    const { data: row } = await supabase
      .from("profiles")
      .select("company, company_description, company_website, company_location, company_industry, company_size")
      .eq("user_id", user.id)
      .maybeSingle();
    setData((row as CompanyProfile) || {});
    setLoading(false);
  };

  useEffect(() => {
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const filledCount = FIELDS.filter((f) => (data[f.key] || "").trim().length > 0).length;
  const completeness = Math.round((filledCount / FIELDS.length) * 100);
  const missing = FIELDS.filter((f) => !(data[f.key] || "").trim());
  const companyName = data.company || (profile as any)?.company || "Twoja firma";

  return (
    <>
      <div className="sticky top-4 z-10 rounded-xl border border-border bg-card p-4 mb-3">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Building2 className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-foreground truncate">{companyName}</p>
              <button
                type="button"
                onClick={() => setCollapsed((v) => !v)}
                className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors shrink-0"
                aria-label={collapsed ? "Rozwiń" : "Zwiń"}
                aria-expanded={!collapsed}
              >
                {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </button>
            </div>
            <div className="mt-1.5 flex items-center gap-2">
              <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    completeness === 100 ? "bg-accent" : completeness >= 50 ? "bg-primary" : "bg-yellow-500"
                  }`}
                  style={{ width: `${completeness}%` }}
                />
              </div>
              <span className="text-[11px] font-semibold text-muted-foreground whitespace-nowrap">
                {loading ? "…" : `${completeness}%`}
              </span>
            </div>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {!collapsed && completeness < 100 && !loading && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-3 pt-3 border-t border-border">
                <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-1.5">
                  Brakujące pola
                </p>
                <ul className="space-y-1">
                  {missing.map((f) => (
                    <li key={f.key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span className="w-1 h-1 rounded-full bg-primary shrink-0" />
                      {f.label}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground text-xs font-medium hover:bg-muted transition-colors"
          >
            <Pencil className="w-3 h-3" /> Edytuj profil
          </button>
        </div>
      </div>

      <EmployerProfileModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          loadProfile();
        }}
      />
    </>
  );
};

export default EmployerProfileSidebar;
