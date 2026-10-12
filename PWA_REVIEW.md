# Weryfikacja PWA i wdrożenia

11.10.2026 użytkownik potwierdził dodanie Siłki jako PWA na iPhonie. Potwierdzenie obejmuje instalację; odzyskiwanie treningu w trybie samolotowym, powrót z tła i aktualizacja na urządzeniu pozostają do sprawdzenia.

Wdrożenie 11.10.2026: Vercel Hobby, projekt `silka`, gałąź produkcyjna `feat/progress`, adres https://silka-jureczko.vercel.app. Pierwszy build wykrył problem automatycznego presetu Vercel: pliki trafiły poza `.output/public`. Jawny preset Nitro `static` naprawił katalog; lint, typecheck i build z `VERCEL=1 CI=1` przeszły. Commit `676aeba` uzyskał status Ready. Anonimowe żądania HTTPS potwierdziły routing SPA, 53 zasoby PWA, manifest standalone, PNG, MIME JavaScript i nagłówki wyłączające HTTP cache dla `/sw.js`. Konfiguracja wskazuje chmurowy Supabase. Użytkownik zalogował się w produkcyjnej aplikacji; profil potwierdził zapis plików na urządzeniu. Nie dodano danych treningowych w celu testowania chmury. Fizyczny iPhone i izolacja dwóch rzeczywistych kont nadal wymagają weryfikacji.

11.10.2026. Zakres: nowa sekcja instalacji i aktualizacji w profilu, komunikat połączenia, manifest i worker; dotychczasowe ekrany oceniono wcześniej w `LAYOUT_REVIEW.md` i `AI_REVIEW.md`. Tryb antislop: during, ustalenie sesji. Design Read: ustawienia osobistego dziennika treningowego dla dwóch osób, zgodne z `DESIGN.md`; ENERGY 2 / RHYTHM 2 / MOTION 1.

## Dowody funkcjonalne

- Produkcyjny build z lokalnym Supabase: 53 zasoby, około 892 KiB plików statycznych. Worker nie jest uruchamiany na serwerze developerskim. Ikony PNG powstały przez rasteryzację istniejącego SVG hantla, bez dodania nowego znaku i zależności projektu.
- Pierwszy build `b71ff95a-5554-4155-8e8c-2a7d0fd116ee`: logowanie lokalnym kontem B, profil potwierdził zapis plików, rozpoczęto sesję `8ba344c3-03ff-46a9-9936-ebe622842393`.
- Zatrzymano własny serwer statyczny na 3002 oraz wyłącznie lokalną bramkę `supabase_kong_silka`. Pełne odświeżenie otworzyło trening z lokalnego dziennika. Wykonano `10 × 83,75 kg`; kolejne odświeżenie zachowało wynik i czas końca odpoczynku. UI rozróżnił lokalny zapis i błąd zdalny. Bramka została przywrócona po teście.
- Drugi build `c1b4f46e-75ac-42f3-85e1-4796fbea32f4`: „Sprawdź aktualizacje” wykryło oczekującego workera. „Uruchom nową wersję” wstrzymało aktualizację podczas aktywnej sesji. Zakończono sesję przy niedostępnym API; niewysłane zakończenie także blokowało aktualizację.
- Wylogowanie z potwierdzonym zachowaniem lokalnego szkicu, logowanie kontem A: jego pusty dashboard nie pokazał wyników B, a aktualizacja nadal była blokowana szkicem B. Po powrocie na B synchronizacja zakończyła się. Odczyt lokalnej bazy: jedna sesja `completed`, rewizja 3, sześć serii, jedna wykonana, ciężar 83.75. Brak dodatkowych serii i sesji.
- W drugiej karcie pozostawiono niezapisaną nazwę profilu. Aktualizacja z pierwszej karty przeładowała wyłącznie pierwszą; pole drugiej zachowało wpisany tekst. Jej własne przyciski aktualizacji były nieaktywne podczas edycji. Formularz anulowano bez zapisu.
- Zatrzymanie serwera statycznego przy „Sprawdź aktualizacje” dało czytelny błąd. Po przywróceniu ponowienie zakończyło się poprawnym komunikatem. Sprawdzono Enter i Tab; kontrolka wylogowania otrzymała widoczny focus.
- Szerokości 320, 390, 700, 850, 1000, 1280 CSS px: brak poziomego overflow i przycisków mniejszych niż 44 × 44 px. Oceniono zrzut 390 × 844 z sekcją PWA i dolną nawigacją; odstęp nad nawigacją zachowany. Tymczasowy viewport przywrócono.
- Testy jednostkowe obejmują blokady aktualizacji, uszkodzoną tożsamość, brak kopiowania tokenów, wykluczenie Auth/API i obcych originów, offline fallback, stare chunki, rollback nieudanej instalacji, ręczną aktywację oraz ostrożne usuwanie starych cache.

