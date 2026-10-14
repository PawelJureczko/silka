# Kierunek wizualny Siłki

Rozwinięcie briefu z `PROJECT.md` i zlecenia wyróżnienia layoutu z 11.10.2026. Produkt pozostaje osobistym, mobilnym dziennikiem treningów dla dwóch osób.

## Charakter

Konkretny zapis wysiłku: jednostka, ćwiczenie, seria, wynik. Język dziennika treningowego, z dużymi liczbami i wyraźnymi podziałami. Bez marketingowych ozdobników, fikcyjnych wyników i ilustracji w pustych stanach.

ENERGY 2 / RHYTHM 2 / MOTION 1. Energia wynika z typografii i wyniku, rytm z różnic między akcją, spisem a historią. Ruch ogranicza się do informacji zwrotnej przy obsłudze kontrolek; respektuje `prefers-reduced-motion`.

## Decyzje i ich cel

| Decyzja | Powód |
| --- | --- |
| Paleta z `PROJECT.md`, dark mode | Zachowuje wybrany przez właściciela motyw i znajomy kontekst pracy na telefonie. |
| Limonka przy rozpoczęciu, rekordzie i aktywnym miejscu | Wskazuje działanie lub wynik, który ma pierwszeństwo przed pozostałą treścią. |
| Systemowy sans, ciężkie nagłówki, cyfry tablicowe | Czytelne polskie znaki i stabilne liczby bez dodatkowego pobierania fontów na iPhonie. |
| Tekstowa nazwa „siłka.” | Wykorzystuje istniejącą nazwę; mocniejszy krój i pochylenie podkreślają charakter sportowy bez tworzenia nowego symbolu. |
| Numerowane jednostki, plany i ćwiczenia | Kolejność pracy tworzy motyw dziennika; numery wynikają z rzeczywistej listy. |
| Start: jedna wyraźna powierzchnia głównej akcji | Rozpoczęcie lub wznowienie ma pierwszeństwo przed podsumowaniem tygodnia. |
| Plany jako spis z wierszami | Szybciej porównuje się nazwy i status aktywnego planu, bez powtarzania dekoracyjnych ikon. |
| Postępy: wynik ćwiczenia przed regularnością | Najpierw odpowiadają na pytanie o ciężar i poprzednie sesje; regularność jest osobnym uzupełnieniem. |
| Sesja: indeks ćwiczenia i odrębne pola serii | Pozycja w treningu jest widoczna, a zaznaczenie wykonania ma tekst i obramowanie. |
| Promień 6 px dla kontrolek, 8 px dla serii, 12 px dla powierzchni | Kształt odróżnia kontrolkę od grupy danych; nie wszystkie elementy są kapsułami. |
| Linie między treścią i różne odstępy | Oddzielają jednostki pracy, bez zagnieżdżania każdej informacji w kolejnej karcie. |
| Istniejące ikony tylko tam, gdzie opisują czynność | Nawigacja pozostaje rozpoznawalna, bez nowych bibliotek ani dekoracyjnych symboli. |
| Strzałki przy powrocie, paginacji i wejściu w wynik | Sygnalizują kierunek nawigacji, nie są dodatkiem do każdej akcji. |
| Cień przy przypiętym timerze | Odróżnia timer od przewijanej pod nim treści. Pozostałe powierzchnie są płaskie. |
| Pełnoekranowa seria z dużą nazwą i dwoma polami | Na siłowni jedna seria jest główną decyzją; schowanie nawigacji uwalnia miejsce i ogranicza przypadkowe wyjścia. |
| Odpoczynek zastępuje formularz serii | Oddziela wykonanie od regeneracji i pokazuje wyraźnie, kiedy przejść do kolejnej serii. |
| Popup aktualizacji tylko na Starcie | Nowa wersja jest widoczna przy uruchomieniu, a edycja i aktywne ćwiczenie nie są przerywane dialogiem. |
| Konsultacja jako zapis 01 prompt, 02 odpowiedź, 03 podgląd | Kolejność odpowiada ręcznemu przenoszeniu danych; linie i numeracja rozwijają motyw dziennika. |
| Różnice planu w wierszach „Było / Propozycja” | Pokazują dokładnie, co użytkownik zatwierdza, w tym usunięte dane. |
| Formularz konsultacji i lista powrotu w dwóch kolumnach od 850 px | Na szerokim ekranie kontynuacja jest dostępna obok przygotowania; na telefonie zachowujemy pojedynczy przepływ. |
| Nowy plan: ankieta przed pustym edytorem | Osoba bez historii dostaje wyraźny punkt startu; ręczne układanie pozostaje osobnym wyborem. |
| Ankieta w czterech numerowanych grupach z liniami | Cel, warunki treningu, ograniczenia i preferencje są oddzielnymi decyzjami; numeracja rozwija istniejący motyw dziennika. |
| Pola ankiety w jednej kolumnie, krótkie pary od 600 px | Na telefonie etykiety mają pełną szerokość, a na tablecie sprzęt i krótkie odpowiedzi można czytać obok siebie. |
| Instalacja i aktualizacje w liniowej sekcji profilu | Ustawienia urządzenia mają jedno miejsce; linie rozwijają rytm dziennika bez dodatkowych kart i ozdobnych ikon. |
| Krótki komunikat braku sieci przed treścią | Stan połączenia pozostaje widoczny bez zasłaniania pól treningu ani przypiętego timera. |
| Snackbar po kopiowaniu, nad dolną nawigacją | Natychmiast potwierdza wynik; obramowanie i cień oddzielają go od przewijanej treści, a limonka pozostaje przy głównym CTA. |

## Reflow i obsługa

- Telefon: jeden przepływ treści, dolna nawigacja z czterema podpisanymi pozycjami, główne kontrolki co najmniej 44 × 44 px.
- Od 700 px: start i postępy rozdzielają treści na dwie kolumny; długa historia zajmuje całą szerokość.
- Od 1000 px: nawigacja mieści się w nagłówku; wiersz planu ma oddzielną kolumnę akcji. Treść zachowuje maksymalną szerokość.
- Granice wynikają z miejsca potrzebnego treści. Należy sprawdzać również szerokości pomiędzy progami.
- Safe area i dolny odstęp chronią ostatnią kontrolkę przed nawigacją. Formularze używają co najmniej 16 px tekstu; focus pozostaje widoczny.
- Pusty stan wyjaśnia kolejny krok; ładowanie nazywa pobierane dane; błąd pozwala ponowić odczyt. Żaden stan nie dopisuje fikcyjnej historii.

Ten kierunek dotyczy prezentacji. Reguły treningów, zapisu, izolacji kont i zatwierdzania zmian pozostają w `PROJECT.md`.
