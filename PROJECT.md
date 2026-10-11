# Siłka

## Status i zakres tego etapu

Siłka to bezpłatna aplikacja PWA do planowania treningów siłowych i śledzenia postępów. Początkowo korzystają z niej dwie osoby, każda na własnym koncie.

Repozytorium: https://github.com/PawelJureczko/silka

Etapy 0–2 są zapisane na GitHub: dokumentacja, fundament, katalog ćwiczeń, edytor planu, aktywne przypisanie, archiwum oraz zatwierdzany eksport/import kopii. Etap 3 dodaje dashboard, rozpoczęcie i wznowienie sesji, wykonane serie, poprzednie wyniki, timer, lokalny szkic z kolejką oraz zakończenie i porzucenie z podsumowaniem. Postępy, AI i instalacja PWA są planowane.

Uruchomienie i weryfikacja: `README.md`. Używamy npm, Node 22.23.1, Nuxt 4.6.1 i Vue 3.5.43, z dokładnymi wersjami zależności w lockfile. Nie dodano Pinia, biblioteki ikon ani animacji.

Projekt Supabase `silka` działa na Free w eu-west-1. RLS chroni 10 tabel. Publiczna rejestracja jest wyłączona. Dwa konta i ich profile istnieją w chmurze; testy dwóch osób używają oddzielnego lokalnego Supabase i fikcyjnych danych. Wdrożenie Vercel oraz PWA nie zostały wykonane.

Migracje `20261011000100`–`20261011000600` są zastosowane lokalnie i w chmurze, z historią migracji. Wspólny katalog zawiera 19 ćwiczeń. Cztery RPC planów oraz cztery RPC treningów działają jako `SECURITY INVOKER`, wymagają uwierzytelnienia i zachowują RLS. Fikcyjne plany, ćwiczenia i treningi do testów nie były zapisywane w chmurze.

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
- Katalog ćwiczeń oraz ćwiczenia własne.
- Jednostki treningowe z kolejnością ćwiczeń, seriami, zakresem powtórzeń, ciężarem i odpoczynkiem.
- Przypisanie własnego planu jako aktywnego.
- Przekazanie planu drugiej osobie przez eksport/import niezależnej kopii.
- Rozpoczęcie, wznowienie, zakończenie i porzucenie treningu.
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
- Import kopii nie daje dostępu do historii, konta ani prywatnego katalogu drugiej osoby.
- Baza jest źródłem zapisanych danych; lokalny zapis chroni aktywną pracę i oczekujące zmiany.

## Stack i architektura

| Obszar | Rozwiązanie |
| --- | --- |
| Aplikacja | Nuxt 4, Vue 3 Composition API, TypeScript strict |
| Style | Tailwind CSS i własne tokeny projektu |
| Dane i konta | Supabase PostgreSQL, Supabase Auth, RLS |
| Walidacja danych wejściowych | Zod, z typami wyprowadzanymi ze schematów |
| Hosting | Statyczne wdrożenie na Vercel Hobby |
| PWA | Manifest i service worker; moduł dobrany po sprawdzeniu zgodności z wybraną wersją Nuxt 4 |
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
| `exercises` | `owner_id` nullable, `name`, `equipment`, `muscle_group`, `load_mode`, `weight_convention`, `weight_increment_kg`, `archived_at` |
| `training_plans` | `user_id`, `name`, `description`, `revision`, `archived_at` |
| `plan_assignments` | `user_id`, `plan_id`, `is_active`, `starts_on` |
| `plan_workouts` | `user_id`, `plan_id`, `name`, `position`, opcjonalny `weekday` |
| `plan_exercises` | `user_id`, `plan_workout_id`, `exercise_id`, `position`, `rest_seconds`, `notes` |
| `plan_sets` | `user_id`, `plan_exercise_id`, `position`, `set_type`, `reps_min`, `reps_max`, `target_weight_kg` nullable |
| `workout_sessions` | `user_id`, `plan_id` nullable, `plan_revision_snapshot`, `plan_name_snapshot`, `workout_name_snapshot`, `source_workout_id` nullable bez FK, `started_at`, `finished_at` nullable, `rest_ends_at` nullable, `status`, `revision`, `last_operation_id`, `last_operation_hash` |
| `workout_exercises` | `user_id`, `session_id`, `exercise_id`, `exercise_name_snapshot`, `equipment_snapshot`, `load_mode_snapshot`, `weight_convention_snapshot`, `position`, `rest_seconds`, `notes` |
| `workout_sets` | `user_id`, `workout_exercise_id`, `position`, `set_type`, planowane zakresy i ciężar, `reps` nullable, `weight_kg` nullable, `status`, `completed_at` nullable |

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
- Ćwiczenia z `owner_id IS NULL` są wspólnym katalogiem do odczytu dla zalogowanych kont. Zwykły użytkownik nie może ich tworzyć, zmieniać ani usuwać.
- Własne ćwiczenia są prywatne. Użycie `exercise_id` musi wskazywać ćwiczenie wspólne albo należące do bieżącego użytkownika, co jest sprawdzane także przy zapisie w bazie.
- RPC nie przyjmuje tożsamości z importowanego JSON. Użytkownik wynika z sesji Auth; relacje i uprawnienia są sprawdzane w transakcji.
- Widoki statystyczne dostępne przez API muszą respektować RLS, np. przez `security_invoker = true`.
- Publiczny klucz klienta Supabase nie zastępuje RLS. `service_role` i inne klucze administracyjne nie mogą trafić do aplikacji ani repozytorium.
- Testy dwóch kont sprawdzają odczyt, zapisy, podmienione identyfikatory rodziców, podmianę `user_id`, RPC i widoki. Brak sesji nie daje dostępu do prywatnych danych.

