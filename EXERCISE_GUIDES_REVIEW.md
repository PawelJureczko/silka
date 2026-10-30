# Instrukcje ćwiczeń i ciężar na przerwie

30.10.2026. Zakres: linki do techniki wykonania oraz poprzedni wynik następnej serii. antislop during z wyboru w sesji; kierunek `DESIGN.md`, ENERGY 2 / RHYTHM 2 / MOTION 1.

## Dowody

- Dopasowano wszystkie 118 aktywnych rekordów katalogu produkcyjnego. Każdy ma bezpośrednią instrukcję; 114 różnych adresów otwarto u wydawców i sprawdzono tytuły ćwiczeń. ACE jest pierwszym wyborem; pozostałe warianty pochodzą z Muscle & Strength, StrengthLog oraz filmu OriGym. Istotne różnice ogólnych wariantów opisano przy linkach. Sprawdzenie materiałów nie jest oceną techniki konkretnego użytkownika.
- Testy jednostkowe: 52 PASS, w tym pozycja i rodzaj poprzedniej serii, nowe serie, brak historii, zero, brak ciężaru, polski przecinek, masa ciała i asysta. Instrukcje rozróżniają sprzęt i wariant oraz nie zgadują nieznanych nazw i adresów.
- Lokalna integracja treningów: 30 PASS, z RLS dwóch kont, snapshotami, idempotencją, konfliktem i podmianą. Pierwsza próba była ograniczona brakiem dostępu do lokalnego Dockera w sandboxie; powtórzenie z dostępem do Dockera zakończyło się poprawnie.
- Lint, typecheck i statyczny build PWA zakończyły się poprawnie.
- Test przeglądarkowy na fikcyjnej lokalnej sesji: pierwsza seria 12 × 8 kg; przerwa wskazała poprzednią drugą serię 10 × 10 kg. Po drugiej serii nagłówek przeszedł do wyciskania hantli siedząc, a porównanie do 12 × 12,5 kg na rękę. Kolejna przerwa pokazała 10 × 16 kg. Odświeżenie odtworzyło timer i porównanie. Sesję zakończono z czterema seriami; linki pozostały w historii.
- Link w treningu otwarto Enterem i kliknięciem; nowe karty pokazały instrukcję ACE, a sesja zachowała termin odpoczynku. Focus miał limonkowy obrys 2 px. W edytorze planu widoczne były dwa poprawne linki.
- W wyborze ćwiczenia kliknięcie instrukcji Arnoldków otworzyło materiał Muscle & Strength i pozostawiło dialog otwarty oraz dwie pozycje w planie. Dopiero przycisk nazwy ćwiczenia dodał trzecią pozycję. Niezapisany formularz zamknięto bez zapisywania zmian.
- Katalog A–Z i podział na partie pokazały instrukcje. Filtr „barki” przy 320 px miał 18 linków, każdy co najmniej 44 × 44 px. Nieznane lokalne ćwiczenia testowe pokazały jawną bibliotekę ACE z wyjaśnieniem braku przypisania.
- Pomiar szerokości dokumentu: tryb przerwy i lista serii 320/320 px, tryb przerwy 390/390 px; edytor 768/768 i 1280/1280 px. Bez poziomego overflow. Kontrolki przerwy przy 390 px miały minimum 44 × 44 px. Brak błędów konsoli w sprawdzonym przepływie.
- Kontrast sprawdzony `contrast-check.py`: primary/background 19,06:1; secondary/background 7,76:1; secondary/surface 6,91:1; accent/background 15,23:1.
- Zrzuty lokalnego testu: `/private/tmp/silka-rest-previous.png` i `/private/tmp/silka-exercise-guide.png`. Nie użyto prawdziwych treningów jako danych testowych. Nie testowano tej zmiany na fizycznym iPhonie; zachowanie kart w zainstalowanej PWA wymaga sprawdzenia na urządzeniu. Zewnętrzne materiały mogą zmieniać adresy.

## Delivery Gate: PASS w zakresie zmiany

### Hard Gate

