# Tortorici: dati demografici e socioeconomici

Piattaforma interattiva e open data per l'analisi della struttura demografica, dei flussi anagrafici, del reddito imponibile e delle dinamiche socioeconomiche del comune di **Tortorici (ME)**, nei Nebrodi.

🌐 **Demo online**: Una volta abilitate le GitHub Pages (vedi sotto), l'applicazione sarà accessibile all'indirizzo `https://dmalessio.github.io/dati-tortorici/`.

---

## 📊 Dataset Inclusi (Ground Truth certificata)

Tutti i dataset storici sono normalizzati e disponibili sia all'interno dell'applicazione che come file CSV/JSON direttamente scaricabili nella cartella [`data/`](data/):

| Dataset | Fonte Ufficiale | Periodo | Descrizione |
| :--- | :--- | :--- | :--- |
| `redditi_irpef_2001_2024.csv` | **MEF - Dipartimento Finanze** | 2001–2024 | Contribuenti, imponibile complessivo, reddito medio per dichiarante e per residente, ripartizione per lavoro dipendente e pensioni. |
| `popolazione_andamento_2001_2024.csv` | **ISTAT** | 2001–2024 | Serie storica dei residenti al 31 dicembre, variazioni percentuali, famiglie e numero medio di componenti. |
| `movimento_naturale_2002_2024.csv` | **ISTAT** | 2002–2024 | Nascite, decessi e saldo naturale annuo. |
| `flussi_migratori_2002_2024.csv` | **ISTAT** | 2002–2024 | Immigrazioni (da altri comuni e dall'estero), emigrazioni e saldi migratori. |
| `indici_demografici_2002_2025.csv` | **ISTAT** | 2002–2025 | Indice di vecchiaia, indice di ricambio della popolazione attiva, dipendenza strutturale, natalità e mortalità. |
| `piramidi_eta_2002_2025.json` | **ISTAT** | 2002–2025 | 24 piramidi complete per genere e per stato civile (celibi/nubili, coniugati, vedovi, divorziati). |
| `eta_scolastica_2002_2025.json` | **ISTAT** | 2002–2025 | Serie annuale da 0 a 18 anni con aggregazione per cicli (nido, infanzia, primaria, medie, superiori). |
| `stranieri_per_paese_2025.csv` | **ISTAT** | 2025 | Residenti per nazione estera di cittadinanza (17 paesi). |
| `censimenti_storici_1861_2021.csv` | **ISTAT** | 1861–2021 | 16 censimenti generali post-unitari con note storiche e popolazione legale. |
| `parco_veicolare_2004_2016.csv` | **ACI / PRA** | 2004–2016 | Autovetture, motoveicoli, trasporto merci e tasso di motorizzazione ogni 1.000 residenti. |
| `comuni_limitrofi_benchmark.csv` | **ISTAT** | 2025 | Confronto demografico con i comuni contermini dei Nebrodi e della provincia di Messina. |
| `snai_istat_projections_benchmark.json` | **ISTAT Focus Aree Interne & SNAI** | 2021–2027 | Parametri ufficiali della *Strategia Nazionale per le Aree Interne* (Area di Progetto Nebrodi) e proiezioni ISTAT al 2033, 2043 e 2050. |

---

## 🚀 Funzionalità della Piattaforma

1. **Sticky Year Scrubber Controller**: barra di controllo temporale persistente in testata con riproduzione automatica, tasti passo-passo e salti agli anni chiave (2002, 2008, 2011, 2016, 2020, 2025).
2. **Piramide delle Età Dinamica**: visualizzazione per genere e per stato civile, con scale di proporzione fisse universali per evitare riscalature arbitrarie tra un anno e l'altro.
3. **Diagramma di Flusso Idraulico**: rappresentazione a nodi degli ingressi (nascite e iscrizioni anagrafiche) e delle uscite (decessi e cancellazioni) che alimentano il bacino residenziale di Tortorici.
4. **Osservatorio Scuola (0–18 anni)**: monitoraggio del fabbisogno scolastico per ciascun ciclo educativo.
5. **Indicatori Economici MEF e Mobilità ACI**: evoluzione del reddito imponibile medio per contribuente (salito a € 15.253 nel 2024) e parco autoveicoli.
6. **Planisfero Vettoriale delle Comunità Straniere**: mappa SVG mondiale con rotte migratorie verso Tortorici.
7. **Cronologia Secolare dei Censimenti (1861–2021)**: serie storica con etichette numeriche permanenti su tutti i 16 censimenti e tracciamento del picco del 1921 (16.269 residenti).
8. **Simulatore Previsionale a Componenti di Coorte (2025–2050)**: calcolo della traiettoria demografica futura a confronto continuo con la curva mediana ufficiale ISTAT per le Aree Interne del Mezzogiorno e gli scenari di coesione territoriale SNAI.
9. **Centro Dati & Esploratore CSV**: ricerca full-text, visualizzazione tabellare e download con un clic di tutti i dataset.

---

## 🛠️ Esecuzione in Locale

L'applicazione è interamente statica (HTML5, Vanilla CSS, Vanilla JavaScript): non richiede build tools, bundler o dipendenze esterne pesanti.

Per eseguirla localmente con Python:

```bash
# Clona il repository
git clone https://github.com/dmalessio/dati-tortorici.git
cd dati-tortorici

# Avvia un server HTTP locale
python -m http.server 8080
```

Apri quindi il browser all'indirizzo: **`http://localhost:8080`**.

---

## 🌐 Come Pubblicare su GitHub Pages

Per rendere il sito pubblico e accessibile a tutti via web tramite **GitHub Pages**:

1. Vai sul repository su GitHub: `https://github.com/dmalessio/dati-tortorici`;
2. Clicca sulla scheda **Settings** (Impostazioni in alto a destra);
3. Nel menu laterale a sinistra, clicca su **Pages**;
4. Nella sezione **Build and deployment**:
   * **Source**: seleziona *Deploy from a branch*;
   * **Branch**: seleziona `main` e cartella `/ (root)`;
   * Clicca su **Save**.
5. Nel giro di 1-2 minuti, il sito sarà online all'indirizzo:
   👉 **`https://dmalessio.github.io/dati-tortorici/`**

---

## 📄 Struttura della Cartella

```text
├── css/
│   └── styles.css               # Design system istituzionale e layout anti-shifting
├── data/                        # Dataset CSV e JSON certificati
│   ├── censimenti_storici_1861_2021.csv
│   ├── comuni_limitrofi_benchmark.csv
│   ├── eta_scolastica_2002_2025.json
│   ├── flussi_migratori_2002_2024.csv
│   ├── indici_demografici_2002_2025.csv
│   ├── movimento_naturale_2002_2024.csv
│   ├── parco_veicolare_2004_2016.csv
│   ├── piramidi_eta_2002_2025.json
│   ├── popolazione_andamento_2001_2024.csv
│   ├── redditi_irpef_2001_2024.csv
│   ├── snai_istat_projections_benchmark.json
│   ├── stranieri_per_paese_2025.csv
│   └── tortorici_demographics_master.json
├── js/
│   ├── app.js                   # Controller principale, time scrubber e ScrollSpy
│   ├── charts.js                # Motore grafico piramidi, scuola, censimenti e flussi
│   ├── data.js                  # Master dataset integrato in formato JS
│   ├── map.js                   # Planisfero vettoriale SVG
│   └── simulator.js             # Simulatore previsionale a componenti 2025–2050
├── scripts/                     # Script Python di estrazione e verifica automatica
│   ├── fetch_all_mef_opendata.py
│   ├── fetch_additional_sources.py
│   ├── integrate_snai_data.py
│   ├── test_frontend_integration.py
│   └── verify_ground_truth.py
├── .gitignore
├── index.html                   # Entry point applicazione
└── README.md                    # Documentazione del progetto
```
