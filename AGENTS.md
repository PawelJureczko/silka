# Zasady pracy nad Siłką

## Kontekst i zakres

Przeczytaj `PROJECT.md` przed zmianami. Jest źródłem założeń produktu, architektury, design systemu, modelu danych i etapów MVP.

Pracujemy nad prywatną, bezpłatną aplikacją treningową PWA dla dwóch osób. Priorytety to poprawny zapis treningu, izolacja danych, wygoda na iPhonie i koszt 0 zł.

Stan po etapie 5 i wdrożeniu etapu 6: istnieje fundament Nuxt 4/Vue 3/TypeScript/Tailwind, Auth, nawigacja i baza z RLS. Działają plany, katalog, import kopii oraz dashboard, aktywny trening, poprzednie wyniki, timer, lokalny dziennik IndexedDB z kolejką i konfliktem rewizji, zakończenie i porzucenie z podsumowaniem. Działają historia, wykresy, rekordy, regularność, zatwierdzane sugestie ciężaru i edycja profilu. Ręczne konsultacje AI obsługują cztery akcje JSON v1, podgląd i zatwierdzany zapis. Kontekst oraz zatwierdzone odpowiedzi są prywatne i przechowywane z RLS na koncie. Produkcyjny build zawiera PWA z cache plików aplikacji i ręcznymi aktualizacjami blokowanymi przy aktywnych/niewysłanych treningach wszystkich lokalnych kont. HTTPS działa pod `silka-jureczko.vercel.app` na Vercel Hobby; produkcyjna gałąź to `main`. Test fizycznego iPhone’a i dwóch rzeczywistych kont pozostaje otwarty. Instrukcje uruchomienia i konfiguracji są w `README.md`. Nie traktuj docelowej struktury jako opisu już istniejących plików.

- Wykonuj zakres wynikający z bieżącego zlecenia i wcześniejszych ustaleń w sesji.
- Gdy użytkownik zatwierdził etap lub działanie, kontynuuj je bez ponownego pytania o tę samą zgodę.
- Nie rozszerzaj zadania o inne etapy, refaktoryzacje lub usługi bez potrzeby wynikającej z celu.
- Przy zadaniu dotyczącym samej dokumentacji nie inicjalizuj aplikacji, usług ani migracji.
- Nie nadpisuj niezwiązanych zmian użytkownika. Najpierw sprawdź istniejący stan plików i Git, jeśli katalog jest repozytorium.
- Informuj krótko o istotnych ustaleniach, zmianach kierunku i rzeczywistych blokadach.
- Nie commituj, nie pushuj i nie wdrażaj bez upoważnienia wynikającego ze zlecenia.

## Kod i struktura

- Używaj Nuxt 4, Vue 3 Composition API i `<script setup lang="ts">`.
- Włącz TypeScript strict. Unikaj `any`, podwójnych rzutowań i wyciszania błędów typów bez uzasadnienia.
- Dane z JSON, sieci i magazynu lokalnego traktuj jako `unknown`, dopóki nie zostaną zwalidowane.
- Nazwy w kodzie pisz po angielsku; UI, komunikaty i dokumentację projektu po polsku.
- Komponenty Vue nazywaj PascalCase; composables zaczynaj od `use`.
- Preferuj niewielkie komponenty o jednej odpowiedzialności. Wyodrębniaj współdzielony kod, gdy ma rzeczywiste zastosowanie.
- Nie buduj ogólnych fabryk, kontenerów DI, warstw repozytoriów ani monorepo bez konkretnej potrzeby.
- Komentarze wyjaśniają powód lub nieoczywisty przypadek, nie powtarzają kodu.
- Korzystaj z konwencji katalogów opisanej w `PROJECT.md`. Nie twórz pustych katalogów.
- Zachowuj jeden menedżer pakietów i jeden lockfile po wyborze przy inicjalizacji.
- Dobieraj bezpłatne zależności open source; sprawdzaj ich zgodność z faktycznie używaną wersją Nuxt.

## Podział odpowiedzialności

- Widoki i komponenty odpowiadają za prezentację, interakcje i dostępność.
- Composables koordynują przepływy i reaktywny stan.
- Reguły progresji, rekordów i podsumowań umieszczaj w `app/domain` jako testowalne funkcje bez zależności od UI.
- Dostęp do Supabase, IndexedDB i schowka umieszczaj w `app/services`; nie wykonuj zapytań z komponentów.
- Schematy wejściowe umieszczaj w `shared/schemas`; wyprowadzaj typy przez Zod.
- Typy bazy generuj z rzeczywistego schematu. Nie edytuj ręcznie wygenerowanego pliku.
- Pinia dodaj tylko przy uzasadnionej potrzebie współdzielonego stanu.
- Zachowaj aplikację statyczną i kliencką, dopóki konkretne wymaganie nie uzasadni zmiany.

