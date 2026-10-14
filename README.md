# Siłka

Prywatna aplikacja treningowa dla dwóch osób. Założenia produktu i etapy: [PROJECT.md](PROJECT.md). Zasady pracy: [AGENTS.md](AGENTS.md).

Zrealizowano etapy 1–5: Nuxt 4, Vue 3, TypeScript strict, Tailwind 4, mobilną nawigację, Auth, profil i bazę z RLS. Działają wspólny katalog z dodawaniem ćwiczeń przez zalogowane konta, edytor jednostek i serii, aktywne przypisanie, archiwizacja i przywracanie oraz eksport/import kopii z podglądem. Działa aktywny trening: dashboard, serie, poprzednie wyniki, odpoczynek, lokalny szkic i synchronizacja oraz podsumowanie. Działają historia z filtrami, wykresy, rekordy, regularność, zatwierdzane sugestie ciężaru oraz edycja profilu. Ręczna konsultacja AI obsługuje prompty, cztery akcje JSON v1 i zatwierdzany zapis. Etap 6 ma pliki instalacyjne PWA, otwieranie bez serwera, ręczne aktualizacje i wdrożenie HTTPS; testy fizycznego iPhone’a pozostają otwarte.

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

Migracje `20261011000100`–`20261012000300` oraz początkowy `seed.sql` zostały zastosowane w tym projekcie przez SQL Editor; wersje zapisano w `supabase_migrations.schema_migrations`. Bazowy katalog ma 81 ćwiczeń w 9 grupach mięśniowych. Produkcja ma obecnie 85 wspólnych wpisów, w tym 4 dawniej prywatne, oraz 12 tabel z RLS. Funkcje planów, zapisu treningów, postępów, profilu i konsultacji działają z uprawnieniami wywołującego (usuwanie treningu jest opisanym poniżej wyjątkiem), dostępne dla `authenticated` i niedostępne dla `anon`. Kolejne zmiany zapisuj jako nowe migracje i stosuj przez Supabase CLI po zalogowaniu oraz powiązaniu z właściwym projektem. Nie uruchamiaj ponownie zastosowanych migracji w istniejącej bazie.

Rozszerzenie katalogu `20261011001100` zastosowano lokalnie przez `supabase migration up --local`, następnie w chmurze w transakcji z zapisem wersji. Przeszły `npm run test:db` (75/75) oraz `npm run test:plans` (7/7). Sprawdzono 80 wspólnych aktywnych rekordów, 61 nowych i brak powtórzonych nazw. W produkcyjnej aplikacji pierwsza strona pobrała 50 pozycji, „Pokaż więcej” dołączyło pozostałe 30 bez duplikatów, a wyszukiwanie „przysiad” zwróciło 7 wariantów. Wybór nowego ćwiczenia pokazał komunikat dostępności. Zmiana dotyczy danych katalogu, więc nowe ćwiczenia są dostępne po ponownym otwarciu katalogu z połączeniem internetowym, bez aktualizacji PWA.

Migracja `20261012000100_add_lying_leg_curl.sql` dodaje „Uginanie nóg leżąc na maszynie” jako osobne wspólne ćwiczenie: kg łącznie, domyślny krok 2,5 kg. Zastosowano ją lokalnie i w chmurze z zapisem wersji. Lokalne ponowienie nie dodało duplikatu: katalog ma 81 aktywnych wspólnych rekordów. Ponownie przeszły `npm run test:db` (75/75) i `npm run test:plans` (7/7). Migracja nie zmienia schematu ani RLS; nie wymaga regenerowania typów lub wdrażania nowego builda. Prywatne plany zapisujemy osobno przez RPC, bez danych kont w migracji.

