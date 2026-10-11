# Siłka

Prywatna aplikacja treningowa dla dwóch osób. Założenia produktu i etapy: [PROJECT.md](PROJECT.md). Zasady pracy: [AGENTS.md](AGENTS.md).

Zrealizowano etapy 1–4: Nuxt 4, Vue 3, TypeScript strict, Tailwind 4, mobilną nawigację, Auth, profil i bazę z RLS. Działają katalog, własne ćwiczenia, edytor jednostek i serii, aktywne przypisanie, archiwizacja i przywracanie oraz eksport/import kopii z podglądem. Działa aktywny trening: dashboard, serie, poprzednie wyniki, odpoczynek, lokalny szkic i synchronizacja oraz podsumowanie. Działają historia z filtrami, wykresy, rekordy, regularność, zatwierdzane sugestie ciężaru oraz edycja profilu. AI i instalacja PWA są kolejnymi etapami.

## Uruchomienie z Supabase w chmurze

```sh
nvm use
npm ci
cp .env.example .env
npm run dev
```

W `.env` ustaw `NUXT_PUBLIC_SUPABASE_URL` i **publiczny** klucz `NUXT_PUBLIC_SUPABASE_KEY` typu publishable albo legacy anon. Nigdy nie używaj `service_role`, klucza secret ani hasła bazy. Konfiguracja odrzuca rozpoznane klucze administracyjne przed zbudowaniem aplikacji. Pliki `.env` i `.env.local` są ignorowane przez Git.

W tym środowisku `.env` jest już skonfigurowany dla projektu `silka`. Konto do panelu administracyjnego Supabase i konta użytkowników Siłki są osobne. Konta Siłki tworzymy przez Authentication → Users → Add user → Create new user, z zaznaczonym Auto confirm user. Publiczna rejestracja i anonimowe logowanie pozostają wyłączone. Utworzenie konta automatycznie tworzy profil.

Panel projektu: https://supabase.com/dashboard/project/dtuyllkefazftqphwfdc

Migracje `20261011000100`–`20261011000800` oraz początkowy `seed.sql` zostały zastosowane w tym projekcie przez SQL Editor; wersje zapisano w `supabase_migrations.schema_migrations`. Potwierdzono 19 wspólnych ćwiczeń, 10 tabel z RLS oraz cztery funkcje planów, cztery funkcje treningów oraz trzy funkcje postępów i profilu z uprawnieniami wywołującego, dostępne dla `authenticated` i niedostępne dla `anon`. Kolejne zmiany zapisuj jako nowe migracje i stosuj przez Supabase CLI po zalogowaniu oraz powiązaniu z właściwym projektem. Nie uruchamiaj ponownie zastosowanych migracji w istniejącej bazie.

## Lokalne środowisko bez danych prywatnych

Wymagany działający Docker. Wersja Node z `.nvmrc` jest także wymagana przez lokalny Supabase CLI.

```sh
nvm use
npm ci
npm run db:start
npm run dev:setup
npm run dev:local
```

`dev:setup` tworzy dwa fikcyjne konta tylko w lokalnym Supabase i zapisuje publiczną konfigurację w `.env.local`. Nie nadpisuje istniejącego pliku. `dev:local` wybiera ten plik zamiast chmurowego `.env`.

Nuxt blokuje drugą instancję w tym samym katalogu. Jeśli pozostawiasz działającą aplikację w chmurze, osobny podgląd testowy uruchom przez `NUXT_IGNORE_LOCK=1 SILKA_TEST_BUILD_DIR=.nuxt-local npm run dev:local -- --port 3001`. Osobny katalog builda chroni pliki pierwszego serwera. Build równoległy do serwera wymaga analogicznie `NUXT_IGNORE_LOCK=1 SILKA_TEST_BUILD_DIR=/private/tmp/silka-nuxt-build npm run build` na macOS; przy zwykłym uruchomieniu po zatrzymaniu dev wystarcza `npm run build`.

