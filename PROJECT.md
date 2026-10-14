# Siłka

## Status i zakres tego etapu

Siłka to bezpłatna aplikacja PWA do planowania treningów siłowych i śledzenia postępów. Początkowo korzystają z niej dwie osoby, każda na własnym koncie.

Repozytorium: https://github.com/PawelJureczko/silka

Etapy 0–2 są zapisane na GitHub: dokumentacja, fundament, katalog ćwiczeń, edytor planu, aktywne przypisanie, archiwum oraz zatwierdzany eksport/import kopii. Etap 3 dodaje dashboard, rozpoczęcie i wznowienie sesji, wykonane serie, poprzednie wyniki, timer, lokalny szkic z kolejką oraz zakończenie i porzucenie z podsumowaniem. Etap 4 dodaje historię z filtrami, wykresy, rekordy, regularność, zatwierdzane sugestie ciężaru oraz edycję profilu. Etap 5 dodaje ręczne konsultacje AI: cztery akcje JSON v1, prompt, walidację, podgląd i zatwierdzany zapis. Etap 6 ma zaimplementowany manifest, ikony, lokalne otwieranie aplikacji i ręczne aktualizacje. Aplikacja działa przez HTTPS; weryfikacja na fizycznym iPhonie pozostaje do wykonania.

Uruchomienie i weryfikacja: `README.md`. Używamy npm, Node 22.23.1, Nuxt 4.6.1 i Vue 3.5.43, z dokładnymi wersjami zależności w lockfile. Nie dodano Pinia, biblioteki ikon ani animacji.

Projekt Supabase `silka` działa na Free w eu-west-1. RLS chroni 12 tabel. Publiczna rejestracja jest wyłączona. Dwa konta i ich profile istnieją w chmurze; testy dwóch osób używają oddzielnego lokalnego Supabase i fikcyjnych danych. Projekt Vercel `silka` działa na Hobby pod https://silka-jureczko.vercel.app. Gałąź produkcyjna to `main`; push uruchamia wdrożenie. Potwierdzono logowanie rzeczywistego użytkownika, odczyt profilu, zapis plików PWA oraz publiczne zasoby i routing HTTPS. Izolacja kont była testowana lokalnie; test dwóch rzeczywistych kont pozostaje do wydania.

Migracje `20261011000100`–`20261012000300` są zastosowane lokalnie i w chmurze, z historią migracji. Bazowy katalog zawiera 81 ćwiczeń w 9 grupach mięśniowych. Migracja `20261012000200` udostępnia wszystkie ćwiczenia zalogowanym kontom i pozwala dodawać nowe wspólne wpisy. Produkcja zawiera po niej 85 rekordów, w tym 4 dawniej prywatne; lokalna baza ma własne dane. Edycja, archiwizacja i usuwanie katalogu są administracyjne. Nie scalamy automatycznie podobnych nazw ani nie zmieniamy identyfikatorów, relacji i historii. Migracja `20261011001100` dodaje 61 pozycji bez zmiany wcześniejszych identyfikatorów. Migracja `20261012000100` dodaje osobne „Uginanie nóg leżąc na maszynie” z obciążeniem liczonym łącznie i domyślnym krokiem 2,5 kg; wariant zachowuje własną historię względem ogólnego uginania nóg na maszynie. Prywatne plany użytkowników zapisujemy oddzielnie od migracji katalogu, przez transakcyjne RPC z RLS; nie umieszczamy ich w seedzie ani repozytorium. RPC planów, zapisu treningów, postępów, profilu i konsultacji działają jako `SECURITY INVOKER`, wymagają uwierzytelnienia i zachowują RLS. Usuwanie treningu jest ograniczonym wyjątkiem opisanym w etapie 3. Fikcyjne plany, ćwiczenia i treningi do testów nie były zapisywane w chmurze.

Katalog obejmuje warianty na sztandze, z hantlami, na maszynach, wyciągach oraz z masą ciała i asystą. Ciężar to wartość łączna, na rękę lub asysta zgodnie z etykietą ćwiczenia. Dla rozpiętek na bramie zapisujemy ciężar jednego stosu na rękę; dla podciągania i pompek na poręczach z dodatkowym ciężarem tylko dodane obciążenie, bez masy ciała. Kroki ciężaru są domyślnymi wartościami do sugestii, nie opisem każdej maszyny. Ćwiczenia mierzone czasem lub dystansem wymagają osobnego rozszerzenia modelu serii i nie należą do tego katalogu.

Stan sprawdzony 11 października 2026: lokalny katalog był pusty i nie był checkoutem Git. GitHub zwracał publiczne repozytorium bez gałęzi domyślnej, o rozmiarze 0 KB. Przy przygotowaniu dokumentacji nie inicjalizowano aplikacji ani usług.

## Cel produktu

Użytkownik może przygotować plan, rozpocząć trening, zapisać wykonane serie i ocenić postęp przed kolejną sesją. Najważniejszy przepływ powinien być wygodny na iPhonie podczas treningu, przy obsłudze jedną ręką.

Priorytety:

1. Szybkie zapisywanie serii i ochrona przed utratą aktywnego treningu.
2. Prywatność i izolacja danych dwóch kont.
3. Czytelny interfejs mobilny i mała liczba interakcji.
4. Koszt usług wynoszący 0 zł w ramach darmowych limitów.
5. Prosta architektura, którą można rozwijać wspólnie z Codexem.

## Zakres MVP

- Dwa osobne konta i logowanie przez Supabase Auth.
- Tworzenie, edytowanie i archiwizowanie własnych planów.
- Wspólny katalog ćwiczeń z możliwością dodawania pozycji przez zalogowanych użytkowników.
- Jednostki treningowe z kolejnością ćwiczeń, seriami, zakresem powtórzeń, ciężarem i odpoczynkiem.
- Przypisanie własnego planu jako aktywnego.
- Przekazanie planu drugiej osobie przez eksport/import niezależnej kopii.
- Rozpoczęcie, wznowienie, zakończenie i porzucenie treningu.
- Trwałe usunięcie własnej sesji po potwierdzeniu, także pustej i aktywnej.
- Zapisywanie ciężarów i powtórzeń, dodawanie serii i oznaczanie ich jako wykonane lub pominięte.
- Porównanie z poprzednią zakończoną sesją tego samego ćwiczenia.
- Minutnik odpoczynku.
- Historia, wykresy, rekordy i statystyki regularności.
- Wyjaśnialne sugestie ciężarów na podstawie poprzednich wyników.
- Ręczne konsultacje z AI przez prompt i wersjonowany JSON.
- Instalacja PWA na iOS i kontynuowanie wcześniej załadowanego treningu podczas chwilowej utraty sieci.

Poza MVP pozostają wspólna edycja planów, dostęp do cudzych postępów, publiczne profile, płatności, powiadomienia push i automatyczne wywołania LLM. Pełna synchronizacja offline przy równoczesnej pracy na wielu urządzeniach również wymaga osobnego etapu.

## Założenia początkowe

