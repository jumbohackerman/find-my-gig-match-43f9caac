import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const PrivacyPolicy = () => (
  <div className="min-h-screen bg-background text-foreground">
    <div className="max-w-3xl mx-auto px-6 py-12">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8"
      >
        <ArrowLeft className="w-4 h-4" /> Powrót
      </Link>

      <h1 className="font-display text-3xl font-bold mb-8">
        Polityka Prywatności JobSwipe
      </h1>

      <div className="space-y-10 text-sm text-muted-foreground leading-relaxed">
        <section>
          <h2 className="font-display text-lg font-semibold text-foreground mb-3">
            §1. Administrator danych
          </h2>
          <ol className="list-decimal pl-5 space-y-2">
            <li>
              Administratorem danych osobowych przetwarzanych w związku z
              prowadzeniem platformy JobSwipe jest Robert Matysiak prowadzący
              jednoosobową działalność gospodarczą, ul. Perzyńskiego 11/5,
              01-855 Warszawa, NIP: 1182198094, e-mail:{" "}
              <a
                href="mailto:rob.matysiak@outlook.com"
                className="text-primary hover:underline"
              >
                rob.matysiak@outlook.com
              </a>
              .
            </li>
            <li>
              W sprawach dotyczących danych osobowych można kontaktować się
              pod adresem:{" "}
              <a
                href="mailto:rob.matysiak@outlook.com"
                className="text-primary hover:underline"
              >
                rob.matysiak@outlook.com
              </a>
              .
            </li>
            <li>Administrator nie wyznaczył Inspektora Ochrony Danych.</li>
          </ol>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-foreground mb-3">
            §2. Najważniejsze założenia przetwarzania danych w JobSwipe
          </h2>
          <ol className="list-decimal pl-5 space-y-2">
            <li>
              JobSwipe jest platformą rekrutacyjną, w której Kandydat tworzy
              Profil, przegląda Oferty i aplikuje na wybrane stanowiska, a
              Pracodawca publikuje własne Oferty i prowadzi własne
              rekrutacje.
            </li>
            <li>
              W zakresie działania platformy, kont użytkowników,
              bezpieczeństwa, komunikacji systemowej, funkcji profilu, funkcji
              shortlisty i rozliczeń administratorem danych jest Operator.
            </li>
            <li>
              Po aplikacji Kandydata na konkretną Ofertę dane związane z tą
              Aplikacją są udostępniane Pracodawcy wskazanemu w Ofercie.
            </li>
            <li>
              Pracodawca prowadzący rekrutację działa jako odrębny
              administrator danych w zakresie własnego procesu
              rekrutacyjnego.
            </li>
            <li>
              Każda Oferta powinna zawierać dane Pracodawcy oraz jego
              klauzulę informacyjną albo link do niej.
            </li>
            <li>
              Podstawowym źródłem danych rekrutacyjnych w JobSwipe jest
              Profil Kandydata, a nie CV.
            </li>
          </ol>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-foreground mb-3">
            §3. Jakie dane przetwarzamy
          </h2>
          <p className="mb-3">
            W zależności od sposobu korzystania z Serwisu możemy przetwarzać
            następujące kategorie danych:
          </p>
          <ol className="list-decimal pl-5 space-y-3">
            <li>
              <strong className="text-foreground">Dane konta:</strong>
              <ol className="list-[lower-alpha] pl-5 mt-1 space-y-1">
                <li>adres e-mail,</li>
                <li>dane uwierzytelniające,</li>
                <li>rola użytkownika,</li>
                <li>identyfikatory konta i sesji,</li>
                <li>informacje o ustawieniach konta.</li>
              </ol>
            </li>
            <li>
              <strong className="text-foreground">Dane Profilu Kandydata:</strong>
              <ol className="list-[lower-alpha] pl-5 mt-1 space-y-1">
                <li>imię i nazwisko,</li>
                <li>tytuł zawodowy,</li>
                <li>lokalizacja,</li>
                <li>seniority,</li>
                <li>preferowany tryb pracy,</li>
                <li>oczekiwania finansowe,</li>
                <li>dostępność,</li>
                <li>umiejętności,</li>
                <li>doświadczenie zawodowe,</li>
                <li>języki,</li>
                <li>branża,</li>
                <li>inne dane dobrowolnie podane przez Kandydata w Profilu.</li>
              </ol>
            </li>
            <li>
              <strong className="text-foreground">Dane dotyczące CV:</strong>
              <ol className="list-[lower-alpha] pl-5 mt-1 space-y-1">
                <li>plik CV lub jego treść przesłana przez Kandydata,</li>
                <li>dane odczytane z CV w celu uzupełnienia Profilu.</li>
              </ol>
            </li>
            <li>
              <strong className="text-foreground">
                Dane dotyczące Aplikacji i procesu rekrutacyjnego:
              </strong>
              <ol className="list-[lower-alpha] pl-5 mt-1 space-y-1">
                <li>Oferty, na które Kandydat aplikuje,</li>
                <li>statusy Aplikacji,</li>
                <li>informacje o shortliście,</li>
                <li>snapshot danych Profilu z momentu shortlisty,</li>
                <li>komunikacja w aplikacji,</li>
                <li>
                  notatki i działania Pracodawcy w zakresie udostępnionym
                  przez Serwis.
                </li>
              </ol>
            </li>
            <li>
              <strong className="text-foreground">Dane Pracodawcy:</strong>
              <ol className="list-[lower-alpha] pl-5 mt-1 space-y-1">
                <li>dane firmy,</li>
                <li>dane osób korzystających z konta firmowego,</li>
                <li>dane Ofert,</li>
                <li>dane płatności i rozliczeń,</li>
                <li>historia wykorzystania Pakietów shortlisty.</li>
              </ol>
            </li>
            <li>
              <strong className="text-foreground">
                Dane techniczne i bezpieczeństwa:
              </strong>
              <ol className="list-[lower-alpha] pl-5 mt-1 space-y-1">
                <li>adres IP,</li>
                <li>dane urządzenia i przeglądarki,</li>
                <li>logi techniczne,</li>
                <li>zdarzenia bezpieczeństwa,</li>
                <li>identyfikatory cookies i podobnych technologii.</li>
              </ol>
            </li>
          </ol>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-foreground mb-3">
            §4. CV i import danych do Profilu
          </h2>
          <ol className="list-decimal pl-5 space-y-2">
            <li>CV służy wyłącznie do automatycznego uzupełnienia Profilu Kandydata.</li>
            <li>CV nie jest udostępniane Pracodawcom przez JobSwipe.</li>
            <li>
              Po skutecznym imporcie danych do Profilu plik CV jest usuwany
              niezwłocznie, nie później niż w ciągu 24 godzin od zakończenia
              procesu importu.
            </li>
            <li>
              Automatyczny import danych z CV może zawierać błędy, braki lub
              nieścisłości. Kandydat powinien sprawdzić i poprawić dane
              zaimportowane z CV przed dalszym korzystaniem z Profilu i
              aplikowaniem na Oferty.
            </li>
            <li>
              Profil jest docelowym źródłem danych wykorzystywanym w
              dopasowaniu i procesie rekrutacyjnym.
            </li>
          </ol>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-foreground mb-3">
            §5. Cele i podstawy prawne przetwarzania
          </h2>
          <p className="mb-3">
            Przetwarzamy dane osobowe w następujących celach i na następujących
            podstawach prawnych:
          </p>
          <ol className="list-decimal pl-5 space-y-2">
            <li>Utworzenie i prowadzenie Konta – art. 6 ust. 1 lit. b RODO.</li>
            <li>
              Świadczenie usług Serwisu dla Kandydatów i Pracodawców – art. 6
              ust. 1 lit. b RODO.
            </li>
            <li>Tworzenie i obsługa Profilu Kandydata – art. 6 ust. 1 lit. b RODO.</li>
            <li>Import danych z CV do Profilu – art. 6 ust. 1 lit. b RODO.</li>
            <li>
              Umożliwienie aplikowania na Oferty i przekazywania Aplikacji
              Pracodawcom – art. 6 ust. 1 lit. b RODO.
            </li>
            <li>
              Obsługa shortlisty, Pakietów shortlisty, płatności i rozliczeń –
              art. 6 ust. 1 lit. b RODO oraz art. 6 ust. 1 lit. f RODO.
            </li>
            <li>
              Prowadzenie audytu działań, zapisywanie snapshotów shortlisty,
              zapobieganie nadużyciom i ochrona przed roszczeniami – art. 6
              ust. 1 lit. f RODO.
            </li>
            <li>Zapewnienie bezpieczeństwa Serwisu – art. 6 ust. 1 lit. f RODO.</li>
            <li>
              Realizacja obowiązków prawnych, podatkowych i rachunkowych –
              art. 6 ust. 1 lit. c RODO.
            </li>
            <li>
              Newsletter i marketing bezpośredni – art. 6 ust. 1 lit. a RODO,
              jeżeli użytkownik wyraził zgodę.
            </li>
            <li>
              Udział Kandydata w przyszłych rekrutacjach – art. 6 ust. 1 lit.
              a RODO, jeżeli Kandydat wyraził odrębną zgodę.
            </li>
            <li>
              Opcjonalne cookies analityczne i funkcjonalne – art. 6 ust. 1
              lit. a RODO, jeżeli użytkownik wyraził zgodę.
            </li>
          </ol>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-foreground mb-3">
            §6. Profilowanie, rekomendacje i dopasowanie ofert
          </h2>
          <ol className="list-decimal pl-5 space-y-2">
            <li>
              JobSwipe może wykorzystywać dane Profilu do dopasowywania
              Kandydatów i Ofert.
            </li>
            <li>
              Dopasowanie opiera się na danych profilowych i mechanizmach
              scoringowych służących usprawnieniu korzystania z platformy.
            </li>
            <li>
              Wynik dopasowania, rekomendacja systemowa lub pozycja Kandydata
              na liście mają charakter pomocniczy.
            </li>
            <li>
              JobSwipe nie podejmuje samodzielnie decyzji o zatrudnieniu,
              odrzuceniu Kandydata ani zakończeniu jego udziału w rekrutacji.
            </li>
            <li>
              Decyzje rekrutacyjne, w tym decyzje o odrzuceniu, zaproszeniu do
              rozmowy, zatrudnieniu albo zakończeniu procesu wobec Kandydata,
              podejmuje Pracodawca.
            </li>
            <li>
              Wynik dopasowania nie stanowi samodzielnej, w pełni
              zautomatyzowanej decyzji wywołującej wobec użytkownika skutki
              prawne lub podobnie istotnie na niego wpływającej.
            </li>
            <li>
              Użytkownik może otrzymać ogólne informacje o głównych
              kategoriach danych wpływających na dopasowanie, takich jak
              umiejętności, doświadczenie, seniority, lokalizacja, tryb pracy,
              oczekiwania finansowe i dostępność.
            </li>
            <li>
              JobSwipe nie ujawnia pełnych wag, kodu, pełnej logiki ani
              szczegółów technicznych mechanizmu scoringowego, jeżeli mogłoby
              to naruszyć bezpieczeństwo, tajemnicę przedsiębiorstwa, prawa
              własności intelektualnej lub ułatwić obchodzenie zasad Serwisu.
            </li>
            <li>
              JobSwipe nie projektuje mechanizmów dopasowania w celu
              różnicowania Kandydatów na podstawie cech prawnie chronionych,
              takich jak płeć, wiek, pochodzenie, religia, niepełnosprawność
              czy inne cechy niezwiązane z kwalifikacjami zawodowymi.
            </li>
            <li>
              JobSwipe może okresowo kontrolować mechanizmy dopasowania pod
              kątem jakości, trafności, bezpieczeństwa oraz ryzyka
              nieuzasadnionej stronniczości lub dyskryminacji.
            </li>
          </ol>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-foreground mb-3">
            §7. Udostępnianie danych Pracodawcom i snapshot shortlisty
          </h2>
          <ol className="list-decimal pl-5 space-y-2">
            <li>
              Kandydat, aplikując na konkretną Ofertę, przekazuje dane
              związane z Aplikacją Pracodawcy wskazanemu w tej Ofercie.
            </li>
            <li>
              Pracodawca otrzymuje dane w zakresie niezbędnym do prowadzenia
              rekrutacji i zgodnie z funkcjami Serwisu.
            </li>
            <li>
              Przed shortlistą Pracodawca może widzieć jedynie ograniczony
              podgląd Profilu.
            </li>
            <li>
              Po dodaniu Kandydata do shortlisty Pracodawca może uzyskać
              rozszerzony dostęp do Profilu i możliwość komunikacji w
              aplikacji.
            </li>
            <li>
              W momencie dodania Kandydata do shortlisty JobSwipe może
              zapisać snapshot wybranych danych Profilu widocznych dla
              Pracodawcy w tym momencie.
            </li>
            <li>
              Snapshot jest przetwarzany w celu audytu, rozliczeń, wykazania
              zakresu udostępnionych danych, obsługi reklamacji oraz ochrony
              przed roszczeniami, na podstawie prawnie uzasadnionego interesu
              Administratora.
            </li>
            <li>JobSwipe nie udostępnia Pracodawcy CV Kandydata.</li>
            <li>
              JobSwipe nie udostępnia automatycznie numeru telefonu ani
              adresu e-mail Kandydata po shortliście.
            </li>
            <li>
              Pracodawca jest odrębnym administratorem danych w zakresie
              własnej rekrutacji i odpowiada za własne obowiązki informacyjne
              oraz retencję danych.
            </li>
          </ol>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-foreground mb-3">
            §8. Odbiorcy danych
          </h2>
          <p className="mb-3">
            Dane mogą być przekazywane następującym kategoriom odbiorców:
          </p>
          <ol className="list-decimal pl-5 space-y-2">
            <li>dostawcom infrastruktury technicznej, w szczególności Supabase,</li>
            <li>
              dostawcom usług AI wykorzystywanych do importu CV i funkcji
              pomocniczych, w szczególności OpenAI,
            </li>
            <li>operatorowi płatności wskazanemu w aplikacji,</li>
            <li>
              dostawcom usług utrzymania, bezpieczeństwa i wsparcia
              technicznego,
            </li>
            <li>dostawcom usług księgowych, prawnych lub doradczych,</li>
            <li>Pracodawcom, na których Oferty Kandydat aplikuje,</li>
            <li>
              organom publicznym, jeżeli obowiązek udostępnienia danych
              wynika z przepisów prawa.
            </li>
          </ol>
          <p className="mt-3">
            Lista dostawców może być aktualizowana wraz z rozwojem Serwisu i
            wdrażaniem nowych funkcji.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-foreground mb-3">
            §9. Przekazywanie danych poza EOG
          </h2>
          <ol className="list-decimal pl-5 space-y-2">
            <li>
              W związku z korzystaniem z dostawców technologicznych, takich
              jak dostawcy infrastruktury chmurowej, AI, płatności lub
              bezpieczeństwa, może dochodzić do przekazywania danych poza
              Europejski Obszar Gospodarczy.
            </li>
            <li>
              W takim przypadku stosujemy odpowiednie zabezpieczenia wymagane
              przez RODO, w szczególności standardowe klauzule umowne, decyzje
              stwierdzające odpowiedni stopień ochrony lub inne mechanizmy
              przewidziane przez przepisy.
            </li>
            <li>
              Szczegółowe informacje o transferach mogą zależeć od aktualnie
              wykorzystywanych dostawców i konfiguracji usług.
            </li>
          </ol>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-foreground mb-3">
            §10. Okres przechowywania danych
          </h2>
          <ol className="list-decimal pl-5 space-y-2">
            <li>Dane Konta i Profilu przechowujemy przez czas korzystania z Serwisu.</li>
            <li>
              Po usunięciu Konta dane są usuwane albo ograniczane w zakresie
              niezbędnym do wykonania obowiązków prawnych, rozliczeń, obsługi
              reklamacji i ochrony przed roszczeniami. Taki ograniczony okres
              przechowywania wynosi do 12 miesięcy, chyba że przepisy prawa
              wymagają dłuższego okresu.
            </li>
            <li>
              Plik CV jest usuwany po skutecznym imporcie danych do Profilu,
              nie później niż w ciągu 24 godzin od zakończenia procesu
              importu.
            </li>
            <li>
              Dane rozliczeniowe i księgowe przechowujemy przez okres
              wymagany przepisami podatkowymi i rachunkowymi.
            </li>
            <li>
              Dane dotyczące Aplikacji i shortlisty przechowujemy przez czas
              trwania procesu rekrutacyjnego oraz przez okres niezbędny do
              rozliczeń, audytu, obsługi reklamacji, wykazania zakresu
              udostępnionych danych i ochrony przed roszczeniami.
            </li>
            <li>
              Snapshot shortlisty jest przechowywany przez okres do 12
              miesięcy od zakończenia danej rekrutacji lub ostatniego
              zdarzenia rozliczeniowego dotyczącego shortlisty, chyba że
              dłuższe przechowywanie jest niezbędne ze względu na reklamację,
              spór, obowiązek prawny, kontrolę lub dochodzenie roszczeń.
            </li>
            <li>
              Dane przetwarzane na podstawie zgody przechowujemy do czasu
              wycofania zgody, chyba że istnieje inna podstawa prawna
              dalszego przechowywania.
            </li>
            <li>
              Zgoda na udział w przyszłych rekrutacjach obowiązuje przez 12
              miesięcy, chyba że zostanie wcześniej wycofana.
            </li>
            <li>
              Logi bezpieczeństwa mogą być przechowywane przez okres
              niezbędny do zapewnienia bezpieczeństwa Serwisu i wyjaśniania
              incydentów.
            </li>
          </ol>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-foreground mb-3">
            §11. Newsletter, marketing i przyszłe rekrutacje
          </h2>
          <ol className="list-decimal pl-5 space-y-2">
            <li>
              Newsletter i komunikacja marketingowa są realizowane wyłącznie
              po uzyskaniu odrębnej, dobrowolnej zgody użytkownika.
            </li>
            <li>Zgoda na newsletter nie jest warunkiem korzystania z Serwisu.</li>
            <li>Checkbox zgody marketingowej nie jest zaznaczony domyślnie.</li>
            <li>Zgodę można wycofać w dowolnym momencie.</li>
            <li>
              Zgoda Kandydata na udział w przyszłych rekrutacjach jest odrębna
              od zgody marketingowej, dobrowolna i niezaznaczona domyślnie.
            </li>
            <li>Brak zgody na przyszłe rekrutacje nie wpływa na udział w bieżącej rekrutacji.</li>
          </ol>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-foreground mb-3">
            §12. Prawa użytkownika
          </h2>
          <p className="mb-3">Użytkownikowi przysługuje prawo do:</p>
          <ol className="list-decimal pl-5 space-y-2">
            <li>dostępu do danych,</li>
            <li>sprostowania danych,</li>
            <li>usunięcia danych,</li>
            <li>ograniczenia przetwarzania,</li>
            <li>przenoszenia danych,</li>
            <li>wniesienia sprzeciwu wobec przetwarzania opartego na uzasadnionym interesie,</li>
            <li>
              wycofania zgody w dowolnym momencie, jeżeli przetwarzanie
              odbywa się na podstawie zgody,
            </li>
            <li>wniesienia skargi do Prezesa Urzędu Ochrony Danych Osobowych.</li>
          </ol>
          <p className="mt-3">
            Żądania dotyczące danych można kierować na adres:{" "}
            <a
              href="mailto:rob.matysiak@outlook.com"
              className="text-primary hover:underline"
            >
              rob.matysiak@outlook.com
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-foreground mb-3">
            §13. Bezpieczeństwo danych
          </h2>
          <ol className="list-decimal pl-5 space-y-2">
            <li>
              Stosujemy środki techniczne i organizacyjne mające na celu
              ochronę danych przed nieuprawnionym dostępem, utratą, zmianą lub
              ujawnieniem.
            </li>
            <li>
              Zakres środków bezpieczeństwa jest dostosowywany do charakteru
              danych, ryzyka i aktualnych możliwości technicznych.
            </li>
            <li>
              Użytkownik powinien chronić swoje dane logowania i nie
              udostępniać Konta osobom nieuprawnionym.
            </li>
          </ol>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-foreground mb-3">
            §14. Cookies
          </h2>
          <p>
            Szczegółowe zasady stosowania plików cookies i podobnych
            technologii opisuje{" "}
            <Link to="/cookies" className="text-primary hover:underline">
              Polityka Cookies JobSwipe
            </Link>
            .
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-foreground mb-3">
            §15. Zmiany Polityki Prywatności
          </h2>
          <ol className="list-decimal pl-5 space-y-2">
            <li>
              Polityka Prywatności może być aktualizowana w szczególności w
              związku ze zmianą prawa, funkcji Serwisu, dostawców usług lub
              sposobów przetwarzania danych.
            </li>
            <li>Aktualna wersja Polityki Prywatności jest dostępna w Serwisie.</li>
          </ol>
        </section>
      </div>

      <footer className="mt-16 pt-6 border-t border-border text-xs text-muted-foreground">
        Ostatnia aktualizacja: 25 kwietnia 2026 r.
      </footer>
    </div>
  </div>
);

export default PrivacyPolicy;
