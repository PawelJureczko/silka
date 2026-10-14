# Ankieta nowego planu, 14.10.2026

Zakres: nowy wybór na `/plans/new`, ankieta na `/plans/ai`, składanie instrukcji oraz istniejący import JSON. Tryb antislop: during, wybrany przez użytkownika. Kierunek: osobisty dziennik treningowy z `DESIGN.md`, ENERGY 2 / RHYTHM 2 / MOTION 1. Zmiana jest lokalna, bez wdrożenia produkcyjnego i bez migracji.

## Weryfikacja funkcjonalna

- PASS: „Otwórz pusty edytor” otwiera działający edytor, powrót prowadzi do wyboru; „Wypełnij ankietę” otwiera formularz bez historii.
- PASS: oba tryby tworzenia planu przełączają formularz. Wybranie wcześniej 20 sesji w trybie historii nie dołącza ich do promptu z ankiety; odczyt tekstu potwierdził `Historia (limit 0): []`.
- PASS: zmieniono wszystkie selecty ankiety, wypełniono pola liczbowe, tekstowe i textarea; przełączono każdy checkbox dni i sprzętu. Opcja braku ograniczeń ukrywa pole ich opisu.
- PASS: brak sprzętu i niezgodna liczba dni pokazują komunikaty, fokus trafia do pierwszego błędnego pola. Schemat jednostkowo odrzuca również obce pola, powtórzenia i błędne zakresy.
- PASS: przygotowanie promptu pokazuje stan ładowania i blokuje powtórne kliknięcie. Prompt zawiera fikcyjne odpowiedzi, katalog oraz ścisły schemat v1; pomija plan i historię.
- PASS: „Zobacz cały prompt” rozwija tekst; „Kopiuj prompt” daje komunikat sukcesu. Rzeczywiste wklejenie klawiaturą zwróciło ten sam tekst (20025 znaków). Odczyt schowka warstwą narzędzi zwracał wcześniejszy tekst, dlatego rozstrzygający był test wklejenia w formularzu.
- PASS: błędny JSON jest odrzucany. Poprawny JSON testowy pokazuje dwie jednostki z ciężarem `null`; anulowanie podglądu nie zapisuje planu. Dialog zamyka się przez Escape. Osobne potwierdzenie zapisuje plan, a link otwiera edytor z poprawnymi dniami, ćwiczeniem i pustym celem ciężaru.
- PASS: chwilowe zatrzymanie wyłącznie lokalnego API pokazało błąd odczytu i przycisk ponowienia. Po przywróceniu API odczyt działał, a wpisana odpowiedź pozostała w ankiecie. Lokalną bramę przywrócono; fikcyjny plan i konsultację z tego testu usunięto po dokładnych ID i sprawdzeniu nazwy testowej.
- PASS: `npm run lint`, `npm run typecheck`, `npm test` (34/34), `npm run test:ai` (8/8) i `SILKA_TEST_BUILD_DIR=.nuxt-pwa-test npm run build`. Build PWA: 53 zasoby. Nie zmieniano bazy, więc nie powtarzano testów RLS całego schematu. Konsola sprawdzonej karty nie zawierała błędów ani ostrzeżeń.

## Delivery Gate: Hard Gate

Każdy wiersz odnosi się do dodanego lub zmienionego interfejsu, nie do całej istniejącej aplikacji ani tekstów użytkowników.

- R-02 PASS: nowe teksty nie zawierają pauzy typograficznej; użyto zdań, dwukropków i numeracji.
- R-03 PASS: pomiary DOM przy 320, 390, 600, 700, 850, 1000 i 1280 px nie wykazały poziomego przewijania; skontrolowano zrzuty widoku telefonu i szerszego okna.
- R-17 PASS: liczby są odpowiedziami, granicami pól, kolejnością części lub rzeczywistą liczbą ćwiczeń i sesji.
- R-18 PASS: nie dodano referencji ani opinii użytkowników.
- R-23 PASS: nie tworzono nowych logo, awatarów ani innych assetów.
- R-25 PASS: kontrast primary/background 19,06:1, secondary/background 7,76:1, secondary/interactive 5,81:1, tekst głównego przycisku 15,23:1, komunikat błędu/background 10,48:1.
- R-26 PASS: linki, tryby, selecty, pola, checkboxy, submit, kopiowanie, podgląd, anulowanie i zatwierdzenie sprawdzono przez interakcje opisane wyżej.
- R-27 PASS: brak konsultacji, odczyt, przygotowanie, walidacja, błąd API i ponowienie mają widoczne stany.
- R-28 PASS: nie dodano FAQ.
- R-32 PASS: Tab przechodzi do następnego selecta z obrysem 2 px; formularz używa natywnych kontrolek, Escape zamyka potwierdzenie importu.
- R-33 PASS: kod napisano w źródłach Vue/TypeScript; ESLint sformatował kod. Nie dodano skryptów przepisywania CSS ani UI.
- R-34 PASS: aplikacja ma uzgodniony pojedynczy ciemny motyw, bez nowego przełącznika.
- R-35 PASS: uruchomiono aplikację lokalnie, przeszło kliknięcie obu ścieżek i całego importu, build oraz testy; elementy wymieniono w weryfikacji funkcjonalnej.
- R-36 PASS: nie dodano obietnic bezpieczeństwa medycznego ani marketingowych wyników; UI wskazuje granicę ankiety.
- R-37 PASS: zastosowano istniejący kierunek `DESIGN.md`, jawne parametry 2/2/1 i wybrany przez użytkownika tryb during.
- R-38 PASS: formularz jest pusty lub ma jawne wartości edytowalne. Do testów użyto oznaczonego fikcyjnego planu wyłącznie w lokalnej bazie.