- R-02 PASS: nowe komunikaty nie dodają pauz typograficznych; dotychczasowe nazwy i placeholdery niezmienione.
- R-03 PASS: pomiary 320, 390, 768 i 1280 px opisane wyżej.
- R-17 PASS: poprzednie wyniki i liczby pochodzą z sesji; lokalne przykłady są jawnie testowe.
- R-18 PASS: brak opinii i referencji.
- R-23 PASS: brak nowych grafik, logo i nawigacji.
- R-24 PASS: linki do istniejących stron wydawców, 114 adresów sprawdzonych bezpośrednio.
- R-25 PASS: zmierzone kontrasty 6,91:1 lub wyższe dla użytych par tekstu i tła.
- R-26 PASS: link, wybór ćwiczenia, zakończenie serii, pominięcie przerwy i podsumowanie sprawdzone w przepływie.
- R-27 PASS: pusty wynik, brak kilogramów, brak dopasowania instrukcji mają jawne komunikaty; istniejące stany pobierania i błędu zachowane.
- R-28 PASS: brak FAQ.
- R-32 PASS: natywny link, Enter, nazwa dostępności z ćwiczeniem i nową kartą, obrys focusa 2 px.
- R-33 PASS: bezpośrednie poprawki Vue/TS, bez skryptu przepisującego UI.
- R-34 PASS: zachowany jedyny uzgodniony ciemny motyw.
- R-35 PASS: build i elementy zmienionego przepływu sprawdzone, lista czynności wyżej.
- R-36 PASS: bez nowych deklaracji bezpieczeństwa, diagnoz i gwarancji działania iPhone’a.
- R-37 PASS: istniejący kierunek i cele obu zmian zapisane w `DESIGN.md`.
- R-38 PASS: brak wymyślonych materiałów lub produkcyjnych wyników; jawna biblioteka dla nierozpoznanej nazwy.

### Purpose-Gate

- R-01 PASS: bez gradientów.
- R-04 PASS: bez nowych ikon.
- R-06 PASS: dotychczasowy sans i cyfry tablicowe służą czytaniu ciężaru.
- R-07 PASS: jednolite tło.
- R-08 PASS: bez ozdobnych strzałek.
- R-09 PASS: bez nowych kapsuł i odznak.
- R-10 PASS: bez szkła.
- R-12 PASS: bez nowych cieni.
- R-13 PASS: bez glow.
- R-14 PASS: liniowy katalog i wynik, bez siatki kart.
- R-19 PASS: bez nowych animacji, respektowane istniejące reduced-motion.
- R-22 PASS: bez ilustracji.

### Liveliness

- Dials PASS: jawne 2/2/1, zachowane w zmianie.
- Focal point PASS: duża nazwa i wynik; limonkowy timer nadal wyróżnia odpoczynek.
- Whitespace PASS: linia nad poprzednim wynikiem oddziela przygotowanie sprzętu od akcji.
- Accent PASS: jedna limonka istniejącego systemu, zwykły link ma biały tekst i podkreślenie.
- Identity PASS: numerowane serie, duże cyfry i język osobistego dziennika.
- Design Read PASS: kierunek z `DESIGN.md`, kontynuacja uzgodnionego wyglądu.

### Craftsmanship i Quality Locks

- C-1 PASS: cele obu zmian zapisano w `DESIGN.md`.
- C-2 PASS: instrukcja ma realny adres i otwiera kartę; test wyboru nie zmienia planu po kliknięciu linku.
- C-3 PASS: wynik pomaga przygotować ciężar, link pomaga sprawdzić technikę; bez dodatkowych sekcji szablonowych.
- C-4 PASS: brak danych i nieznane ćwiczenie obsłużone, sprawdzona klawiatura i opisane szerokości; ograniczenie testów fizycznego iOS jawne.
- C-5 PASS: materiały od rzeczywistych wydawców, dane porównania odczytane z historii.
- R-05 PASS: zachowany przepływ treningu i liniowy katalog.
- R-11 PASS: istniejące promienie kontrolek bez nowych kapsuł.
- R-15 PASS: konkretne „Jak wykonać?” i „Poprzednio w tej serii”.
- R-16 PASS: bez marketingowych określeń.
- R-20 PASS: dziennik serii z własną hierarchią wyniku i odpoczynku.
- R-21 PASS: ciemny motyw z briefu użytkownika.
- R-29 PASS: brak nowych tokenów kolorów.
- R-30 PASS: rozwinięcie Siłki bez kopiowania układu innego produktu.
- R-31 PASS: uzasadnienia w tabeli decyzji `DESIGN.md`.
- UI PASS: źródło i różnice wariantu są podpisane; wynik nie jest automatyczną sugestią zwiększenia ciężaru.
- Mobile PASS: linki minimum 44 px, przewijany przepływ, brak autofocusa i poziomego overflow w sprawdzonych widokach.
