# Rozbudowa statystyk

21.11.2026. antislop during (wybór w sesji). Kierunek: osobisty dziennik treningowy, ENERGY 2 / RHYTHM 2 / MOTION 1, zgodnie z `DESIGN.md`.

## Wynik i sprawdzenia

Kolejno dodano: porównanie jednostek, rekordy powtórzeń przy stałym ciężarze, historię decyzji, wykonanie planu, podsumowanie miesiąca, kalendarz i tygodniowe serie na partie. Trzy widoki ograniczają długość mobilnego ekranu. Reguły i ograniczenia są w `PROJECT.md` oraz przy danych.

- Lint, typecheck i build statyczny/PWA PASS. Build lokalny: `3bc6c47c-e670-4f9c-b4ff-8815e10b3fc0`.
- 60 testów jednostkowych PASS: zgodność jednostek i wariantów, duplikaty, dodatkowe serie, pominięcia, null/zero, polskie liczby, wykonanie zakresów, lokalne daty, DST, zmiana roku i luty przestępny.
- 13 testów integracji postępów PASS: pełna historia rekordu, paginacja, zgodność obciążenia, niejednoznaczne decyzje, zakresy, strefy, puste sesje, limit kalendarza z pełnymi sumami, błędne parametry, dwa konta i anonim. Poprawiono zależny od daty test stref: każdą strefę porównuje z jej własną bazową liczbą sesji.
- 81 sprawdzeń RLS PASS. Nowe funkcje są SECURITY INVOKER z pustym search_path, wymagają auth.uid(), bez argumentu właściciela. Istniejące RPC i historia nie są zmieniane.
- Typy wygenerowano z rzeczywistego lokalnego schematu. Obie migracje wdrożono w jednej transakcji i zapisano w historii migracji produkcji. Kontrola: invoker=true, anonymous_blocked=true, authenticated_allowed=true.
- Lokalny UI: wybór ćwiczenia, strony rekordów 1→2→1, link z rekordu otwiera właściwą sesję. Decyzje występują obok wyników swojej sesji, bez zmiany kilogramów.
- Lokalny UI: dwa różne wybory jednostki, porównanie serii, brak dodatkowych poprzednich serii i podsumowanie wykonania.
- Lokalny UI: oba kierunki miesiąca i tygodnia, pusty miesiąc i tydzień, wybór dnia, opis metody partii. Bieżący niepełny miesiąc jest opisany. Tygodniowy okres jest niezależny od miesiąca kalendarza.
- Brak API: wstrzymano wyłącznie lokalny `supabase_rest_silka`. Widoczny stan ładowania przeszedł w błąd z ponowieniem. Po przywróceniu API przycisk odczytał dane. Kontener pozostawiono z Paused=false.
- Pomiar szerokość dokumentu/viewport: 320/320, 390/390, 700/700, 768/768, 850/850 i 1280/1280 px. Minimum szerokości dnia: odpowiednio 44,85; 54,85; 87,42; 97,14; 50,42; 72 px; wysokość 58 px. Kalendarz ma odstęp między polami. Układ dwóch kolumn zaczyna się dopiero przy 850 px.
- Enter aktywuje widok kalendarza; aktywny przycisk zachowuje widoczny obrys limonkowy 2 px. Zmiana poprzedniego miesiąca zachowuje focus kontrolki. Wybór jest również podkreślony i opisany aria-pressed.
- Kontrast obliczony skryptem: primary/background 19,06:1; secondary/interactive 5,81:1; accent/interactive 11,40:1. Te same tokeny obsługują tekst, krawędzie i focus.
- Dwie dodatkowe lokalne sesje do testowania paginacji usunięto po weryfikacji ich ID i nazwy. Fikcyjne konta i dane nie trafiły do produkcji.
- Zrzuty: `/private/tmp/silka-stats-calendar-320.png`, `/private/tmp/silka-stats-error.png`.

## Delivery Gate: PASS w zakresie zmiany

### Hard Gate