## Delivery Gate: Purpose Gate

- R-01 PASS: paleta projektu; nie dodano gradientów, tekstur ani pasków dekoracyjnych.
- R-04 PASS: brak nowych ikon; etykiety opisują czynności.
- R-06 PASS: systemowy sans zapewnia polskie znaki i nie wymaga pobierania fontów; numeracja identyfikuje grupy pytań.
- R-07 PASS: tło pozostaje jednolite.
- R-08 PASS: strzałka występuje tylko w linku powrotu do planów.
- R-09 PASS: brak dekoracyjnych odznak i powtarzających tytuł etykiet nad nagłówkiem.
- R-10 PASS: brak dodatkowych efektów szkła.
- R-12 PASS: brak nowych cieni; dialog korzysta z istniejącej prezentacji nad treścią.
- R-13 PASS: brak glow i pulsowania.
- R-14 PASS: pytania są fieldsetami, nie siatką kart; opcje radio i checkbox mają ramkę, by wskazywać obszar dotykowy i wybór.
- R-19 PASS: tylko istniejące reakcje kontrolek, bez automatycznych animacji; globalne `prefers-reduced-motion` pozostaje aktywne.
- R-22 PASS: brak ilustracji.

## Delivery Gate: Liveliness

- PASS: ENERGY 2 / RHYTHM 2 / MOTION 1 podano przed zmianami i zachowano przez istniejącą typografię, grupy pytań i spokojne kontrolki.
- PASS: punkt skupienia stanowi wybór ścieżki, następnie odpowiedzi ankiety i przycisk przygotowania promptu.
- PASS: odstępy i linie rozdzielają cel, czas/sprzęt, ograniczenia/regenerację oraz preferencje.
- PASS: limonka wskazuje zaznaczenie, focus i główną akcję; opisy mają neutralną paletę.
- PASS: numeracja i linie rozwijają motyw dziennika treningowego.
- PASS: Design Read zadeklarowano przed generowaniem UI, na podstawie `DESIGN.md`.

## Delivery Gate: Craftsmanship i Quality Locks

- C-1 PASS: powody układu, koloru, typografii i numeracji zapisano w `DESIGN.md`.
- C-2 PASS: komplet interakcji opisano wyżej, w tym rzeczywiste wklejenie ze schowka i zapis przez RPC.
- C-3 PASS: każda grupa dotyczy danych potrzebnych do doboru planu; brak sekcji marketingowych.
- C-4 PASS: sprawdzono walidację, awarię, ponowienie, telefon, szerokie okno i klawiaturę.
- C-5 PASS: liczby wynikają z formularza, katalogu i testów; brak fikcyjnych obietnic.
- R-05 PASS: treść wynika z ankiety; od 600 px krótkie pola są parami, od 850 px obok jest lista konsultacji. Na telefonie pozostaje jeden ciąg.
- R-11 PASS: kontrolki korzystają z istniejącego promienia 6 px, bez kapsuł.
- R-15 PASS: CTA nazywają rezultat: „Wypełnij ankietę”, „Otwórz pusty edytor”, „Przygotuj prompt z ankiety”.
- R-16 PASS: brak sloganów o AI i marketingowych określeń.
- R-20 PASS: zachowano język i numerowany zapis dziennika Siłki, zamiast ogólnego kreatora marketingowego.
- R-21 PASS: dark mode pochodzi z briefu właściciela.
- R-29 PASS: użyto istniejących neutralnych tokenów i limonki; czerwony oznacza błąd.
- R-30 PASS: rozwinięto obecny interfejs produktu, bez klonowania innej aplikacji.
- R-31 PASS: główne decyzje i ich powody zapisano w `DESIGN.md`.

## Uzupełnienia UI i mobile

- PASS UI: paleta, pojedynczy akcent, brak dekoracyjnych ikon, emoji, odznak, kropek, szkła, glow i marketingowych szablonów; stany i realne zachowanie potwierdzono wyżej.
- PASS mobile: krótka para pól i sprzęt przechodzą w dwie kolumny od 600 px, formularz z historią konsultacji od 850 px; nie ukryto problemów przez overflow. Pomiar wszystkich głównych kontrolek przy 390 px zwrócił zero obszarów mniejszych niż 44 × 44 px (dla radio/checkbox mierzono klikany label). Kontrolki mają odstępy; dolna nawigacja ma istniejący odstęp treści i safe area. Nie ma funkcji dostępnych wyłącznie po hover.
- PASS dowody: `/tmp/silka-ankieta-mobile.png`, `/tmp/silka-ankieta-desktop.png`.

Ograniczenia: nie testowano tej zmiany w zainstalowanej PWA na fizycznym iPhonie i nie wysyłano promptu do zewnętrznego LLM. Poprawność oraz praktyczny dobór otrzymanego planu nadal wymagają oceny użytkownika. Niewysłana ankieta znika po odświeżeniu lub zmianie trybu.
