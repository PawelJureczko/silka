# Podmiana ćwiczenia w sesji albo we własnym planie

21.11.2026. antislop during (wybór w sesji). Kierunek: osobisty dziennik treningowy, ENERGY 2 / RHYTHM 2 / MOTION 1, zgodnie z `DESIGN.md`.

## Wynik i sprawdzenia

Przed wyborem zamiennika pojawia się dialog z opcjami „Tylko ten trening” oraz „Ten trening i mój plan”. Druga opcja zmienia konkretną pozycję konkretnej jednostki, np. trzecie ćwiczenie B. Nie podmienia wszystkich wystąpień ćwiczenia. Zapis sesji i szablonu jest atomowy, dotyczy wyłącznie zalogowanego właściciela i nie zmienia wcześniejszych sesji ani osobnej kopii planu drugiej osoby.

- Lint, typecheck i statyczny build PWA PASS.
- 62 testy jednostkowe PASS. Nowe przypadki sprawdzają zachowanie zatwierdzonej zmiany planu przy kolejnych lokalnych zapisach, odtworzeniu dziennika i ponownej podmianie częściowo wykonanego ćwiczenia.
- 45 testów integracji treningów PASS. Nowy zestaw sprawdza dwa konta i osobne kopie planów, powtarzające się ćwiczenia w różnych pozycjach, kolejny trening, częściowo wykonane serie, idempotencję, błędny payload, rollback obu zmian i konflikt rewizji.
- 7 testów integracji planów oraz 81 sprawdzeń bazy/RLS PASS. Rzeczywiste UUID pozycji należącej do drugiego fikcyjnego konta nie pozwala zmienić ani przypisać jego danych. Odczyt kontekstu odrzuca obce konto i anonimowego klienta.
- Typy wygenerowano z lokalnego schematu. Migracje `20261121000300` i `20261121000400` wdrożono na produkcji w jednej transakcji i zapisano w historii migracji. Kontrola porównała hashe funkcji z lokalnymi źródłami: start_matches=true, save_matches=true, invoker=true, anonymous_blocked=true.
- Identyfikator źródłowej pozycji jest technicznym zapisem pochodzenia sesji. Nie ma żywego FK do edytowalnego szablonu. Jeżeli edytor odtworzył pozycje, dialog nie zgaduje powiązania i pozostawia dostępną podmianę jednorazową.
- UI: obie opcje, wybór z katalogu, potwierdzenie, powrót „Zmień zakres” z zachowaniem wybranego zamiennika, anulowanie i Escape zostały sprawdzone. Anulowanie pozostawiło sesję i rewizję planu bez zmian.
- UI: brak dostępnego odczytu blokuje wyłącznie opcję zmiany planu, pokazuje powód i „Sprawdź ponownie”. Po przywróceniu lokalnego API ponowienie odczytało kontekst i odblokowało wybór.
- UI offline: po odczytaniu planu wstrzymano wyłącznie lokalny `supabase_rest_silka`, zatwierdzono zmianę, odświeżono stronę i wykonano kolejną serię. Dziennik zachował obie operacje. Po wznowieniu API plan zmienił rewizję dokładnie raz, obie wykonane serie zostały zapisane, pozostała jednostka i plan drugiego konta pozostały bez zmian.
- UI: następna lokalna sesja tej samej jednostki zawierała nowy wariant i zachowane zakresy, bez przeniesienia kilogramów starego wariantu. Po potwierdzonym zapisie aplikacja unieważnia wyłącznie dane planów, dashboardu i kontekstu AI bieżącego właściciela.
- Pomiar dokument/viewport: 320/320, 390/390, 768/768 i 1280/1280 px. Brak poziomego przewijania. Najmniejsza kontrolka nowego dialogu ma 48 px; przy 320 px przyciski wyboru mają 262 px szerokości i ponad 120 px wysokości. Dialog ma ograniczoną wysokość i własne przewijanie.
- Klawiatura: Escape zamyka, Spacja wybiera opcję, focus korzysta z istniejącego obrysu i pułapki natywnego dialogu. Brak nowych pól lub autofocusa wywołującego klawiaturę ekranową.
- Kontrast: secondary/surface 6,91:1, secondary/interactive 5,81:1, primary/interactive 14,27:1, accent/surface 13,56:1. W obu opcjach zastąpiono jaśniejsze domyślne tło hover tłem interactive; pomiar DOM potwierdził #27272A podczas hover.
- Lokalne sesje testowe porzucono i zsynchronizowano, a następnie usunięto po sprawdzeniu ich ID i nazw. Kontener API przywrócono do Paused=false. Nie tworzono testowych sesji ani planów na produkcji.
- Zrzuty: `/private/tmp/silka-plan-swap-scope-final.png`, `/private/tmp/silka-plan-swap-confirm.png`. Przykład planu jest jawnie lokalny.

## Delivery Gate: PASS w zakresie zmiany

### Hard Gate