- Interfejs i treści użytkowe są po polsku; nazwy w kodzie są po angielsku.
- Podstawową jednostką obciążenia jest kilogram. Obsługujemy wartości ułamkowe.
- Dwa konta są zakładane ręcznie; publiczna rejestracja jest wyłączona w konfiguracji Auth.
- Logowanie e-mail/hasło nie wymaga płatnego dostawcy SMS. Obsługę odzyskiwania hasła trzeba sprawdzić z rzeczywistą konfiguracją poczty przed wydaniem.
- Każdy plan należy do konta, któremu jest przypisany. Przekazanie planu tworzy kopię z nowymi identyfikatorami i właścicielem wynikającym z zalogowanej sesji.
- Import kopii nie daje dostępu do historii ani konta drugiej osoby. Katalog ćwiczeń jest wspólny dla zalogowanych użytkowników.
- Baza jest źródłem zapisanych danych; lokalny zapis chroni aktywną pracę i oczekujące zmiany.

## Stack i architektura

| Obszar | Rozwiązanie |
| --- | --- |
| Aplikacja | Nuxt 4, Vue 3 Composition API, TypeScript strict |
| Style | Tailwind CSS i własne tokeny projektu |
| Dane i konta | Supabase PostgreSQL, Supabase Auth, RLS |
| Walidacja danych wejściowych | Zod, z typami wyprowadzanymi ze schematów |
| Hosting | Statyczne wdrożenie na Vercel Hobby |
| PWA | Manifest i natywny service worker generowany z listy plików statycznego builda Nuxt; bez dodatkowej zależności |
| Stan współdzielony | Composables; Pinia, jeśli potrzebuje jej aktywny trening |
| Zapis lokalny | IndexedDB dla szkicu sesji i oczekujących operacji |
| Sprawdzenia | Typecheck, lint, testy reguł domenowych, RLS i kluczowych przepływów |

Proponowane renderowanie: aplikacja kliencka z `ssr: false` i statycznym buildem. Routing bezpośrednich wejść musi działać również na hostingu. Prywatne ekrany nie wymagają SEO ani osobnego serwera Nuxt na start.

Podział odpowiedzialności:

- `pages` i `components`: widoki, formularze, dostępność i prezentacja stanu.
- `composables`: sterowanie przepływami i reaktywnym stanem interfejsu.
- `domain`: czyste reguły progresji, rekordów, podsumowań i porównań.
- `services`: zapytania Supabase, IndexedDB, schowek i przygotowanie eksportu.
- `shared/schemas`: walidacja kontraktów i danych wejściowych.
- PostgreSQL: integralność, autoryzacja przez RLS i transakcje.

UI nie wykonuje własnych zapytań Supabase. Nie tworzymy ogólnego frameworka repozytoriów ani osobnego backendu bez konkretnej potrzeby. Import całego planu oraz rozpoczęcie sesji z kopiowaniem jej struktury powinny być atomowymi operacjami PostgreSQL przez RPC. Funkcje domyślnie działają jako wywołujący i respektują RLS.

## Design system

Dark mode jest podstawowym motywem.

Kierunek layoutu rozwija [DESIGN.md](DESIGN.md): osobisty dziennik siłowy, wyraźna typografia wyników, numerowana kolejność i spisy zamiast powtarzalnych kart. Dolna nawigacja pozostaje na telefonie i tablecie, a od 1000 px mieści się w nagłówku. Od 700 px start i postępy korzystają z dwóch kolumn. Tokeny kolorów pozostają bez zmian.

| Token | Wartość | Zastosowanie |
| --- | --- | --- |
| Background | `#09090B` | Tło aplikacji |
| Surface | `#18181B` | Karty i panele |
| Interactive | `#27272A` | Pola i elementy interaktywne |
| Accent | `#BEF264` | Główne akcje, aktywny stan, ważny wynik |
| Primary text | `#FAFAFA` | Treść podstawowa |
| Secondary text | `#A1A1AA` | Opisy i treść pomocnicza |

Zasady interfejsu:

- Mobile-first, stała dolna nawigacja: Start, Plany, Postępy, Profil.
- Duże obszary dotykowe, docelowo co najmniej 44 × 44 CSS px dla głównych kontrolek.
- Główne akcje dostępne w dolnej części ekranu, z uwzględnieniem safe area i klawiatury.
- Czytelna typografia i wyrównanie liczb w tabelach serii.
- Pola ciężaru i powtórzeń z odpowiednią klawiaturą oraz poprawną obsługą przecinka dziesiętnego.
- Stan wykonania opisany również ikoną lub tekstem, nie samym kolorem.
- Krótkie mikroanimacje z obsługą `prefers-reduced-motion`.
- Widoczny focus, etykiety pól i komunikaty błędów przy odpowiednich kontrolkach.
- Wykresy z jednostkami, czytelnymi osiami i tekstowym podsumowaniem.
- Jawne stany ładowania, pustych danych, błędu i oczekiwania na synchronizację.

Nie dodajemy ciężkich bibliotek animacji ani wykresów bez uzasadnienia. Rozbudowane elementy historii i wykresów można ładować na żądanie.

## Główne ekrany

### Start

Najbliższa jednostka wynikająca z aktywnego planu i jego kolejności lub przypisanych dni. Przycisk rozpoczęcia treningu, ostatnia aktywność i podsumowanie tygodnia. Jeśli trwa sesja, główną akcją jest jej wznowienie.

### Plany

Lista własnych planów, edycja jednostek, ćwiczeń i serii, przypisanie aktywnego planu oraz archiwizacja. Dostęp do eksportu, importu kopii i konsultacji AI.

### Aktywny trening

Widok skupiony na zapisywaniu wykonania: ćwiczenia, serie, ciężary, powtórzenia, poprzedni wynik, sugestia i timer. Można dodać lub pominąć serię. Zakończenie pokazuje podsumowanie i stan zapisu; porzucenie wymaga świadomej decyzji.

Aktywna sesja domyślnie otwiera pełnoekranowy tryb jednego ćwiczenia i jednej oczekującej serii. CTA „Seria zakończona” zabezpiecza wykonanie istniejącym lokalnym dziennikiem; następnie pojawia się odpoczynek, jeśli pozostała kolejna seria. Timer ma +30 s, pominięcie i po upływie czasu „Rozpocznij kolejną serię”. Można wybrać inne niewykonane ćwiczenie albo przejść do wszystkich serii, dodawania, korekty, sugestii i zakończenia. Ostatnia rozstrzygnięta seria pokazuje przejście do podsumowania, bez automatycznego zakończenia. Historia pozostaje w dotychczasowym widoku. Nie używamy przeglądarkowego Fullscreen API, więc interfejs działa także w zainstalowanej PWA i Safari.

### Postępy

Historia sesji, szczegóły treningu, progresja konkretnego ćwiczenia, rekordy i regularność. Porównania obejmują zgodny sposób liczenia obciążenia i sprzęt. Ewentualne szacunki, np. szacowane 1RM, muszą być wyraźnie oznaczone.

### Profil

Nazwa użytkownika, cele, strefa czasowa, ustawienia aplikacji, eksport własnych danych i wylogowanie.

## Proponowana struktura katalogów

