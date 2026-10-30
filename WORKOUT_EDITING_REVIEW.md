# Podmiana ćwiczeń, stabilny formularz i koniec przerwy

30.10.2026. Tryb antislop during, zgodnie z wyborem w sesji. Kierunek: `DESIGN.md`, ENERGY 2 / RHYTHM 2 / MOTION 1. Zakres obejmuje bieżący trening, bez zmiany planów i kontraktu AI.

## Weryfikacja funkcjonalna

- Lint, typecheck, 42 testy jednostkowe, 81 sprawdzeń RLS, 22 testy integracji treningów i 7 testów postępów przeszły. Build statyczny z PWA przeszedł.
- Testy bazy obejmują podmianę przed pierwszą serią, zachowanie tożsamości wykonanych wyników, stare payloady, nieaktualną rewizję, dwa konta i brak logowania, obce/niedostępne ID, rollback błędnej ostatniej serii oraz idempotentne ponowienie.
- Lokalnie utworzono fikcyjny plan i sesję: zmiana przysiadu na wyciskanie hantli, anulowanie propozycji, podmiana bez API, odświeżenie i odzyskanie podmiany z IndexedDB, wpisanie 12 × 8 kg, synchronizacja, zakończenie serii i automatyczny formularz serii 2 po 8 s.
- Po wykonaniu jednej serii podmieniono pozostałą na unoszenie hantli przed siebie. Oryginalne 12 × 8 kg zostało przy wyciskaniu, a nowa pozycja otrzymała nową serię. Przedłużenie przerwy o 30 s pokazało 0:38 i zakończyło się automatycznie. Ostatnia seria nie uruchomiła zbędnej przerwy. Podsumowanie zawierało 3 wykonane i 1 pominiętą serię, z zachowanymi nazwami i ciężarami.
- Pomiar pola w trybie serii przy 390 px przed i po wpisywaniu: ta sama pozycja w dokumencie 559,109375 px oraz wysokość 80 px. Podczas zwykłej synchronizacji nie dochodzi przycisk zmieniający wysokość statusu. To test układu w przeglądarce desktopowej; nie emuluje prawdziwej klawiatury iOS.
- Tryb serii sprawdzono przy rzeczywistych 390 px; historię po podmianie przy rzeczywistych 320, 700 i 1280 px. Brak poziomego overflow; kontrolki trybu serii przy 390 px miały minimum 44 × 44 px.
- Produkcyjna migracja została poprzedzona porównaniem historii oraz MD5 poprzedniej funkcji z repozytorium. Transakcja zapisała wersję `20261030000100`; wynik potwierdził SECURITY INVOKER. Nie użyto prawdziwych wyników jako danych testowych.

Nie testowano fizycznego iPhone’a, wibracji sprzętowej, alarmu przy blokadzie ani działania w tle. Przejście odbywa się w widocznej aplikacji lub po powrocie, na podstawie zapisanego terminu. Konflikt i otwarte dialogi wstrzymują przejście. Jedno nieudane automatyczne zakończenie przerwy nie uruchamia pętli zapisu; pozostaje przycisk i komunikat błędu.

## Delivery Gate: PASS

