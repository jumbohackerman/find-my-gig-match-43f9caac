import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { ArrowRight, Sparkles, Search, Users, Briefcase, MapPin, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/jobswipe-logo.png";

const Landing = () => {
  const [counts, setCounts] = useState<{ candidates: number; employers: number }>({ candidates: 0, employers: 0 });

  useEffect(() => {
    // Public anonymous counts. profiles RLS only returns own row, so this may
    // return 0 for anon users — show graceful fallback placeholders below.
    let cancelled = false;
    (async () => {
      try {
        const [c, e] = await Promise.all([
          supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "candidate"),
          supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "employer"),
        ]);
        if (!cancelled) {
          setCounts({
            candidates: c.count ?? 0,
            employers: e.count ?? 0,
          });
        }
      } catch {
        // silent
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const candidatesLabel = counts.candidates > 0 ? counts.candidates.toLocaleString("pl-PL") : "1 200+";
  const employersLabel = counts.employers > 0 ? counts.employers.toLocaleString("pl-PL") : "180+";

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* ── Top bar ── */}
      <header className="px-6 py-4 border-b border-border/40">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <img src={logo} alt="" className="w-9 h-9" />
            <span className="font-display text-xl font-bold">
              Job<span className="text-gradient-primary">Swipe</span>
            </span>
          </Link>
          <Link
            to="/auth"
            className="px-4 py-2 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium hover:bg-muted transition-colors"
          >
            Zaloguj się
          </Link>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="px-6 py-16 sm:py-24">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-medium mb-6">
              <Sparkles className="w-3 h-3" />
              <span>AI shortlista — top 5 kandydatów</span>
            </div>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight tracking-tight mb-6">
              Rekrutacja, która <span className="text-gradient-primary">szanuje Twój czas.</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-xl">
              Aplikuj profilem. Bez wysyłania CV w ciemno. AI shortlista wybiera najlepszych —
              pracodawca kontaktuje tylko tych, których chce poznać.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/auth?role=candidate"
                className="px-6 py-3 rounded-xl btn-gradient text-primary-foreground font-medium shadow-glow hover:scale-[1.02] transition-transform inline-flex items-center gap-2"
              >
                Zacznij jako kandydat <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/auth?role=employer"
                className="px-6 py-3 rounded-xl border border-border bg-transparent text-foreground font-medium hover:bg-secondary transition-colors inline-flex items-center gap-2"
              >
                <Briefcase className="w-4 h-4" /> Dodaj ofertę pracy
              </Link>
            </div>
          </motion.div>

          {/* Mockup card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative max-w-sm mx-auto w-full"
          >
            <div className="absolute -inset-6 bg-gradient-to-br from-primary/20 via-accent/10 to-transparent rounded-3xl blur-2xl" aria-hidden />
            <div className="relative card-gradient rounded-3xl border border-border shadow-2xl p-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center text-2xl">🚀</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">Senior Frontend Developer</h3>
                  <p className="text-sm text-muted-foreground">SGH Tech</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mb-4">
                <span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3" /> Warszawa</span>
                <span>· Hybrydowo</span>
                <span>· Senior</span>
              </div>
              <p className="text-sm text-foreground mb-4">
                Dołącz do zespołu budującego nowoczesną platformę edukacyjną. React, TypeScript, GraphQL.
              </p>
              <div className="flex flex-wrap gap-2 mb-5">
                {["React", "TypeScript", "GraphQL"].map((t) => (
                  <span key={t} className="px-2 py-1 rounded-md bg-secondary text-secondary-foreground text-xs">{t}</span>
                ))}
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-foreground">18 000 – 25 000 zł</span>
                <span className="text-xs text-accent font-medium">95% dopasowania</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── How it works — candidate ── */}
      <section className="px-6 py-16 bg-secondary/20 border-y border-border/40">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-display text-3xl sm:text-4xl font-bold mb-2 text-center">Jak to działa — kandydat</h2>
          <p className="text-muted-foreground text-center mb-12">3 kroki do nowej pracy</p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { n: "1", title: "Zbuduj profil raz", body: "AI uzupełni Twój profil danymi z CV. Bez wklejania, bez formularzy bez końca." },
              { n: "2", title: "Przeglądaj oferty", body: "Aplikuj jednym kliknięciem. Twój profil trafia bezpośrednio do pracodawcy." },
              { n: "3", title: "Czekaj na kontakt", body: "Pracodawcy odzywają się tylko do tych, których naprawdę chcą poznać." },
            ].map((s) => (
              <div key={s.n} className="card-gradient rounded-2xl border border-border p-6">
                <div className="w-10 h-10 rounded-full btn-gradient text-primary-foreground font-bold flex items-center justify-center mb-4">{s.n}</div>
                <h3 className="font-semibold text-lg mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works — employer ── */}
      <section className="px-6 py-16">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-display text-3xl sm:text-4xl font-bold mb-2 text-center">Jak to działa — pracodawca</h2>
          <p className="text-muted-foreground text-center mb-12">Top 5 kandydatów wybranych przez AI</p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { n: "1", icon: Briefcase, title: "Dodaj ofertę", body: "Zbierz aplikacje od kandydatów dopasowanych do Twoich kryteriów." },
              { n: "2", icon: Sparkles, title: "Uruchom AI Shortlistę", body: "AI wybiera top 5 kandydatów spośród wszystkich aplikujących." },
              { n: "3", icon: Users, title: "Kontaktuj najlepszych", body: "Skontaktuj się tylko z tymi, którzy najlepiej pasują do roli." },
            ].map((s) => (
              <div key={s.n} className="card-gradient rounded-2xl border border-border p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-accent/10 text-accent flex items-center justify-center"><s.icon className="w-5 h-5" /></div>
                  <span className="text-xs font-bold text-muted-foreground">KROK {s.n}</span>
                </div>
                <h3 className="font-semibold text-lg mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Social proof ── */}
      <section className="px-6 py-12 bg-secondary/20 border-y border-border/40">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-lg text-foreground">
            Dołącz do <span className="font-bold text-gradient-primary">{candidatesLabel}</span> kandydatów
            {" "}i <span className="font-bold text-gradient-primary">{employersLabel}</span> pracodawców
          </p>
        </div>
      </section>

      {/* ── Example job card with login overlay ── */}
      <section className="px-6 py-16">
        <div className="max-w-md mx-auto">
          <h2 className="font-display text-2xl font-bold mb-6 text-center">Przykładowa oferta</h2>
          <div className="relative card-gradient rounded-3xl border border-border shadow-xl p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center text-2xl">🚀</div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">Senior Frontend Developer</h3>
                <p className="text-sm text-muted-foreground">SGH Tech</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mb-4">
              <span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3" /> Warszawa</span>
              <span>· Hybrydowo</span>
              <span>· Senior</span>
            </div>
            <p className="text-sm text-foreground mb-4">
              Dołącz do zespołu budującego nowoczesną platformę edukacyjną. React, TypeScript, GraphQL.
            </p>
            <div className="flex flex-wrap gap-2 mb-5">
              {["React", "TypeScript", "GraphQL", "Node.js"].map((t) => (
                <span key={t} className="px-2 py-1 rounded-md bg-secondary text-secondary-foreground text-xs">{t}</span>
              ))}
            </div>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="font-semibold text-foreground">18 000 – 25 000 zł</span>
            </div>

            {/* Overlay CTA */}
            <div className="absolute inset-0 rounded-3xl bg-background/70 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
              <Lock className="w-6 h-6 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Aplikowanie wymaga konta</p>
              <Link
                to="/auth"
                className="px-5 py-2.5 rounded-xl btn-gradient text-primary-foreground font-medium shadow-glow inline-flex items-center gap-2"
              >
                <Search className="w-4 h-4" /> Zaloguj się, by aplikować
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border/40 px-6 py-6 mt-auto">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
          <Link to="/privacy" className="hover:text-foreground transition-colors">Prywatność</Link>
          <span className="text-border">·</span>
          <Link to="/terms" className="hover:text-foreground transition-colors">Regulamin</Link>
          <span className="text-border">·</span>
          <Link to="/cookies" className="hover:text-foreground transition-colors">Cookies</Link>
          <span className="text-border">·</span>
          <span>© {new Date().getFullYear()} JobSwipe</span>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