- R-02 PASS: nowa treść nie używa pauzy typograficznej; zastane tytuły aplikacji pozostają.
- R-03 PASS: sześć pomiarów rzeczywistych viewportów bez poziomego przewijania.
- R-17 PASS: statystyki pochodzą z własnych zapisanych sesji; metodologia jest jawna.
- R-18 PASS: brak referencji i opinii.
- R-23 PASS: brak nowych grafik, ikon lub logo; nowe widoki realizują zamówione statystyki.
- R-24 PASS: link z rekordu otworzył istniejącą sesję; ścieżki historii pozostają.
- R-25 PASS: nowe pary kolorów i stany używają policzonych tokenów, minimum 5,81:1.
- R-26 PASS: przełączniki, wybory, paginacja, okresy, dni, szczegóły i ponowienie mają sprawdzone działanie.
- R-27 PASS: ładowanie, błąd z ponowieniem i puste okresy sprawdzono lokalnie; schematy i integracja sprawdzają brak historii.
- R-28 PASS: brak FAQ.
- R-32 PASS: natywne przyciski i select, jawne etykiety, aria-pressed, tekstowe wyniki i focus 2 px.
- R-33 PASS: bezpośrednie zmiany w Vue/TS/CSS, bez skryptów przepisujących UI.
- R-34 PASS: zachowany uzgodniony ciemny motyw.
- R-35 PASS: aplikacja uruchomiona, opisane próby UI i statyczny build wykonane.
- R-36 PASS: brak deklaracji pomiaru intensywności, techniki lub gwarancji iOS.
- R-37 PASS: kierunek, dials i powody layoutu zapisane w DESIGN.md przed dostarczeniem.
- R-38 PASS: próby są lokalne i fikcyjne, a produkcyjne dane pozostają własnymi zapisami użytkownika.

### Purpose-Gate

- R-01 PASS: bez gradientów.
- R-04 PASS: bez nowych ikon.
- R-06 PASS: systemowy sans i cyfry tablicowe z dziennika, bez nowych fontów.
- R-07 PASS: jednolite tło.
- R-08 PASS: strzałki zmieniają wyłącznie okres, z etykietami dostępności.
- R-09 PASS: bez kapsuł i odznak.
- R-10 PASS: bez szkła.
- R-12 PASS: bez nowych cieni.
- R-13 PASS: bez glow.
- R-14 PASS: spisy, porównanie i kalendarz wynikają z danych, bez siatki identycznych kart.
- R-19 PASS: bez nowych animacji; reduced-motion zachowane.
- R-22 PASS: bez ilustracji.

### Liveliness

- Dials PASS: 2/2/1, zgodne z istniejącym dziennikiem.
- Focal point PASS: rekord ćwiczenia, konkretne serie lub miesięczna liczba treningów prowadzą dany widok.
- Whitespace PASS: linie oddzielają wyniki i zakresy, bez zagnieżdżonych kart.
- Accent PASS: limonka przy głównym wyniku, dniu z sesją i aktywnym wyborze.
- Identity PASS: numeracja ćwiczeń, duże wyniki, język sesji i serii.
- Design Read PASS: kontynuacja kierunku z DESIGN.md, ogłoszona przed implementacją.

### Craftsmanship i Quality Locks

- C-1 PASS: wszystkie główne decyzje mają powód w DESIGN.md.
- C-2 PASS: nowe rodzaje kontrolek sprawdzono w UI, rekordy i agregacje także w integracji.
- C-3 PASS: każda sekcja odpowiada jednej z siedmiu zamówionych statystyk.
- C-4 PASS: puste i błędne odczyty, telefon i desktop, klawiatura oraz limity sprawdzone; ograniczenia urządzeń podano niżej.
- C-5 PASS: bez wymyślonych twierdzeń o skuteczności lub intensywności treningu.
- R-05 PASS: trzy widoki i spisy wynikają z pracy z dziennikiem, bez szablonu marketingowego.
- R-11 PASS: promienie z istniejącego systemu, bez kapsuł.
- R-15 PASS: konkretne nazwy widoków, okresów i ponowienia odczytu.
- R-16 PASS: bez marketingowych określeń.
- R-20 PASS: zachowany charakter dziennika Siłki.
- R-21 PASS: dark mode z briefu właściciela.
- R-29 PASS: dotychczasowe neutralne tokeny i jeden akcent.
- R-30 PASS: rozwinięcie własnego layoutu, bez kopiowania innej aplikacji.
- R-31 PASS: cele layoutu i sposobu prezentacji zapisane w DESIGN.md.

## Ograniczenia

Nie testowano fizycznego iPhone’a ani rzeczywistego powiększenia tekstu 200%. Widoki nie wywołują klawiatury ekranowej. Liczba serii na partię pochodzi z aktualnego katalogu, bez historii zmian przypisania partii. Decyzje to aktualny zapis w sesji, bez audytu każdej edycji. Kalendarz pokazuje do 200 sesji miesiąca, rekordy po 20 obciążeń, decyzje z 12 sesji, a lista jednostek pochodzi z 60 ostatnich sesji z planu; ograniczenia są widoczne w UI. Zakończona pusta sesja jest liczona jako trening z zerem serii. Odczyty wymagają połączenia z kontem i nie dodają nowego cache prywatnych danych offline.