| Konto lokalne | Hasło wyłącznie do testów lokalnych |
| --- | --- |
| `pawel@silka.test` | `Silka-local-only-2026!` |
| `partnerka@silka.test` | `Silka-local-only-2026!` |

Te fikcyjne dane nie nadają się do kont w chmurze. Skrypty tworzące użytkowników i testy integracyjne odrzucają adresy inne niż loopback. Nigdy nie kopiuj ich klucza administracyjnego do konfiguracji aplikacji.

`npm run db:stop` zatrzymuje lokalny projekt z zachowaniem danych. `npm run db:reset` **usuwa lokalne dane**, odtwarza migracje i seed; potem uruchom ponownie `dev:setup`. Nie dotyka projektu w chmurze.

## Weryfikacja

```sh
npm run lint
npm run typecheck
npm test
npm run test:db
npm run test:auth
npm run test:plans
npm run test:workouts
npm run test:progress
npm run build
```

- 18 testów jednostkowych: konfiguracja, Auth, liczby z przecinkiem, limity planu, wersja eksportu, jawne mapowanie, kopiowanie danych Vue, kolejność serii, kolejka i izolacja szkicu, zakończenie, timer, regularność, walidacja profilu, reguła progresji, granice ciężaru i odrzucenie nieaktualnego podglądu sugestii.
- 75 testów pgTAP: odczyty i zapisy RLS, podmiana właściciela, obce FK, wspólny i prywatny katalog, integralność serii, historia oraz brak uwierzytelnienia. Dane testu są wycofywane transakcją.
- Testy integracyjne: rzeczywiste logowanie dwóch lokalnych kont przez Auth i PostgREST, izolacja profili, wylogowanie, błędne hasło i blokada rejestracji.
- `test:plans`: sześć scenariuszy przez Auth/PostgREST (7 wyników TAP z testem nadrzędnym): atomowy zapis grafu, ponowienie operacji, izolacja dwóch kont i odmowa anonimowa, rollback po błędzie, ścisła walidacja, konflikt rewizji oraz aktywacja/archiwizacja/przywrócenie. Skrypt usuwa wyłącznie własne losowe lokalne rekordy testowe.
- `test:workouts`: sześć scenariuszy przez Auth/PostgREST (7 wyników TAP z testem nadrzędnym): atomowy i idempotentny start, izolacja dwóch kont i odmowa anonimowa, niezależność snapshotu od edycji planu, walidacja i rollback, stabilne serie, kolejka, konflikt rewizji, zakończenie, podsumowanie tygodnia i zgodne poprzednie wyniki. Skrypt tworzy i usuwa wyłącznie własne losowe lokalne konta testowe.
- `test:progress`: sześć scenariuszy (7 wyników TAP z nadrzędnym): rekord z całej historii i wykres 30 sesji, rozgrzewki i porzucenie, zgodność sprzętu i konwencji, masa ciała, asysta, niejednoznaczna historia, izolacja dwóch kont i anonima, granica tygodnia w strefie oraz atomowy zapis własnego profilu. Test tworzy i usuwa wyłącznie losowe lokalne konta.
- Typy bazy: `npm run db:types` generuje `shared/types/database.generated.ts` z działającej lokalnej bazy. Nie edytuj tego pliku ręcznie.

Ręcznie sprawdzono błędne hasło, logowanie obu lokalnych kont, nawigację, sesję po odświeżeniu, wylogowanie, zmianę konta i ochronę bezpośredniego wejścia na prywatny ekran. Widok 390 × 844 nie ma poziomego przewijania; elementy dolnej nawigacji mają wysokość 56 px. Test przeglądarki nie zastępuje testów na fizycznym iPhonie.

Etap 2 sprawdzono w przeglądarce na dwóch lokalnych kontach: utworzenie i edycja planu, ciężary `82,5`, `80` oraz puste pole, zmiana kolejności i odczyt po odświeżeniu, prywatne ćwiczenie z ciężarem na rękę, eksport, anulowanie importu, jawne mapowanie ćwiczenia i zatwierdzony import na drugim koncie. Drugie konto nie widzi oryginalnego planu. Sprawdzono aktywację, archiwizację i przywracanie. Fikcyjne plany z tego testu pozostają wyłącznie w lokalnej bazie.