## Interfejs i wydajność

- Używaj dokładnych tokenów kolorów z `PROJECT.md`. Dark mode jest podstawą.
- Projektuj mobile-first i sprawdzaj główne przepływy na wąskim ekranie.
- Uwzględniaj dolną nawigację, safe area, klawiaturę ekranową i obsługę jedną ręką.
- Główne kontrolki powinny mieć obszary dotykowe co najmniej 44 × 44 CSS px.
- Stosuj natywne przyciski i pola, jawne etykiety, focus i czytelne komunikaty błędów.
- Nie przekazuj znaczenia wyłącznie kolorem. Obsługuj `prefers-reduced-motion`.
- Obsługuj polski przecinek dziesiętny bez niejednoznacznego przeliczania ciężaru.
- Projektuj stany ładowania, pustych danych, błędu i synchronizacji razem z właściwym widokiem.
- Nie dodawaj ciężkich bibliotek animacji, ikon lub wykresów dla pojedynczego prostego elementu.
- Ogranicz pobieraną historię, stosuj paginację i ładuj kosztowne elementy na żądanie.
- Nie dodawaj do UI szczegółów implementacji, które nie pomagają użytkownikowi podjąć decyzji.

## Baza, migracje i autoryzacja

- Wszystkie zmiany schematu, funkcji, ograniczeń i RLS zapisuj w wersjonowanych migracjach `supabase/migrations`.
- Nie zmieniaj zastosowanej migracji; dodaj kolejną. Ręczne zmiany schematu w dashboardzie nie zastępują migracji.
- Włącz RLS na każdej tabeli dostępnej przez API. Zabezpieczaj wszystkie dozwolone operacje, w tym wynik zapisu przez `WITH CHECK`.
- Własność danych wynika z `auth.uid()`, nie z parametrów JSON, stanu formularza ani wybranego profilu.
- Zabezpieczaj relacje między prywatnymi rekordami złożonymi FK zawierającymi `user_id`.
- Katalog ćwiczeń jest wspólny dla zalogowanych użytkowników: wszystkie rekordy mają `owner_id = null`. Zalogowane konto może odczytać katalog i dodać ćwiczenie; edycja, archiwizacja i usuwanie wpisów pozostają administracyjne. Nie udostępniaj anonimowo katalogu ani prywatnych planów i historii.
- Sprawdzaj dostęp do wskazanego ćwiczenia także po stronie bazy.
- Funkcje RPC domyślnie używają uprawnień wywołującego. Jeśli potrzebne jest `SECURITY DEFINER`, uzasadnij wyjątek, ogranicz uprawnienia i `search_path` oraz jawnie sprawdź tożsamość i własność.
- Widoki i funkcje nie mogą obchodzić RLS. Widoki udostępnione klientowi powinny używać `security_invoker = true` tam, gdzie jest to właściwe.
- Import planu i utworzenie sesji z jej strukturą wykonuj atomowo. Nie pozostawiaj częściowo zapisanego grafu danych.
- Plan jest szablonem; sesja przechowuje własne wartości planowane i wykonane. Edycja lub archiwizacja planu nie zmienia historii.
- Używaj UUID, `numeric` dla ciężaru i `timestamptz` dla czasu. Brak wartości, zero, seria pominięta i wykonana to różne stany.
- Integralność, liczby i dozwolone statusy zabezpieczaj w bazie, nie tylko w formularzu.
- Nie wykonuj destrukcyjnych migracji ani zmian zdalnych danych poza zakresem upoważnienia. Najpierw przygotuj i sprawdź zmianę lokalnie.
- Seed zawiera wyłącznie dane techniczne lub fikcyjne; nigdy prawdziwe hasła, konta i historię użytkowników.

## Sekrety i prywatność

- Nie zapisuj sekretów w repozytorium ani logach. Pliki przykładów konfiguracji zawierają wyłącznie nazwy i bezpieczne placeholdery.
- Klient może znać publiczny klucz Supabase; bezpieczeństwo zapewniają Auth i RLS.
- Nigdy nie umieszczaj `service_role`, kluczy administracyjnych ani poświadczeń bazy w bundle'u klienta lub publicznym runtime config.
- Ogranicz logowanie prywatnych danych treningowych, tokenów i odpowiedzi importu.
- Eksport obejmuje tylko dane bieżącego użytkownika w wybranym zakresie.
- Lokalny stan oraz kolejkę zapisów rozdzielaj po `user_id`. Zmiana konta nie może ujawnić ani wysłać danych poprzedniego konta.

