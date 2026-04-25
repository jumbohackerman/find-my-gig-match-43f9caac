import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const Terms = () => (
  <div className="min-h-screen bg-background text-foreground">
    <div className="max-w-3xl mx-auto px-6 py-12">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8"
      >
        <ArrowLeft className="w-4 h-4" /> Powrót
      </Link>

      <h1 className="font-display text-3xl font-bold mb-8">
        Regulamin korzystania z platformy JobSwipe
      </h1>

      <div className="space-y-10 text-sm text-muted-foreground leading-relaxed">
        <section>
          <h2 className="font-display text-lg font-semibold text-foreground mb-3">
            §1. Postanowienia ogólne
          </h2>
          <ol className="list-decimal pl-5 space-y-2">
            <li>
              Niniejszy Regulamin określa zasady korzystania z platformy
              internetowej JobSwipe, prowadzonej przez Roberta Matysiaka
              prowadzącego jednoosobową działalność gospodarczą pod adresem:
              ul. Perzyńskiego 11/5, 01-855 Warszawa, NIP: 1182198094, adres
              e-mail:{" "}
              <a
                href="mailto:rob.matysiak@outlook.com"
                className="text-primary hover:underline"
              >
                rob.matysiak@outlook.com
              </a>
              , dalej jako „Operator" lub „JobSwipe".
            </li>
            <li>
              JobSwipe jest platformą internetową służącą do łączenia
              kandydatów poszukujących pracy z pracodawcami publikującymi
              oferty pracy i prowadzącymi procesy rekrutacyjne.
            </li>
            <li>
              JobSwipe działa jako platforma typu swipe-first dla Kandydatów
              oraz jako panel rekrutacyjny typu ATS-light dla Pracodawców.
            </li>
            <li>Korzystanie z Serwisu wymaga akceptacji Regulaminu.</li>
            <li>
              Regulamin jest udostępniany nieodpłatnie w sposób umożliwiający
              jego pozyskanie, utrwalenie i odtworzenie.
            </li>
          </ol>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-foreground mb-3">
            §2. Definicje
          </h2>
          <ol className="list-decimal pl-5 space-y-2">
            <li>
              Serwis / JobSwipe – platforma internetowa dostępna online,
              prowadzona przez Operatora.
            </li>
            <li>
              Operator – Robert Matysiak prowadzący jednoosobową działalność
              gospodarczą, ul. Perzyńskiego 11/5, 01-855 Warszawa, NIP:
              1182198094.
            </li>
            <li>
              Użytkownik – każda osoba korzystająca z Serwisu, w tym Kandydat
              lub Pracodawca.
            </li>
            <li>
              Kandydat – użytkownik korzystający z Serwisu w celu stworzenia
              profilu zawodowego, przeglądania ofert pracy i aplikowania na
              wybrane oferty.
            </li>
            <li>
              Pracodawca – użytkownik korzystający z Serwisu w celu
              publikacji własnych ofert pracy i prowadzenia własnych procesów
              rekrutacyjnych.
            </li>
            <li>
              Konto – indywidualny dostęp Użytkownika do Serwisu po
              rejestracji i zalogowaniu.
            </li>
            <li>
              Profil – zestaw danych zawodowych Kandydata zapisanych w
              Serwisie, będący podstawowym źródłem informacji wykorzystywanym
              w dopasowaniu i procesie rekrutacyjnym.
            </li>
            <li>
              CV – dokument przesłany przez Kandydata wyłącznie w celu
              automatycznego uzupełnienia Profilu.
            </li>
            <li>
              Oferta – ogłoszenie o pracę opublikowane przez Pracodawcę w
              Serwisie.
            </li>
            <li>Aplikacja – zgłoszenie Kandydata na konkretną Ofertę.</li>
            <li>
              Shortlista – płatne dodanie Kandydata przez Pracodawcę do
              shortlisty konkretnej Oferty.
            </li>
            <li>
              Pakiet shortlisty – pakiet 5, 10 lub 20 slotów shortlisty
              przypisany do konkretnej Oferty.
            </li>
            <li>
              Slot shortlisty – jednostka umożliwiająca dodanie jednego
              Kandydata do shortlisty dla konkretnej Oferty.
            </li>
          </ol>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-foreground mb-3">
            §3. Rejestracja i konto
          </h2>
          <ol className="list-decimal pl-5 space-y-2">
            <li>Korzystanie z podstawowych funkcji Serwisu wymaga utworzenia Konta.</li>
            <li>
              Użytkownik zobowiązuje się podawać dane prawdziwe, aktualne i
              dotyczące jego osoby albo reprezentowanego przez niego podmiotu.
            </li>
            <li>Użytkownik odpowiada za zachowanie poufności danych logowania.</li>
            <li>
              Użytkownik nie może udostępniać Konta osobom nieuprawnionym ani
              korzystać z Konta innej osoby.
            </li>
            <li>
              Użytkownik może samodzielnie usunąć Konto z poziomu aplikacji,
              jeżeli taka funkcja jest dostępna w panelu użytkownika.
            </li>
            <li>
              Operator może ograniczyć, zawiesić lub usunąć Konto w przypadku
              naruszenia Regulaminu, przepisów prawa, bezpieczeństwa Serwisu
              lub uzasadnionego podejrzenia nadużycia.
            </li>
          </ol>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-foreground mb-3">
            §4. Zasady korzystania przez Kandydata
          </h2>
          <ol className="list-decimal pl-5 space-y-2">
            <li>
              Kandydat może w szczególności:
              <ol className="list-[lower-alpha] pl-5 mt-1 space-y-1">
                <li>utworzyć i edytować Profil,</li>
                <li>przesłać CV w celu automatycznego uzupełnienia Profilu,</li>
                <li>przeglądać Oferty,</li>
                <li>aplikować na wybrane Oferty,</li>
                <li>śledzić status swoich Aplikacji w zakresie udostępnionym przez Serwis,</li>
                <li>
                  komunikować się z Pracodawcą w aplikacji, jeżeli funkcja
                  chatu jest dostępna na danym etapie procesu.
                </li>
              </ol>
            </li>
            <li>
              Profil jest podstawowym źródłem informacji o Kandydacie w
              JobSwipe. CV służy wyłącznie do ułatwienia lub przyspieszenia
              uzupełnienia Profilu.
            </li>
            <li>
              CV nie jest udostępniane Pracodawcom przez Serwis i jest usuwane
              niezwłocznie po skutecznym imporcie danych do Profilu, nie
              później niż w ciągu 24 godzin od zakończenia procesu importu.
            </li>
            <li>
              Automatyczny import danych z CV może zawierać błędy, braki lub
              nieścisłości. Kandydat jest zobowiązany sprawdzić dane
              zaimportowane z CV i poprawić je przed wykorzystaniem Profilu w
              Aplikacjach, jeżeli są niepełne lub nieprawidłowe.
            </li>
            <li>
              Kandydat odpowiada za poprawność danych zapisanych i
              zatwierdzonych w Profilu, w tym danych zaimportowanych
              automatycznie z CV.
            </li>
            <li>
              Kandydat zobowiązuje się nie podawać treści bezprawnych,
              nieprawdziwych, wprowadzających w błąd lub naruszających prawa
              osób trzecich.
            </li>
            <li>
              Kandydat, aplikując na konkretną Ofertę, przekazuje dane
              związane z Aplikacją Pracodawcy wskazanemu w Ofercie. Pracodawca
              prowadzi własny proces rekrutacyjny jako odrębny administrator
              danych.
            </li>
            <li>
              Kandydat może wyrazić odrębną, dobrowolną zgodę na udział w
              przyszłych rekrutacjach przez okres 12 miesięcy. Brak takiej
              zgody nie wpływa na możliwość udziału w bieżącej rekrutacji.
            </li>
          </ol>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-foreground mb-3">
            §5. Zasady korzystania przez Pracodawcę
          </h2>
          <ol className="list-decimal pl-5 space-y-2">
            <li>
              Pracodawca może korzystać z Serwisu wyłącznie w celu
              publikowania własnych Ofert i prowadzenia własnych procesów
              rekrutacyjnych.
            </li>
            <li>
              Pracodawca może mieć konto firmowe z dostępem dla wielu osób
              działających w imieniu tej samej firmy.
            </li>
            <li>
              Pracodawca odpowiada za działania osób, którym udostępnia dostęp
              do konta firmowego.
            </li>
            <li>
              Pracodawca zobowiązuje się publikować wyłącznie Oferty zgodne z
              prawem, rzeczywiste, aktualne i niewprowadzające w błąd.
            </li>
            <li>
              Oferty anonimowe nie są przewidziane. Kandydat powinien widzieć
              nazwę Pracodawcy przed aplikacją.
            </li>
            <li>
              Każda Oferta powinna zawierać dane Pracodawcy oraz klauzulę
              informacyjną Pracodawcy albo link do takiej klauzuli,
              umożliwiający Kandydatowi zapoznanie się z zasadami
              przetwarzania danych przez Pracodawcę w danej rekrutacji.
            </li>
            <li>
              Pracodawca nie może wykorzystywać Serwisu do:
              <ol className="list-[lower-alpha] pl-5 mt-1 space-y-1">
                <li>publikowania fałszywych lub pozornych Ofert,</li>
                <li>obchodzenia mechanizmów rozliczeniowych JobSwipe,</li>
                <li>
                  pozyskiwania danych Kandydatów poza zakresem przewidzianym w
                  Serwisie,
                </li>
                <li>kontaktowania się z Kandydatami z pominięciem zasad Serwisu,</li>
                <li>naruszania prywatności Kandydatów,</li>
                <li>
                  prowadzenia działań sprzecznych z prawem, dobrymi obyczajami
                  lub celem Serwisu.
                </li>
              </ol>
            </li>
            <li>
              Przed dodaniem Kandydata do shortlisty Pracodawca widzi wyłącznie
              ograniczony podgląd Profilu, bez danych kontaktowych, CV i
              danych pozwalających na bezpośrednią identyfikację, chyba że dana
              informacja jest wyraźnie przewidziana w funkcjonalności Serwisu.
            </li>
            <li>
              Po płatnym dodaniu Kandydata do shortlisty Pracodawca uzyskuje
              rozszerzony dostęp do Profilu w zakresie udostępnionym przez
              Serwis oraz możliwość kontaktu przez chat w aplikacji.
            </li>
            <li>
              Po shortliście Serwis nie udostępnia automatycznie numeru
              telefonu, adresu e-mail ani CV Kandydata.
            </li>
            <li>
              Pracodawca działa jako odrębny administrator danych osobowych w
              zakresie własnego procesu rekrutacyjnego i odpowiada za
              wykonanie własnych obowiązków wynikających z RODO oraz prawa
              pracy.
            </li>
          </ol>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-foreground mb-3">
            §6. Shortlista, pakiety i płatności
          </h2>
          <ol className="list-decimal pl-5 space-y-2">
            <li>
              JobSwipe oferuje Pracodawcom płatne Pakiety shortlisty
              przypisane do konkretnej Oferty.
            </li>
            <li>
              Dostępne pakiety obejmują 5, 10 lub 20 slotów, chyba że w
              aplikacji wskazano inne aktualnie dostępne warianty.
            </li>
            <li>
              Pracodawca kupuje Pakiet shortlisty przed dodaniem Kandydata do
              shortlisty.
            </li>
            <li>Ceny Pakietów są prezentowane w aplikacji przed zakupem.</li>
            <li>
              Kliknięcie „Dodaj do shortlisty", „Shortlistuj" lub równoważnej
              akcji powoduje zużycie 1 slotu z aktywnego Pakietu przypisanego
              do danej Oferty.
            </li>
            <li>
              Zwykłe wyświetlenie podglądu Kandydata, rekomendacja systemowa,
              zmiana statusu albo oznaczenie Kandydata bez dodania do
              shortlisty nie powodują naliczenia opłaty.
            </li>
            <li>
              Usunięcie Kandydata z shortlisty nie powoduje automatycznego
              zwrotu slotu, chyba że Operator podejmie odmienną decyzję w
              ramach reklamacji albo obowiązek zwrotu wynika z bezwzględnie
              obowiązujących przepisów prawa.
            </li>
            <li>
              Zamknięcie, usunięcie lub dezaktywacja Oferty przez Pracodawcę
              nie powoduje automatycznego zwrotu niewykorzystanych slotów,
              chyba że w aplikacji, odrębnych warunkach handlowych, decyzji
              Operatora albo bezwzględnie obowiązujących przepisach prawa
              wskazano inaczej.
            </li>
            <li>
              Operator może prowadzić ewidencję billingową i audytową zdarzeń
              shortlisty, obejmującą w szczególności datę, Pracodawcę, Ofertę,
              Kandydata, liczbę slotów przed i po akcji oraz osobę wykonującą
              akcję.
            </li>
            <li>
              W momencie dodania Kandydata do shortlisty Serwis może zapisać
              snapshot wybranych danych Profilu widocznych dla Pracodawcy w
              tym momencie, w celu audytu, rozliczeń, obsługi reklamacji,
              wykazania zakresu udostępnionych danych i ochrony przed
              roszczeniami.
            </li>
            <li>
              Płatności mogą być obsługiwane przez operatora płatności
              wskazanego w aplikacji. Dane dotyczące płatności mogą być
              przetwarzane przez tego operatora zgodnie z jego regulaminem i
              polityką prywatności.
            </li>
            <li>
              Zakup Pakietu shortlisty nie gwarantuje zatrudnienia Kandydata,
              odpowiedzi Kandydata ani pozytywnego zakończenia rekrutacji.
            </li>
            <li>
              Jeżeli Pracodawcy lub osobie działającej w imieniu Pracodawcy
              przysługują bezwzględnie obowiązujące prawa konsumenckie lub
              prawa przedsiębiorcy na prawach konsumenta, Operator respektuje
              te prawa zgodnie z obowiązującymi przepisami.
            </li>
          </ol>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-foreground mb-3">
            §7. Komunikacja w aplikacji
          </h2>
          <ol className="list-decimal pl-5 space-y-2">
            <li>
              Komunikacja między Pracodawcą a Kandydatem odbywa się w
              aplikacji, jeżeli funkcja chatu jest dostępna dla danej
              rekrutacji.
            </li>
            <li>
              Chat po stronie Pracodawcy jest dostępny zasadniczo po dodaniu
              Kandydata do shortlisty.
            </li>
            <li>
              Zabronione jest wykorzystywanie chatu do obchodzenia zasad
              Serwisu, w szczególności do nieuprawnionego pozyskiwania danych
              kontaktowych lub przenoszenia procesu poza Serwis w sposób
              naruszający Regulamin.
            </li>
            <li>
              Pracodawca nie może wykorzystywać informacji uzyskanych w
              Serwisie w celu identyfikacji Kandydata, a następnie prowadzić
              rekrutacji, kontaktu lub zatrudnienia z pominięciem zasad
              rozliczeń JobSwipe.
            </li>
            <li>
              Naruszenie zakazu obchodzenia Serwisu może skutkować
              zawieszeniem Konta, odmową dalszego świadczenia usług,
              dochodzeniem należnego wynagrodzenia oraz naprawienia szkody na
              zasadach ogólnych.
            </li>
            <li>
              Operator może stosować techniczne mechanizmy ograniczające
              wysyłanie treści zawierających oczywiste próby obejścia zasad,
              w szczególności numery telefonów, adresy e-mail, linki
              zewnętrzne lub komunikatory.
            </li>
            <li>
              Serwis może automatycznie oznaczać zaproszenia, rozmowy lub
              statusy jako wygasłe po okresie bezczynności wskazanym w
              aplikacji, w celu zachowania aktualności procesów rekrutacyjnych
              i jakości doświadczenia użytkowników.
            </li>
          </ol>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-foreground mb-3">
            §8. Przegląd publicznych ofert przez Pracodawcę
          </h2>
          <ol className="list-decimal pl-5 space-y-2">
            <li>
              Serwis może udostępniać Pracodawcy osobną sekcję służącą do
              przeglądania publicznych, aktywnych Ofert innych Pracodawców w
              celach researchowych.
            </li>
            <li>
              Taki widok jest wyłącznie read-only i nie umożliwia edycji,
              ukrywania, usuwania ani zarządzania cudzymi Ofertami.
            </li>
            <li>
              W tym widoku nie są udostępniane dane Kandydatów, prywatne
              statystyki, dane rozliczeniowe ani wewnętrzne informacje innych
              Pracodawców.
            </li>
            <li>
              Widok researchowy obejmuje wyłącznie dane publiczne Ofert, w
              zakresie nie szerszym niż dane widoczne dla użytkowników
              przeglądających Oferty.
            </li>
          </ol>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-foreground mb-3">
            §9. Działania zabronione i zasady niedyskryminacji
          </h2>
          <ol className="list-decimal pl-5 space-y-2">
            <li>
              Zabrania się w szczególności:
              <ol className="list-[lower-alpha] pl-5 mt-1 space-y-1">
                <li>publikowania fałszywych Ofert,</li>
                <li>podszywania się pod inne osoby lub podmioty,</li>
                <li>naruszania praw osób trzecich,</li>
                <li>spamowania,</li>
                <li>prób obejścia płatnej shortlisty,</li>
                <li>prób pozyskiwania danych Kandydatów poza zasadami Serwisu,</li>
                <li>ingerowania w działanie Serwisu,</li>
                <li>podejmowania prób nieuprawnionego dostępu do danych,</li>
                <li>
                  wykorzystywania Serwisu do celów sprzecznych z prawem lub
                  dobrymi obyczajami,
                </li>
                <li>
                  publikowania Ofert lub prowadzenia rekrutacji w sposób
                  dyskryminujący Kandydatów ze względu na cechy prawnie
                  chronione.
                </li>
              </ol>
            </li>
            <li>
              JobSwipe nie projektuje mechanizmów dopasowania w celu
              różnicowania Kandydatów na podstawie cech prawnie chronionych,
              takich jak płeć, wiek, pochodzenie, religia, niepełnosprawność
              czy inne cechy niezwiązane z kwalifikacjami zawodowymi.
            </li>
            <li>
              W razie naruszenia Regulaminu Operator może usunąć treść,
              ograniczyć dostęp do funkcji, zawiesić Konto, usunąć Konto lub
              podjąć inne działania konieczne do ochrony Serwisu i jego
              użytkowników.
            </li>
          </ol>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-foreground mb-3">
            §10. Reklamacje
          </h2>
          <ol className="list-decimal pl-5 space-y-2">
            <li>
              Reklamacje dotyczące działania Serwisu można składać na adres:{" "}
              <a
                href="mailto:rob.matysiak@outlook.com"
                className="text-primary hover:underline"
              >
                rob.matysiak@outlook.com
              </a>
              .
            </li>
            <li>
              Reklamacja powinna zawierać dane pozwalające zidentyfikować
              Użytkownika, opis problemu oraz oczekiwany sposób rozwiązania
              sprawy.
            </li>
            <li>
              Operator udziela odpowiedzi na reklamację w terminie 14 dni od
              dnia jej otrzymania.
            </li>
            <li>
              Odpowiedź jest przekazywana na adres e-mail, z którego złożono
              reklamację, chyba że Użytkownik wskaże inny adres do kontaktu.
            </li>
            <li>
              Reklamacje dotyczące płatności mogą wymagać współpracy z
              operatorem płatności.
            </li>
          </ol>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-foreground mb-3">
            §11. Odpowiedzialność
          </h2>
          <ol className="list-decimal pl-5 space-y-2">
            <li>
              Operator zapewnia techniczne funkcjonowanie Serwisu, ale nie
              gwarantuje:
              <ol className="list-[lower-alpha] pl-5 mt-1 space-y-1">
                <li>zatrudnienia Kandydata,</li>
                <li>pozyskania odpowiedniego Kandydata przez Pracodawcę,</li>
                <li>zawarcia umowy między Kandydatem a Pracodawcą,</li>
                <li>określonego wyniku procesu rekrutacyjnego.</li>
              </ol>
            </li>
            <li>
              Operator nie odpowiada za treść Ofert publikowanych przez
              Pracodawców, decyzje rekrutacyjne Pracodawców ani dane podane
              przez Użytkowników, chyba że odpowiedzialność taka wynika z
              bezwzględnie obowiązujących przepisów prawa.
            </li>
            <li>
              Operator może czasowo ograniczyć dostęp do Serwisu z przyczyn
              technicznych, bezpieczeństwa lub konserwacyjnych.
            </li>
            <li>
              Automatyczny import danych z CV oraz mechanizmy dopasowania mogą
              zawierać błędy lub niepełności. Użytkownik powinien weryfikować
              dane i rekomendacje przed podjęciem decyzji lub dalszym
              wykorzystaniem informacji w procesie rekrutacyjnym.
            </li>
          </ol>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-foreground mb-3">
            §12. Prawa własności intelektualnej
          </h2>
          <ol className="list-decimal pl-5 space-y-2">
            <li>
              Serwis, jego interfejs, układ graficzny, logotypy, nazwy,
              teksty, elementy wizualne, szablony, materiały i funkcjonalności
              udostępnione przez Operatora stanowią elementy chronione prawem,
              w szczególności prawem autorskim, prawami własności przemysłowej
              lub innymi właściwymi przepisami.
            </li>
            <li>
              Użytkownik nie może kopiować, rozpowszechniać, modyfikować,
              odsprzedawać ani wykorzystywać elementów Serwisu poza zakresem
              dozwolonego korzystania z platformy, chyba że Operator wyraził
              na to zgodę albo wynika to z bezwzględnie obowiązujących
              przepisów prawa.
            </li>
            <li>
              Jeżeli Serwis udostępnia szablony, układy profilu, materiały
              pomocnicze lub dokumenty generowane przez JobSwipe, pozostają
              one elementem Serwisu. Użytkownik może korzystać z nich
              wyłącznie w zakresie funkcji udostępnionych przez JobSwipe.
            </li>
          </ol>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-foreground mb-3">
            §13. Dane osobowe i cookies
          </h2>
          <ol className="list-decimal pl-5 space-y-2">
            <li>
              Zasady przetwarzania danych osobowych określa{" "}
              <Link to="/privacy" className="text-primary hover:underline">
                Polityka Prywatności JobSwipe
              </Link>
              .
            </li>
            <li>
              Zasady korzystania z plików cookies określa{" "}
              <Link to="/cookies" className="text-primary hover:underline">
                Polityka Cookies JobSwipe
              </Link>
              .
            </li>
          </ol>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-foreground mb-3">
            §14. Zmiany Regulaminu
          </h2>
          <ol className="list-decimal pl-5 space-y-2">
            <li>
              Operator może zmienić Regulamin z ważnych przyczyn, w
              szczególności w przypadku:
              <ol className="list-[lower-alpha] pl-5 mt-1 space-y-1">
                <li>zmiany przepisów prawa,</li>
                <li>zmiany funkcjonalności Serwisu,</li>
                <li>zmiany modelu biznesowego,</li>
                <li>zmiany zasad bezpieczeństwa,</li>
                <li>konieczności przeciwdziałania nadużyciom,</li>
                <li>zmiany dostawców usług technicznych lub płatniczych.</li>
              </ol>
            </li>
            <li>
              O zmianach Regulaminu Użytkownicy zostaną poinformowani z co
              najmniej 14-dniowym wyprzedzeniem, o ile bezwzględnie
              obowiązujące przepisy nie wymagają innego trybu.
            </li>
            <li>
              Użytkownik, który nie akceptuje zmian Regulaminu, może zakończyć
              korzystanie z Serwisu i usunąć Konto przed wejściem zmian w
              życie.
            </li>
            <li>
              Zmiana ceny, zasad płatności lub innych istotnych warunków usług
              płatnych wymaga wyraźnego poinformowania Pracodawcy przed
              zakupem lub kontynuacją korzystania z płatnej usługi na nowych
              warunkach.
            </li>
            <li>
              Zmiany Regulaminu nie wpływają na prawa nabyte przed wejściem
              zmian w życie, chyba że bezwzględnie obowiązujące przepisy prawa
              stanowią inaczej.
            </li>
          </ol>
        </section>
      </div>

      <footer className="mt-16 pt-6 border-t border-border text-xs text-muted-foreground">
        Ostatnia aktualizacja: 25 kwietnia 2026 r.
      </footer>
    </div>
  </div>
);

export default Terms;