Struktura docelowa, tworzona stopniowo wraz z implementacją:

```text
silka/
├── app/
│   ├── app.vue
│   ├── assets/css/main.css
│   ├── components/
│   │   ├── ui/
│   │   ├── navigation/
│   │   ├── plans/
│   │   ├── workout/
│   │   └── progress/
│   ├── composables/
│   ├── domain/
│   ├── services/
│   ├── layouts/
│   ├── middleware/
│   ├── plugins/
│   └── pages/
│       ├── index.vue
│       ├── login.vue
│       ├── plans/
│       ├── workouts/
│       ├── progress.vue
│       └── profile.vue
├── shared/
│   ├── schemas/
│   └── types/
├── public/
├── supabase/
│   ├── migrations/
│   ├── tests/
│   └── seed.sql
├── tests/
│   ├── unit/
│   └── e2e/
├── PROJECT.md
├── AGENTS.md
└── nuxt.config.ts
```

`shared/types` zawiera także typy wygenerowane z bazy. `stores` dodajemy dopiero wraz z uzasadnionym użyciem Pinia. Nie tworzymy pustych katalogów dla pozornej kompletności.

## Model danych

Plan jest szablonem. Sesja jest niezależnym zapisem wykonania z kopią wartości planowanych. Zmiana planu nie może zmienić istniejącej sesji ani historii.

Każda prywatna tabela ma `user_id`. Identyfikatory są UUID. W tabelach edytowalnych przewidujemy `created_at`, `updated_at` i tam, gdzie potrzebne, `revision`.

| Tabela | Główne pola poza identyfikatorami i znacznikami czasu |
| --- | --- |
| `profiles` | `user_id` jako PK i FK do `auth.users`, `display_name`, `training_goal`, `timezone`, `preferences` |
| `exercises` | `owner_id` zawsze `null` (pole zachowane dla zgodności), `name`, `equipment`, `muscle_group`, `load_mode`, `weight_convention`, `weight_increment_kg`, `archived_at` |
| `training_plans` | `user_id`, `name`, `description`, `revision`, `archived_at` |
| `plan_assignments` | `user_id`, `plan_id`, `is_active`, `starts_on` |
| `plan_workouts` | `user_id`, `plan_id`, `name`, `position`, opcjonalny `weekday` |
| `plan_exercises` | `user_id`, `plan_workout_id`, `exercise_id`, `position`, `rest_seconds`, `notes` |
| `plan_sets` | `user_id`, `plan_exercise_id`, `position`, `set_type`, `reps_min`, `reps_max`, `target_weight_kg` nullable |
| `workout_sessions` | `user_id`, `plan_id` nullable, `plan_revision_snapshot`, `plan_name_snapshot`, `workout_name_snapshot`, `source_workout_id` nullable bez FK, `started_at`, `finished_at` nullable, `rest_ends_at` nullable, `status`, `revision`, `last_operation_id`, `last_operation_hash` |
| `workout_exercises` | `user_id`, `session_id`, `exercise_id`, `exercise_name_snapshot`, `equipment_snapshot`, `load_mode_snapshot`, `weight_convention_snapshot`, `position`, `rest_seconds`, `notes` |
| `workout_sets` | `user_id`, `workout_exercise_id`, `position`, `set_type`, planowane zakresy i ciężar, `reps` nullable, `weight_kg` nullable, `status`, `completed_at` nullable |
| `deleted_workout_sessions` | `session_id` i `user_id` jako złożony PK; tylko znacznik zapobiegający odtworzeniu usuniętej sesji, bez wyników i nazw |

Relacje:

```text
auth.users → profiles
training_plans → plan_assignments
training_plans → plan_workouts → plan_exercises → plan_sets
exercises → plan_exercises
training_plans → workout_sessions
workout_sessions → workout_exercises → workout_sets
exercises → workout_exercises
```

### Integralność i historia

- Tabele podrzędne wskazują prywatnego rodzica przez złożony FK `(parent_id, user_id)` do unikalnej pary `(id, user_id)`. Nie można przypiąć własnego wiersza do cudzego planu lub treningu.
- W MVP przypisanie wymaga właściciela zgodnego z właścicielem planu. Unikalny indeks częściowy dopuszcza jeden aktywny plan na konto.
- Unikalny indeks częściowy dopuszcza jedną sesję ze statusem `active` na konto.
- Status sesji: `active`, `completed`, `abandoned`. Status serii: `pending`, `completed`, `skipped`.
- Planowane wartości są kopiowane do sesji przy jej rozpoczęciu. Dodana podczas sesji seria może nie mieć wartości planowanych.
- Sesja nie wymaga trwałego FK do edytowalnej jednostki, ćwiczenia planu ani serii planu. Zmiana tych elementów nie blokuje edycji i nie usuwa historii.
- Plany i wykorzystane ćwiczenia archiwizujemy. Nazwy, sprzęt i sposób liczenia obciążenia w historii pochodzą ze snapshotów.
- Ciężary używają `numeric`, nie typu zmiennoprzecinkowego. Zero jest dozwolone; brak wartości nie jest utożsamiany z zerem.
- Liczba powtórzeń, zakresy, kolejność i odpoczynek mają ograniczenia w bazie. Wykonana seria wymaga poprawnych danych dla jej sposobu liczenia obciążenia.
- `load_mode` rozróżnia m.in. obciążenie zewnętrzne, masę ciała i asystę. Większa asysta nie oznacza większej siły. Sposób zapisu ciężaru, np. na jedną hantlę albo łączny, jest określony dla ćwiczenia.
- `weight_convention` przyjmuje `total`, `per_hand`, `bodyweight` lub `assistance`, zgodnie z `load_mode`; sesja zachowuje tę wartość jako snapshot. Rewizje rosną przy zmianie wiersza planu lub sesji. Operacje edycji grafu w kolejnych etapach muszą zmienić korzeń raz, atomowo z elementami podrzędnymi.
- Czas zapisujemy jako `timestamptz`; dni i tygodnie prezentujemy według strefy użytkownika.
- Rekordy, objętość i statystyki wyliczamy z wykonanych serii zakończonych sesji. Nie tworzymy osobnej tabeli rekordów w MVP.

### RLS i dostęp

- RLS jest włączone na wszystkich tabelach dostępnych przez API.
- Prywatne dane są dostępne wyłącznie dla `authenticated` z `auth.uid() = user_id`.
- Polityki obejmują `SELECT`, `INSERT`, `UPDATE`, `DELETE`; `WITH CHECK` zabezpiecza również wynik zapisu i podmianę właściciela.
- Wszystkie ćwiczenia mają `owner_id IS NULL`, wymuszone ograniczeniem bazy. Zalogowane konta mogą odczytać katalog i dodawać wspólne wpisy. Nie mają uprawnień UPDATE/DELETE katalogu; poprawki i archiwizacja pozostają administracyjne. Anonimowe konto nie odczytuje ani nie zapisuje katalogu.
- Użycie `exercise_id` wymaga istniejącego dostępnego ćwiczenia; zapis planu odrzuca również wpisy archiwalne. Historyczne warunki RPC dopuszczające właściciela zachowują zgodność, lecz nie umożliwiają prywatnych wpisów przez ograniczenie `owner_id IS NULL`.
- RPC nie przyjmuje tożsamości z importowanego JSON. Użytkownik wynika z sesji Auth; relacje i uprawnienia są sprawdzane w transakcji.
- Widoki statystyczne dostępne przez API muszą respektować RLS, np. przez `security_invoker = true`.
- Publiczny klucz klienta Supabase nie zastępuje RLS. `service_role` i inne klucze administracyjne nie mogą trafić do aplikacji ani repozytorium.
- Testy dwóch kont sprawdzają odczyt, zapisy, podmienione identyfikatory rodziców, podmianę `user_id`, RPC i widoki. Brak sesji nie daje dostępu do prywatnych danych.

