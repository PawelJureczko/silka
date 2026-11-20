# Decyzja na następny trening

21.11.2026. Zlecenie rozpoczęte 20.11. Tryb antislop during z wyboru w sesji. Kierunek `DESIGN.md`, ENERGY 2 / RHYTHM 2 / MOTION 1. Zakres: prywatny wybór „Progres / Zostaw / Lżej” dla ćwiczenia sesji i przypomnienie przy kolejnym wykonaniu.

## Weryfikacja

- 55 testów jednostkowych PASS: wartości domyślne, stara kolejka v1 bez pola, zapis i odtworzenie decyzji, brak zmiany serii, niezgodny wariant i reset przy podmianie. Oryginał z wykonanymi seriami zachowuje decyzję.
- 37 testów integracji treningów PASS: dwa konta i brak logowania, wartości enum i null, atomowość i rollback późnego błędu, rewizja, ponowienie po utracie odpowiedzi, stare payloady oraz niezmienność wyników, planowanych wartości, statusu i czasów zakończonej sesji. Nowa sesja pokazuje decyzję ostatniego zgodnego wariantu; niejednoznaczna ostatnia sesja nie wskazuje arbitralnie starszego wyniku. Format oryginalnego RPC pozostał niezmieniony.
- 81 sprawdzeń RLS i 7 testów postępów PASS. Lint, typecheck i statyczny build PWA PASS. Typy wygenerowano z lokalnego schematu.
- Lokalna próba UI na fikcyjnym koncie: zakończona historia miała domyślne „Zostaw”. Wybór „Lżej” Enterem zachował wyniki 10 × 20 kg. Po odświeżeniu pozostał zaznaczony. Zmiana przez Tab i Spację zachowała focus z obrysem 2 px.
- Wstrzymano tylko lokalny kontener REST, bez wpływu na produkcję. „Progres” został zabezpieczony lokalnie, odtworzony po reloadzie i pokazany ze stanem oczekiwania na synchronizację. Po przywróceniu REST zapis dotarł do konta. Kontener przywrócono.
- Następna fikcyjna sesja pokazała poprzednią decyzję „Progres” przy 10 × 20 kg. Własny wybór nowej sesji zaczął od „Zostaw”. Pola ciężaru pozostały puste. Wybrano „Lżej”, zapisano 12 × 22,5 kg; przerwa przeszła do drugiego ćwiczenia z jego decyzją „Zostaw”. Drugie ćwiczenie otrzymało „Progres”; oba wybory przetrwały zakończenie sesji.
- Przy aktywnym lokalnym treningu próba edycji innej historii pokazała „Najpierw rozstrzygnij lokalny szkic treningu”. Aktywna sesja pozostała dostępna z zapisanymi danymi.
- Dla zakończonej fikcyjnej sesji zasymulowano drugie urządzenie i konflikt rewizji. Widok zachował lokalne „Progres”, pokazał konflikt i wymagał jawnego odczytu wersji z konta. Po zatwierdzeniu odczytał zdalne „Lżej”.
- Pomiar dokumentu: 320/320, 390/390, 768/768 i 1280/1280 px, bez poziomego overflow. Przy 320 px nowe przyciski miały minimum 44 × 44 px. Zawijanie tekstu nie jest blokowane. Nie testowano fizycznego iPhone’a, klawiatury iOS ani rzeczywistego powiększenia tekstu 200%; funkcja nie wywołuje klawiatury.
- Kontrast `contrast-check.py`: primary/interactive 14,27:1; secondary/background 7,76:1; secondary/interactive 5,81:1; accent/interactive 11,40:1. Obramowanie kontrolki używa secondary, zaznaczenie ma także podkreślenie i `aria-pressed`.
- Zrzuty lokalnych prób: `/private/tmp/silka-decision-choice.png`, `/private/tmp/silka-decision-offline.png`, `/private/tmp/silka-decision-conflict.png`. Dane były fikcyjne i nie trafiły do chmury.
- Migracje wdrożono na produkcji po porównaniu MD5 dotychczasowej funkcji i historii migracji. Jedna transakcja zapisała obie wersje; kontrola potwierdziła RLS i SECURITY INVOKER oraz zero decyzji innych niż domyślne `maintain` w istniejącej historii. Nie zmieniano prawdziwych wyników w ramach testu funkcji.

## Delivery Gate: PASS w zakresie zmiany

### Hard Gate

