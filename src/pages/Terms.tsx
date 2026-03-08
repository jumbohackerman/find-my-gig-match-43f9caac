import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const PLACEHOLDER = "⚠️ To jest tekst zastępczy (placeholder). Ostateczna treść prawna zostanie dodana przed uruchomieniem produkcyjnym.";

const Terms = () => (
  <div className="min-h-screen bg-background text-foreground">
    <div className="max-w-2xl mx-auto px-6 py-12">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8">
        <ArrowLeft className="w-4 h-4" /> Powrót
      </Link>

      <h1 className="font-display text-3xl font-bold mb-2">Regulamin</h1>
      <p className="text-xs text-muted-foreground bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2 mb-8">{PLACEHOLDER}</p>

      <div className="space-y-8 text-sm text-muted-foreground leading-relaxed">
        <section>
          <h2 className="font-display text-lg font-semibold text-foreground mb-2">1. Postanowienia ogólne</h2>
          <p>Niniejszy regulamin określa zasady korzystania z serwisu JobSwipe prowadzonego przez [Nazwa firmy]. Korzystanie z serwisu oznacza akceptację regulaminu.</p>
        </section>
        <section>
          <h2 className="font-display text-lg font-semibold text-foreground mb-2">2. Definicje</h2>
          <p><strong>Serwis</strong> — aplikacja internetowa JobSwipe. <strong>Kandydat</strong> — użytkownik szukający pracy. <strong>Pracodawca</strong> — użytkownik publikujący oferty.</p>
        </section>
        <section>
          <h2 className="font-display text-lg font-semibold text-foreground mb-2">3. Rejestracja i konto</h2>
          <p>Rejestracja wymaga podania adresu email i hasła. Użytkownik zobowiązuje się do podania prawdziwych danych. Konto może zostać usunięte na żądanie użytkownika.</p>
        </section>
        <section>
          <h2 className="font-display text-lg font-semibold text-foreground mb-2">4. Zasady korzystania</h2>
          <p>Zabrania się: publikowania fałszywych ofert, spamowania, podszywania się pod inne osoby, wykorzystywania serwisu w sposób niezgodny z prawem.</p>
        </section>
        <section>
          <h2 className="font-display text-lg font-semibold text-foreground mb-2">5. Odpowiedzialność</h2>
          <p>Serwis nie ponosi odpowiedzialności za treść ofert publikowanych przez pracodawców ani za przebieg procesów rekrutacyjnych.</p>
        </section>
        <section>
          <h2 className="font-display text-lg font-semibold text-foreground mb-2">6. Reklamacje</h2>
          <p>Reklamacje należy zgłaszać na adres [email]. Rozpatrzenie następuje w ciągu 14 dni roboczych.</p>
        </section>
        <section>
          <h2 className="font-display text-lg font-semibold text-foreground mb-2">7. Zmiany regulaminu</h2>
          <p>Zastrzegamy prawo do zmiany regulaminu. O zmianach użytkownicy zostaną powiadomieni z [X]-dniowym wyprzedzeniem.</p>
        </section>
      </div>

      <footer className="mt-16 pt-6 border-t border-border text-xs text-muted-foreground">
        Ostatnia aktualizacja: [DATA]
      </footer>
    </div>
  </div>
);

export default Terms;