## Aktywny trening i PWA

Nowa pobrana wersja pokazuje na ekranie Start popup „Dostępna aktualizacja”, z CTA „Aktualizuj” oraz „Na później”. Aplikacja sprawdza worker po uruchomieniu i przy powrocie z tła (z ograniczeniem do sprawdzenia raz na minutę). Nie przeładowuje się automatycznie; istniejąca blokada wszystkich lokalnych dzienników pozostaje obowiązkowa. Popup nie przerywa edytora ani aktywnego ekranu ćwiczenia. Profil zachowuje ręczne sprawdzanie. Powiadomień push nie dodano w tym etapie; sygnał po upływie odpoczynku jest informacją w otwartej aplikacji.

Każda zmiana serii najpierw zabezpiecza lokalny szkic, następnie trafia do Supabase. UI rozróżnia zapis lokalny, oczekiwanie, zapis na koncie oraz błąd. Nie pokazujemy potwierdzenia synchronizacji przed sukcesem zapisu zdalnego.

Zasady odporności:

- UUID dla sesji, ćwiczeń wykonania i serii są stabilne między ponowieniami.
- Ponowienie tej samej operacji nie tworzy dodatkowych serii ani sesji.
- Kolejka zapisów jest uporządkowana w ramach sesji. Zakończenie treningu uwzględnia wcześniejsze oczekujące zmiany.
- Rewizja sesji umożliwia wykrycie konfliktu ze zmianą na innym urządzeniu. Konflikt wymaga jawnego rozstrzygnięcia; nie nadpisujemy go po cichu.
- IndexedDB i oczekujące operacje są rozdzielone po `user_id`. Wylogowanie oraz zmiana konta nie mogą wysłać danych poprzedniej osoby w nowej sesji.
- Wylogowanie przy niezapisanych zmianach wymaga poinformowania użytkownika i decyzji o ich zachowaniu lub odrzuceniu. Po wylogowaniu prywatny szkic nie jest wyświetlany innemu kontu.
- Offline w MVP dotyczy wcześniej załadowanego treningu. Pierwsze logowanie i pobranie nieznanych danych wymagają sieci.
- Timer zapisuje docelowy czas końca, a pozostały czas wylicza z zegara. Po odświeżeniu i powrocie z tła odtwarza właściwy stan.
- Dźwięki i sygnały przy zablokowanym ekranie wymagają sprawdzenia na rzeczywistym iPhonie; nie są warunkiem działania timera w MVP.
- Service worker cache'uje zasoby aplikacji, nie odpowiedzi Auth ani prywatne dane API. Dane treningu trafiają do kontrolowanego magazynu lokalnego.
- Aktualizacja PWA nie przeładowuje strony automatycznie podczas aktywnego treningu. Najpierw zabezpieczamy dane i pokazujemy możliwość aktualizacji.

### Zaimplementowana część etapu 6

- `npm run build` po generowaniu Nuxt uruchamia `scripts/build-pwa.mjs`. Worker otrzymuje ID builda i listę wyłącznie statycznych plików: publiczny HTML aplikacji, chunki Nuxta, manifest i ikony. Precache obejmuje również leniwie ładowane widoki, żeby trening otwierał się po pełnym odświeżeniu bez serwera. Nie przechwytuje zewnętrznych żądań, API/Auth ani metod innych niż GET; nie zapisuje odpowiedzi pobieranych w czasie pracy.
- Manifest używa `display: standalone`, ikon PNG 192/512 oraz ikony Apple 180. Ikony wykorzystują dotychczasowy symbol hantla. Profil podaje instalację przez Safari i pokazuje natywny przycisk tylko tam, gdzie przeglądarka udostępni zdarzenie instalacyjne.
- Supabase inicjalizuje się w tle. Minimalne, zwalidowane ID/e-mail z istniejącego magazynu SDK umożliwiają natychmiastowe otwarcie własnego lokalnego dziennika. Nie kopiujemy tokenów, nie zastępujemy Auth ani RLS. Wylogowanie i terminalne odrzucenie sesji przez SDK usuwają bieżącą tożsamość z UI.
- Nowy worker czeka. Przycisk w profilu aktywuje go wyłącznie po odczytaniu wszystkich lokalnych dzienników. Aktywna sesja, rozpoczęcie, kolejka, konflikt, uszkodzony dziennik albo błąd odczytu blokują aktualizację. Wspólna blokada Web Locks chroni odczyt i aktywację przed równoległym zapisem treningu z innej karty. Edycja profilu blokuje przyciski aktualizacji w tym widoku.
- Przeładowuje się tylko karta, w której użytkownik uruchomił aktualizację. Inne karty zachowują formularze i dostęp do poprzednich chunków. Stary cache jest usuwany dopiero, gdy jedyna otwarta karta potwierdzi zgodność swojego ID builda z workerem. Automatyczne przeładowania Nuxta przy zmianie manifestu/chunków są wyłączone.
- Worker nie zastępuje backupu. Wyczyszczenie danych witryny lub usunięcie ich przez system może usunąć niewysłany trening. Pierwsze logowanie, pobranie sesji, plany, historia i konsultacje AI wymagają sieci. Nie dodano Background Sync, push ani alarmów timera przy zablokowanym ekranie.
- Lokalny test produkcyjnego builda: odcięcie serwera statycznego oraz API, odświeżenie, zapis `10 × 83,75 kg`, odtworzenie timera, zakończenie, odzyskanie po zmianie konta i synchronizacja bez duplikatów. Dwa buildy potwierdziły blokady aktualizacji i zachowanie niezapisanego formularza w drugiej karcie. Nie jest to test trybu samolotowego ani zainstalowanej PWA na iOS. Dowody i pozostałe kroki są w `PWA_REVIEW.md` oraz `README.md`.

### Zaimplementowane zachowanie etapu 3