## Plany i kopie

Lista `/plans` udostępnia edytor, katalog oraz import. Formularz zmienia kolejność jednostek, ćwiczeń i serii, obsługuje zakres powtórzeń, odpoczynek i różne sposoby liczenia kilogramów. Zapis całego grafu jest transakcyjny, z kontrolą rewizji i bez duplikowania ostatniej ponawianej operacji. Przy konflikcie formularz zachowuje zmiany; „Odśwież dane” wymaga jawnego odrzucenia szkicu. Edytor wymaga połączenia, a przejście z niezapisanymi zmianami pokazuje potwierdzenie.

„Eksportuj kopię” udostępnia zapisany plan jako plik lub tekst JSON. Kontrakt `silka-plan` v1 (Zod) i limit 256 KiB są opisane w `PROJECT.md`. Import nie jest konsultacją AI i wymaga podglądu oraz zatwierdzenia. Ćwiczenia prywatne nadawcy wymagają jawnego dopasowania. Kopia dostaje nowy identyfikator i właściciela z Auth; nie zmienia oryginału, historii ani aktywnego planu odbiorcy.

## Aktywny trening

Na Start wybierz jednostkę aktywnego planu i rozpocznij trening. Wpisuj wykonane powtórzenia i ciężar (również z przecinkiem), oznaczaj serie, pomijaj je lub dodawaj kolejne. Poprzednie wyniki są informacją, pola wykonania zaczynają się puste. Wykonana seria uruchamia odpoczynek; timer można wydłużyć o 30 sekund lub zakończyć. Zakończenie wymaga co najmniej jednej wykonanej serii i oznacza pozostałe jako pominięte. Porzucenie zachowuje sesję, ale wyklucza ją z postępów. Szczegóły ostatnich sesji otwierają się z dashboardu; pełna historia z filtrami jest na ekranie Postępy.

Każda poprawna zmiana trafia najpierw do IndexedDB osobno dla zalogowanego konta, później do transakcyjnego RPC. UI odróżnia zapis lokalny, kolejkę, sukces na koncie i konflikt. Odświeżenie oraz powrót do karty odzyskują szkic; synchronizacja ponawia się po odzyskaniu sieci i podczas pracy w aplikacji. Pierwsze pobranie nowej sesji wymaga połączenia. Przy konflikcie można pobrać szkic wyników i świadomie zastąpić go wersją z konta. Eksport awaryjny nie ma automatycznego importu. Wylogowanie z oczekującymi zmianami wymaga potwierdzenia; szkic pozostaje dostępny tylko po powrocie na to samo konto w tej przeglądarce.

Wymagane są IndexedDB, Web Locks i BroadcastChannel oraz HTTPS lub localhost. Nie czyść danych witryny przed wysłaniem zmian. Pełne otwarcie aplikacji bez sieci, service worker i instalacja na iOS należą do etapu 6; lokalny magazyn nie zastępuje kopii w bazie. Timer nie oferuje alarmu przy zablokowanym ekranie.

Etap 3 sprawdzono na lokalnych kontach w widoku 390 × 844: start, szybkie wpisywanie, przecinek i walidacja, wykonanie serii, dodawanie serii, timer, odświeżenie, poprzednie wyniki, zakończenie i porzucenie. Przy wyłączonym lokalnym API wykonano serię, odświeżono stronę z dostępnymi zasobami aplikacji, odzyskano szkic i timer, zakończono trening i po przywróceniu API wysłano kolejkę bez duplikatów. Sprawdzono konflikt rewizji, jego jawne odrzucenie oraz zachowanie szkicu przez wylogowanie i jego izolację przy zmianie konta. Testy w przeglądarce nie potwierdzają jeszcze zachowania zainstalowanej PWA na fizycznym iPhonie.

Publiczne API projektu w chmurze potwierdza aktywny provider e-mail, wyłączoną rejestrację i odmowę anonimowego odczytu profili (`42501`). Rzeczywistych haseł użytkowników nie używano w automatycznych testach.

