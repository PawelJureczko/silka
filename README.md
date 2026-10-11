# Siłka

Prywatna aplikacja treningowa dla dwóch osób. Założenia produktu i etapy: [PROJECT.md](PROJECT.md). Zasady pracy: [AGENTS.md](AGENTS.md).

Zrealizowano fundament i etap planów: Nuxt 4, Vue 3, TypeScript strict, Tailwind 4, mobilną nawigację, Auth, profil i bazę z RLS. Działają katalog, własne ćwiczenia, edytor jednostek i serii, aktywne przypisanie, archiwizacja i przywracanie oraz eksport/import kopii z podglądem. Aktywny trening, postępy, AI i instalacja PWA są kolejnymi etapami.

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

Migracje `20261011000100_foundation.sql`, `20261011000200_plans.sql` i `20261011000300_plan_create.sql` oraz początkowy `seed.sql` zostały zastosowane w tym projekcie przez SQL Editor; wersje zapisano w `supabase_migrations.schema_migrations`. Potwierdzono 19 wspólnych ćwiczeń, 10 tabel z RLS oraz cztery funkcje planów z uprawnieniami wywołującego, dostępne dla `authenticated` i niedostępne dla `anon`. Kolejne zmiany zapisuj jako nowe migracje i stosuj przez Supabase CLI po zalogowaniu oraz powiązaniu z właściwym projektem. Nie uruchamiaj ponownie zastosowanych migracji w istniejącej bazie.

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
npm run build
```

- 8 testów jednostkowych: konfiguracja, Auth, liczby z przecinkiem, limity planu, wersja eksportu, jawne mapowanie, kopiowanie danych Vue i kolejność serii.
- 75 testów pgTAP: odczyty i zapisy RLS, podmiana właściciela, obce FK, wspólny i prywatny katalog, integralność serii, historia oraz brak uwierzytelnienia. Dane testu są wycofywane transakcją.
- Testy integracyjne: rzeczywiste logowanie dwóch lokalnych kont przez Auth i PostgREST, izolacja profili, wylogowanie, błędne hasło i blokada rejestracji.
- `test:plans`: sześć scenariuszy przez Auth/PostgREST (7 wyników TAP z testem nadrzędnym): atomowy zapis grafu, ponowienie operacji, izolacja dwóch kont i odmowa anonimowa, rollback po błędzie, ścisła walidacja, konflikt rewizji oraz aktywacja/archiwizacja/przywrócenie. Skrypt usuwa wyłącznie własne losowe lokalne rekordy testowe.
- Typy bazy: `npm run db:types` generuje `shared/types/database.generated.ts` z działającej lokalnej bazy. Nie edytuj tego pliku ręcznie.

Ręcznie sprawdzono błędne hasło, logowanie obu lokalnych kont, nawigację, sesję po odświeżeniu, wylogowanie, zmianę konta i ochronę bezpośredniego wejścia na prywatny ekran. Widok 390 × 844 nie ma poziomego przewijania; elementy dolnej nawigacji mają wysokość 56 px. Test przeglądarki nie zastępuje testów na fizycznym iPhonie.

Etap 2 sprawdzono w przeglądarce na dwóch lokalnych kontach: utworzenie i edycja planu, ciężary `82,5`, `80` oraz puste pole, zmiana kolejności i odczyt po odświeżeniu, prywatne ćwiczenie z ciężarem na rękę, eksport, anulowanie importu, jawne mapowanie ćwiczenia i zatwierdzony import na drugim koncie. Drugie konto nie widzi oryginalnego planu. Sprawdzono aktywację, archiwizację i przywracanie. Fikcyjne plany z tego testu pozostają wyłącznie w lokalnej bazie.

## Plany i kopie

Lista `/plans` udostępnia edytor, katalog oraz import. Formularz zmienia kolejność jednostek, ćwiczeń i serii, obsługuje zakres powtórzeń, odpoczynek i różne sposoby liczenia kilogramów. Zapis całego grafu jest transakcyjny, z kontrolą rewizji i bez duplikowania ostatniej ponawianej operacji. Przy konflikcie formularz zachowuje zmiany; „Odśwież dane” wymaga jawnego odrzucenia szkicu. Edytor wymaga połączenia, a przejście z niezapisanymi zmianami pokazuje potwierdzenie.

„Eksportuj kopię” udostępnia zapisany plan jako plik lub tekst JSON. Kontrakt `silka-plan` v1 (Zod) i limit 256 KiB są opisane w `PROJECT.md`. Import nie jest konsultacją AI i wymaga podglądu oraz zatwierdzenia. Ćwiczenia prywatne nadawcy wymagają jawnego dopasowania. Kopia dostaje nowy identyfikator i właściciela z Auth; nie zmienia oryginału, historii ani aktywnego planu odbiorcy.

Publiczne API projektu w chmurze potwierdza aktywny provider e-mail, wyłączoną rejestrację i odmowę anonimowego odczytu profili (`42501`). Rzeczywistych haseł użytkowników nie używano w automatycznych testach.

## Statyczny build i hosting

`npm run build` generuje `.output/public` z `ssr: false`. `vercel.json` określa katalog wynikowy, routing SPA i podstawowe nagłówki. W Vercel ustaw te same dwie publiczne zmienne środowiskowe oraz zgodną wersję Node 22. Konfiguracja jest wbudowywana w statyczne pliki; zmiana wymaga ponownego builda. Wdrożenie nie zostało jeszcze wykonane.

Odzyskiwanie hasła, konfiguracja poczty i docelowych redirect URLs, backupy, PWA i zachowanie iOS wymagają osobnej weryfikacji przed wydaniem.

## Zależności

Lockfile jest źródłem dokładnych wersji. Na 11.10.2026 `npm audit` wskazuje 11 ostrzeżeń high w łańcuchu narzędzi Nuxt (braces i node-forge oraz zależności nadrzędne); `npm audit --omit=dev` wskazuje 0 podatności. Nie ma jeszcze zgodnych wydań usuwających te dwie przyczyny. Devtools są wyłączone, serwer developerski nasłuchuje wyłącznie na loopback, a produkcyjny wynik jest statyczny. Przed wydaniem ponownie sprawdź aktualizacje i audyt. Override simple-git usuwa zgłoszone podatności critical jego wcześniejszej wersji.
