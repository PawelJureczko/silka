# Seria na pełnym ekranie i popup aktualizacji

Weryfikacja 14.10.2026. antislop during wybrany w rozmowie. Design Read: mobilny dziennik siłowy, ENERGY 2 / RHYTHM 2 / MOTION 1, zgodnie z `DESIGN.md`.

## Przepływy sprawdzone lokalnie

- PASS: aktywna sesja otwiera pojedyncze ćwiczenie bez głównej nawigacji; zakończona sesja wraca do zwykłego layoutu i podsumowania.
- PASS: pusta seria pokazuje walidację; poprawienie pól odblokowuje akcje. `12` powtórzeń i `8,5` kg zapisują się jako wykonanie; pola nie kopiują automatycznie celu ani poprzedniego wyniku.
- PASS: „Seria zakończona” zapisuje wykonanie i uruchamia odpoczynek. +30 s zmienia termin, odświeżenie odzyskuje pozostały czas, pominięcie wraca do pól. Po terminie widać „Pora na kolejną serię” i przycisk rozpoczęcia.
- PASS: wybór innego ćwiczenia, pominięcie serii, powrót do wcześniejszej oczekującej serii, pełna lista i powrót do trybu ćwiczenia działają. Ostatnia seria pokazuje „Serie zapisane”; koniec wymaga osobnego potwierdzenia. Podsumowanie testu: 3 wykonane, 1 pominięta; wynik odczytano na drugim pochodzeniu przeglądarki.
- PASS: przy zatrzymanej lokalnej bramie API wykonana seria przetrwała odświeżenie, UI pokazał kolejkę, a po przywróceniu API wrócił do „Zapisano na koncie”. Produkcyjnej bazy nie używano do testów.
- PASS: prawdziwe, kolejne buildy statyczne na lokalnym serwerze wykryły oczekujący service worker na Starcie. Próba aktualizacji z aktywnym lokalnym dziennikiem nie przeładowała strony i pokazała przyczynę. Po zakończeniu i odczytaniu sesji aktualizacja zadziałała.
- PASS: popup „Dostępna aktualizacja” zawiera „Aktualizuj” i „Na później”; Escape go zamyka, a ponowne uruchomienie Startu ponownie go pokazuje. Kliknięcie „Aktualizuj” aktywuje worker i przeładowuje stronę; poza Startem popup nie przerywa pracy. Profil zachowuje kontrolki ręczne.
- PASS: lint, typecheck, 35 testów jednostkowych i 16 integracyjnych treningów. Build statyczny przeszedł; budowano różne wersje do testu rzeczywistej aktualizacji. Konsola statycznej karty nie miała błędów ani ostrzeżeń.

## Delivery Gate

Zakres: nowe kontrolki i zmieniony przepływ. Niezmienione elementy systemu wizualnego mają uzasadnienia oraz kontrast w `DESIGN.md` i `AI_INTAKE_REVIEW.md`.

### Hard Gate

- R-02 PASS: nowe teksty bez pauzy typograficznej; przykładowe dane użytkownika i starsza treść pozostają niezależne.
- R-03 PASS: bez poziomego przewijania w rzeczywiście odczytanych viewportach 320, 390 i 1280 px; zrzuty telefonu i desktopu sprawdzono. Formularz jest jedną kolumną z parą pól i ograniczoną szerokością na desktopie.
- R-17 PASS: numeracja, liczba serii i odliczanie wynikają z sesji i zapisanego terminu.
- R-18 PASS: nie dodano opinii ani referencji.
- R-23 PASS: brak nowych assetów, logo i awatarów.
- R-25 PASS: istniejące tokeny primary, secondary, accent i red-300 zachowują kontrast opisany w poprzednim raporcie (minimum 5,81:1 dla użytych par tekstu).
- R-26 PASS: link powrotu, wszystkie serie, wybór ćwiczenia, pola, ukończenie, pominięcie, timer, zakończenie i popup mają sprawdzone działanie.
- R-27 PASS: ładowanie sesji, brak danych, walidacja, zapis lokalny, kolejka, synchronizacja i błąd aktualizacji są obsłużone; test awarii opisano wyżej.
- R-28 PASS: brak FAQ.
- R-32 PASS: natywne pola i przyciski, istniejący focus 2 px, dialog zamyka się przez Escape; nie usunięto etykiet ani obsługi klawiatury.
- R-33 PASS: zmiany UI napisano w źródłach Vue; formatował je ESLint. Nie dodano skryptów przepisywania UI/CSS.
- R-34 PASS: działa uzgodniony ciemny motyw, nie dodano przełącznika motywów.
- R-35 PASS: uruchomiono dev i build statyczny; kliknięcia, awarię i aktualizację sprawdzono jak powyżej.
- R-36 PASS: nie obiecuje się push ani alarmu na zablokowanym iPhonie.
- R-37 PASS: kierunek pochodzi z `DESIGN.md`; cel układu, timera i popupu dopisano do tabeli decyzji.
- R-38 PASS: wyniki testowe są jawnie fikcyjne, tylko lokalne; interfejs korzysta z rzeczywistej sesji i stanu workera.