- R-02 PASS: nowe komunikaty bez pauzy typograficznej; istniejące tytuły niezmienione.
- R-03 PASS: cztery rzeczywiste szerokości i pomiar braku overflow opisane wyżej.
- R-17 PASS: poprzednia decyzja i wyniki pochodzą z prywatnej sesji.
- R-18 PASS: bez opinii i referencji.
- R-23 PASS: bez nowych grafik, logo i nawigacji.
- R-24 PASS: brak nowych linków nawigacyjnych.
- R-25 PASS: kontrast tekstu i krawędzi policzony, minimum 5,81:1 dla nowych par.
- R-26 PASS: kliknięto i użyto klawiaturą wszystkich trzech wyborów; zapis i ponowny odczyt sprawdzono.
- R-27 PASS: brak poprzedniej decyzji ma komunikat, odczyt ma stałe miejsce, błąd zapisu i konflikt zachowują szkic.
- R-28 PASS: bez FAQ.
- R-32 PASS: natywne przyciski w nazwanym fieldset, aria-pressed, Tab/Spacja/Enter i widoczny focus 2 px; zwykły zapis nie wyłącza i nie odbiera focusa przyciskowi.
- R-33 PASS: bezpośrednie edycje Vue/TS; bez skryptu przepisującego UI.
- R-34 PASS: zachowany ciemny motyw uzgodniony w briefie.
- R-35 PASS: uruchomiono aplikację i build oraz opisany przepływ lokalny, z odświeżeniem, brakiem API i konfliktem.
- R-36 PASS: bez gwarancji działania na fizycznym iOS i bez fikcyjnych deklaracji.
- R-37 PASS: kierunek dziennika i cele wyborów zapisane w `DESIGN.md`.
- R-38 PASS: bez fikcyjnych produkcyjnych danych; przykłady testowe jawnie lokalne.

### Purpose-Gate

- R-01 PASS: bez gradientów.
- R-04 PASS: bez nowych ikon.
- R-06 PASS: dotychczasowy sans, czytelne etykiety zamiast ozdobnej typografii.
- R-07 PASS: dotychczasowe jednolite tło.
- R-08 PASS: brak ozdobnych strzałek.
- R-09 PASS: brak nowych kapsuł i odznak.
- R-10 PASS: brak szkła.
- R-12 PASS: bez nowych cieni.
- R-13 PASS: bez glow.
- R-14 PASS: wybory pod seriami, bez siatki kart.
- R-19 PASS: bez nowych animacji, istniejące reduced-motion zachowane.
- R-22 PASS: brak ilustracji.

### Liveliness

- Dials PASS: jawne 2/2/1, utrzymane w istniejącym dzienniku.
- Focal point PASS: wynik lub timer nadal prowadzi ekran; decyzja jest akcją pomocniczą pod serią.
- Whitespace PASS: linia i legenda oddzielają wykonane dane od zamiaru na przyszłość; przypomnienie rezerwuje dwie linie przed polami.
- Accent PASS: limonka zaznacza aktywny wybór, pozostałe kontrolki pozostają neutralne.
- Identity PASS: numeracja ćwiczeń, duży wynik i język dziennika Siłki zachowane.
- Design Read PASS: kierunek z `DESIGN.md`, bez wprowadzania nowego stylu.

### Craftsmanship i Quality Locks

- C-1 PASS: cel i hierarchia obu elementów opisane w `DESIGN.md`.
- C-2 PASS: trzy wybory mają sprawdzony zapis, a przypomnienie odpowiada poprzedniej sesji.
- C-3 PASS: treść dotyczy decyzji użytkownika, bez dodatkowych sekcji szablonowych.
- C-4 PASS: odtworzenie, brak API, konflikt, ochrona innego aktywnego szkicu i klawiatura sprawdzone; ograniczenia fizycznego iOS i zoomu są jawne.
- C-5 PASS: brak wymyślonych twierdzeń o skuteczności treningu lub automatycznej zmianie obciążenia.
- R-05 PASS: zachowany przepływ aktywnej serii i liniowej historii.
- R-11 PASS: prostokątne kontrolki z promieniem z systemu, bez kapsuł.
- R-15 PASS: konkretne „Progres / Zostaw / Lżej” i legenda „Następnym razem”.
- R-16 PASS: bez marketingowych określeń.
- R-20 PASS: motyw dziennika serii i wyniku zachowany.
- R-21 PASS: dark mode z briefu właściciela.
- R-29 PASS: bez nowych kolorów.
- R-30 PASS: rozwinięcie obecnego produktu, bez kopiowania układu innej aplikacji.
- R-31 PASS: cele layoutu opisane w tabeli decyzji.
- UI PASS: neutralne domyślne „Zostaw”, podpisany kierunek asysty i masy ciała, bez automatycznego wpisywania kilogramów.
- Mobile PASS: trzy duże przyciski mieszczą się przy 320 px; brak autofocusa, przewijanie strony i safe area pozostają.