Migracja `20261012000200_share_exercise_catalog.sql` jest zastosowana lokalnie i w produkcji. Wszystkie ćwiczenia są wspólne dla zalogowanych użytkowników; dodawanie przez aplikację tworzy wspólny wpis. `owner_id` pozostaje zawsze `null`, edycja i usuwanie są administracyjne, a anonimowe konto nie ma dostępu do katalogu. Zachowano ID, pozostałe parametry ćwiczeń oraz prywatne plany i historię; skrypt produkcyjny porównał ich odciski przed zatwierdzeniem. Przeszły testy RLS (81), planów (7), treningów (7), jednostkowe (28), lint, typecheck i build. Regeneracja typów nie wykazała różnic. Teksty formularza i katalogu opisują teraz wspólną bazę ćwiczeń.

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
npm run test:ai
npm run build
```

- 23 testy jednostkowe: konfiguracja, Auth, liczby z przecinkiem, limity planu, wersja eksportu, jawne mapowanie, kopiowanie danych Vue, kolejność serii, kolejka i izolacja szkicu, zakończenie, timer, regularność, walidacja profilu, reguła progresji, granice ciężaru i odrzucenie nieaktualnego podglądu sugestii. AI: cztery warianty kontraktu, redakcja promptu, limity UTF-8, niedostępne ID, dobór serii i porównanie zmian.
- 75 testów pgTAP: odczyty i zapisy RLS, podmiana właściciela, obce FK, wspólny i prywatny katalog, integralność serii, historia oraz brak uwierzytelnienia. Dane testu są wycofywane transakcją.
- Testy integracyjne: rzeczywiste logowanie dwóch lokalnych kont przez Auth i PostgREST, izolacja profili, wylogowanie, błędne hasło i blokada rejestracji.
- `test:plans`: sześć scenariuszy przez Auth/PostgREST (7 wyników TAP z testem nadrzędnym): atomowy zapis grafu, ponowienie operacji, izolacja dwóch kont i odmowa anonimowa, rollback po błędzie, ścisła walidacja, konflikt rewizji oraz aktywacja/archiwizacja/przywrócenie. Skrypt usuwa wyłącznie własne losowe lokalne rekordy testowe.
- `test:workouts`: sześć scenariuszy przez Auth/PostgREST (7 wyników TAP z testem nadrzędnym): atomowy i idempotentny start, izolacja dwóch kont i odmowa anonimowa, niezależność snapshotu od edycji planu, walidacja i rollback, stabilne serie, kolejka, konflikt rewizji, zakończenie, podsumowanie tygodnia i zgodne poprzednie wyniki. Skrypt tworzy i usuwa wyłącznie własne losowe lokalne konta testowe.
- `test:progress`: sześć scenariuszy (7 wyników TAP z nadrzędnym): rekord z całej historii i wykres 30 sesji, rozgrzewki i porzucenie, zgodność sprzętu i konwencji, masa ciała, asysta, niejednoznaczna historia, izolacja dwóch kont i anonima, granica tygodnia w strefie oraz atomowy zapis własnego profilu. Test tworzy i usuwa wyłącznie losowe lokalne konta.
- Typy bazy: `npm run db:types` generuje `shared/types/database.generated.ts` z działającej lokalnej bazy. Nie edytuj tego pliku ręcznie.
- `test:ai`: siedem scenariuszy (8 wyników TAP z nadrzędnym): izolacja konsultacji i planów dwóch kont oraz anonima, obce FK, idempotentne przygotowanie, błędne pola/wersja/JSON/ciężary/rozmiar/katalog, rollback, cztery akcje, ponowienie zapisu, wskazanie serii i konflikt rewizji. Test usuwa wyłącznie własne losowe lokalne konta.

Ręcznie sprawdzono błędne hasło, logowanie obu lokalnych kont, nawigację, sesję po odświeżeniu, wylogowanie, zmianę konta i ochronę bezpośredniego wejścia na prywatny ekran. Widok 390 × 844 nie ma poziomego przewijania; elementy dolnej nawigacji mają wysokość 56 px. Test przeglądarki nie zastępuje testów na fizycznym iPhonie.

Etap 2 sprawdzono w przeglądarce na dwóch lokalnych kontach: utworzenie i edycja planu, ciężary `82,5`, `80` oraz puste pole, zmiana kolejności i odczyt po odświeżeniu, ćwiczenie z ciężarem na rękę (wówczas prywatne, od migracji `20261012000200` wspólne), eksport, anulowanie importu, jawne mapowanie ćwiczenia i zatwierdzony import na drugim koncie. Drugie konto nie widzi oryginalnego planu. Sprawdzono aktywację, archiwizację i przywracanie. Fikcyjne plany z tego testu pozostają wyłącznie w lokalnej bazie.

## Plany i kopie

Lista `/plans` udostępnia edytor, katalog oraz import. Formularz zmienia kolejność jednostek, ćwiczeń i serii, obsługuje zakres powtórzeń, odpoczynek i różne sposoby liczenia kilogramów. Zapis całego grafu jest transakcyjny, z kontrolą rewizji i bez duplikowania ostatniej ponawianej operacji. Przy konflikcie formularz zachowuje zmiany; „Odśwież dane” wymaga jawnego odrzucenia szkicu. Edytor wymaga połączenia, a przejście z niezapisanymi zmianami pokazuje potwierdzenie.

„Eksportuj kopię” udostępnia zapisany plan jako plik lub tekst JSON. Kontrakt `silka-plan` v1 (Zod) i limit 256 KiB są opisane w `PROJECT.md`. Import nie jest konsultacją AI i wymaga podglądu oraz zatwierdzenia. Ćwiczenia prywatne nadawcy wymagają jawnego dopasowania. Kopia dostaje nowy identyfikator i właściciela z Auth; nie zmienia oryginału, historii ani aktywnego planu odbiorcy.

## Aktywny trening

Na Start wybierz jednostkę aktywnego planu i rozpocznij trening. Wpisuj wykonane powtórzenia i ciężar (również z przecinkiem), oznaczaj serie, pomijaj je lub dodawaj kolejne. Poprzednie wyniki są informacją, pola wykonania zaczynają się puste. Wykonana seria uruchamia odpoczynek; timer można wydłużyć o 30 sekund lub zakończyć. Zakończenie wymaga co najmniej jednej wykonanej serii i oznacza pozostałe jako pominięte. Porzucenie zachowuje sesję, ale wyklucza ją z postępów. Szczegóły ostatnich sesji otwierają się z dashboardu; pełna historia z filtrami jest na ekranie Postępy.

Każda poprawna zmiana trafia najpierw do IndexedDB osobno dla zalogowanego konta, później do transakcyjnego RPC. UI odróżnia zapis lokalny, kolejkę, sukces na koncie i konflikt. Odświeżenie oraz powrót do karty odzyskują szkic; synchronizacja ponawia się po odzyskaniu sieci i podczas pracy w aplikacji. Pierwsze pobranie nowej sesji wymaga połączenia. Przy konflikcie można pobrać szkic wyników i świadomie zastąpić go wersją z konta. Eksport awaryjny nie ma automatycznego importu. Wylogowanie z oczekującymi zmianami wymaga potwierdzenia; szkic pozostaje dostępny tylko po powrocie na to samo konto w tej przeglądarce.

Wymagane są IndexedDB, Web Locks i BroadcastChannel oraz HTTPS lub localhost. Nie czyść danych witryny przed wysłaniem zmian. Produkcyjny build zapisuje pliki aplikacji do otwierania bez sieci; lokalny magazyn nie zastępuje kopii w bazie. Timer nie oferuje alarmu przy zablokowanym ekranie.

Etap 3 sprawdzono na lokalnych kontach w widoku 390 × 844: start, szybkie wpisywanie, przecinek i walidacja, wykonanie serii, dodawanie serii, timer, odświeżenie, poprzednie wyniki, zakończenie i porzucenie. Przy wyłączonym lokalnym API wykonano serię, odświeżono stronę z dostępnymi zasobami aplikacji, odzyskano szkic i timer, zakończono trening i po przywróceniu API wysłano kolejkę bez duplikatów. Sprawdzono konflikt rewizji, jego jawne odrzucenie oraz zachowanie szkicu przez wylogowanie i jego izolację przy zmianie konta. Testy w przeglądarce nie potwierdzają jeszcze zachowania zainstalowanej PWA na fizycznym iPhonie.

Publiczne API projektu w chmurze potwierdza aktywny provider e-mail, wyłączoną rejestrację i odmowę anonimowego odczytu profili (`42501`). Rzeczywistych haseł użytkowników nie używano w automatycznych testach.

## Postępy i profil

Na `/progress` są statystyki 12 tygodni, historia po 20 sesji z filtrami, rekord wybranego wariantu ćwiczenia i wykres do 30 ostatnich zgodnych sesji. Rekord obejmuje całą historię. Liczą się wykonane serie robocze zakończonych treningów; porzucone sesje pozostają wyłącznie w historii. Asysta jest porównywana w przeciwnym kierunku niż zewnętrzny ciężar. Szczegóły jednostek, zakresów i obliczeń są w `PROJECT.md`.

Podczas treningu „Zaproponuj ciężar” sprawdza ostatnią zgodną sesję. Komplet planowanych serii przy jednym ciężarze i górnym zakresie pozwala zaproponować kolejny krok; inaczej propozycja utrzymuje ciężar albo wyjaśnia brak danych. „Zobacz zastosowanie” pokazuje konkretne serie i edytowalny ciężar. Dopiero zatwierdzenie uzupełnia ciężary przez lokalny zapis i kolejkę. Plan i wykonanie serii nie zmieniają się automatycznie.

Profil pozwala ustawić nazwę, cel, strefę czasową i cel tygodnia (domyślnie 3, zakres 1–7). Zmiana celu przelicza prezentowaną regularność. Wyjście z edycji wymaga potwierdzenia odrzucenia formularza.

Etap 4 sprawdzono w przeglądarce w widoku 390 × 844 na lokalnych danych: wykres ciężaru i objętości, rekord, filtry, druga strona historii, zapis profilu, anulowanie i zatwierdzenie edytowanego ciężaru `83,75`, zachowanie po odświeżeniu oraz brak cudzej historii po zmianie konta. Wyłączenie lokalnego API pokazuje błędy odczytu; po jego przywróceniu ponowienie odzyskuje dane. Fikcyjne sesje są wyłącznie w lokalnej bazie. Migracje postępów zastosowano również w chmurze; aplikacja z rzeczywistym kontem pokazuje poprawny pusty stan.

## Trwałe usuwanie treningu

Otwórz sesję z historii w Postępach albo aktywny trening ze Startu. Wybierz „Usuń ten trening”, sprawdź nazwę, datę i liczbę serii, następnie „Usuń trwale”. „Anuluj” i Escape pozostawiają sesję bez zmian. Można usunąć trening pusty, aktywny, zakończony lub porzucony; nie trzeba najpierw oznaczać żadnej serii jako wykonanej.

Usunięcie wymaga internetu i obejmuje dane sesji, jej ćwiczenia oraz lokalną kolejkę tego treningu. Nie usuwa planu. Wyniki znikają z historii i kolejnych wyliczeń statystyk, rekordów oraz sugestii. Zapisane wcześniej konsultacje AI zachowują swoje snapshoty. Przy konflikcie rewizji odczytaj aktualną wersję z konta, potwierdzając ewentualne odrzucenie lokalnego szkicu, zanim ponowisz usuwanie. Po niepewnej odpowiedzi serwera ponowienie jest bezpieczne.

Migracja `20261012000300_delete_workouts.sql` jest zastosowana lokalnie i w produkcji z zapisem wersji. Skrypt wdrożeniowy potwierdził niezmienność istniejących danych oraz uprawnienia; nie usunął żadnej sesji. Zmiana interfejsu wymaga aktualnego builda aplikacji. Prywatna tabela `deleted_workout_sessions` zachowuje wyłącznie UUID sesji i właściciela, aby opóźniona synchronizacja nie odtworzyła skasowanych danych. Klient ma do niej tylko odczyt; usuwanie sesji odbywa się przez RPC sprawdzające właściciela i rewizję.

Testy: `npm run test:workouts` obejmuje także `workout-deletion.test.mjs`: dwa fikcyjne konta i anon, cascade, pusty trening, porzucenie, statystyki, konflikt rewizji, ponowienie i spóźnione operacje.

Weryfikacja z 12.10.2026: lint i typecheck przeszły, testy jednostkowe 31/31, treningów 16/16 i pgTAP RLS 81/81. Build z oddzielnym katalogiem `SILKA_TEST_BUILD_DIR=.nuxt-pwa-test npm run build` przeszedł i wygenerował 53 zasoby PWA; zwykły build wymaga zakończenia serwera dev korzystającego z `.nuxt`. Typy wygenerowano z rzeczywistej lokalnej bazy, a wersję migracji zapisano w jej historii.

Przegląd interfejsu dotyczył wyłącznie dodanej funkcji, według kierunku `DESIGN.md` (ENERGY 2 / RHYTHM 2 / MOTION 1):

- PASS, układ: okno mieści się przy 390 px i na szerokim ekranie; nazwa sesji, data i liczba serii wskazują dokładnie usuwane dane. Zrzuty lokalne: `/tmp/silka-usuwanie-mobile.png` i `/tmp/silka-usuwanie-potwierdzenie.png`.
- PASS, cel wyglądu: istniejąca typografia i dialog; czerwony opis wyróżnia nieodwracalną akcję. Bez nowych ozdobników, ikon, fontów, animacji i zależności.
- PASS, obsługa: otwarcie, Anuluj, Tab i Escape sprawdzono w przeglądarce; nowe kontrolki mają 48 px wysokości. Transakcyjne usuwanie oraz błędy potwierdzają testy RPC i usług. Nie klikano trwałego usuwania prawdziwego treningu.
- PASS, odzyskanie: przy zatrzymanej lokalnej bramie API dopisana seria przetrwała odświeżenie. Usunięcie fikcyjnej sesji przez RPC z osobnego połączenia i powrót API spowodowały rozpoznanie usunięcia, wyczyszczenie jej kolejki oraz brak wznowienia na Starcie. Konto testowe posprzątano, bramę przywrócono. Nie jest to test fizycznego iPhone’a.

## Ręczna konsultacja AI

Nowy plan bez historii: **Plany → Nowy plan → Wypełnij ankietę**. Uzupełnij cel, doświadczenie, czas, dni, sprzęt, ograniczenia i preferencje. Po „Przygotuj prompt z ankiety” obejrzyj tekst, skopiuj go do wybranego AI i wklej otrzymany JSON do tej samej konsultacji. Sprawdź podgląd i dopiero wtedy potwierdź zapis. Plan nie aktywuje się automatycznie. Ścieżka z ankietą zawsze pomija historię; „Ułóż na bazie historii” zachowuje dotychczasowy wybór zakresu. Pusty edytor jest dostępny przez „Ułóż plan samodzielnie”.

Odpowiedzi ankiety, również informacje o ograniczeniach, zapisują się na prywatnym koncie po przygotowaniu promptu i trafiają do jego treści. Przed tym krokiem istnieją tylko w pamięci widoku, więc odświeżenie je usuwa. Nie podawaj szczegółowej dokumentacji medycznej; ankieta nie jest oceną zdolności do ćwiczeń. UI i generator korzystają z istniejącego JSON v1 oraz limitu instrukcji 2000 znaków, bez migracji i nowych usług. Ankietę publikuje się z buildem aplikacji.

Weryfikacja ankiety z 14.10.2026: lint, typecheck, testy jednostkowe 34/34, integracja AI 8/8 i build przeszły. Lokalnie sprawdzono formularz, walidację, rzeczywiste kopiowanie/wklejenie promptu, import, anulowanie i zatwierdzenie, błąd API z ponowieniem oraz szerokości 320–1280 px. Szczegóły i raport PASS antislop: `AI_INTAKE_REVIEW.md`. To nie zastępuje testu fizycznego iPhone’a.

W Planach wybierz „Konsultacja AI”; w edytorze zapisanego planu dostępne jest „Skonsultuj plan z AI”. Wybierz nowy plan, zamianę planu, analizę historii albo progresję ciężaru oraz zakres 0/10/20 zakończonych treningów. Przygotowany prompt można obejrzeć i skopiować. Samodzielnie wklej go do wybranego LLM; aplikacja nie korzysta z API LLM.

Odpowiedź wklej jako sam JSON v1. „Sprawdź odpowiedź” waliduje kontrakt i pokazuje różnice. Przy progresji wskaż serię dla każdej wybranej sugestii i wyświetl zmiany ciężarów. Dopiero zatwierdzenie zapisuje dane. Nowy plan nie staje się automatycznie aktywny, zamiana obejmuje również opis i notatki, a analiza nie zmienia planu ani historii.

Kontekst oraz zatwierdzona odpowiedź są prywatne na koncie, chronione przez RLS. Lista pokazuje 10 ostatnich konsultacji. Wklejony tekst przed zatwierdzeniem istnieje tylko w pamięci strony; odświeżenie go usuwa. Wymagane jest połączenie. Prompt pomija opis i prywatne notatki; cały tekst jest dostępny przed przekazaniem do zewnętrznego narzędzia. Odpowiedź ma limit 256 KiB UTF-8. Konflikt rewizji wymaga nowej konsultacji. Ponowienie identycznego zatwierdzenia zwraca zapisany wynik bez duplikatu.

Etap 5 sprawdzono na lokalnych danych testowych: cztery akcje, skopiowanie promptu, błędny JSON, anulowanie i unieważnienie podglądu po edycji tekstu, wybór serii, dialog z Escape oraz odczyt zatwierdzonych danych po odświeżeniu. Nieaktualny plan blokuje podgląd. Wyłączenie lokalnej bramy API pokazuje błędy na obu ekranach; po przywróceniu połączenia oba przyciski ponowienia odzyskują dane. Formularz i podgląd mieszczą się w szerokościach 320, 390, 700, 850, 1000 i 1280 px; kontrolki mają co najmniej 44 × 44 px. Użyto testowych odpowiedzi JSON bez automatyzowania zewnętrznego LLM.

## Kierunek interfejsu

`DESIGN.md` opisuje motyw dziennika treningowego: duże liczby, numerowane plany i ćwiczenia, wynik przed statystykami oraz jedną główną akcję na starcie. Układ ma osobne stany telefonu, tabletu i szerokiego ekranu. Dolna nawigacja przechodzi do nagłówka od 1000 px.

Po zmianie layoutu sprawdzono szerokości 320, 390, 700, 850, 1000 i 1280 px, klawiaturę, dialogi oraz główne przepływy. Szczegóły, kontrast i raport antislop są w `LAYOUT_REVIEW.md`. Weryfikacja zainstalowanej PWA na fizycznym iPhonie pozostaje do wykonania.

## Statyczny build i hosting

`npm run build` generuje `.output/public` z `ssr: false` i jawnym presetem Nitro `static`. Preset zachowuje ten sam katalog także w CI Vercel, gdzie automatyczne wykrycie dostawcy zmieniłoby miejsce zapisu. `vercel.json` określa katalog wynikowy, routing SPA i podstawowe nagłówki. W Vercel ustaw te same dwie publiczne zmienne środowiskowe oraz zgodną wersję Node 22. Konfiguracja jest wbudowywana w statyczne pliki; zmiana wymaga ponownego builda.

Wdrożona aplikacja: https://silka-jureczko.vercel.app. Projekt Vercel `silka` na Hobby śledzi produkcyjną gałąź `feat/progress`; każdy push uruchamia build. `main` nadal zawiera dokumentację. Ustawiono Node 22.x, `npm ci` i dwie publiczne zmienne Supabase w środowisku Production. Stary adres `project-bcug5.vercel.app` przekierowuje na nowy. Potwierdzono logowanie i odczyt profilu w HTTPS, gotowość lokalnych plików PWA, 53 zasoby cache, manifest i ikony oraz bezpośredni routing `/profile` i `/workouts/:id`. `/sw.js` ma typ JavaScript i `no-cache, no-store, must-revalidate`.

Na ekranie importu Vercel wybierz Hobby, repozytorium `PawelJureczko/silka` oraz gałąź zawierającą aktualną implementację. `main` zawiera obecnie wyłącznie dokumentację. Preset Other, build `npm run build`, output `.output/public`, install `npm ci`, Node 22.x. Nie włączaj płatnych dodatków. Publiczne zmienne to `NUXT_PUBLIC_SUPABASE_URL` i `NUXT_PUBLIC_SUPABASE_KEY`; nie dodawaj `.env.local`, hasła bazy ani kluczy administracyjnych. Po wdrożeniu sprawdź `/sw.js` (JavaScript, bez cache HTTP), manifest, ikony i bezpośrednie wejście w `/profile` oraz szczegóły treningu.

## PWA i instalacja

`postbuild` generuje worker z plików `.output/public`. Service worker jest wyłączony przy `npm run dev`; do testów używaj produkcyjnego builda i statycznego serwera z fallbackiem SPA. Test lokalny z Supabase: `SILKA_TEST_BUILD_DIR=.nuxt-pwa-test npm run build -- --dotenv .env.local`. Przed rzeczywistym wdrożeniem wykonaj zwykłe `npm run build` z konfiguracją chmurową.

Na iPhonie otwórz adres HTTPS w Safari, wybierz Udostępnij → Do ekranu początkowego i pozostaw „Otwieraj jako aplikację”, jeśli jest dostępne. Uruchom ikonę i zaloguj się. W profilu poczekaj na potwierdzenie zapisania plików. Otwórz trening przy działającym internecie, zanim przejdziesz offline. Zainstalowana aplikacja może mieć osobną sesję od karty przeglądarki.

Aktualizację uruchom z Profilu. Aplikacja najpierw sprawdza lokalny zapis wszystkich kont; aktywny trening lub niewysłane zmiany blokują przeładowanie. Inne karty zachowują otwarte formularze. Jeśli błąd przygotowania lub sprawdzania aktualizacji utrzymuje się, przywróć połączenie i ponów próbę. Nie usuwaj danych witryny jako sposobu naprawy przy oczekującym zapisie.

Przed uznaniem etapu 6 za zakończony:

- Potwierdzenie izolacji dwóch rzeczywistych kont na wdrożonej aplikacji HTTPS.
- Fizyczny iPhone: safe area, klawiatura i obsługa jedną ręką. Użytkownik potwierdził instalację PWA; zachowanie treningu na urządzeniu nadal wymaga testów.
- Tryb samolotowy po załadowaniu treningu: seria, zamknięcie/ponowne otwarcie, zakończenie, odzyskanie sieci i brak duplikatów.
- Powrót z tła i blokady ekranu: timer oraz lokalny szkic. Alarm na zablokowanym ekranie nie jest oferowany.
- Aktualizacja podczas sesji i po synchronizacji, także przy dwóch otwartych kartach.
- Odzyskiwanie konta, konfiguracja poczty i docelowych redirect URLs, eksport historii, procedura kopii bazy oraz sprawdzone odtworzenie. Te elementy nie są jeszcze gotowe.

Lokalne dowody i raport antislop: `PWA_REVIEW.md`. Nie dodano usługi płatnej ani zależności PWA.

## Zależności

Lockfile jest źródłem dokładnych wersji. Na 11.10.2026 `npm audit` wskazuje 11 ostrzeżeń high w łańcuchu narzędzi Nuxt (braces i node-forge oraz zależności nadrzędne); `npm audit --omit=dev` wskazuje 0 podatności. Nie ma jeszcze zgodnych wydań usuwających te dwie przyczyny. Devtools są wyłączone, serwer developerski nasłuchuje wyłącznie na loopback, a produkcyjny wynik jest statyczny. Przed wydaniem ponownie sprawdź aktualizacje i audyt. Override simple-git usuwa zgłoszone podatności critical jego wcześniejszej wersji.
