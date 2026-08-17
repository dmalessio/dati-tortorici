# Tortorici: dati demografici e socioeconomici

Piattaforma interattiva e open data per l'esplorazione dei dati demografici, anagrafici, fiscali e socioeconomici del comune di **Tortorici (ME)**, nel Parco dei Nebrodi.

🌐 **Applicazione online**: [https://dmalessio.github.io/dati-tortorici/](https://dmalessio.github.io/dati-tortorici/)

---

## 📌 Cosa contiene la dashboard

La dashboard offre un quadro statistico completo e dinamico articolato in sezioni tematiche:

1. **Time Machine (2002–2025)**: navigatore temporale per visualizzare l'evoluzione storica anno per anno con riproduzione animata e indicatori sintetici in tempo reale (popolazione, età media, indice di vecchiaia, ricambio generazionale).
2. **Struttura per Età e Genere**: piramide delle età (per genere e stato civile) con scale proporzionali costanti nel tempo.
3. **Dinamica Naturale e Migratoria**: diagramma di flusso che illustra nascite, decessi, iscrizioni, cancellazioni anagrafiche e relativi saldi.
4. **Osservatorio Scuola (0–18 anni)**: andamento del fabbisogno educativo suddiviso per cicli (nido, infanzia, primaria, medie, superiori).
5. **Redditi IRPEF e Mobilità**: serie storiche MEF sui redditi imponibili (2001–2024), ripartizione per lavoro dipendente e pensioni, e statistiche di motorizzazione ACI.
6. **Comunità Straniere**: mappa vettoriale con le nazionalità estere dei residenti.
7. **Serie Storica della Popolazione**: visualizzazione a doppia modalità con i **16 censimenti generali (1861–2021)** e l'**andamento annuale continuo (2001–2024)**.
8. **Simulatore Previsionale (2025–2050)**: modello di simulazione what-if su natalità, mortalità e migrazioni a confronto con il benchmark ufficiale ISTAT Aree Interne e il trend storico locale.
9. **Esploratore Dati Open Data**: tabella con ricerca full-text e download con un clic di tutti i dataset in formato CSV.

---

## 🏛️ Fonti Ufficiali

* **ISTAT** — Censimento permanente della popolazione, bilanci demografici e serie anagrafiche.
* **MEF (Dipartimento delle Finanze)** — Open Data sulle dichiarazioni dei redditi IRPEF delle persone fisiche.
* **ACI / PRA** — Statistiche annuali del Pubblico Registro Automobilistico.
* **SNAI / Coesione Territoriale** — Strategia Nazionale per le Aree Interne (Area di Progetto Nebrodi).

---

## 🛠️ Utilizzo in locale

L'applicazione è interamente statica (HTML, CSS e JavaScript standard):

```bash
git clone https://github.com/dmalessio/dati-tortorici.git
cd dati-tortorici
python -m http.server 8080
```

Apri quindi il browser all'indirizzo: `http://localhost:8080`.
