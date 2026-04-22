# Aplikacja webowa do wizualizacji danych z czujników (prototyp)

## 1) Analiza wymagań użytkownika
Aplikacja jest przeznaczona dla użytkowników monitorujących środowisko za pomocą czujników.

### Wymagania funkcjonalne i realizacja
- **Odczyt danych z czujników** – w prototypie realizowany przez symulator danych (`simulateSensorData`).
- **Wizualizacja danych** – wykres liniowy i karty KPI (temperatura, wilgotność, ciśnienie).
- **Aktualizacja w czasie rzeczywistym** – odświeżanie co 3 sekundy (`setInterval`).
- **Dostęp do danych historycznych** – tabela z ostatnimi 20 pomiarami.
- **Generowanie alertów po przekroczeniu progów** – panel alertów + formularz konfiguracji progów.

### Wymagania niefunkcjonalne i realizacja
- **Szybkie działanie** – lekki frontend bez frameworków, wyłącznie HTML/CSS/JS + Chart.js.
- **Dostęp przez przeglądarkę** – aplikacja SPA uruchamiana jako statyczna strona.
- **Prosty i intuicyjny interfejs** – dashboard podzielony na sekcje (karty, wykres, alerty, historia).
- **Możliwość rozbudowy** – kod rozdzielony na warstwy UI/symulacja/logika progów.

## 2) Założenia projektowe

## Architektura klient–serwer
- **Klient:** przeglądarka uruchamiająca interfejs dashboardu.
- **Serwer (docelowo):** REST API lub WebSocket dla danych z czujników.
- **Prototyp:** symulacja po stronie klienta, bez backendu.

## Technologie
- Frontend: **HTML, CSS, JavaScript**
- Wizualizacja: **Chart.js**

## Założenia działania
- Dane są odświeżane cyklicznie co 3 sekundy.
- W prototypie dane są symulowane.
- Wizualizacja obejmuje wykres + dashboard.
- Użytkownik może ustawić progi alertów.

## 3) Rozwój systemu (kolejne etapy)
1. Integracja z rzeczywistymi czujnikami (MQTT / HTTP / Modbus gateway).
2. Wprowadzenie bazy danych (np. PostgreSQL, TimescaleDB lub InfluxDB).
3. Logowanie użytkowników i role (operator / administrator).
4. Trwałe reguły alertowe i powiadomienia (email, SMS, webhook).
5. Eksport raportów i analiza trendów.

## 4) Uruchomienie
Wystarczy otworzyć `index.html` w przeglądarce.

Alternatywnie (zalecane): uruchomić prosty serwer statyczny, np.:
```bash
python3 -m http.server 8080
```
a następnie wejść na `http://localhost:8080`.