### Purpose Gate

- R-01 PASS: dotychczasowa paleta, bez gradientów i dekoracyjnych pasków.
- R-04 PASS: nie dodano ikon dekoracyjnych.
- R-06 PASS: duża nazwa ułatwia rozpoznanie ćwiczenia; tablicowe liczby stabilizują timer i pola.
- R-07 PASS: tło jednolite, bez wzorów.
- R-08 PASS: strzałka tylko w powrocie na Start.
- R-09 PASS: brak odznak i etykiet powtarzających nagłówek.
- R-10 PASS: brak szkła.
- R-12 PASS: cień pozostaje przy timerze listy i istniejącym dialogu, bez cieni na nowych polach.
- R-13 PASS: brak glow.
- R-14 PASS: jedna powierzchnia odpoczynku, nie siatka powielonych kart.
- R-19 PASS: bez dodatkowych animacji; działa istniejące reduced-motion.
- R-22 PASS: brak ilustracji.

### Liveliness

- PASS: jawne dials 2/2/1, spójne z typografią i spokojną obsługą.
- PASS: jedna główna akcja zależna od etapu: ukończenie serii, rozpoczęcie kolejnej albo podsumowanie.
- PASS: odstępy dzielą wynik, nazwę ćwiczenia i formularz; odpoczynek zastępuje pola.
- PASS: limonka wyróżnia wykonanie oraz czas odpoczynku.
- PASS: numeracja ćwiczeń i serii zachowuje motyw dziennika.
- PASS: Design Read zadeklarowano przed implementacją.

### Craftsmanship i Quality Locks

- C-1 PASS: cele większych pól, schowania nawigacji i osobnego odpoczynku zapisano w `DESIGN.md`.
- C-2 PASS: działanie nowych kontrolek opisano w przepływach.
- C-3 PASS: ekran służy wykonaniu jednej serii, bez sekcji wypełniających szablon.
- C-4 PASS: walidacja, timer, odświeżenie, brak API, ponowienie i aktualizacja nie tracą zapisanej serii.
- C-5 PASS: brak fikcyjnych obietnic i statystyk produktu.
- R-05 PASS: układ wynika z fazy treningu; desktop ogranicza szerokość, nie rozciąga pól na cały monitor.
- R-11 PASS: istniejące promienie kontrolek i powierzchni, bez kapsuł.
- R-15 PASS: CTA nazywają czynności: „Seria zakończona”, „Aktualizuj”, „Wszystkie serie”.
- R-16 PASS: brak marketingowych określeń.
- R-20 PASS: duży zapis ćwiczenia i wyniku kontynuuje język dziennika Siłki.
- R-21 PASS: motyw wynika z briefu właściciela.
- R-29 PASS: dotychczasowe neutralne kolory i limonka; czerwony służy błędom.
- R-30 PASS: rozwinięto obecny produkt, bez klonowania innej aplikacji.
- R-31 PASS: główne decyzje i uzasadnienia są w `DESIGN.md`.

### UI i mobile

- PASS UI: brak ozdobnych ikon, emoji, glow, szkła, sztucznych wskaźników i szablonowych kart; stany oraz nawigacja mają działanie opisane wyżej.
- PASS mobile: pomiar przy 320 px nie znalazł przycisków, inputów ani linków mniejszych niż 44 × 44 px. Przy 390 × 844 widać pola i główne CTA; dłuższe treści przewijają się, nie są obcinane. Layout treningu uwzględnia safe area i nie używa Fullscreen API ani hover jako warunku dostępu.

Dowody: `/tmp/silka-focus-seria.png`, `/tmp/silka-focus-odpoczynek.png`, `/tmp/silka-focus-desktop.png`, `/tmp/silka-update-popup.png`.

Ograniczenia: nie weryfikowano fizycznego iPhone’a ani sygnału na blokadzie. Nie dodano Web Push, uprawnień powiadomień ani usług serwerowych. Stare instalacje muszą najpierw uruchomić wersję zawierającą popup, korzystając z dotychczasowej obsługi aktualizacji w Profilu.
