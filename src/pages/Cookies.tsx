import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const PLACEHOLDER = "⚠️ To jest tekst zastępczy (placeholder). Ostateczna treść prawna zostanie dodana przed uruchomieniem produkcyjnym.";

const Cookies = () => (
  <div className="min-h-screen bg-background text-foreground">
    <div className="max-w-2xl mx-auto px-6 py-12">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8">
        <ArrowLeft className="w-4 h-4" /> Powrót
      </Link>

      <h1 className="font-display text-3xl font-bold mb-2">Polityka Cookies</h1>
      <p className="text-xs text-muted-foreground bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2 mb-8">{PLACEHOLDER}</p>

      <div className="space-y-8 text-sm text-muted-foreground leading-relaxed">
        <section>
          <h2 className="font-display text-lg font-semibold text-foreground mb-2">1. Czym są pliki cookies?</h2>
          <p>Pliki cookies to małe pliki tekstowe zapisywane na Twoim urządzeniu podczas korzystania z serwisu. Pozwalają one na prawidłowe działanie strony i zapamiętywanie Twoich preferencji.</p>
        </section>
        <section>
          <h2 className="font-display text-lg font-semibold text-foreground mb-2">2. Rodzaje cookies</h2>
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-secondary/50 border border-border">
              <p className="text-xs font-semibold text-foreground mb-1">🔒 Niezbędne (zawsze aktywne)</p>
              <p className="text-xs">Wymagane do działania serwisu: sesja logowania, preferencje cookies, tokeny bezpieczeństwa.</p>
            </div>
            <div className="p-3 rounded-xl bg-secondary/50 border border-border">
              <p className="text-xs font-semibold text-foreground mb-1">📊 Analityczne (opcjonalne)</p>
              <p className="text-xs">Pomagają zrozumieć sposób korzystania z serwisu. [Szczegóły narzędzi analitycznych do uzupełnienia].</p>
            </div>
            <div className="p-3 rounded-xl bg-secondary/50 border border-border">
              <p className="text-xs font-semibold text-foreground mb-1">⚙️ Funkcjonalne (opcjonalne)</p>
              <p className="text-xs">Zapamiętują preferencje użytkownika, np. wybrany język lub ukryte oferty.</p>
            </div>
          </div>
        </section>
        <section>
          <h2 className="font-display text-lg font-semibold text-foreground mb-2">3. Zarządzanie cookies</h2>
          <p>Przy pierwszej wizycie wyświetlamy baner z wyborem. Możesz zmienić swój wybór w dowolnym momencie, usuwając dane serwisu w przeglądarce. Możesz również zablokować cookies w ustawieniach przeglądarki — może to jednak ograniczyć funkcjonalność serwisu.</p>
        </section>
        <section>
          <h2 className="font-display text-lg font-semibold text-foreground mb-2">4. Powiązane dokumenty</h2>
          <p>
            Zapoznaj się również z naszą{" "}
            <Link to="/privacy" className="text-primary hover:underline">Polityką Prywatności</Link>{" "}
            oraz{" "}
            <Link to="/terms" className="text-primary hover:underline">Regulaminem</Link>.
          </p>
        </section>
      </div>

      {/* TODO: Backend consent logging hook point */}
      {/* When backend consent logging is implemented, record:
          - user_id (if authenticated) or anonymous session ID
          - consent choice ("all" | "essential")
          - timestamp
          - IP address (server-side)
       */}

      <footer className="mt-16 pt-6 border-t border-border text-xs text-muted-foreground">
        Ostatnia aktualizacja: [DATA]
      </footer>
    </div>
  </div>
);

export default Cookies;