- Szczegóły sesji zawierają „Usuń ten trening” i osobne potwierdzenie z nazwą, datą i liczbą wykonanych serii. Usunięcie wymaga sieci; obejmuje sesję, jej ćwiczenia, serie oraz lokalną kolejkę tej sesji. Nie zmienia planu ani innego aktywnego treningu. Statystyki, rekordy i kolejne sugestie są liczone z pozostałej historii. Wcześniej zapisane konteksty konsultacji AI pozostają niezależnymi snapshotami.
- Migracja `20261012000300_delete_workouts.sql` jest zastosowana lokalnie i w chmurze z zapisem wersji. Przy wdrożeniu sprawdzono niezmienność istniejących planów i historii oraz uprawnienia; migracja nie usunęła żadnej sesji. `delete_workout` jest ograniczonym wyjątkiem `SECURITY DEFINER` z pustym `search_path`, sprawdzeniem `auth.uid()`, własności i rewizji oraz wspólną blokadą operacji treningów. Bezpośredni DELETE klienta jest zabroniony. Transakcja zapisuje prywatny znacznik usunięcia i usuwa graf przez FK cascade. Ponowienie nie powiela operacji, konflikt rewizji niczego nie usuwa. Klient nie może usuwać znaczników, a trigger blokuje odtworzenie UUID przez spóźniony start, insert lub zmianę ID. Synchronizacja rozpoznaje usuniętą sesję i usuwa wyłącznie jej lokalny dziennik.
- Start zapisuje lokalnie zamiar ze stabilnym UUID, następnie RPC atomowo kopiuje jednostkę z konkretnej rewizji planu. Nie podstawia planowanego ciężaru jako wykonanego. Pierwsze pobranie sesji wymaga sieci. Ponowienie po utracie odpowiedzi zwraca istniejącą sesję.
- Dashboard wybiera jednostkę przypisaną do dzisiejszego dnia albo kolejną po ostatniej zakończonej sesji aktywnego planu (wśród 30 ostatnich sesji). Użytkownik może zmienić wybór. Zmiana planu odtwarza ID jednostek i może zresetować wybór do pierwszej. Dashboard pokazuje trzy ostatnie sesje i dokładną liczbę zakończonych sesji rozpoczętych w bieżącym tygodniu według strefy profilu.
- IndexedDB `silka-workouts` przechowuje jeden bieżący lub ostatni dziennik na konto. Zapis używa transakcji z `durability: strict`; UI potwierdza lokalny sukces dopiero po jej zakończeniu. Web Locks szereguje modyfikacje i synchronizację między kartami, a BroadcastChannel odświeża ich stan. Wymagane są obsługujące je przeglądarki i HTTPS lub localhost.
- Kolejka przechowuje pełne snapshoty wykonania. Scala jedynie ostatni snapshot, którego jeszcze nie próbowano wysłać. ID operacji, bazowa rewizja i treść rozpoczętej próby pozostają stałe do potwierdzenia; późniejsze zmiany czekają za nią. Zakończenie nie wyprzedza wcześniejszych zapisów.
- RPC zapisu sprawdza właściciela, rewizję, wszystkie istniejące ćwiczenia i serie, liczby oraz statusy. Można dopisać do 40 serii na ćwiczenie; nie można zmienić snapshotu planu ani usunąć istniejącej serii. Zakończona sesja jest tylko do odczytu w aplikacji; RPC nie pozwala jej ponownie edytować.
- Zakończenie wymaga przynajmniej jednej wykonanej serii. Pozostałe otrzymują status `skipped`. Porzucenie zachowuje wyniki, ale wyklucza sesję ze statystyk i poprzednich wyników. Podsumowanie pokazuje wykonane i pominięte serie oraz czas; nie sumuje nieporównywalnych kilogramów.
- Poprzednie wyniki pochodzą z najnowszej wcześniejszej zakończonej sesji z wykonanymi seriami danego ćwiczenia, zgodnym sprzętem, trybem i konwencją ciężaru. Porównanie serii zachowuje pozycję i rodzaj; nie przenosi wyniku automatycznie do formularza.
- Po konflikcie szkic i kolejka pozostają lokalnie, a wysyłanie jest zatrzymane. Można pobrać `silka-workout-recovery.json` i jawnie zastąpić szkic wersją z konta. Plik jest kopią do ręcznego odtworzenia wyników, bez automatycznego importu. Odrzuconą przez serwer próbę startu można anulować; po niepewnym timeoutcie najpierw ponawiamy ten sam UUID.
- Wylogowanie z kolejką lub konfliktem wymaga potwierdzenia zachowania szkicu na tym urządzeniu. Powrót na to samo konto przywraca go; inne konto nie widzi go i nie wysyła jego zmian. Przy trwającym zapisie lokalnym trzeba poczekać na jego zakończenie.
- Timer ma zapisany znacznik końca, obsługuje dodanie 30 sekund i zakończenie odpoczynku. Nie ma dźwięków w tle. Odświeżanie, powrót do karty i odzyskanie szkicu sprawdzono w przeglądarce; fizyczny iPhone pozostaje do weryfikacji.
- Test utraty łączności obejmuje wyłączenie lokalnego API, edycję, odświeżenie z dostępnymi zasobami aplikacji, zakończenie i późniejszą synchronizację. Pełne uruchomienie aplikacji bez sieci wymaga service workera w etapie 6. Usunięcie danych witryny lub ich usunięcie przez system może utracić niewysłany szkic.

## Sugestie ciężaru

Pierwsza wersja korzysta z prostych, jawnych reguł, bez AI. Punktem odniesienia jest ostatnia zakończona sesja zgodnego ćwiczenia, sprzętu i sposobu liczenia obciążenia.

Reguły uwzględniają osiągnięty zakres powtórzeń oraz krok ciężaru ćwiczenia. Sugestia pokazuje uzasadnienie i pozostaje edytowalna. Nie podnosimy automatycznie wartości w planie. Brak wiarygodnej historii oznacza brak sugestii.

Dokładne reguły oraz przykłady graniczne zatwierdzamy przy realizacji etapu postępów i obejmujemy testami domenowymi.

## Ręczna współpraca z AI

Nie korzystamy z API LLM, kluczy LLM, automatyzacji interfejsu ChatGPT ani własnego modelu na urządzeniu. Użytkownik sam przenosi prompt i odpowiedź między aplikacjami.

Obsługiwane cele konsultacji:

1. Wygenerowanie nowego planu.
2. Modyfikacja istniejącego planu.
3. Analiza historii treningowej.
4. Propozycje progresji ciężaru.

### Przepływ konsultacji

1. Użytkownik wybiera cel, plan i zakres historii.
2. Aplikacja tworzy `requestId`; RPC zapisuje kontekst na koncie w prywatnej tabeli z RLS. Aplikacja generuje prompt z tego kontekstu.
3. Prompt zawiera potrzebne dane, katalog dozwolonych ćwiczeń, jednostki, kontrakt JSON oraz instrukcję zwrócenia samego JSON.
4. Użytkownik kopiuje prompt i wkleja go do wybranego LLM. Udane kopiowanie promptu lub JSON eksportu potwierdza snackbar „Skopiowano”, widoczny przez 5 sekund z możliwością zamknięcia. Przy braku dostępu do schowka aplikacja pokazuje błąd i udostępnia tekst do ręcznego skopiowania.
5. Użytkownik wkleja odpowiedź do Siłki.
6. Aplikacja parsuje JSON, waliduje schemat i sprawdza powiązania z aktualnym kontem i konsultacją.
7. Aplikacja pokazuje propozycję oraz różnice względem aktualnych danych.
8. Dopiero zatwierdzenie wykonuje dozwoloną zmianę atomowo.