## Aktywny trening i PWA

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

### Zaimplementowane zachowanie etapu 3

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
2. Aplikacja tworzy `requestId`, zachowuje kontekst konsultacji lokalnie dla danego konta i generuje prompt.
3. Prompt zawiera potrzebne dane, katalog dozwolonych ćwiczeń, jednostki, kontrakt JSON oraz instrukcję zwrócenia samego JSON.
4. Użytkownik kopiuje prompt i wkleja go do wybranego LLM. Przy braku dostępu do schowka aplikacja udostępnia tekst do ręcznego skopiowania.
5. Użytkownik wkleja odpowiedź do Siłki.
6. Aplikacja parsuje JSON, waliduje schemat i sprawdza powiązania z aktualnym kontem i konsultacją.
7. Aplikacja pokazuje propozycję oraz różnice względem aktualnych danych.
8. Dopiero zatwierdzenie wykonuje dozwoloną zmianę atomowo.

Domyślnie eksport nie zawiera e-maila, identyfikatora konta, danych drugiej osoby ani prywatnych notatek. Historia ma jawny i ograniczony zakres. Użytkownik może obejrzeć cały prompt przed skopiowaniem.

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

Zwykły eksport/import kopii planu jest osobnym przepływem od konsultacji AI. Przenosi dane planu, nie tożsamość ani historię właściciela; tworzy nowy własny plan po podglądzie i zatwierdzeniu. Mapowanie ćwiczeń własnych drugiej osoby wymaga jawnej decyzji odbiorcy.

### Zaimplementowany eksport kopii planu v1

Osobny kontrakt `format: "silka-plan"`, `schemaVersion: 1` zawiera `plan` zgodny z powyższą strukturą oraz `exercises`: opisy wyłącznie użytych ćwiczeń (`id`, `name`, `equipment`, `muscleGroup`, `loadMode`, `weightConvention`, `weightIncrementKg`). Nie zawiera identyfikatora konta, e-maila ani historii. Notatki do ćwiczeń i opis planu są częścią kopii, co UI pokazuje przed eksportem. Limit całego pliku wynosi 256 KiB UTF-8. Nieznane pola, wersje, brakujące, nieużyte lub powtórzone opisy ćwiczeń są odrzucane.

Importer dopasowuje dostępne ćwiczenia po ID i zgodnej konwencji obciążenia. Pozostałe wymagają jawnego wyboru lub utworzenia własnego ćwiczenia. Zatwierdzenie zapisuje nowy plan „… — kopia”; nie ustawia go automatycznie jako aktywnego. Anulowanie podglądu nie zapisuje planu. Osobno zatwierdzone dodanie ćwiczenia do katalogu pozostaje na koncie.

Zapis całego planu, aktywacja i archiwizacja są transakcyjnymi RPC działającymi z RLS wywołującego. Zapis używa bazowej rewizji i stabilnego ID operacji; ponowienie ostatniego zapisu z identycznymi danymi zwraca istniejący wynik. Zmiana danych pod tym samym ID operacji jest odrzucana. Nieaktualna rewizja blokuje nadpisanie. Po nowszej operacji wymagany jest ponowny odczyt. Archiwizacja usuwa aktywne przypisanie, a przywrócenie go nie odtwarza. Edytor planów wymaga sieci; lokalne zabezpieczenie aktywnego treningu działa od etapu 3.

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

- Zgodny moduł PWA — przy etapie instalacji iOS, na podstawie istniejącej wersji Nuxt.
- Katalog startowy obejmuje 19 ćwiczeń z jawną konwencją obciążenia; użytkownik może dodać prywatne ćwiczenia. Dalsze rozszerzenia katalogu dodajemy migracjami.
- Ostateczne reguły sugestii ciężarów i definicje rekordów — przy postępach.
- Konfiguracja odzyskiwania konta, harmonogram kopii i procedura odtworzenia — przed wydaniem.
- Współdzielenie postępów i wspólna edycja — po MVP, przez osobny model dostępu i migracje RLS.