## Postępy i profil

Na `/progress` są statystyki 12 tygodni, historia po 20 sesji z filtrami, rekord wybranego wariantu ćwiczenia i wykres do 30 ostatnich zgodnych sesji. Rekord obejmuje całą historię. Liczą się wykonane serie robocze zakończonych treningów; porzucone sesje pozostają wyłącznie w historii. Asysta jest porównywana w przeciwnym kierunku niż zewnętrzny ciężar. Szczegóły jednostek, zakresów i obliczeń są w `PROJECT.md`.

Podczas treningu „Zaproponuj ciężar” sprawdza ostatnią zgodną sesję. Komplet planowanych serii przy jednym ciężarze i górnym zakresie pozwala zaproponować kolejny krok; inaczej propozycja utrzymuje ciężar albo wyjaśnia brak danych. „Zobacz zastosowanie” pokazuje konkretne serie i edytowalny ciężar. Dopiero zatwierdzenie uzupełnia ciężary przez lokalny zapis i kolejkę. Plan i wykonanie serii nie zmieniają się automatycznie.

Profil pozwala ustawić nazwę, cel, strefę czasową i cel tygodnia (domyślnie 3, zakres 1–7). Zmiana celu przelicza prezentowaną regularność. Wyjście z edycji wymaga potwierdzenia odrzucenia formularza.

Etap 4 sprawdzono w przeglądarce w widoku 390 × 844 na lokalnych danych: wykres ciężaru i objętości, rekord, filtry, druga strona historii, zapis profilu, anulowanie i zatwierdzenie edytowanego ciężaru `83,75`, zachowanie po odświeżeniu oraz brak cudzej historii po zmianie konta. Wyłączenie lokalnego API pokazuje błędy odczytu; po jego przywróceniu ponowienie odzyskuje dane. Fikcyjne sesje są wyłącznie w lokalnej bazie. Migracje postępów zastosowano również w chmurze; aplikacja z rzeczywistym kontem pokazuje poprawny pusty stan.

## Kierunek interfejsu

`DESIGN.md` opisuje motyw dziennika treningowego: duże liczby, numerowane plany i ćwiczenia, wynik przed statystykami oraz jedną główną akcję na starcie. Układ ma osobne stany telefonu, tabletu i szerokiego ekranu. Dolna nawigacja przechodzi do nagłówka od 1000 px.

Po zmianie layoutu sprawdzono szerokości 320, 390, 700, 850, 1000 i 1280 px, klawiaturę, dialogi oraz główne przepływy. Szczegóły, kontrast i raport antislop są w `LAYOUT_REVIEW.md`. Weryfikacja zainstalowanej PWA na fizycznym iPhonie pozostaje do wykonania.

## Statyczny build i hosting

`npm run build` generuje `.output/public` z `ssr: false`. `vercel.json` określa katalog wynikowy, routing SPA i podstawowe nagłówki. W Vercel ustaw te same dwie publiczne zmienne środowiskowe oraz zgodną wersję Node 22. Konfiguracja jest wbudowywana w statyczne pliki; zmiana wymaga ponownego builda. Wdrożenie nie zostało jeszcze wykonane.

Odzyskiwanie hasła, konfiguracja poczty i docelowych redirect URLs, backupy, PWA i zachowanie iOS wymagają osobnej weryfikacji przed wydaniem.

## Zależności

Lockfile jest źródłem dokładnych wersji. Na 11.10.2026 `npm audit` wskazuje 11 ostrzeżeń high w łańcuchu narzędzi Nuxt (braces i node-forge oraz zależności nadrzędne); `npm audit --omit=dev` wskazuje 0 podatności. Nie ma jeszcze zgodnych wydań usuwających te dwie przyczyny. Devtools są wyłączone, serwer developerski nasłuchuje wyłącznie na loopback, a produkcyjny wynik jest statyczny. Przed wydaniem ponownie sprawdź aktualizacje i audyt. Override simple-git usuwa zgłoszone podatności critical jego wcześniejszej wersji.