Domyślnie eksport nie zawiera e-maila, identyfikatora konta, danych drugiej osoby ani prywatnych notatek. Historia ma jawny i ograniczony zakres. Użytkownik może obejrzeć cały prompt przed skopiowaniem.

### Zaimplementowane zachowanie etapu 5

- „Nowy plan” pozwala wybrać ankietę „Stwórz nowy plan” albo pusty edytor. Ankieta zbiera cel, opcjonalny wiek osoby dorosłej, doświadczenie i przerwę, aktywność, liczbę i opcjonalne dni sesji, czas z rozgrzewką, okres planu, sprzęt, podział, ograniczenia, regenerację i preferencje. Nie jest kwalifikacją medyczną ani diagnozą. Ankieta zawsze przygotowuje `create_plan` bez historii, także po przełączeniu z konsultacji z wynikami. Dotychczasowa ścieżka na podstawie historii pozostaje dostępna.
- Zod waliduje ankietę; wybrane dni muszą odpowiadać częstotliwości albo pozostać puste, sprzęt jest wymagany, a wskazane ograniczenia wymagają opisu. Odpowiedzi mieszczą się w dotychczasowym limicie 2000 znaków instrukcji. Dopiero przygotowanie promptu zapisuje je jako prywatny kontekst konsultacji na koncie; niewysłana ankieta jest tylko w pamięci widoku. UI informuje, że cały tekst, również ograniczenia, trafi do promptu do samodzielnego skopiowania.
- Prompt nowego planu uwzględnia czas rozgrzewki i przerw, dostępną liczbę dni, sprzęt, preferencje i regenerację; prosi o kolejność, prostą progresję i pozostawienie `targetWeightKg: null` przy braku wyników. Odpowiedź nadal korzysta z JSON v1 generowanego z jednego schematu. Import, podgląd i zatwierdzenie nie zmieniają kontraktu ani modelu bazy. Ankietę publikuje się z buildem aplikacji, bez migracji.
- Konsultacje otwiera się z listy planów lub z zapisanego planu w edytorze. Zakres historii to 0, 10 albo 20 ostatnich zakończonych sesji; zawiera tylko wykonane serie. Katalog obejmuje do 200 dostępnych, niearchiwalnych ćwiczeń, z pierwszeństwem ćwiczeń wybranego planu. Formularz planów pokazuje 20 ostatnio edytowanych; starszy plan można wskazać z edytora.
- `ai_consultations` przechowuje właściciela z Auth, akcję, opcjonalny plan i bazową rewizję, kontekst, stabilne ID nowego planu oraz wynik zatwierdzenia. Relacja do planu zawiera `user_id`. Zapis na koncie umożliwia powrót po odświeżeniu i w innej karcie oraz ponowną walidację kontekstu przez RPC; zastępuje planowany wcześniej magazyn lokalny konsultacji.
- Lista powrotu obejmuje 10 ostatnich konsultacji. Kontekst zawiera prywatny snapshot planu potrzebny do porównania; generowany prompt usuwa opis i notatki. JSON Schema promptu powstaje z tej samej definicji Zod co walidacja odpowiedzi. Opcjonalne własne instrukcje są przenoszone do promptu zgodnie z wyborem użytkownika.
- Wklejony tekst i niezatwierdzony podgląd istnieją tylko w pamięci strony. Opuszczenie widoku ostrzega o ich odrzuceniu. Zatwierdzona odpowiedź i wynik pozostają na koncie; zachowaną analizę można odczytać ponownie.
- Utworzenie planu nie aktywuje go. Zamiana obejmuje cały plan, w tym opis i notatki; podgląd jawnie pokazuje ich zmianę lub usunięcie. Analiza nie modyfikuje planu ani historii. Progresja pozwala przypisać każdą sugestię do jednej zgodnej serii planu lub ją pominąć; powtórzenia, odpoczynek i notatki pozostają bez zmian.
- `prepare_ai_consultation`, wariant bez planu i `apply_ai_response` działają z RLS wywołującego. Przygotowanie i zatwierdzenie są idempotentne. Zapis całego grafu i wyniku konsultacji jest jedną transakcją; rewizja, katalog, akcja, pola, liczby i limit 256 KiB są ponownie sprawdzane w bazie. Inna odpowiedź pod zatwierdzonym `requestId` jest odrzucana.
- Konsultacje wymagają połączenia. Aplikacja nie kontaktuje się z LLM; użytkownik sam wybiera zewnętrzne narzędzie i przekazuje mu dane. Nie dodano zależności ani płatnych usług.

### Kontrakt JSON v1

Jeden schemat Zod z rozłączną unią po `action`; każdy obiekt jest ścisły. Typy TypeScript wynikają ze schematu, bez niezależnego ręcznego powielania kontraktu.

| Pole | Reguła |
| --- | --- |
| `schemaVersion` | Wymagana liczba całkowita `1`. Nieznana wersja jest odrzucana. |
| `requestId` | UUID zgodny z otwartą konsultacją bieżącego konta. |
| `action` | `create_plan`, `replace_plan`, `analyze_history` albo `suggest_progression`. |
| `target` | Wymagane dla `replace_plan`: `planId` UUID i dodatni `baseRevision`. Niedozwolone dla pozostałych akcji. |
| `payload` | Struktura właściwa dla akcji, opisana poniżej. |

Struktury `payload`:

- `create_plan` i `replace_plan`: `plan` z `name`, `description` oraz tablicą `workouts`. Jednostka zawiera `name`, `weekday` nullable i `exercises`. Ćwiczenie zawiera `exerciseId`, `restSeconds`, `notes` i `sets`. Seria zawiera `setType`, `repsMin`, `repsMax`, `targetWeightKg` nullable. Kolejność wynika z tablic.
- `analyze_history`: `summary`, tablica tekstowych `observations` i tablica tekstowych `recommendations`. Wynik jest informacyjny i nie zmienia planu.
- `suggest_progression`: `suggestions`, gdzie każda pozycja zawiera `exerciseId`, `suggestedWeightKg` i `reason`. Import wyświetla propozycje; przeniesienie do konkretnej planowanej serii wymaga jej wskazania oraz zatwierdzenia z aktualną rewizją planu.

Przykład odpowiedzi dla utworzenia planu. UUID są przykładowe; w rzeczywistej odpowiedzi muszą pochodzić z promptu i dozwolonego katalogu:

```json
{
  "schemaVersion": 1,
  "requestId": "04872559-2520-4b9b-9d2f-6b7a71d8ef74",
  "action": "create_plan",
  "payload": {
    "plan": {
      "name": "Plan A",
      "description": "Przykład struktury odpowiedzi",
      "workouts": [
        {
          "name": "Trening A",
          "weekday": null,
          "exercises": [
            {
              "exerciseId": "23e82d62-62ed-4f8d-8ef7-f28d130857d9",
              "restSeconds": 120,
              "notes": "",
              "sets": [
                {
                  "setType": "working",
                  "repsMin": 8,
                  "repsMax": 12,
                  "targetWeightKg": null
                }
              ]
            }
          ]
        }
      ]
    }
  }
}
```