- R-02 PASS: nowa treść dialogu nie używa pauzy typograficznej; zastane tytuły pozostają.
- R-03 PASS: cztery pomiary viewportów bez poziomego przewijania, tekst mieści się w dialogu.
- R-17 PASS: brak nowych statystyk lub twierdzeń liczbowych w UI.
- R-18 PASS: bez referencji i opinii.
- R-23 PASS: brak nowych grafik, logo, ikon i nawigacji.
- R-24 PASS: nie dodano linków do nowych podstron; dotychczasowy katalog jest działającym selektorem.
- R-25 PASS: policzone pary kolorów mają co najmniej 5,81:1; hover sprawdzony w DOM.
- R-26 PASS: wybory, katalog, potwierdzenie, powrót, anulowanie, zamknięcie i ponowienie sprawdzone w UI.
- R-27 PASS: odczyt ma ładowanie, brak powiązania, błąd z ponowieniem; zapis lokalny, synchronizacja i konflikt mają odrębne komunikaty.
- R-28 PASS: brak FAQ.
- R-32 PASS: natywne przyciski, nazwany dialog, focus z istniejącego systemu, Spacja i Escape sprawdzone.
- R-33 PASS: bezpośrednie zmiany Vue/TS; bez zewnętrznego skryptu przepisującego UI.
- R-34 PASS: zachowany uzgodniony ciemny motyw.
- R-35 PASS: aplikacja uruchomiona, nowe kontrolki sprawdzone i build wykonany.
- R-36 PASS: izolacja potwierdzona testami dwóch kont; brak deklaracji testu fizycznego iPhone’a.
- R-37 PASS: kierunek i powód układu zapisane w `DESIGN.md`, tryb ogłoszony przed zmianami.
- R-38 PASS: fikcyjne dane wyłącznie lokalnie, wyraźna nazwa testowego planu, bez produkcyjnego seedowania.

### Purpose-Gate

- R-01 PASS: bez gradientów.
- R-04 PASS: bez nowych ikon.
- R-06 PASS: dotychczasowy systemowy sans i hierarchia dialogu, bez nowych fontów.
- R-07 PASS: jednolite istniejące tło.
- R-08 PASS: bez ozdobnych strzałek.
- R-09 PASS: bez kapsuł i odznak.
- R-10 PASS: bez szkła.
- R-12 PASS: bez nowych cieni.
- R-13 PASS: bez glow.
- R-14 PASS: dwie duże opcje odpowiadają dwóm skutkom operacji; nie dodano siatki kart.
- R-19 PASS: bez nowych animacji; istniejące reduced-motion pozostaje.
- R-22 PASS: bez ilustracji.

### Liveliness

- Dials PASS: jawne 2/2/1, zachowane w istniejącym dzienniku.
- Consistency PASS: duże pola wyboru i spokojny dialog odpowiadają zadeklarowanemu rytmowi i ruchowi.
- Focal point PASS: pytanie o zakres i dwie podpisane opcje prowadzą dialog; potwierdzenie wyróżnia nowy wariant.
- Whitespace PASS: odstępy oddzielają wybory, kontekst szablonu i końcowe potwierdzenie.
- Accent PASS: limonka pozostaje przy głównym CTA i obrysie hover/focus, opisy neutralne.
- Identity PASS: konkretne nazwy ćwiczenia, jednostki i planu zachowują język dziennika Siłki.
- Design Read PASS: odczytano istniejący kierunek i ogłoszono kontynuację przed implementacją.

### Craftsmanship i Quality Locks

- C-1 PASS: wybór przed katalogiem zapobiega niejasnej trwałości zmiany, powód zapisany w `DESIGN.md`.
- C-2 PASS: każda nowa kontrolka ma wykonany przepływ; warunki dostępności mają wyjaśnienie.
- C-3 PASS: treść odpowiada zakresowi, skutkom i własności operacji, bez sekcji szablonowych.
- C-4 PASS: wąski i szeroki ekran, klawiatura, brak API, ponowienie, odtworzenie, konflikt i rollback sprawdzone; ograniczenia urządzeń podano poniżej.
- C-5 PASS: brak wymyślonych twierdzeń o wynikach treningowych i skuteczności.
- R-05 PASS: mały krok w istniejącym przepływie, bez przebudowy w marketingowy szablon.
- R-11 PASS: promienie istniejących przycisków i dialogu, bez kapsuł.
- R-15 PASS: konkretne „Tylko ten trening”, „Ten trening i mój plan” i nazwany zakres potwierdzenia.
- R-16 PASS: bez marketingowych określeń.
- R-20 PASS: zachowane nazwy, rytm i typografia dziennika treningów.
- R-21 PASS: dark mode wynika z briefu właściciela.
- R-29 PASS: wyłącznie dotychczasowe tokeny i pojedynczy akcent.
- R-30 PASS: rozwinięcie obecnej aplikacji, bez kopiowania innego produktu.
- R-31 PASS: wybór zakresu, kontekst pozycji i dostępność opisane w `DESIGN.md`.

## Ograniczenia

Nie testowano fizycznego iPhone’a ani rzeczywistego powiększenia tekstu 200%. Trwała zmiana wymaga najpierw zsynchronizowanego treningu i odczytu bieżącej wersji planu. Po tym odczycie utrata sieci nie usuwa lokalnego zamiaru. Przy konflikcie szkic pozostaje lokalnie, a baza nie zapisuje połowy operacji. Starsza sesja bez pewnego powiązania z aktualną pozycją szablonu obsługuje podmianę jednorazową; trwałą zmianę można wtedy wprowadzić w edytorze planu.
