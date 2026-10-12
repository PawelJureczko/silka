# Siłka — instrukcja administracyjna

Stan opisany na **11 października 2026 r.** Dokument dotyczy naszego istniejącego projektu, a nie przykładowej konfiguracji. Nazwy zakładek w panelach usług mogą się zmieniać; podane linki i nazwy ustawień pomagają je odnaleźć.

**Najważniejsze:** Vercel publikuje aplikację, Supabase przechowuje konta i dane, a GitHub przechowuje kod. Wdrożenie aplikacji nie aktualizuje automatycznie bazy. Usunięcie aplikacji z telefonu nie jest kopią ani usunięciem konta.

## Spis treści

1. [Szybka mapa zadań](#mapa)
2. [Nasze usługi i adresy](#adresy)
3. [Konta użytkowników Siłki](#konta)
4. [Baza danych i bezpieczeństwo](#baza)
5. [Katalog ćwiczeń](#katalog)
6. [Praca lokalna na komputerze](#lokalnie)
7. [Publikowanie zmian przez GitHub i Vercel](#publikacja)
8. [Migracje zdalnej bazy](#migracje)
9. [Konfiguracja Vercel, domena i rollback](#vercel)
10. [Klucze, hasła i pliki konfiguracji](#sekrety)
11. [E-maile i odzyskiwanie dostępu](#email)
12. [Kopie zapasowe i odtwarzanie](#backup)
13. [PWA na iPhonie](#pwa)
14. [Rozwiązywanie problemów](#problemy)
15. [Koszty i okresowe utrzymanie](#utrzymanie)
16. [Co jeszcze wymaga przygotowania](#ograniczenia)
17. [Słownik i dokumentacja projektu](#slownik)

<a id="mapa"></a>
## 1. Szybka mapa zadań

| Chcę… | Gdzie i co robię |
| --- | --- |
| Korzystać z Siłki | [Otwieram aplikację](https://silka-jureczko.vercel.app) lub ikonę PWA na telefonie. |
| Dodać osobę | Supabase → Authentication → Users → Add user → Create new user. [Instrukcja](#konta). |
| Sprawdzić, czy kod się opublikował | Vercel → projekt `silka` → Deployments → status, commit i środowisko Production. |
| Opublikować zmianę interfejsu | Sprawdzam kod, commituję wybrane pliki, pushuję na `feat/progress`, kontroluję wdrożenie. [Instrukcja](#publikacja). |
| Dodać wspólne ćwiczenia | Przygotowuję nową migrację SQL, testuję lokalnie, stosuję w chmurze. Sam push nie wystarcza. |
| Sprawdzić dane | Supabase → Table Editor; SQL Editor do świadomych zapytań administracyjnych. |
| Zmienić połączenie aplikacji z Supabase | Zmieniam dwie zmienne środowiskowe i wykonuję nowe wdrożenie Vercel. |
| Cofnąć wadliwy frontend | Vercel → Instant Rollback, następnie poprawiam kod. [Ograniczenia](#vercel). |
| Zabezpieczyć historię i konta | Wykonuję kopię bazy poza repozytorium. Eksport planu nie jest pełnym backupem. |
| Rozwiązać problem z zapisem treningu | Najpierw sprawdzam synchronizację i sieć. Nie usuwam danych PWA z oczekującymi zapisami. |

<a id="adresy"></a>
## 2. Nasze usługi i adresy

### Adresy do zapisania

| Element | Wartość |
| --- | --- |
| Aplikacja produkcyjna | [silka-jureczko.vercel.app](https://silka-jureczko.vercel.app) |
| Kod | [GitHub: PawelJureczko/silka](https://github.com/PawelJureczko/silka) |
| Repozytorium na obecnym Macu | `/Users/paweljureczko/Desktop/silka` |
| Vercel | [Panel projektu silka](https://vercel.com/jureczkopawel-2338s-projects/silka) |
| Zespół Vercel | `jureczkopawel-2338s-projects` |
| Projekt Supabase | [Panel silka](https://supabase.com/dashboard/project/dtuyllkefazftqphwfdc) |
| Użytkownicy Siłki | [Supabase → Authentication → Users](https://supabase.com/dashboard/project/dtuyllkefazftqphwfdc/auth/users) |
| Identyfikator projektu Supabase | `dtuyllkefazftqphwfdc` |
| Publiczny URL API Supabase | `https://dtuyllkefazftqphwfdc.supabase.co` |
| Organizacja / region Supabase | `Siłka` / Europe, `eu-west-1` |
| Gałąź produkcyjna Vercel | **`feat/progress`** |

Adres `project-bcug5.vercel.app` został zastąpiony docelowym adresem powyżej. Do instalowania PWA i udostępniania aplikacji używaj stałego adresu produkcyjnego, nie adresu pojedynczego wdrożenia.

### Za co odpowiada każda usługa

| Usługa / element | Przechowuje | Nie zastępuje |
| --- | --- | --- |
| GitHub | Kod, migracje, dokumentację i historię commitów. | Kopii prawdziwych danych treningowych ani kont Auth. |
| Vercel | Zbudowane pliki aplikacji, konfigurację wdrożeń, zmienne środowiskowe. | Bazy i panelu użytkowników Siłki. |
| Supabase Auth | Konta aplikacji, uwierzytelnienie i sesje. | Kont administratorów Vercel/GitHub. |
| Supabase PostgreSQL | Plany, ćwiczenia, treningi, profile, konsultacje AI i reguły dostępu. | Niezależnej kopii zapasowej na Free. |
| Przeglądarka / PWA | Zalogowanie, pliki aplikacji, lokalny trening i kolejkę synchronizacji. | Gwarancji, że wszystkie zmiany trafiły już do chmury. |

Siłka jest obecnie statyczną aplikacją kliencką Nuxt. Łączy się z Supabase z urządzenia użytkownika. Nie utrzymujemy osobnego serwera Node ani płatnego API AI.

### Trzy różne rodzaje kont

1. **Twoje konto administratora Supabase** daje dostęp do panelu projektu i bazy.
2. **Konta aplikacji**, np. Twoje i Marysi, znajdują się w Authentication → Users. Służą do logowania do Siłki.
3. **Konta GitHub i Vercel** pozwalają zarządzać kodem i publikacją.

Dodanie Marysi do Siłki nie wymaga zapraszania jej do organizacji Supabase ani zespołu Vercel. Takie zaproszenie dawałoby uprawnienia administracyjne. Hasła i kody odzyskiwania kont administratorów przechowuj w menedżerze haseł; włącz MFA tam, gdzie jest dostępne.

<a id="konta"></a>
## 3. Konta użytkowników Siłki

### Dodanie kolejnej osoby

Możemy dodać trzecie i kolejne konto aplikacji. Założenie „dwie osoby” dotyczyło początkowego zakresu produktu. Każda osoba dostaje własny identyfikator i prywatne dane. Limit dwóch aktywnych projektów Supabase Free oznacza projekty, nie użytkowników. [Limity Supabase](https://supabase.com/pricing).

1. Otwórz [Authentication → Users](https://supabase.com/dashboard/project/dtuyllkefazftqphwfdc/auth/users).
2. Kliknij **Add user → Create new user**.
3. Wpisz e-mail tej osoby i silne, indywidualne hasło.
4. Pozostaw **Auto confirm user**, żeby konto działało bez wiadomości potwierdzającej.
5. Kliknij **Create user**.
6. Przekaż dane logowania prywatnie. Nie umieszczaj ich w repozytorium, dokumentacji ani zrzutach ekranu.
7. Użytkownik otwiera produkcyjny adres Siłki, loguje się i tworzy swój plan lub importuje udostępnioną kopię.

Nie dodawaj użytkownika przez ręczny `INSERT` do `auth.users`. Supabase obsługuje haszowanie hasła i tożsamości, a nasz trigger `on_auth_user_created` tworzy wiersz w `public.profiles`.

Publiczna rejestracja i logowanie anonimowe są w obecnej konfiguracji wyłączone. Nie trzeba ich włączać, aby tworzyć konta administracyjnie. Nowa osoba nie dziedziczy automatycznie planów ani historii istniejących użytkowników.

### Jak znaleźć konto i jego dane

W Authentication → Users wyszukaj e-mail i otwórz szczegóły konta. Zwróć uwagę na **UUID użytkownika**. W tabelach aplikacji jest to zwykle `user_id`, natomiast katalog ćwiczeń jest wspólny i jego `owner_id` ma zawsze wartość `null`.

E-mail służy do logowania. UUID łączy konto z planami, treningami i lokalną synchronizacją. Ponowne utworzenie konta z tym samym e-mailem nadaje nowy UUID i nie przywraca dawnej historii.

W Table Editor możesz filtrować rekordy po UUID, ale preferuj edytowanie planów i treningów przez aplikację. Ręczny zapis w panelu może ominąć walidację i atomowe operacje używane przez Siłkę.

### Hasło, blokowanie dostępu i usuwanie

Siłka nie ma jeszcze kompletnego ekranu samodzielnej zmiany i odzyskiwania hasła. Nie zakładaj, że wysłanie dowolnego linku resetującego z panelu zakończy się działającym formularzem. [Stan obsługi e-maili](#email).

Przy utracie hasła zachowaj istniejące konto i UUID. Sprawdź dostępne działania w szczegółach użytkownika; jeśli panel nie umożliwia ustawienia nowego hasła, potrzebna jest kontrolowana operacja administracyjna Supabase Auth lub dodanie właściwego przepływu do aplikacji. Nie umieszczaj do tego klucza administracyjnego w frontendzie.

Przy czasowym odebraniu dostępu sprawdź opcje blokady konta w Auth, zamiast usuwać jego dane. Osobno trzeba uwzględnić już wydane sesje; samo zamknięcie panelu lub wylogowanie własnej przeglądarki nie wylogowuje innej osoby.

**Usunięcie użytkownika jest operacją destrukcyjną:** nasze relacje `ON DELETE CASCADE` usuwają powiązane dane aplikacji. Najpierw zabezpiecz dane i wyjaśnij, czy chodzi o blokadę, czy rzeczywiste usunięcie konta. Archiwizowanie planu wykonuj w Siłce — nie usuwaj w tym celu użytkownika.

<a id="baza"></a>
## 4. Baza danych i bezpieczeństwo

### Najważniejsze tabele

| Tabela | Co zawiera |
| --- | --- |
| `auth.users` | Konta zarządzane przez Supabase Auth; osobny schemat `auth`. |
| `profiles` | Profil i ustawienia użytkownika. |
| `exercises` | Wspólne ćwiczenia wszystkich zalogowanych kont; `owner_id` zawsze `NULL`. |
| `training_plans` | Plany jako szablony, rewizje i archiwizacja. |
| `plan_assignments` | Przypisanie aktywnego planu. |
| `plan_workouts` | Dni / jednostki w planie. |
| `plan_exercises` | Ćwiczenia w jednostce treningowej. |
| `plan_sets` | Zaplanowane serie. |
| `workout_sessions` | Rozpoczęte i zakończone treningi. |
| `workout_exercises` | Ćwiczenia sesji z kopią istotnych parametrów. |
| `workout_sets` | Serie sesji i wykonane wartości. |
| `ai_consultations` | Kontekst ręcznej konsultacji i kontrola importu odpowiedzi AI. |

Tabele bez wskazanego schematu znajdują się w `public`. Trening przechowuje własne wartości planowane i wykonane. Późniejsza edycja planu nie powinna zmieniać historii sesji.

### RLS — kto widzi jakie dane

**Row Level Security** ogranicza rekordy dostępne przez API zgodnie z zalogowanym kontem. Własność wynika z `auth.uid()`. Użytkownik nie może uzyskać cudzych treningów przez podmianę `user_id` w formularzu.

Wszystkie ćwiczenia są dostępne dla zalogowanych użytkowników. Każde konto może dodać nowy wspólny wpis w aplikacji; `owner_id` ma zawsze wartość `null`. Edycja, archiwizacja i usuwanie istniejących ćwiczeń pozostają administracyjne, bo wpis może być używany przez wiele planów. Katalog nie jest dostępny anonimowo. Plany, konsultacje AI, profile i historia pozostają prywatne.

SQL Editor i administracyjny Table Editor nie odzwierciedlają uprawnień zwykłego użytkownika aplikacji. Widoczność wszystkich rekordów w panelu administratora jest oczekiwana; nie dowodzi błędu ani poprawności RLS. Izolację sprawdzamy przez API z dwoma kontami i bez logowania. [Dokumentacja RLS](https://supabase.com/docs/guides/database/postgres/row-level-security).

### Bezpieczne zapytania diagnostyczne

Poniższe zapytania tylko odczytują informacje. Wklejaj do SQL Editora pojedynczy blok i przed uruchomieniem sprawdzaj, czy jesteś w odpowiednim projekcie.

```sql
-- Stan wersjonowanych migracji.
select version, name
from supabase_migrations.schema_migrations
order by version;
```

```sql
-- Czy RLS jest włączone na tabelach aplikacji?
select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
order by tablename;
```

```sql
-- Liczebność wspólnego katalogu według grup mięśniowych.
select muscle_group, count(*) as exercise_count
from public.exercises
where owner_id is null
group by muscle_group
order by muscle_group;
```

W obecnym schemacie mamy **12 tabel `public` z RLS**. Bazowy katalog ma **81 ćwiczeń w 9 grupach**, a produkcyjny wspólny katalog **85 wpisów**, w tym 4 dawniej prywatne. Migracja `20261012000200_share_exercise_catalog.sql` udostępnia wszystkie dotychczasowe i przyszłe ćwiczenia zalogowanym kontom bez zmiany ID i historii. Ostatnia zastosowana migracja to `20261012000300_delete_workouts.sql`; dodaje zatwierdzane, trwałe usuwanie własnych sesji. W szczegółach treningu wybierz „Usuń ten trening” i sprawdź nazwę, datę oraz liczbę serii przed potwierdzeniem. Operacja wymaga internetu, usuwa sesję z historii i statystyk, ale zachowuje plan. Nie ma cofnięcia. Opóźniony zapis offline nie odtworzy usuniętej sesji. Jeśli później dodasz kolejne migracje, te liczby naturalnie się zmienią.

Nie wyłączaj RLS, aby „naprawić” komunikat permission denied. Sprawdź sesję, uprawnienia wywoływanej funkcji i zgodność migracji.

<a id="katalog"></a>
## 5. Katalog ćwiczeń

### Wspólny katalog

Ćwiczenie dodane w aplikacji od razu trafia do wspólnej bazy i jest dostępne dla wszystkich zalogowanych kont. Nie umieszczaj w jego nazwie danych osobowych ani prywatnych notatek. Parametry ciężaru są wspólne; wykonane serie i wyniki pozostają prywatne.

Techniczne rozszerzenia katalogu, które mają być odtwarzalne także w nowej instalacji, dodajemy przez migracje w `supabase/migrations`.

1. Utwórz nową migrację: `npx supabase migration new add_shared_exercises`.
2. Uzupełnij wygenerowany plik na wzór ostatniej migracji katalogu.
3. Dla nowych pozycji wygeneruj UUID raz i wpisz je jako stałe w pliku. Nie wykorzystuj ID istniejącego ćwiczenia.
4. Ustal nazwę, sprzęt, grupę mięśniową, sposób liczenia ciężaru i krok progresji.
5. Zastosuj migrację lokalnie, sprawdź katalog oraz utworzenie planu.
6. Zastosuj ją w produkcji zgodnie z [procedurą migracji](#migracje), a plik zapisz w Git.

Nie modyfikuj zastosowanych migracji. Sama edycja `seed.sql` nie aktualizuje produkcyjnego katalogu. Nie uruchamiaj resetu zdalnej bazy, aby dodać ćwiczenia.

### Co oznaczają parametry ciężaru

| Przypadek | `load_mode` | `weight_convention` | Co wpisuje użytkownik |
| --- | --- | --- | --- |
| Sztanga / całkowite obciążenie | `external` | `total` | Łączny ciężar w kg. |
| Hantle / obciążenie jednej ręki | `external` | `per_hand` | Ciężar jednego hantla. |
| Masa ciała | `bodyweight` | `bodyweight` | Wariant bez zewnętrznego ciężaru. |
| Maszyna z asystą | `assisted` | `assistance` | Wartość odciążenia; mniej asysty oznacza trudniej. |

Pole `weight_increment_kg` określa krok sugestii. Powinien odpowiadać faktycznemu sprzętowi. W ćwiczeniach z dodatkowym obciążeniem, np. podciąganiu z pasem, zapisujemy dodatkowy ciężar, nie masę ciała plus obciążenie. Przy bramie opis musi wyjaśniać, czy chodzi o jeden stos / jedną rękę.

Nie zmieniaj istniejącego ID z „kg na rękę” na „kg łącznie”. Takie warianty powinny mieć odrębne pozycje, żeby nie mieszać porównań. Serie oparte na czasie lub dystansie nie są jeszcze pełnoprawnym typem danych — nie obchodź tego przez udawane powtórzenia.

**Stan rozszerzenia z 11.10.2026:** migracja 011 została zastosowana lokalnie i w chmurze. Katalog jest dostępny produkcyjnie bez nowego buildu aplikacji. Przy przygotowywaniu tej instrukcji plik migracji i związane aktualizacje dokumentacji czekały jeszcze na commit; przed kolejnym wydaniem sprawdź `git status`.

<a id="lokalnie"></a>
## 6. Praca lokalna na komputerze

### Najpierw wybierz bazę

| Polecenie | Aplikacja | Dane |
| --- | --- | --- |
| `npm run dev` | Lokalny frontend, zwykle `http://127.0.0.1:3000`. | Konfiguracja z `.env`; u nas połączenie z chmurą, czyli prawdziwe konta i treningi. |
| `npm run dev:local` | Lokalny frontend. | Konfiguracja z `.env.local`; osobny Supabase w Dockerze i fikcyjne dane. |
| Adres Vercel | Produkcyjny frontend. | Produkcyjny Supabase ustawiony w Vercel. |

**Lokalny adres strony nie oznacza lokalnej bazy.** Do testowania zapisów wybieraj `dev:local` i sprawdź plik konfiguracyjny. Nie używaj prawdziwej historii jako danych testowych.

### Uruchomienie istniejącego checkoutu

Wymagania: Git, npm, Node 22 zgodny z `.nvmrc`, Docker dla lokalnego Supabase. Otwórz Docker Desktop przed poleceniem `db:start`.

```bash
cd /Users/paweljureczko/Desktop/silka
git status
nvm use
npm ci
npm run db:start
npm run dev:setup
npm run dev:local
```

Jeśli `nvm use` zgłasza brak wersji, wykonaj `nvm install`, a potem ponownie `nvm use`. `npm ci` instaluje wersje z `package-lock.json`. Nie przechodź przypadkowo na Node 24 ani inny menedżer pakietów.

`dev:setup` tworzy fikcyjne konta i lokalną konfigurację; nie nadpisuje istniejącego `.env.local`. Adresy i hasło kont testowych są w `README.md`. Nie są to konta produkcyjne. Na nowym komputerze najpierw sklonuj repozytorium i przejdź na gałąź z aplikacją `feat/progress`; samo `main` nie odpowiada obecnemu wdrożeniu.

| Lokalna usługa | Adres |
| --- | --- |
| Supabase API | `http://127.0.0.1:54321` |
| Studio — lokalny panel bazy | `http://127.0.0.1:54323` |
| PostgreSQL | `127.0.0.1:54322` |
| Podgląd lokalnych e-maili | `http://127.0.0.1:54324` |

Frontend zatrzymasz przez `Ctrl+C`. Lokalny Supabase zatrzymasz przez `npm run db:stop`; normalne zatrzymanie zachowuje dane.

### Migracje i sprawdzenia lokalne

Nowe migracje bez kasowania danych:

```bash
npx supabase migration up --local
```

`npm run db:reset` **usuwa lokalne dane i buduje lokalną bazę od nowa**. Używaj tylko wtedy, gdy właśnie tego potrzebujesz. Nasz skrypt ma `--local`; nie zastępuj go poleceniem kierującym reset do chmury.

Przed wydaniem kodu standardowy zestaw sprawdzeń:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Zmiany danych, Auth, RLS, importu lub synchronizacji wymagają dodatkowo odpowiednich testów na lokalnym Supabase:

```bash
npm run test:db
npm run test:auth
npm run test:plans
npm run test:workouts
npm run test:progress
npm run test:ai
```

Po zmianie **schematu** bazy wykonaj `npm run db:types`. Nie edytuj ręcznie wygenerowanych typów. Dodanie samych wierszy katalogu nie zmienia typów.

Zatrzymaj serwer deweloperski przed buildem korzystającym z tego samego katalogu `.nuxt`. Jeśli musisz budować obok działającego serwera, repozytorium pozwala wskazać osobny katalog:

```bash
NUXT_IGNORE_LOCK=1 SILKA_TEST_BUILD_DIR=/private/tmp/silka-nuxt-build npm run build
```

Zmiany samej dokumentacji nie wymagają uruchamiania aplikacji, Dockera ani testów bazy.

<a id="publikacja"></a>
## 7. Publikowanie zmian przez GitHub i Vercel

### Jak obecnie działa publikacja

Produkcję śledzi gałąź **`feat/progress`**. Push na tę gałąź uruchamia build Vercel, także wtedy, gdy commit zmienia tylko dokumentację. Nie zakładaj, że `main` jest produkcją. Inne gałęzie mogą tworzyć wdrożenia Preview. [Integracja Vercel z Git](https://vercel.com/docs/git).

Weryfikuj konkretny commit i oznaczenie **Production / Current**, a nie tylko zielony status dowolnego wdrożenia. Przy przygotowaniu dokumentu ostatnim zweryfikowanym wdrożeniem aplikacji był commit `9499dcc`; baza ma już również migrację 011. To punkt odniesienia, nie numer, którego trzeba trzymać się przy kolejnych wydaniach.

### Zwykła zmiana aplikacji

1. Wykonaj `git status` i `git diff`. Sprawdź, jakie zmiany już istnieją.
2. Zaimplementuj i sprawdź zmianę lokalnie, najlepiej na lokalnej bazie.
3. Dodaj do commita konkretne pliki. Nie stosuj bezmyślnie `git add .`, gdy są też niedokończone prace.
4. Commituj i pushuj dopiero, gdy chcesz opublikować zmianę.

Przykład — ścieżkę zastąp rzeczywistym plikiem:

```bash
git branch --show-current
git status
git diff
git add sciezka/do/zmienionego/pliku
git commit -m "Opis zmiany"
git push origin feat/progress
```

5. W Vercel → Deployments otwórz wdrożenie tego commita.
6. Poczekaj na **Ready**. Przy błędzie otwórz Build Logs.
7. Otwórz stały adres produkcyjny. Sprawdź zmieniony ekran, logowanie i najważniejszy powiązany przepływ.
8. Na PWA sprawdź aktualizację w Profilu, gdy żaden trening ani zapis nie oczekuje na synchronizację.

Jeśli pracujesz na innej gałęzi, powyższy push nie przenosi automatycznie Twojej bieżącej pracy na `feat/progress`. Najpierw świadomie scal sprawdzone zmiany. Nie przełączaj produkcyjnej gałęzi tylko po to, żeby ominąć nieudany build.

### Gdy zmiana zawiera migrację

Build Vercel **nie wykonuje** `supabase db push`. Kod i baza mają oddzielny cykl wdrożenia.

Dla zmiany zgodnej ze starą aplikacją: przygotuj i przetestuj migrację oraz kod, zabezpiecz bazę, zastosuj migrację, a następnie opublikuj kod. Przy zmianie samego katalogu wystarcza zastosowanie migracji; zapis pliku w Git nadal jest konieczny.

Zmiany usuwające lub zmieniające znaczenie kolumn wymagają osobnego planu. Stare PWA mogą działać jeszcze po publikacji nowej wersji. Preferuj kolejność: dodanie kompatybilnych struktur → nowe UI → usunięcie starych struktur dopiero w późniejszym, uzgodnionym wydaniu.

<a id="migracje"></a>
## 8. Migracje zdalnej bazy

### Pierwsze połączenie CLI z projektem

CLI jest zależnością repozytorium. Wykonuj polecenia z katalogu projektu, po `nvm use`. Samo działanie aplikacji nie oznacza, że CLI jest zalogowane lub połączone z chmurą.

```bash
npx supabase login
npx supabase link --project-ref dtuyllkefazftqphwfdc
npx supabase migration list --linked
```

Przejdź logowanie we własnej przeglądarce. Jeśli CLI zapyta o hasło bazy, użyj hasła zapisanego przy tworzeniu projektu. Nie wpisuj hasła ani tokena w dokumentacji, poleceniu zachowanym w historii czy commicie. `link` wybiera projekt — zawsze sprawdzaj jego identyfikator przed zapisem.

### Zastosowanie nowej migracji

1. Nowy plik migracji musi być przetestowany lokalnie i przejrzany, szczególnie pod kątem RLS oraz zmian istniejących danych.
2. Zrób kopię bazy odpowiednią do ryzyka zmiany.
3. Porównaj historię lokalną i zdalną przez `migration list`.
4. Sprawdź plan bez wykonywania migracji:

```bash
npx supabase db push --linked --dry-run
```

5. Jeśli widzisz wyłącznie oczekiwane migracje do właściwego projektu, zastosuj je:

```bash
npx supabase db push --linked
npx supabase migration list --linked
```

6. Sprawdź zmienione dane i zachowanie aplikacji. Zapisz migrację w historii Git razem z opisem zmiany.

Jeśli CLI proponuje ponowne wykonanie starych migracji albo zgłasza rozbieżność historii, **przerwij i wyjaśnij przyczynę**. Nie używaj w ciemno `migration repair`, `--include-all`, resetu ani usuwania wierszy historii. Pierwsze migracje naszego projektu były stosowane przez SQL Editor z zapisaniem wersji w `supabase_migrations.schema_migrations`.

Przy awaryjnym użyciu SQL Editora wersjonowany plik nadal musi pozostać źródłem zmiany, a historia migracji musi odpowiadać temu, co faktycznie wykonała baza. Zwykłe wklejenie SQL nie rejestruje automatycznie migracji CLI. Z tego powodu preferujemy od teraz kontrolowane wdrażanie przez CLI.

`supabase/config.toml` konfiguruje środowisko lokalne. `db push` nie przenosi automatycznie ustawień panelu Auth, SMTP, dozwolonych przekierowań ani konfiguracji Vercel. [Dokumentacja CLI](https://supabase.com/docs/reference/cli/supabase-db-push).

<a id="vercel"></a>
## 9. Konfiguracja Vercel, domena i rollback

### Ustawienia projektu

Otwórz [projekt silka](https://vercel.com/jureczkopawel-2338s-projects/silka) → Settings. Aktualna konfiguracja:

| Ustawienie | Wartość |
| --- | --- |
| Framework Preset | **Other** |
| Root Directory | Katalog główny repozytorium, `./`. |
| Install Command | `npm ci` |
| Build Command | `npm run build` |
| Output Directory | `.output/public` |
| Node.js Version | `22.x` |
| Repozytorium Git | `PawelJureczko/silka` |
| Production Branch | `feat/progress` |

Gałąź sprawdzisz w **Settings → Environments → Production → Branch Tracking**; powiązanie repozytorium w Settings → Git. Nazwy tych sekcji mogą ulec zmianie.

`npm run build` uruchamia `nuxt generate`, a skrypt `postbuild` tworzy service worker PWA. `nuxt.config.ts` jawnie ustawia `nitro: { preset: 'static' }`. Zachowaj to ustawienie: automatyczny wybór presetu Vercel spowodował wcześniej niespójność katalogów wyjściowych i błąd braku `.output/public/_nuxt/builds/latest.json`.

`vercel.json` przechowuje build, katalog wyjściowy, nagłówki i przekierowanie tras SPA na `index.html`. Wyjątki dla `_nuxt`, ikon, manifestu i `sw.js` pozwalają pobierać rzeczywiste zasoby. Bez reguły SPA bezpośrednie wejście np. na `/progress` może kończyć się 404.

### Zmienne środowiskowe i ponowne wdrożenie

W **Settings → Environment Variables** mamy dwie publiczne zmienne dla środowiska **Production**:

```dotenv
NUXT_PUBLIC_SUPABASE_URL=https://dtuyllkefazftqphwfdc.supabase.co
NUXT_PUBLIC_SUPABASE_KEY=TU_WSTAW_PUBLICZNY_KLUCZ_PUBLISHABLE_LUB_ANON
```

Klucz pobierz z ustawień API Keys właściwego projektu Supabase. Placeholder powyżej nie jest działającą wartością. Nie dodawaj cudzysłowów jako części wartości w panelu Vercel.

Po zmianie zmiennej wykonaj nowe wdrożenie: **Deployments → odpowiednie wdrożenie → menu → Redeploy**. Statyczny frontend zawiera konfigurację nadaną przy budowaniu; zapis zmiennej nie zmienia już opublikowanych plików. [Zmienne Vercel](https://vercel.com/docs/environment-variables), [zarządzanie wdrożeniami](https://vercel.com/docs/deployments/managing-deployments).

Środowisko **Preview nie jest obecnie skonfigurowane jako niezależna baza testowa**. Nie oczekuj, że każda podglądowa gałąź będzie od razu działać. Jeśli dodasz do Preview klucze produkcyjnego Supabase, podgląd będzie zapisywać prawdziwe dane. Bezpieczne testy wykonuj lokalnie; osobny staging wymaga świadomej konfiguracji.

### Domena i HTTPS

W Settings → Domains sprawdzisz powiązanie `silka-jureczko.vercel.app`. Korzystamy z domeny Vercel i HTTPS, bez konieczności kupowania własnej domeny.

Zmiana domeny wpływa na adresy Auth i PWA. Magazyn przeglądarki jest związany z adresem pochodzenia: nowe pochodzenie nie przejmie automatycznie lokalnej kolejki treningów ze starego. Przed taką zmianą zsynchronizuj urządzenia i zaplanuj aktualizację instalacji PWA oraz przekierowań.

### Cofnięcie wadliwego wdrożenia aplikacji

1. W Deployments ustal ostatnie poprawne wdrożenie **Production**.
2. Użyj dostępnej akcji **Instant Rollback / Rollback** i sprawdź, jakie wdrożenie zostanie przywrócone.
3. Zweryfikuj stały adres produkcyjny i zgodność starego kodu z obecną bazą.
4. Popraw błąd w kodzie, wykonaj sprawdzenia i przygotuj właściwe wydanie. Alternatywnie cofnij konkretny commit przez `git revert` po sprawdzeniu zakresu; nie nadpisuj historii przez force push.

Na Hobby Instant Rollback jest ograniczony do poprzedniego wdrożenia produkcyjnego. Po rollbacku Vercel wyłącza automatyczne przypisywanie domen produkcyjnych nowym wdrożeniom — trzeba świadomie użyć **Undo Rollback** lub promować wybraną wersję. Sam kolejny push może więc nie przywrócić automatycznej publikacji. [Aktualne zasady rollbacku](https://vercel.com/docs/instant-rollback).

Rollback przywraca poprzedni build i jego konfigurację. **Nie cofa migracji, usuniętych danych ani lokalnej kolejki użytkownika.** Urządzenie z PWA może nadal mieć starsze pliki w cache; nie wymuszaj przeładowania trwającego treningu.

<a id="sekrety"></a>
## 10. Klucze, hasła i pliki konfiguracji

| Element | Gdzie jest używany | Jak go traktować |
| --- | --- | --- |
| URL Supabase | Frontend, `.env`, Vercel. | Publiczny adres projektu. |
| Publishable / legacy `anon` key | Frontend, `NUXT_PUBLIC_SUPABASE_KEY`. | Może być widoczny w aplikacji; dostęp ograniczają Auth i RLS. |
| Secret key / legacy `service_role` | Wyłącznie zaufane operacje administracyjne. | Sekret; nigdy frontend, Git ani `NUXT_PUBLIC_*`. |
| Hasło PostgreSQL | Połączenie administracyjne CLI / bazy. | Menedżer haseł; nie jest hasłem logowania do Siłki. |
| Supabase access token | Autoryzacja CLI / konta administratora. | Sekret; nie jest publicznym kluczem aplikacji. |
| Hasło użytkownika Siłki | Formularz logowania i Auth. | Prywatne dla danej osoby. |

Publiczny klucz nie jest mechanizmem izolowania danych. Klucze administracyjne mogą omijać RLS; ich ujawnienie wymaga odwołania lub rotacji i sprawdzenia skutków. Samo ujawnienie publicznego URL lub poprawnego publishable key nie oznacza wycieku sekretu. [Rodzaje kluczy Supabase](https://supabase.com/docs/guides/getting-started/api-keys).

W repozytorium:

- `.env` — lokalna konfiguracja połączenia z chmurą, ignorowana przez Git.
- `.env.local` — lokalna konfiguracja Supabase w Dockerze, ignorowana przez Git.
- `.env.example` — nazwy zmiennych i bezpieczne przykłady, bez sekretów.
- `supabase/config.toml` — wersjonowane ustawienia lokalnej usługi.
- zmienne Vercel — konfiguracja z panelu; nie aktualizują się po edycji pliku `.env` na Macu.

Jeśli sekret trafił do Git, samo usunięcie go w kolejnym commicie nie wystarcza. Najpierw unieważnij go w odpowiedniej usłudze, zaktualizuj potrzebne konfiguracje i zweryfikuj działanie. Czyszczenie historii Git planuj osobno, żeby nie nadpisać pracy innych osób.

Nie publikuj zrzutów zakładek z sekretami ani pełnych logów zawierających tokeny, adresy e-mail czy dane treningowe. Repozytorium jest publiczne. Kopie bazy także muszą pozostać poza nim.

<a id="email"></a>
## 11. E-maile i odzyskiwanie dostępu

### Co działa obecnie

Logowanie e-mailem i hasłem do ręcznie utworzonego, potwierdzonego konta. Nie wymaga wiadomości e-mail przy każdym wejściu. Nie mamy jeszcze sprawdzonego, kompletnego przepływu „zapomniałem hasła” w Siłce ani potwierdzonej konfiguracji własnego SMTP.

### Czego nie zakładać o domyślnej wysyłce Supabase

Domyślna usługa pocztowa Supabase jest przeznaczona do ograniczonych zastosowań testowych: dokumentacja podaje wysyłkę do adresów członków zespołu projektu i limit **2 wiadomości na godzinę**, bez gwarancji dostarczenia. Nie zapraszaj użytkownika Siłki do administracyjnego zespołu tylko po to, żeby otrzymał wiadomość. [Dokumentacja SMTP](https://supabase.com/docs/guides/auth/auth-smtp).

Zaproszenia e-mail, reset hasła i magic link wymagają osobnego sprawdzenia. Brak wiadomości nie oznacza, że baza użytkowników została usunięta.

### Jak przygotować pełną obsługę odzyskiwania hasła

To osobne zadanie wdrożeniowe, nie funkcja gotowa po samym kliknięciu ustawienia:

1. Dodać w aplikacji formularz żądania resetu, obsługę linku odzyskiwania i ustawienia nowego hasła oraz błędów / wygasłego linku.
2. W Supabase → Authentication → URL Configuration ustawić **Site URL** na `https://silka-jureczko.vercel.app`.
3. Dodać dokładny adres rzeczywiście zaimplementowanej trasy odzyskiwania do dozwolonych Redirect URLs. Nie wpisywać wymyślonej trasy, której aplikacja nie obsługuje.
4. Skonfigurować SMTP w ustawieniach Auth / Emails: dostawcę, nadawcę i wymagane rekordy domeny. Koszt i ograniczenia dostawcy trzeba sprawdzić przed wyborem.
5. Sprawdzić cały proces dla zwykłego użytkownika spoza zespołu administratorów oraz w Safari i PWA.

Site URL jest domyślnym adresem przekierowania dla odpowiednich przepływów Auth; sam nie dodaje formularza resetu do aplikacji. [Konfiguracja przekierowań](https://supabase.com/docs/guides/auth/redirect-urls).

W razie problemów sprawdzaj Auth Logs w Supabase, logi dostawcy poczty, spam i dopasowanie adresów. Nie udostępniaj linków resetujących, bo zawierają dane umożliwiające przejęcie dostępu.

<a id="backup"></a>
## 12. Kopie zapasowe i odtwarzanie

### Co trzeba zabezpieczyć

GitHub przechowuje strukturę aplikacji, ale nie aktualną zawartość bazy. Eksport kopii planu z Siłki nie obejmuje wszystkich kont, sesji i historii. Lokalny trening z niewysłanymi zmianami istnieje tylko na urządzeniu i nie pojawi się w kopii chmury.

Supabase Free nie obejmuje automatycznych kopii bazy dostępnych jak w płatnych planach. Dlatego potrzebujemy własnej kopii poza projektem. Zrzut bazy nie zawiera samych plików z Supabase Storage; obecna Siłka nie opiera głównego przepływu na takich plikach. Jeśli je dodamy, trzeba objąć je osobnym backupem. [Zasady kopii Supabase](https://supabase.com/docs/guides/platform/backups).

Proponowana rutyna: backup przed migracją zmieniającą istniejące dane i okresowo, np. co tydzień regularnego używania. To zalecenie administracyjne; nie skonfigurowaliśmy automatycznego harmonogramu.

### Ręczna kopia przez CLI — operacja odczytu

Wymagania: właściwy Node, Docker potrzebny CLI do dumpu, logowanie i połączenie CLI z projektem opisane w [migracjach](#migracje). Przed backupem zakończ synchronizację treningów; nie wykonuj równolegle migracji. Poniższe polecenia zapisują pliki na Macu, nie zmieniają zdalnych danych.

```bash
cd /Users/paweljureczko/Desktop/silka
nvm use
npx supabase migration list --linked
```

Sprawdź, że połączony projekt to `dtuyllkefazftqphwfdc`. Utwórz katalog **poza repozytorium** z ograniczonym dostępem:

```bash
umask 077
SILKA_BACKUP_DIR="$HOME/Documents/Silka-backups/$(date +%Y-%m-%d_%H-%M-%S)"
mkdir -p "$SILKA_BACKUP_DIR"
```

W tym samym terminalu wykonaj kolejne zrzuty. Każdy musi zakończyć się bez błędu:

```bash
npx supabase db dump --linked --role-only --file "$SILKA_BACKUP_DIR/roles.sql"
npx supabase db dump --linked --file "$SILKA_BACKUP_DIR/schema.sql"
npx supabase db dump --linked --data-only --use-copy --exclude storage.buckets_vectors,storage.vector_indexes --file "$SILKA_BACKUP_DIR/data.sql"
npx supabase db dump --linked --schema supabase_migrations --file "$SILKA_BACKUP_DIR/migration-history-schema.sql"
npx supabase db dump --linked --schema supabase_migrations --data-only --use-copy --file "$SILKA_BACKUP_DIR/migration-history-data.sql"
```

To podział na role, strukturę, dane i osobną historię migracji, zgodny z mechanizmem eksportu CLI. Dwie wykluczone tabele dotyczą zarządzanych struktur Storage Vector, nie historii treningów. Sprawdzaj komunikaty dla swojej wersji CLI i aktualną [referencję `db dump`](https://supabase.com/docs/reference/cli/supabase-db-dump).

Przed uznaniem kopii za przydatną:

1. Sprawdź, że pliki powstały i nie są puste. Zachowaj datę, identyfikator źródłowego projektu i commit kodu używanego z bazą.
2. Sprawdź lokalnie zawartość zrzutu pod kątem danych `auth.users`, `auth.identities`, profili, planów i treningów. Nie wypisuj ich do publicznych logów ani czatu.
3. Zachowaj odpowiadające kopii wersjonowane migracje, w tym definicję `public.handle_new_user()` oraz triggera `on_auth_user_created` na `auth.users` z migracji fundamentu. Niestandardowe obiekty w zarządzanych schematach Auth/Storage wymagają osobnego uwzględnienia przy odtwarzaniu.
4. Zapisz konfigurację Auth, URL, SMTP, Vercel i domen w bezpiecznej notatce; nie są kompletną częścią SQL dumpu. Sekrety trzymaj w menedżerze haseł.
5. Wykonaj próbę odtworzenia w odizolowanym środowisku. Sam sukces `db dump` nie dowodzi, że kopia odtwarza działającą Siłkę.

Pliki mogą zawierać dane prywatne, hasze haseł i informacje uwierzytelniające. Przechowuj je na zaszyfrowanym nośniku i zrób niezależną, zabezpieczoną kopię poza tym samym komputerem. Nie commituj ich. `umask 077` ogranicza dostęp do nowo tworzonych plików, ale nie szyfruje ich.

Przy problemie z połączeniem sprawdź **Connect** w panelu Supabase. Do eksportu wybierz połączenie bezpośrednie albo sesyjny pooler zgodnie z dokumentacją, nie transakcyjny pooler używany do krótkich zapytań. Nie wklejaj URL-a z hasłem do historii poleceń.

### Odtwarzanie — najpierw próba na pustym środowisku

**Nie odtwarzaj pełnego dumpu do działającej produkcji „na próbę”.** W tym projekcie procedura odtwarzania nie była jeszcze potwierdzona testem. Poniżej jest kolejność przygotowania odtworzenia; dokładne polecenia dobierz do backupu i pustego celu według [oficjalnej procedury backup/restore Supabase](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore).

1. Przygotuj pusty, odizolowany projekt lub odpowiednie środowisko lokalne. Sprawdź limit darmowych projektów przed utworzeniem kolejnego.
2. Odtwórz wymagane role, strukturę i dane w kolejności z dokumentacji, z zatrzymaniem przy błędzie i transakcyjnym importem. Zachowanie triggerów podczas importu musi być kontrolowane, aby np. nie dublować profili.
3. Przywróć oryginalne UUID kont Auth wraz z ich danymi i tożsamościami. Tworzenie nowych kont z tymi samymi e-mailami nie odtwarza powiązań historii.
4. Sprawdź niestandardowy trigger tworzenia profilu, funkcje RPC, uprawnienia, RLS, ograniczenia i historię migracji. Nie uruchamiaj wszystkich migracji od początku na już odtworzonej strukturze.
5. Skonfiguruj ustawienia projektu, których nie przenosi SQL: Auth, przekierowania, ewentualny SMTP i połączenia aplikacji. Nowy projekt ma inny URL i klucze.
6. Porównaj liczby rekordów, sprawdź logowanie i izolację dwóch kont, utworzenie planu, zapis treningu, historię oraz utworzenie nowego użytkownika i jego profilu.
7. Dopiero po udanej próbie zaplanuj przełączenie produkcji: synchronizację urządzeń, ograniczenie zapisów w czasie przenosin, końcową kopię, nowe zmienne Vercel i wdrożenie.

Przy przypadkowym usunięciu pojedynczego rekordu preferuj odzyskanie go z kopii w środowisku pomocniczym i kontrolowane przywrócenie powiązanych danych. Pełne cofnięcie bazy usuwa także poprawne treningi zapisane po dacie kopii. To inna operacja niż rollback Vercel.

<a id="pwa"></a>
## 13. PWA na iPhonie

### Instalowanie i logowanie

1. Otwórz w Safari `https://silka-jureczko.vercel.app`.
2. Wybierz Udostępnij → Dodaj do ekranu początkowego; jeśli iOS pokazuje dodatkowe ustawienie otwierania jako aplikacja, pozostaw je włączone.
3. Uruchom Siłkę z nowej ikony i zaloguj się kontem **aplikacji**.

Sesja w oknie na Macu nie loguje automatycznie telefonu. Używamy HTTPS z Vercel; nie instaluj PWA z lokalnego adresu Maca jako docelowej aplikacji.

Instalacja została już potwierdzona przez użytkownika. Pozostałe zachowania urządzenia, szczególnie offline, powrót z blokady i aktualizacja przy aktywnym treningu, wymagają dalszej weryfikacji na fizycznym iPhonie.

### Aktualizowanie aplikacji

Po publikacji nowej wersji wejdź w **Profil** i użyj obsługi sprawdzania / zastosowania aktualizacji. Najpierw zakończ albo zabezpiecz trening i poczekaj na synchronizację.

Aplikacja blokuje zastosowanie aktualizacji, gdy istnieje aktywny trening, niewysłane zmiany albo konflikt; kontrola obejmuje lokalnie zapisane konta na tym urządzeniu. Jeśli wcześniej korzystano z innego konta, może być potrzebny powrót do niego i synchronizacja. Zamknij również inne otwarte karty Siłki, jeżeli przeszkadzają w przejęciu nowego service workera.

Zmiana wierszy katalogu w Supabase nie wymaga nowej instalacji PWA. Jeśli nie widzisz nowych ćwiczeń, odśwież dane katalogu po odzyskaniu sieci i sprawdź, z którym projektem łączy się aplikacja.

### Offline i ochrona treningu

Obsługa lokalna dotyczy przede wszystkim już rozpoczętego / wczytanego treningu i kolejki zapisów. Nie zakładaj możliwości pierwszego logowania, pobrania całej historii czy nieotwartego planu bez internetu.

Rozróżniaj zapis lokalny od potwierdzonej synchronizacji z Supabase. Przy braku sieci wróć online i sprawdź status. Przy konflikcie rewizji użyj przewidzianego przepływu rozstrzygnięcia; nie wymuszaj nadpisania bazy ręcznym SQL.

**Nie usuwaj danych witryny, IndexedDB ani instalacji PWA, gdy są niewysłane zmiany.** Może to usunąć jedyną kopię treningu. Wylogowanie, zmiana konta, aktualizacja i reinstalacja muszą uwzględniać kolejkę.

Timer wylicza czas z zapisanego momentu końca odpoczynku. Nie gwarantujemy alarmu dźwiękowego na zablokowanym iPhonie. Cache service workera służy plikom aplikacji; nie powinien przechowywać prywatnych odpowiedzi Auth ani API jako publicznego cache.

<a id="problemy"></a>
## 14. Rozwiązywanie problemów

### Najpierw ustal warstwę problemu

1. **Strona nie otwiera się:** sprawdź połączenie i wdrożenie / domenę Vercel.
2. **Strona działa, ale nie loguje lub nie pobiera danych:** sprawdź Supabase, konto, konfigurację i logi Auth/API.
3. **Problem tylko na jednym urządzeniu:** sprawdź aktualizację PWA, status lokalnej kolejki i sesję tego urządzenia.
4. **Problem po zmianie kodu lub SQL:** porównaj commit wdrożenia i wersje migracji. To dwa niezależne numery stanu.

| Objaw | Co sprawdzić i zrobić |
| --- | --- |
| Nie ma nowej wersji po pushu | Czy push był na `feat/progress`? Czy wdrożenie danego commita ma Ready i Production? Czy nie trwa blokada przypisywania domen po rollbacku? Potem sprawdź aktualizację PWA. |
| Build Failed | Otwórz pierwszy konkretny błąd w Build Logs; sprawdź Node 22, `npm ci`, konfigurację i build lokalny. Nie rozwiązuj błędu przez wyłączenie walidacji. |
| Brak `.output/public/.../latest.json` | Sprawdź jawny preset `static`, komendę `nuxt generate` i katalog wyjściowy Vercel. |
| Komunikat o braku konfiguracji Supabase | Sprawdź dwie zmienne dla właściwego środowiska i wykonaj nowe wdrożenie po zmianie. |
| Invalid login credentials | Upewnij się, że to konto aplikacji, poprawny projekt, e-mail i hasło; sprawdź potwierdzenie / blokadę w Auth. |
| Brak maila resetującego / zaproszenia | Sprawdź ograniczenia domyślnego SMTP, Auth Logs i dostawcę poczty. Pełny reset w UI nie jest jeszcze gotowy. |
| 401, nieważna sesja lub JWT | Sprawdź sieć i sesję; ponowne logowanie wykonaj po zabezpieczeniu oczekujących zapisów. Nie podmieniaj klucza na administracyjny. |
| Permission denied / RLS | Sprawdź konto, właściciela danych, uprawnienia RPC i zastosowane migracje. Nie wyłączaj RLS. |
| Błąd brakującej tabeli, funkcji lub kolumny | Sprawdź projekt Supabase i `migration list`; frontend mógł zostać opublikowany przed migracją. |
| Pusty katalog albo mniej ćwiczeń | Sprawdź zalogowanie, bazę docelową, migrację 011 i odczyt danych. Lokalny Docker jest inną bazą niż produkcja. |
| Własne dane „zniknęły” po logowaniu | Porównaj e-mail i UUID, adres aplikacji oraz projekt Supabase. Nie twórz nowego konta jako pierwszej naprawy. |
| Trening czeka na synchronizację | Zachowaj lokalne dane, sprawdź sieć i błąd kolejki. W razie konfliktu nie pomijaj wcześniejszych zapisów. |
| PWA odmawia aktualizacji | Sprawdź aktywny trening / kolejkę / konflikt również na pozostałych kontach zapisanych na urządzeniu. |
| Supabase jest Paused | Sprawdź stan projektu w panelu i przywróć działanie, jeśli dostępna jest ta opcja. Free może pauzować po tygodniu braku aktywności. |
| `npx supabase` nie znajduje binarki na Macu | Sprawdź `nvm use`, Node 22 i instalację `npm ci`; nie zmieniaj lockfile ani architektury pakietów w ciemno. |
| Port 3000 jest zajęty | Odszukaj własny serwer lub uruchom dev na innym porcie; nie zabijaj przypadkowych procesów. |

### Gdzie oglądać logi

- **Vercel → Deployments → Build Logs:** instalacja, budowanie, generowanie PWA i publikacja plików.
- **Supabase → Logs / Authentication logs:** logowanie i błędy API / PostgreSQL. Dostępność i czas retencji zależą od planu.
- **DevTools przeglądarki → Console / Network:** błędy klienta oraz statusy żądań do Supabase. Nie udostępniaj nagłówków `Authorization`, cookies i tokenów.
- **Profil / aktywny trening:** widoczny status aktualizacji i synchronizacji użytkownika.

Ponieważ aplikacja jest statyczna, brak błędu funkcji serwerowej w Vercel nie dowodzi, że zapis do Supabase zadziałał. Do zgłoszenia problemu zapisz czas, urządzenie, ekran, krok wywołujący problem, commit wdrożenia i bezpieczny komunikat błędu; nie kopiuj pełnej prywatnej odpowiedzi API.

<a id="utrzymanie"></a>
## 15. Koszty i okresowe utrzymanie

### Utrzymanie kosztu 0 zł

Stan oficjalnych planów sprawdzony 11.10.2026. Limity mogą się zmieniać — przed zmianą planu lub włączeniem dodatku sprawdź bieżącą cenę i zasady.

| Usługa | Nasz wybór | Na co uważać |
| --- | --- | --- |
| Supabase | Free. | Obecnie m.in. 500 MB bazy / projekt, 50 tys. MAU, 1 GB Storage, 5 GB egress i 2 aktywne projekty; brak automatycznych backupów w tym planie. |
| Vercel | Hobby. | Plan do użytku osobistego i niekomercyjnego; sprawdzaj Usage i ograniczenia publikacji / transferu. |
| Domena | Subdomena `vercel.app`. | Własna domena może mieć płatne odnowienia i nie jest potrzebna do PWA. |
| AI | Ręczne kopiowanie promptu i odpowiedzi JSON. | Nie ma kosztu API po stronie Siłki; własny abonament zewnętrznego chatbota jest osobną decyzją. |
| SMTP | Brak potwierdzonej konfiguracji własnego dostawcy. | Darmowy Supabase nie gwarantuje bezpłatnej, produkcyjnej dostarczalności poczty. |

Supabase Free może pauzować po **tygodniu braku aktywności**. Nie zakładaj nieprzerwanej dostępności jak w płatnej usłudze. Sprawdzaj Usage w panelu organizacji / projektu. [Cennik i limity Supabase](https://supabase.com/pricing).

W Vercel Hobby przekroczenie limitu może oznaczać oczekiwanie na odnowienie dostępności danej funkcji zamiast automatycznego zwiększenia zasobów. Nie włączaj Pro, płatnego triala, dodatków, PITR ani większego compute „na wszelki wypadek”. Jeżeli aplikacja stanie się komercyjna, trzeba ponownie ocenić warunki Hobby. [Zasady Vercel Hobby](https://vercel.com/docs/plans/hobby).

### Krótka rutyna administratora

**Przy dodawaniu użytkownika:** właściwy projekt → Auth Users → ręczne konto potwierdzone → prywatne przekazanie dostępu → logowanie w Siłce. Nie nadawaj dostępu do paneli usług.

**Przed wydaniem:** `git status` → testy odpowiednie do zmiany → lokalna weryfikacja → kopia / migracja, jeśli potrzebna → świadomy commit i push → Ready Production → sprawdzenie aplikacji i PWA.

**Co tydzień regularnego korzystania:** sprawdź stan synchronizacji i wykonaj kopię danych według przyjętej rutyny. Przy rzadkim użyciu sprawdź też, czy Supabase nie został zapauzowany.

**Co miesiąc:** przejrzyj Usage obu usług, dostęp administratorów, poprawność i dostępność kopii, stan zależności i ostatnich wdrożeń. Aktualizacje zależności wykonuj w kodzie z testami i lockfile; nie uruchamiaj automatycznie `npm audit fix --force` na produkcyjnym wydaniu.

**Okresowo i po istotnej zmianie bazy:** wykonaj próbę odtworzenia kopii oraz test izolacji kont. Zanotuj datę i wynik; dopiero wtedy procedurę odzyskiwania można uznać za sprawdzoną.

<a id="ograniczenia"></a>
## 16. Co jeszcze wymaga przygotowania

Ten dokument nie oznacza wykonania opisanych operacji. Przy jego tworzeniu nie zmieniano kont, ustawień usług ani danych produkcyjnych.

- Pełny reset / samodzielna zmiana hasła w UI i sprawdzona dostarczalność poczty wymagają wdrożenia oraz testu.
- Harmonogram kopii, niezależne miejsce ich przechowywania i udana próba odtwarzania nie zostały jeszcze potwierdzone. Polecenia backupu są procedurą do wykonania, nie dowodem istniejącej kopii.
- Preview na Vercel nie ma osobnego, potwierdzonego środowiska danych. Do testów używamy lokalnego Supabase.
- Instalacja PWA na iPhonie jest potwierdzona; pełny przegląd zachowań iOS jest do dokończenia według `PWA_REVIEW.md`.
- Udostępnianie postępów między użytkownikami nie oznacza wspólnej własności danych. Nie omijaj RLS, aby zastąpić przyszły przepływ udostępniania.
- Katalog 81 ćwiczeń jest w bazie produkcyjnej; pliki rozszerzeń czekały na commit w momencie aktualizacji instrukcji. Zawsze sprawdzaj aktualny stan Git i migracji zamiast zakładać, że kod i baza są na identycznym etapie.

<a id="slownik"></a>
## 17. Słownik i dokumentacja projektu

| Pojęcie | Znaczenie w Siłce |
| --- | --- |
| Production | Aplikacja i baza używane do prawdziwych treningów. |
| Preview | Podgląd buildu; sam w sobie nie zapewnia osobnej bazy. |
| Deploy / wdrożenie | Zbudowanie i opublikowanie wersji aplikacji na Vercel. |
| Migracja | Wersjonowana zmiana bazy, funkcji, uprawnień lub technicznych danych katalogu. |
| RLS | Reguły dostępu do rekordów według uwierzytelnionego użytkownika. |
| Auth | Obsługa kont i sesji logowania w Supabase. |
| UUID | Stały identyfikator konta lub rekordu; nie zmienia się wraz z nazwą. |
| RPC | Funkcja bazy wywoływana przez API, np. atomowy zapis struktury planu. |
| Rewizja | Numer wersji rekordu pomagający wykryć konflikt równoległych zmian. |
| Service worker | Element PWA zarządzający plikami aplikacji i aktualizacją. |
| IndexedDB / kolejka lokalna | Magazyn urządzenia, w którym zachowujemy trening przed synchronizacją. |
| Rollback Vercel | Przywrócenie wcześniejszego wydania aplikacji, bez cofania bazy. |
| Backup / restore | Kopia danych i ich odtworzenie; wymaga osobnej weryfikacji. |

Pliki, do których warto wracać w repozytorium:

- `PROJECT.md` — założenia produktu, model danych, etapy i kontrakt wymiany z AI.
- `AGENTS.md` — zasady zmian w kodzie i bazie.
- `README.md` — uruchomienie, konfiguracja, komendy i fikcyjne konta lokalne.
- `PWA_REVIEW.md` — lista weryfikacji zachowania PWA, szczególnie na iOS.
- `supabase/migrations/` — rzeczywista historia zmian bazy.
- `nuxt.config.ts`, `vercel.json`, `package.json` — rzeczywista konfiguracja budowania i publikacji.

W razie rozbieżności pomiędzy opisem a późniejszą konfiguracją sprawdź panel właściwego projektu, bieżące pliki i historię migracji, a następnie uaktualnij tę instrukcję. Nie stosuj starej procedury bez sprawdzenia środowiska, do którego zapisuje.