### Walidacja i zatwierdzanie

- `weekday`: `null` lub liczba 1–7, od poniedziałku do niedzieli. `setType`: `working` albo `warmup`.
- Wstępne granice v1: JSON do 256 KiB w UTF-8; 1–7 jednostek; 1–20 ćwiczeń na jednostkę; 1–20 serii na ćwiczenie; 1–100 powtórzeń; 0–900 sekund odpoczynku; ciężar 0–1000 kg z dokładnością do 0,01 kg albo `null` dla nieustalonego celu.
- Nazwy: 1–100 znaków po przycięciu; opisy i notatki: do 2000 znaków; analiza: do 50 obserwacji i 50 zaleceń, każde do 2000 znaków; podsumowanie do 4000 znaków; do 100 sugestii progresji, uzasadnienie do 2000 znaków. Granice są ograniczeniami danych aplikacji, nie zaleceniami treningowymi.
- `repsMin` nie przekracza `repsMax`. Liczby muszą być skończone i zgodne z jednostkami; teksty liczbowe nie są niejawnie konwertowane.
- Nowe identyfikatory elementów planu generuje aplikacja, a właściciela wyznacza Auth. JSON nie zawiera pól tożsamości użytkownika ani instrukcji wykonania kodu.
- Nieznane lub niedostępne `exerciseId` blokują import. Użytkownik może jawnie wybrać odpowiednik albo dodać ćwiczenie, po czym wymagane jest ponowne sprawdzenie.
- `action` musi odpowiadać celowi konsultacji. Dla modyfikacji `target` musi wskazywać plan i rewizję wyeksportowane w jej kontekście.
- Zmiana rewizji planu od eksportu blokuje nadpisanie i wymaga nowej konsultacji albo świadomego przygotowania nowej propozycji na aktualnych danych.
- Podgląd pokazuje dodane, usunięte i zmienione jednostki, ćwiczenia, serie, zakresy, ciężary i odpoczynek. Zamiana planu nie jest ukrytą operacją częściową.
- Walidacja klienta służy również informacji zwrotnej. RPC ponownie sprawdza dozwolone dane, własność, ograniczenia i rewizję w tej samej transakcji co zapis.
- `replace_plan` zwiększa rewizję raz. Nowy plan dostaje stabilny UUID przygotowany przez aplikację; ponowienie zatwierdzenia nie tworzy kolejnej kopii i nie nadpisuje istniejącego rekordu przez bezwarunkowy upsert.
- Treść LLM wyświetlamy jako tekst. Nie wykonujemy kodu ani HTML pochodzącego z odpowiedzi.
- Nowe, niezgodne kontrakty otrzymują nowy `schemaVersion`; nie zmieniamy po cichu znaczenia istniejącej wersji.

Zwykły eksport/import kopii planu jest osobnym przepływem od konsultacji AI. Przenosi dane planu, nie tożsamość ani historię właściciela; tworzy nowy własny plan po podglądzie i zatwierdzeniu. Mapowanie ćwiczeń spoza wspólnego katalogu wymaga jawnej decyzji odbiorcy.

### Zaimplementowany eksport kopii planu v1

Osobny kontrakt `format: "silka-plan"`, `schemaVersion: 1` zawiera `plan` zgodny z powyższą strukturą oraz `exercises`: opisy wyłącznie użytych ćwiczeń (`id`, `name`, `equipment`, `muscleGroup`, `loadMode`, `weightConvention`, `weightIncrementKg`). Nie zawiera identyfikatora konta, e-maila ani historii. Notatki do ćwiczeń i opis planu są częścią kopii, co UI pokazuje przed eksportem. Limit całego pliku wynosi 256 KiB UTF-8. Nieznane pola, wersje, brakujące, nieużyte lub powtórzone opisy ćwiczeń są odrzucane.

Importer dopasowuje dostępne ćwiczenia po ID i zgodnej konwencji obciążenia. Pozostałe wymagają jawnego wyboru lub utworzenia nowego wspólnego ćwiczenia. Zatwierdzenie zapisuje nowy plan „… — kopia”; nie ustawia go automatycznie jako aktywnego. Anulowanie podglądu nie zapisuje planu. Osobno zatwierdzone dodanie ćwiczenia pozostaje we wspólnym katalogu.

Zapis całego planu, aktywacja i archiwizacja są transakcyjnymi RPC działającymi z RLS wywołującego. Zapis używa bazowej rewizji i stabilnego ID operacji; ponowienie ostatniego zapisu z identycznymi danymi zwraca istniejący wynik. Zmiana danych pod tym samym ID operacji jest odrzucana. Nieaktualna rewizja blokuje nadpisanie. Po nowszej operacji wymagany jest ponowny odczyt. Archiwizacja usuwa aktywne przypisanie, a przywrócenie go nie odtwarza. Edytor planów wymaga sieci; lokalne zabezpieczenie aktywnego treningu działa od etapu 3.

## Zaimplementowane postępy i sugestie — etap 4

- Historia pokazuje zakończone i porzucone sesje po 20 na stronę, z filtrem statusu i zakresami ostatnich 30/90 dni lub całej historii. Aktywna sesja pozostaje na dashboardzie. Szczegóły i rekord prowadzą do snapshotu konkretnego treningu.
- Statystyki liczą zakończone sesje według daty rozpoczęcia. Regularność obejmuje 12 tygodni od poniedziałku w strefie profilu: aktywne tygodnie, tygodnie z osiągniętym celem i serię aktywności ograniczoną do tego okna. Pusty bieżący tydzień nie przerywa serii przed jego końcem. Cel domyślny to 3 treningi; zmiana celu przelicza również prezentowane wcześniejsze tygodnie.
- Porównania wymagają zgodnego ID ćwiczenia, sprzętu, trybu i konwencji obciążenia ze snapshotu. Lista wyboru obejmuje do 200 ostatnio używanych wariantów. Rekord obejmuje całą zgodną historię; lekki, ładowany na żądanie wykres SVG pokazuje do 30 ostatnich sesji z wykonanymi seriami roboczymi.
- Rozgrzewki, pominięte serie i sesje porzucone nie tworzą rekordów ani punktów wykresu. Dla obciążenia zewnętrznego rekord to największy ciężar (przy remisie więcej powtórzeń), dla asysty najmniejsza asysta, dla masy ciała najwięcej powtórzeń z informacją o zapisanym dodatkowym ciężarze. Nie wyliczamy 1RM.
- Wykres pokazuje ciężar lub powtórzenia, a dla obciążenia zewnętrznego także sumę zapisanego kg × powtórzenia. Dla hantli na rękę nie podwajamy zapisu. Nie sumujemy objętości między różnymi ćwiczeniami, konwencjami, masą ciała i asystą. Powtórzenia mogą pochodzić z serii o różnym ciężarze, co opisuje UI.
- Zatwierdzona reguła sugestii używa ostatniej wcześniejszej zakończonej sesji zgodnego wariantu i kroku ciężaru dostępnego ćwiczenia z katalogu. Wymaga tej samej liczby, kolejności i zakresów planowanych serii roboczych oraz kompletu wykonania przy jednym ciężarze. Gdy wszystkie osiągnęły górny zakres, proponuje jeden krok więcej (dla asysty mniej); w przeciwnym razie utrzymuje ciężar. Brak danych, niezgodność albo powtórzenie wariantu w ostatniej sesji blokują sugestię. Dodatkowe serie bez zakresów i rozgrzewki nie sterują progresją. Masa ciała nie otrzymuje automatycznej sugestii kilogramów. Granice zapisu 0–1000 kg pozostają zachowane.
- Sugestia jest pobierana na żądanie. Podgląd wskazuje niewykonane planowane serie robocze bieżącej sesji, pozwala zmienić ciężar i wymaga zatwierdzenia. Anulowanie nie zapisuje zmian. Przed zastosowaniem ponownie sprawdzamy stan sesji i wartości wskazanych serii; zmieniony podgląd jest odrzucany bez częściowego zapisu. Zatwierdzenie trafia przez istniejący lokalny dziennik i kolejkę. Nie zmienia planu, powtórzeń ani statusów serii.
- Profil edytuje nazwę, cel treningowy, strefę czasową i liczbę treningów w tygodniu (1–7). RPC zapisuje tylko profil `auth.uid()` i atomowo zachowuje pozostałe klucze `preferences`; cel jest w `preferences.weeklyTarget`. Eksport całej historii i ustawienia PWA pozostają do etapu wydania.
- Agregacje i zapis profilu są funkcjami `SECURITY INVOKER` z RLS. Dane wejściowe i odpowiedzi przechodzą Zod. Pobieranie historii jest stronicowane, odczyty mają limit czasu i stany błędu z ponowieniem. Nie dodano zależności ani płatnych usług.