Ograniczenie: odcięcie serwerów nie zmienia `navigator.onLine`. To dowód odzyskania aplikacji i treningu przy niedostępnej sieci serwera, nie test trybu samolotowego ani zainstalowanej PWA w Safari. Natywny prompt instalacji i iOS wymagają urządzenia. Nie oferujemy sygnałów timera na zablokowanym ekranie. Odzyskiwanie konta i kopie pozostają na liście wydania w `README.md`.

Sprawdzenia końcowe: `npm run lint`, `npm run typecheck`, `npm test` 28/28, `npm run test:auth` 2/2, `npm run test:workouts` 7/7 oraz build z lokalną i chmurową konfiguracją przeszły. Chmurowy build `83e5ed01-dad0-4989-9b3d-f5187ad675e5` ma wszystkie 53 zasoby obecne na dysku, właściwy URL Supabase, bez adresu lokalnego API, oraz prawidłowe wymiary ikon PNG. `git diff --check` przeszedł. Nie zmieniano bazy ani migracji w etapie PWA; pełne sprawdzenia bazy z etapu AI są w `AI_REVIEW.md`.

## Antislop: Hard Gate

| Reguła | Wynik i dowód w zmienionym UI |
| --- | --- |
| R-02 | PASS: nowe komunikaty i sekcja PWA nie używają pauz em dash. |
| R-03 | PASS: sześć sprawdzonych szerokości bez overflow; tekst mieści się w pojedynczej kolumnie. |
| R-17 | PASS: nie dodano statystyk. |
| R-18 | PASS: nie dodano opinii użytkowników. |
| R-23 | PASS: ikony instalacyjne powtarzają istniejący, zatwierdzony favicon; nawigacja nie zmieniła struktury. |
| R-24 | PASS: sekcja nie dodaje odnośników do nieistniejących stron. |
| R-25 | PASS: odziedziczone tokeny tekstu na #09090B: #FAFAFA około 19:1, #A1A1AA około 7.7:1; przyciski używają istniejącego kontrastu z raportu layoutu. |
| R-26 | PASS: sprawdzanie, błąd, ponowienie, blokada i uruchomienie aktualizacji przeszły test UI. Instalacja jest pokazywana tylko po otrzymaniu rzeczywistego promptu przeglądarki. |
| R-27 | PASS: kod zawiera checking, ready, error, unsupported i development; brak sieci i błąd aktualizacji mają komunikaty oraz ponowienie. |
| R-28 | PASS: brak FAQ. |
| R-32 | PASS: natywne przyciski, Enter/Tab i widoczny outline; sekcja ma powiązany nagłówek. |
| R-33 | PASS: UI zapisano przez apply_patch w źródłach. Generowanie workera i rasteryzacja SVG nie modyfikują UI/CSS. |
| R-34 | PASS: dark mode z briefu, bez nowego przełącznika. |
| R-35 | PASS: build uruchomiony, dostępne nowe kontrolki PWA przeszły przepływy opisane powyżej. Natywnej instalacji nie przedstawiamy jako zweryfikowanej. |
| R-36 | PASS: UI odróżnia pliki aplikacji od danych i wymaga sieci do planów/historii; dokumentacja jawnie ogranicza lokalny dowód. |
| R-37 | PASS: istniejący kierunek DESIGN.md oraz Design Read i trzy pokrętła podano przed pracą nad nowymi kontrolkami. |
| R-38 | PASS: komunikaty wynikają z rzeczywistych zdarzeń i stanu workera. |

