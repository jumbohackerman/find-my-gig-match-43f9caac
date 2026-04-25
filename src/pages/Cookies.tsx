import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const Cookies = () => (
  <div className="min-h-screen bg-background text-foreground">
    <div className="max-w-3xl mx-auto px-6 py-12">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8"
      >
        <ArrowLeft className="w-4 h-4" /> Powrót
      </Link>

      <h1 className="font-display text-3xl font-bold mb-8">
        Polityka Cookies JobSwipe
      </h1>

      <div className="space-y-10 text-sm text-muted-foreground leading-relaxed">
        <section>
          <h2 className="font-display text-lg font-semibold text-foreground mb-3">
            §1. Informacje ogólne
          </h2>
          <ol className="list-decimal pl-5 space-y-2">
            <li>Serwis JobSwipe korzysta z plików cookies i podobnych technologii.</li>
            <li>
              Cookies to niewielkie pliki zapisywane na urządzeniu użytkownika
              podczas korzystania ze strony lub aplikacji.
            </li>
            <li>
              Cookies mogą służyć do zapewnienia prawidłowego działania
              Serwisu, utrzymania sesji, bezpieczeństwa, zapamiętania
              preferencji oraz – po uzyskaniu zgody – analizy korzystania z
              Serwisu.
            </li>
          </ol>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-foreground mb-3">
            §2. Kategorie cookies
          </h2>

          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-secondary/50 border border-border">
              <h3 className="text-sm font-semibold text-foreground mb-2">
                1. Cookies niezbędne
              </h3>
              <ol className="list-decimal pl-5 space-y-1 text-xs">
                <li>Cookies niezbędne są wymagane do prawidłowego działania Serwisu.</li>
                <li>
                  Mogą obejmować w szczególności:
                  <ol className="list-[lower-alpha] pl-5 mt-1 space-y-0.5">
                    <li>logowanie i utrzymanie sesji,</li>
                    <li>bezpieczeństwo,</li>
                    <li>zapamiętanie wyborów dotyczących cookies,</li>
                    <li>podstawowe działanie interfejsu.</li>
                  </ol>
                </li>
                <li>
                  Cookies niezbędne nie wymagają zgody, ponieważ bez nich
                  Serwis lub jego podstawowe funkcje nie mogłyby działać
                  prawidłowo.
                </li>
              </ol>
            </div>

            <div className="p-4 rounded-xl bg-secondary/50 border border-border">
              <h3 className="text-sm font-semibold text-foreground mb-2">
                2. Cookies funkcjonalne
              </h3>
              <ol className="list-decimal pl-5 space-y-1 text-xs">
                <li>
                  Cookies funkcjonalne pozwalają zapamiętać ustawienia i
                  preferencje użytkownika.
                </li>
                <li>
                  Jeżeli nie są niezbędne do działania Serwisu, są uruchamiane
                  wyłącznie po uzyskaniu zgody użytkownika.
                </li>
              </ol>
            </div>

            <div className="p-4 rounded-xl bg-secondary/50 border border-border">
              <h3 className="text-sm font-semibold text-foreground mb-2">
                3. Cookies analityczne
              </h3>
              <ol className="list-decimal pl-5 space-y-1 text-xs">
                <li>
                  Cookies analityczne pozwalają zrozumieć, jak użytkownicy
                  korzystają z Serwisu, i pomagać w rozwoju produktu.
                </li>
                <li>Cookies analityczne są uruchamiane wyłącznie po uzyskaniu zgody użytkownika.</li>
                <li>
                  Na moment publikacji tej Polityki Cookies Serwis nie
                  zakłada uruchamiania opcjonalnych cookies analitycznych bez
                  zgody użytkownika.
                </li>
              </ol>
            </div>

            <div className="p-4 rounded-xl bg-secondary/50 border border-border">
              <h3 className="text-sm font-semibold text-foreground mb-2">
                4. Cookies marketingowe
              </h3>
              <ol className="list-decimal pl-5 space-y-1 text-xs">
                <li>
                  Cookies marketingowe mogą służyć do personalizacji
                  komunikacji lub działań promocyjnych.
                </li>
                <li>
                  Cookies marketingowe są uruchamiane wyłącznie po uzyskaniu
                  odrębnej zgody użytkownika.
                </li>
                <li>
                  Jeżeli Serwis nie korzysta aktualnie z cookies
                  marketingowych, nie będą one aktywowane.
                </li>
              </ol>
            </div>
          </div>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-foreground mb-3">
            §3. Baner cookies i zgoda
          </h2>
          <ol className="list-decimal pl-5 space-y-2">
            <li>
              Przy pierwszej wizycie użytkownik otrzymuje możliwość wyboru:
              <ol className="list-[lower-alpha] pl-5 mt-1 space-y-1">
                <li>„Akceptuję wszystkie",</li>
                <li>„Odrzucam opcjonalne",</li>
                <li>„Ustawienia".</li>
              </ol>
            </li>
            <li>Opcjonalne cookies nie są uruchamiane przed wyrażeniem zgody.</li>
            <li>Zgody na opcjonalne cookies nie są zaznaczone domyślnie.</li>
            <li>Odmowa opcjonalnych cookies jest równie łatwa jak ich akceptacja.</li>
            <li>Użytkownik może w dowolnym momencie zmienić lub wycofać zgodę.</li>
            <li>
              Wycofanie zgody nie wpływa na zgodność z prawem przetwarzania
              dokonanego przed jej wycofaniem.
            </li>
          </ol>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-foreground mb-3">
            §4. Podstawa korzystania z cookies
          </h2>
          <ol className="list-decimal pl-5 space-y-2">
            <li>
              Cookies niezbędne stosujemy na podstawie uzasadnionego interesu
              Administratora polegającego na zapewnieniu prawidłowego i
              bezpiecznego działania Serwisu.
            </li>
            <li>
              Cookies funkcjonalne, analityczne i marketingowe, które nie są
              niezbędne, stosujemy na podstawie zgody użytkownika.
            </li>
          </ol>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-foreground mb-3">
            §5. Dostawcy technologii
          </h2>
          <ol className="list-decimal pl-5 space-y-2">
            <li>
              Serwis może korzystać z dostawców technologii wspierających
              działanie platformy, w szczególności:
              <ol className="list-[lower-alpha] pl-5 mt-1 space-y-1">
                <li>
                  Supabase – infrastruktura, baza danych, uwierzytelnianie i
                  funkcje techniczne,
                </li>
                <li>
                  OpenAI – funkcje pomocnicze, w szczególności import danych z
                  CV do Profilu,
                </li>
                <li>
                  operator płatności wskazany w aplikacji – obsługa płatności
                  za Pakiety shortlisty,
                </li>
                <li>inni dostawcy techniczni wdrożeni wraz z rozwojem Serwisu.</li>
              </ol>
            </li>
            <li>
              Nie każdy dostawca musi korzystać z cookies. Szczegółowe użycie
              cookies zależy od aktualnej konfiguracji Serwisu.
            </li>
            <li>Lista dostawców może być aktualizowana wraz z rozwojem produktu.</li>
          </ol>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-foreground mb-3">
            §6. Czas przechowywania cookies
          </h2>
          <ol className="list-decimal pl-5 space-y-2">
            <li>Cookies mogą być sesyjne lub trwałe.</li>
            <li>Cookies sesyjne są usuwane po zakończeniu sesji przeglądarki.</li>
            <li>
              Cookies trwałe są przechowywane przez okres wynikający z ich
              celu albo do czasu ich usunięcia przez użytkownika.
            </li>
            <li>
              W przypadku wdrożenia panelu ustawień cookies użytkownik
              powinien mieć możliwość sprawdzenia lub zmiany preferencji
              cookies w Serwisie.
            </li>
          </ol>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-foreground mb-3">
            §7. Zarządzanie cookies w przeglądarce
          </h2>
          <ol className="list-decimal pl-5 space-y-2">
            <li>Użytkownik może zarządzać cookies również z poziomu ustawień przeglądarki.</li>
            <li>
              Ograniczenie lub usunięcie cookies niezbędnych może wpłynąć na
              prawidłowe działanie Serwisu.
            </li>
            <li>
              Odrzucenie opcjonalnych cookies nie powinno blokować korzystania
              z podstawowych funkcji Serwisu.
            </li>
          </ol>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-foreground mb-3">
            §8. Powiązane dokumenty
          </h2>
          <p>
            Zasady przetwarzania danych osobowych opisuje{" "}
            <Link to="/privacy" className="text-primary hover:underline">
              Polityka Prywatności JobSwipe
            </Link>
            . Zasady korzystania z platformy określa{" "}
            <Link to="/terms" className="text-primary hover:underline">
              Regulamin JobSwipe
            </Link>
            .
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-foreground mb-3">
            §9. Kontakt
          </h2>
          <p>
            W sprawach dotyczących cookies można kontaktować się pod adresem:{" "}
            <a
              href="mailto:rob.matysiak@outlook.com"
              className="text-primary hover:underline"
            >
              rob.matysiak@outlook.com
            </a>
            .
          </p>
        </section>
      </div>

      <footer className="mt-16 pt-6 border-t border-border text-xs text-muted-foreground">
        Ostatnia aktualizacja: 25 kwietnia 2026 r.
      </footer>
    </div>
  </div>
);

export default Cookies;