## Etapy MVP i kryteria ukończenia

| Etap | Zakres | Kryterium ukończenia |
| --- | --- | --- |
| 0. Dokumentacja | `PROJECT.md`, `AGENTS.md`, model danych i kontrakt AI | Dokumentacja zapisuje uzgodniony kierunek; brak implementacji aplikacji w tym etapie. |
| 1. Fundament | Nuxt, TypeScript, Tailwind, tokeny, nawigacja, Auth, migracje, RLS | Logowanie dwóch kont działa; próby dostępu do cudzych danych są blokowane w bazie. |
| 2. Plany | Katalog ćwiczeń, edytor jednostek i serii, aktywne przypisanie | Użytkownik tworzy, edytuje i aktywuje własny plan; kopię może przekazać przez jawny eksport/import. |
| 3. Trening | Dashboard, start sesji, poprzednie wyniki, serie, timer, lokalny zapis, podsumowanie | Cały trening można przeprowadzić, odzyskać po odświeżeniu i zapisać bez duplikatów. |
| 4. Postępy | Historia, wykresy, rekordy, regularność, sugestie ciężaru, profil | Wyniki są zgodne z wykonanymi seriami; sugestie są wyjaśnione i edytowalne. |
| 5. AI | Prompty, cztery akcje JSON, walidacja, podgląd i zatwierdzony import | Błędne i nieaktualne odpowiedzi nie zmieniają danych; poprawny import jest atomowy. |
| 6. PWA i wydanie | Manifest, service worker, instalacja iOS, synchronizacja, aktualizacje | Aktywny trening znosi chwilową utratę sieci i powrót z tła; aktualizacja nie przerywa pracy. |

Lokalny zapis aktywnej sesji zaczyna się w etapie 3. W etapie 6 uzupełniamy odporność sieciową i sprawdzamy ją w zainstalowanej PWA. Nie odkładamy ochrony danych treningu wyłącznie na końcowy etap.

## Sprawdzenia przed wydaniem

- Typecheck i lint oraz build z rzeczywistymi skryptami repozytorium.
- Testy domenowe: rekordy, podsumowania, dobór poprzedniej sesji, jednostki i sugestie progresji.
- Testy kontraktu AI: poprawne warianty, nieznana wersja, nadmiarowe pola, błędne liczby i limity.
- Testy RLS, integralności i RPC dla dwóch kont oraz braku sesji.
- Główna ścieżka E2E: logowanie → plan → aktywny trening → zakończenie → historia.
- Import: błędny JSON, niedostępne ćwiczenie, obcy plan, nieaktualna rewizja, anulowanie podglądu, ponowienie zatwierdzenia i rollback nieudanego zapisu.
- Odzyskanie szkicu, ponawianie zapisów, brak sieci, konflikt rewizji, wylogowanie i zmiana konta.
- Rzeczywisty iPhone: instalacja, klawiatura, safe area, powrót z tła, timer i aktualizacja PWA podczas sesji.

## Koszty, kopie danych i ograniczenia usług

Celem jest 0 zł, bez własnej płatnej domeny, płatnego API, SMS i niepotrzebnych usług dodatkowych. Używamy darmowej domeny hostingu. Nie podnosimy planów usług automatycznie.

Według dokumentacji sprawdzonej 11 października 2026:

- Supabase Free obejmuje m.in. 500 MB bazy, 50 000 MAU i 5 GB egress. Projekt może zostać zapauzowany po tygodniu bezczynności; limit wynosi dwa aktywne projekty. Automatyczne backupy bazy nie są częścią Free.
- Vercel Hobby jest przeznaczony do osobistego użytku niekomercyjnego. Przekroczenie limitów może ograniczyć dostępność funkcji, więc darmowy plan nie oznacza nieograniczonych zasobów.

Przed wdrożeniem ponownie sprawdzamy aktualne limity. Do developmentu preferujemy lokalny Supabase; projekt hostowany służy rzeczywistym kontom. Staging nie jest wymagany w MVP.

Plan kopii danych: możliwość eksportu własnych danych z aplikacji, ręczny backup bazy przed ryzykowną migracją i udokumentowana procedura odtworzenia przed pierwszym wydaniem. Backup bazy i eksport użytkownika mają różny zakres; żadnego nie zapisujemy w publicznym repozytorium.

Źródła:

- [Supabase Pricing](https://supabase.com/pricing)
- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Vercel Hobby](https://vercel.com/docs/plans/hobby)
- [Nuxt 4 — struktura aplikacji](https://nuxt.com/docs/4.x/directory-structure/app)

## Decyzje pozostawione do odpowiedniego etapu

- Instalacja i testy fizycznego iPhone’a — na opublikowanej wersji Vercel Hobby.
- Bazowy katalog obejmuje 81 ćwiczeń z jawną konwencją obciążenia; użytkownik może dodać wspólne ćwiczenia. Produkcja ma obecnie 85 wpisów. Techniczne rozszerzenia katalogu dodajemy migracjami.
- Ostateczne reguły sugestii ciężarów i definicje rekordów — przy postępach.
- Konfiguracja odzyskiwania konta, harmonogram kopii i procedura odtworzenia — przed wydaniem.
- Współdzielenie postępów i wspólna edycja — po MVP, przez osobny model dostępu i migracje RLS.
