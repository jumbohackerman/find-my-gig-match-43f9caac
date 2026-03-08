import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const PLACEHOLDER = "⚠️ To jest tekst zastępczy (placeholder). Ostateczna treść prawna zostanie dodana przed uruchomieniem produkcyjnym.";

const PrivacyPolicy = () => (
  <div className="min-h-screen bg-background text-foreground">
    <div className="max-w-2xl mx-auto px-6 py-12">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8">
        <ArrowLeft className="w-4 h-4" /> Powrót
      </Link>

      <h1 className="font-display text-3xl font-bold mb-2">Polityka Prywatności</h1>
      <p className="text-xs text-muted-foreground bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2 mb-8">{PLACEHOLDER}</p>

      <div className="space-y-8 text-sm text-muted-foreground leading-relaxed">
        <section>
          <h2 className="font-display text-lg font-semibold text-foreground mb-2">1. Administrator danych</h2>
          <p>Administratorem danych osobowych jest [Nazwa firmy], z siedzibą w [Adres], NIP: [NIP]. Kontakt: [email].</p>
        </section>
        <section>
          <h2 className="font-display text-lg font-semibold text-foreground mb-2">2. Zakres zbieranych danych</h2>
          <p>Zbieramy dane podane podczas rejestracji (email, imię i nazwisko, rola), dane profilowe (CV, umiejętności, doświadczenie), dane o aktywności (swipe, aplikacje, zapisane oferty) oraz dane techniczne (adres IP, typ przeglądarki).</p>
        </section>
        <section>
          <h2 className="font-display text-lg font-semibold text-foreground mb-2">3. Cel przetwarzania</h2>
          <p>Dane przetwarzamy w celu świadczenia usługi (łączenie kandydatów z pracodawcami), komunikacji, doskonalenia produktu oraz wypełniania obowiązków prawnych.</p>
        </section>
        <section>
          <h2 className="font-display text-lg font-semibold text-foreground mb-2">4. Podstawa prawna</h2>
          <p>Przetwarzanie odbywa się na podstawie art. 6 ust. 1 lit. a, b, f RODO.</p>
        </section>
        <section>
          <h2 className="font-display text-lg font-semibold text-foreground mb-2">5. Okres przechowywania</h2>
          <p>Dane przechowujemy przez okres korzystania z usługi oraz [X] miesięcy po usunięciu konta.</p>
        </section>
        <section>
          <h2 className="font-display text-lg font-semibold text-foreground mb-2">6. Prawa użytkownika</h2>
          <p>Przysługuje Ci prawo dostępu, sprostowania, usunięcia, ograniczenia przetwarzania, przenoszenia danych oraz wniesienia sprzeciwu. Kontakt: [email].</p>
        </section>
        <section>
          <h2 className="font-display text-lg font-semibold text-foreground mb-2">7. Pliki cookies</h2>
          <p>Szczegółowe informacje o plikach cookies znajdują się w naszej <Link to="/cookies" className="text-primary hover:underline">Polityce Cookies</Link>.</p>
        </section>
      </div>

      <footer className="mt-16 pt-6 border-t border-border text-xs text-muted-foreground">
        Ostatnia aktualizacja: [DATA]
      </footer>
    </div>
  </div>
);

export default PrivacyPolicy;
