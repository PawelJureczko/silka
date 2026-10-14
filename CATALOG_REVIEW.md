# Katalog ćwiczeń, 14.10.2026

Zakres: widoki A–Z i według partii, wspólne wyszukiwanie, wybór w edytorze oraz 31 nowych ćwiczeń. Kierunek z `DESIGN.md`; antislop during, ENERGY 2 / RHYTHM 2 / MOTION 1.

Sprawdzenia: lint, typecheck, 38 testów jednostkowych, 81 sprawdzeń RLS, 7 testów integracji planów i statyczny build przeszły. Migracja została zastosowana lokalnie i w chmurze; produkcja potwierdziła 116 aktywnych pozycji oraz 31 nowych wspólnych ID. Nie zmieniono wcześniejszych ćwiczeń, planów ani historii. Zdalna historia migracji zawiera `20261014000100`.

Przeglądarka lokalna: oba widoki, filtr Barki/Klatka piersiowa, wyszukiwanie bez polskich znaków, brak wyników, Enter na przełączniku, otwarcie/anulowanie formularza oraz wybór unoszenia hantli przed siebie do niezapisanego planu działają. Zatrzymanie lokalnej bramy API pokazało błąd i ponowienie; po przywróceniu połączenia katalog odzyskał 114 lokalnych pozycji. Nie zapisano fikcyjnych danych w chmurze. Fizycznego iPhone’a nie testowano.

## Delivery Gate: PASS

- R-02 PASS: nowe teksty bez pauzy typograficznej; A–Z używa półpauzy, istniejące tytuły pozostają bez zmian.
- R-03 PASS: pomiar DOM przy 320, 390, 700 i 1280 px nie wykazał poziomego overflow; przy 320 px nowe kontrolki mają 48–66 px wysokości i minimum 121 px szerokości.
- R-17 PASS: liczby pochodzą z rzeczywistych pobranych wpisów; test jednostkowy sprawdza kompletność grup.
- R-18 PASS: brak opinii i referencji.
- R-23 PASS: brak nowych assetów, logo i awatarów.
- R-25 PASS: istniejące pary primary/surface, secondary/background i background/accent zachowują kontrast opisany w `DESIGN.md` i poprzednich raportach.
- R-26 PASS: przełączniki, wyszukiwanie, filtr, ponowienie, formularz i wybór ćwiczenia kliknięto; katalog do przeglądania ma statyczne wiersze bez pozornego dodawania.
- R-27 PASS: ładowanie pełnego katalogu, błąd z ponowieniem i pusty wynik sprawdzono; częściowy odczyt nie jest pokazywany jako kompletna lista.
- R-28 PASS: brak FAQ.
- R-32 PASS: natywne przyciski z aria-pressed, etykiety input/select, region statusu i alert błędu; Enter przełącza widok. Nie deklarujemy testu czytnika ekranu.
- R-33 PASS: UI edytowano bezpośrednio w Vue; formatowanie przez ESLint, bez skryptów przepisywania layoutu.
- R-34 PASS: dotychczasowy ciemny motyw wynikający z briefu właściciela.
- R-35 PASS: dev, build, opisane kliknięcia i rzeczywisty test awarii lokalnego API.
- R-36 PASS: nie dodano obietnic efektów treningu ani integracji zewnętrznych.
- R-37 PASS: kierunek istnieje w `DESIGN.md`, dopisano cel list, filtrów i przewijania.
- R-38 PASS: katalog pokazuje dane z bazy, a test szkicu dotyczył wyłącznie lokalnego konta.
- R-01 PASS: bez gradientów i dekoracyjnych pasków.
- R-04 PASS: bez nowych ikon i emoji.
- R-06 PASS: istniejący systemowy krój; nagłówki partii wyznaczają podział spisu.
- R-07 PASS: jednolite tło bez wzorów.
- R-08 PASS: dotychczasowa strzałka oznacza powrót do planów.
- R-09 PASS: bez odznak i kapsuł nad nagłówkiem.
- R-10 PASS: bez szkła.
- R-12 PASS: bez nowych cieni.
- R-13 PASS: bez glow.
- R-14 PASS: ćwiczenia są wierszami z liniami, nie powielonymi kartami.
- R-19 PASS: bez nowych animacji; istniejące reduced-motion pozostaje.
- R-22 PASS: bez ilustracji.
- Liveliness/dials PASS: jawne 2/2/1, spokojne listy i wyraźne nagłówki.
- Liveliness/focal point PASS: limonka wyróżnia aktywny układ, obok znajduje się alternatywa.
- Liveliness/whitespace PASS: większy odstęp oddziela partie, linie oddzielają ćwiczenia.
- Liveliness/accent PASS: jeden istniejący akcent limonkowy, bez nowych kolorów.
- Liveliness/identity PASS: spis i typografia kontynuują motyw dziennika Siłki.
- Liveliness/design read PASS: zadeklarowano wykorzystanie istniejącego kierunku przed edycją.
- C-1 PASS: uzasadnienia przełącznika, nagłówków i przewijania zapisano w `DESIGN.md`.
- C-2 PASS: każda nowa kontrolka wykonuje opisaną czynność, a statyczny katalog nie udaje selektora.
- C-3 PASS: ekran odpowiada na potrzebę szukania nazwy lub partii, bez sekcji wypełniających szablon.
- C-4 PASS: sprawdzono szerokości, pusty wynik, błąd/ponowienie i Enter; touch nie wymaga hover.
- C-5 PASS: brak fikcyjnych statystyk i twierdzeń produktowych.
- R-05 PASS: liniowy spis wynika z katalogu, bez siatki kart.
- R-11 PASS: promień 6 px dla kontrolek, wiersze bez kapsuł.
- R-15 PASS: etykiety nazywają wybór: Wszystkie A–Z, Partie mięśniowe, Spróbuj ponownie.
- R-16 PASS: bez marketingowych określeń.
- R-20 PASS: zachowano typografię, limonkę i rytm dziennika Siłki.
- R-21 PASS: ciemny motyw jest wymaganiem właściciela.
- R-29 PASS: zachowano dokładne tokeny, czerwony pozostaje przy błędzie.
- R-30 PASS: rozwinięto obecny produkt, bez kopiowania innego interfejsu.
- R-31 PASS: decyzje wizualne mają cel w `DESIGN.md`.
- UI PASS: brak dekoracyjnych ikon, glow, szkła, fałszywych wskaźników i szablonowych kart.
- Mobile PASS: nowe pola i kontrolki reflow przy 320 px, bez kolizji; katalog przewija stronę, selektor ma własny obszar, safe area i miejsce na dolną nawigację pozostają w layoucie.

Dowody: `/tmp/silka-catalog-groups.png`, `/tmp/silka-catalog-mobile.png`, `/tmp/silka-catalog-desktop.png`.