- R-02 PASS: nowe teksty nie wprowadzają pauzy typograficznej; istniejące nazwy i tytuły pozostają.
- R-03 PASS: weryfikacja rzeczywistych szerokości i pomiar pól opisane wyżej; bez blokowania natywnego scrolla i zoomu.
- R-17 PASS: numeracja, serie i timer pochodzą z bieżącej sesji i terminu, nie z fikcyjnych wskaźników.
- R-18 PASS: brak opinii i referencji.
- R-23 PASS: brak nowych assetów, logo i awatarów.
- R-25 PASS: istniejące pary tokenów primary/background, secondary/background i background/accent; nie dodano kolorów.
- R-26 PASS: kliknięto wybór zamiennika, anulowanie, potwierdzenie, pola, ukończenie, +30 s, zakończenie i podsumowanie.
- R-27 PASS: zapis lokalny, brak API, odzyskanie po reloadzie i synchronizacja sprawdzone w przeglądarce; konflikt i rollback sprawdzone integracyjnie.
- R-28 PASS: bez FAQ.
- R-32 PASS: natywne przyciski i etykiety pól, istniejący focus; brak automatycznego focusa na kolejnej serii; komunikat końca przerwy ma aria-live=polite.
- R-33 PASS: źródła Vue/TS edytowano bezpośrednio, formatowanie przez ESLint; bez generatora przepisywania UI.
- R-34 PASS: dotychczasowy ciemny motyw z briefu.
- R-35 PASS: dev, build i opisany pełny przepływ na lokalnych danych.
- R-36 PASS: UI nie obiecuje wibracji na iOS ani powiadomień na zablokowanym ekranie.
- R-37 PASS: cel stabilnego przepływu, potwierdzenia i braku autofocusa zapisano w `DESIGN.md` przed wydaniem.
- R-38 PASS: dane testowe były lokalne i fikcyjne; katalog i liczby w UI wynikają z danych sesji.
- R-01 PASS: bez gradientów i dekoracyjnych pasków.
- R-04 PASS: bez nowych ikon ani emoji.
- R-06 PASS: istniejący systemowy krój i duże cyfry dla wpisywanych wyników.
- R-07 PASS: jednolite tło, bez wzorów.
- R-08 PASS: strzałka wyłącznie przy istniejącym powrocie na Start.
- R-09 PASS: bez dodatkowych odznak i kapsuł.
- R-10 PASS: bez szkła.
- R-12 PASS: bez nowych cieni; dotychczasowy cień kompaktowego timera jest niezmieniony.
- R-13 PASS: bez glow.
- R-14 PASS: podmiana wykorzystuje obecny liniowy katalog, bez siatki kart.
- R-19 PASS: bez nowych animacji; istniejące reduced-motion pozostaje.
- R-22 PASS: bez ilustracji.
- Liveliness/dials PASS: jawne 2/2/1, duża nazwa i wynik nadal prowadzą ekran.
- Liveliness/focal point PASS: limonka wyróżnia ukończenie serii lub timer.
- Liveliness/whitespace PASS: formularz ma stały odstęp po nazwie zamiast elastycznego dociskania.
- Liveliness/accent PASS: jedna limonka z istniejącej palety.
- Liveliness/identity PASS: numeracja i typografia kontynuują dziennik Siłki.
- Liveliness/design read PASS: zadeklarowano istniejący kierunek przed pierwszą edycją.
- C-1 PASS: każda zmiana layoutu ma cel zapisany w `DESIGN.md`.
- C-2 PASS: nowe kontrolki mają działanie potwierdzone w przepływie.
- C-3 PASS: treść dotyczy aktualnej serii i jej zamiennika, bez sekcji szablonowych.
- C-4 PASS: lokalny zapis przed siecią, odtworzenie szkicu, rollback i zachowanie wcześniejszych kolejek.
- C-5 PASS: brak fikcyjnych twierdzeń i danych użytkowników w produkcyjnych testach.
- R-05 PASS: ekran nadal wynika z fazy treningu, nie z siatki kart.
- R-11 PASS: zachowano promienie kontrolek i powierzchni, bez kapsuł.
- R-15 PASS: czynności nazwano wprost: Podmień ćwiczenie, Anuluj, Seria zakończona.
- R-16 PASS: brak marketingowych określeń.
- R-20 PASS: ten sam dziennik, ciemna paleta, duży wynik i limonka.
- R-21 PASS: ciemny motyw wynika z briefu właściciela.
- R-29 PASS: bez zmiany tokenów kolorów.
- R-30 PASS: rozwinięto bieżący produkt bez klonowania innej aplikacji.
- R-31 PASS: uzasadnienia w `DESIGN.md`.
- UI PASS: brak ozdobników; pokazano wynik, konsekwencje i zatwierdzenie podmiany.
- Mobile PASS: normalny przepływ treści, duże pola i kontrolki, safe area, brak wymuszonego autofocusa, test szerokości z zastrzeżeniem osobnego testu klawiatury iPhone’a.

Dowody: `/tmp/silka-workout-stable-inputs.png`, `/tmp/silka-workout-auto-rest.png`, `/tmp/silka-workout-replace-confirm.png`, `/tmp/silka-workout-replacement-summary.png`, `/tmp/silka-workout-migration-ready.png`.