## Antislop: Purpose Gate

| Reguła | Wynik i powód |
| --- | --- |
| R-01 | PASS: brak nowych gradientów i poświat. |
| R-04 | PASS: sekcja nie dodaje ikon; ikona aplikacji zachowuje istniejący hantel. |
| R-06 | PASS: systemowy sans zgodny z DESIGN.md, brak nowej kapitalizacji i kroju. |
| R-07 | PASS: brak wzoru tła. |
| R-08 | PASS: brak dekoracyjnych strzałek przy akcjach. |
| R-09 | PASS: brak nowych kapsuł i etykiet marketingowych. |
| R-10 | PASS: brak szkła. |
| R-12 | PASS: brak nowych cieni. |
| R-13 | PASS: brak glow. |
| R-14 | PASS: liniowa sekcja ustawień zamiast powtarzalnych kart. |
| R-19 | PASS: wyłącznie odziedziczona zmiana koloru kontrolek; reduced-motion pozostaje w CSS. |
| R-22 | PASS: brak ilustracji. |

## Antislop: Liveliness

| Kryterium | Wynik i dowód |
| --- | --- |
| Jawne pokrętła | PASS: ENERGY 2 / RHYTHM 2 / MOTION 1 zgodnie z istniejącym DESIGN.md. |
| Zgodność pokręteł | PASS: ciężki nagłówek profilu, osobna sekcja urządzenia, płaskie linie, oszczędny ruch. |
| Punkt skupienia | PASS: „Twoje tempo.” pozostaje głównym nagłówkiem; instalacja jest podporządkowanym ustawieniem. |
| Strukturalny odstęp | PASS: linie oraz odstępy oddzielają profil, urządzenie i wylogowanie. |
| Jeden akcent | PASS: limonka występuje przy dostępnej aktualizacji i jej głównej akcji; pozostałe kontrolki są neutralne. |
| Motyw tożsamości | PASS: rytm osobistego dziennika i głos „Siłka na telefonie.” rozwijają wcześniejszy kierunek. |
| Design Read | PASS: praca kontynuuje zadeklarowany kierunek sesji; podano go też na początku raportu. |

## Antislop: Craftsmanship i Quality Locks

| Reguła | Wynik i dowód |
| --- | --- |
| C-1 | PASS: miejsce ustawień i liniowy układ mają zapisany powód w DESIGN.md. |
| C-2 | PASS: kontrolki mają rzeczywiste akcje; niedostępna instalacja nie tworzy pustego przycisku. |
| C-3 | PASS: sekcja służy instalacji, gotowości offline i aktualizacji urządzenia. |
| C-4 | PASS: testy reflow, klawiatury, błędu sieci, oczekującego zapisu i dwóch kart; ograniczenie fizycznego iOS jest jawne. |
| C-5 | PASS: brak opinii/statystyk/obietnic bez dowodu. |
| R-05 | PASS: istniejący profil z jedną sekcją urządzenia, bez szablonu hero i kart. |
| R-11 | PASS: przyciski zachowują promień 6 px, sekcja nie ma dekoracyjnej obudowy. |
| R-15 | PASS: „Sprawdź aktualizacje”, „Uruchom nową wersję”, „Zainstaluj Siłkę” nazywają wynik działania. |
| R-16 | PASS: brak marketingowych buzzwordów. |
| R-20 | PASS: język treningu, zależność aktualizacji od sesji i motyw dziennika odnoszą się do tego produktu. |
| R-21 | PASS: dark mode wynika z briefu właściciela. |
| R-29 | PASS: użyto istniejących neutralnych tokenów oraz jednego akcentu. |
| R-30 | PASS: nie kopiowano innego produktu; rozwinięto bieżący profil. |
| R-31 | PASS: powody układu, koloru, ikon i odstępów zapisano w DESIGN.md i tym raporcie. |