## Aktywny trening, zapis lokalny i PWA

- Zabezpieczaj zmianę lokalnie przed próbą wysłania do bazy.
- Rozróżniaj zapis lokalny, oczekiwanie na synchronizację, sukces zdalny i błąd.
- Używaj stabilnych UUID i idempotentnych operacji. Ponowienie nie może dodać drugiej serii ani sesji.
- Zachowuj kolejność oczekujących zmian i nie kończ zdalnie sesji z pominięciem wcześniejszych zapisów.
- Wykrywaj konflikty rewizji. Nie nadpisuj po cichu zmian z innego urządzenia.
- Odtwarzaj aktywny trening po odświeżeniu, powrocie z tła i chwilowej utracie sieci.
- Timer wylicza pozostały czas z zapisanego znacznika końca, nie z liczby wywołań `setInterval`.
- Service worker nie cache'uje odpowiedzi Auth ani prywatnych API. Dane sesji przechowuj w kontrolowanym magazynie lokalnym.
- Nie przeładowuj automatycznie aktywnego treningu przy aktualizacji service workera.
- Wylogowanie przy oczekujących zmianach wymaga jawnej obsługi ich zachowania lub odrzucenia.
- Nie obiecuj działania sygnałów timera na zablokowanym iPhonie bez rzeczywistej weryfikacji.

## Wymiana z AI

- Nie dodawaj API LLM, SDK dostawcy LLM, kluczy LLM ani automatyzacji interfejsu zewnętrznego chatbota.
- Implementuj ręczny przepływ: prompt → schowek → zewnętrzny LLM → wklejenie JSON → walidacja → podgląd → zatwierdzenie.
- Kontrakt v1 i jego limity są opisane w `PROJECT.md`. Zachowaj jedną definicję schematu i wyprowadzone z niej typy.
- Odrzucaj nieznaną wersję, nieznane pola, niezgodną akcję, niepoprawne liczby i niedostępne identyfikatory.
- Przed parsowaniem sprawdź rozmiar odpowiedzi. Nie wykonuj kodu ani HTML pochodzącego z importu.
- Sprawdzaj konsultację, właściciela i bazową rewizję. RPC ponownie waliduje dane oraz rewizję w transakcji.
- Nie modyfikuj planu na podstawie odpowiedzi AI bez podglądu i zatwierdzenia.
- Analiza jest informacją; sugestia ciężaru wymaga wskazania miejsca zastosowania i zatwierdzenia.
- Nowe ID i tożsamość właściciela nadaje aplikacja i sesja Auth, nie LLM.
- Oddziel zwykły import kopii planu od odpowiedzi na konsultację AI. Żaden z nich nie importuje cudzej tożsamości ani historii.
- Nie zmieniaj znaczenia opublikowanej wersji kontraktu. Dla niezgodnej zmiany zwiększ `schemaVersion`.

## Weryfikacja i dokumentacja

Używaj Node 22 z `.nvmrc` i npm z `package-lock.json`. Sprawdzenia: `npm run lint`, `npm run typecheck`, `npm test`, `npm run test:db`, `npm run test:auth`, `npm run test:plans`, `npm run test:workouts`, `npm run test:progress`, `npm run test:ai`, `npm run build`. Testy bazy i Auth wymagają lokalnego Supabase przez Docker. `npm run db:types` generuje typy rzeczywistej bazy. `npm run dev:local` używa `.env.local`, a `npm run dev` chmurowego `.env`. Nie deklaruj uruchomienia sprawdzeń, które nie zostały wykonane.

- Dobieraj sprawdzenia do ryzyka zmiany. Proste zmiany dokumentacji nie wymagają testów aplikacji.
- Testuj istotne reguły domenowe i przypadki graniczne, a nie implementacyjne szczegóły komponentów.
- Sprawdzaj poprawne i błędne warianty JSON, limity, anulowanie importu, konflikt rewizji, idempotencję i rollback.
- RLS testuj z dwoma różnymi kontami oraz bez uwierzytelnienia, również przy podmienionych FK i `user_id`.
- Utrzymuj główną ścieżkę E2E od logowania przez plan i trening do historii.
- Zmiany synchronizacji sprawdzaj przez odzyskanie szkicu, brak sieci, ponowienie, konflikt i zmianę konta.
- Weryfikuj zainstalowaną PWA na iPhonie przed uznaniem zachowania iOS za gotowe.
- Aktualizuj `PROJECT.md`, gdy zmieniają się uzgodnione zachowanie, model danych, kontrakt lub koszty.
- W podsumowaniu podaj wynik, wykonane sprawdzenia i rzeczywiste ograniczenia. Nie przedstawiaj planowanych funkcji jako działających.
