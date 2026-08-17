import os
import re
import json
import csv
import time
import requests
from bs4 import BeautifulSoup

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, 'data')
CACHE_DIR = os.path.join(BASE_DIR, 'cache_html')
os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(CACHE_DIR, exist_ok=True)

session = requests.Session()
session.headers.update({
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept-Language': 'it-IT,it;q=0.9,en-US;q=0.8,en;q=0.7',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
})

def get_cache_filename(url):
    clean = re.sub(r'[^a-zA-Z0-9_-]', '_', url.replace('https://www.tuttitalia.it/sicilia/55-tortorici/statistiche/', ''))
    return os.path.join(CACHE_DIR, f"{clean}.html")

def fetch_html(url, delay=0.4):
    cache_file = get_cache_filename(url)
    if os.path.exists(cache_file):
        with open(cache_file, 'r', encoding='utf-8') as f:
            return f.read()
            
    print(f"Fetching from web: {url}")
    for attempt in range(3):
        try:
            time.sleep(delay)
            resp = session.get(url, timeout=15)
            resp.raise_for_status()
            content = resp.text
            with open(cache_file, 'w', encoding='utf-8') as f:
                f.write(content)
            return content
        except Exception as e:
            print(f"Attempt {attempt+1} failed for {url}: {e}")
            time.sleep(2 * (attempt + 1))
            
    raise RuntimeError(f"Impossibile scaricare {url} dopo 3 tentativi")

def clean_text(text):
    if not text:
        return ''
    return ' '.join(text.replace('\xa0', ' ').replace('\n', ' ').strip().split())

def parse_number(text):
    if not text:
        return None
    cleaned = clean_text(text).replace('.', '').replace(',', '.').replace('%', '').replace('+', '').replace('(', '').replace(')', '')
    try:
        if '-' in cleaned and len(cleaned) > 1 and cleaned[0] == '-':
            return float(cleaned)
        elif cleaned == '-' or cleaned == '':
            return None
        return float(cleaned)
    except ValueError:
        return None

def parse_int(text):
    num = parse_number(text)
    return int(num) if num is not None else None

def parse_float(text):
    return parse_number(text)

def get_cell_first_int(td):
    if not td:
        return None
    raw_tokens = td.get_text(separator=' ').strip().split()
    if not raw_tokens:
        return None
    return parse_int(raw_tokens[0])

def get_cell_first_float(td):
    if not td:
        return None
    raw_tokens = td.get_text(separator=' ').strip().split()
    if not raw_tokens:
        return None
    return parse_float(raw_tokens[0])

# 1. Popolazione Andamento Demografico (2001-2024)
def fetch_popolazione_andamento():
    url = "https://www.tuttitalia.it/sicilia/55-tortorici/statistiche/popolazione-andamento-demografico/"
    html = fetch_html(url)
    soup = BeautifulSoup(html, 'html.parser')
    tables = soup.find_all('table')
    
    pop_rows = []
    if len(tables) >= 1:
        for tr in tables[0].find('tbody').find_all('tr'):
            tds = tr.find_all(['td', 'th'])
            if len(tds) >= 7:
                anno_str = clean_text(tds[0].get_text(separator=' '))
                data_ril = clean_text(tds[1].get_text(separator=' '))
                pop_res = get_cell_first_int(tds[2])
                var_ass = get_cell_first_int(tds[3])
                var_pct = get_cell_first_float(tds[4])
                num_fam = get_cell_first_int(tds[5])
                med_comp = get_cell_first_float(tds[6])
                
                pop_rows.append({
                    'anno_riferimento': anno_str,
                    'data_rilevamento': data_ril,
                    'popolazione_residente': pop_res,
                    'variazione_assoluta': var_ass,
                    'variazione_percentuale': var_pct,
                    'numero_famiglie': num_fam,
                    'media_componenti_famiglia': med_comp
                })
                
    nat_rows = []
    if len(tables) >= 2:
        for tr in tables[1].find('tbody').find_all('tr'):
            tds = tr.find_all(['td', 'th'])
            if len(tds) >= 7:
                anno_str = clean_text(tds[0].get_text(separator=' '))
                bilancio = clean_text(tds[1].get_text(separator=' '))
                nascite = get_cell_first_int(tds[2])
                var_nas = get_cell_first_int(tds[3])
                decessi = get_cell_first_int(tds[4])
                var_dec = get_cell_first_int(tds[5])
                saldo_nat = get_cell_first_int(tds[6])
                
                nat_rows.append({
                    'anno_riferimento': anno_str,
                    'periodo_bilancio': bilancio,
                    'nascite': nascite,
                    'variazione_nascite': var_nas,
                    'decessi': decessi,
                    'variazione_decessi': var_dec,
                    'saldo_naturale': saldo_nat
                })

    migr_rows = []
    if len(tables) >= 3:
        for tr in tables[2].find('tbody').find_all('tr'):
            tds = tr.find_all(['td', 'th'])
            if len(tds) >= 9:
                anno_str = clean_text(tds[0].get_text(separator=' '))
                iscr_comuni = get_cell_first_int(tds[1])
                iscr_estero = get_cell_first_int(tds[2])
                iscr_altri = get_cell_first_int(tds[3]) or 0
                canc_comuni = get_cell_first_int(tds[4])
                canc_estero = get_cell_first_int(tds[5])
                canc_altri = get_cell_first_int(tds[6]) or 0
                saldo_estero = get_cell_first_int(tds[7])
                saldo_totale = get_cell_first_int(tds[8])
                
                migr_rows.append({
                    'anno_riferimento': anno_str,
                    'iscritti_da_altri_comuni': iscr_comuni,
                    'iscritti_da_estero': iscr_estero,
                    'iscritti_altri': iscr_altri,
                    'cancellati_per_altri_comuni': canc_comuni,
                    'cancellati_per_estero': canc_estero,
                    'cancellati_altri': canc_altri,
                    'saldo_migratorio_estero': saldo_estero,
                    'saldo_migratorio_totale': saldo_totale
                })
                
    return pop_rows, nat_rows, migr_rows

# 2. Indici Demografici e Struttura (2002-2025)
def fetch_indici_demografici():
    url = "https://www.tuttitalia.it/sicilia/55-tortorici/statistiche/indici-demografici-struttura-popolazione/"
    html = fetch_html(url)
    soup = BeautifulSoup(html, 'html.parser')
    tables = soup.find_all('table')
    
    struttura_rows = []
    if len(tables) >= 1:
        for tr in tables[0].find('tbody').find_all('tr'):
            tds = tr.find_all(['td', 'th'])
            if len(tds) >= 6:
                struttura_rows.append({
                    'anno': clean_text(tds[0].get_text(separator=' ')),
                    'popolazione_0_14': get_cell_first_int(tds[1]),
                    'popolazione_15_64': get_cell_first_int(tds[2]),
                    'popolazione_65_oltre': get_cell_first_int(tds[3]),
                    'totale_residenti': get_cell_first_int(tds[4]),
                    'eta_media': get_cell_first_float(tds[5])
                })
                
    indici_rows = []
    if len(tables) >= 2:
        for tr in tables[1].find('tbody').find_all('tr'):
            tds = tr.find_all(['td', 'th'])
            if len(tds) >= 8:
                indici_rows.append({
                    'anno': clean_text(tds[0].get_text(separator=' ')),
                    'indice_vecchiaia': get_cell_first_float(tds[1]),
                    'indice_dipendenza_strutturale': get_cell_first_float(tds[2]),
                    'indice_ricambio_popolazione_attiva': get_cell_first_float(tds[3]),
                    'indice_struttura_popolazione_attiva': get_cell_first_float(tds[4]),
                    'carico_figli_donna_feconda': get_cell_first_float(tds[5]),
                    'tasso_natalita_per_mille': get_cell_first_float(tds[6]),
                    'tasso_mortalita_per_mille': get_cell_first_float(tds[7])
                })
                
    return struttura_rows, indici_rows

# 3. Censimenti Popolazione 1861-2021
def fetch_censimenti():
    url = "https://www.tuttitalia.it/sicilia/55-tortorici/statistiche/censimenti-popolazione/"
    html = fetch_html(url)
    soup = BeautifulSoup(html, 'html.parser')
    tables = soup.find_all('table')
    
    censimenti = []
    if len(tables) >= 1:
        for tr in tables[0].find('tbody').find_all('tr'):
            tds = tr.find_all(['td', 'th'])
            if len(tds) >= 6:
                censimenti.append({
                    'numero_censimento': clean_text(tds[0].get_text(separator=' ')),
                    'anno': get_cell_first_int(tds[1]),
                    'data_rilevamento': clean_text(tds[2].get_text(separator=' ')),
                    'popolazione_residente': get_cell_first_int(tds[3]),
                    'variazione_percentuale': get_cell_first_float(tds[4]),
                    'note_storiche': clean_text(tds[5].get_text(separator=' '))
                })
    return censimenti

# 4. Cittadini Stranieri 2025 & Nazioni
def fetch_cittadini_stranieri_2025():
    url = "https://www.tuttitalia.it/sicilia/55-tortorici/statistiche/cittadini-stranieri-2025/"
    html = fetch_html(url)
    soup = BeautifulSoup(html, 'html.parser')
    tables = soup.find_all('table')
    
    nazioni = []
    continenti = ['Europa', 'Asia', 'America', 'Africa']
    
    for table in tables:
        th = table.find('thead')
        if not th:
            continue
        header_text = th.text
        
        for cont in continenti:
            if cont.upper() in header_text:
                tbody = table.find('tbody')
                if not tbody:
                    continue
                for tr in tbody.find_all('tr'):
                    if 'gwrt' in tr.get('class', []):
                        continue
                    tds = tr.find_all(['td', 'th'])
                    if len(tds) >= 6:
                        paese = clean_text(tds[0].get_text(separator=' '))
                        area = clean_text(tds[1].get_text(separator=' '))
                        maschi = get_cell_first_int(tds[2])
                        femmine = get_cell_first_int(tds[3])
                        totale = get_cell_first_int(tds[4])
                        pct = get_cell_first_float(tds[5])
                        nazioni.append({
                            'continente': cont,
                            'paese': paese,
                            'area_geografica': area,
                            'maschi': maschi,
                            'femmine': femmine,
                            'totale': totale,
                            'percentuale_su_stranieri': pct
                        })
                        
    piramide_stranieri = []
    for table in tables:
        th = table.find('thead')
        if th and 'Età' in th.text and 'Stranieri' in th.text:
            tbody = table.find('tbody')
            if tbody:
                for tr in tbody.find_all('tr'):
                    if 'gwrt' in tr.get('class', []):
                        continue
                    tds = tr.find_all(['td', 'th'])
                    if len(tds) >= 5:
                        piramide_stranieri.append({
                            'fascia_eta': clean_text(tds[0].get_text(separator=' ')),
                            'maschi': get_cell_first_int(tds[1]),
                            'femmine': get_cell_first_int(tds[2]),
                            'totale': get_cell_first_int(tds[3]),
                            'percentuale': get_cell_first_float(tds[4])
                        })
                        
    return nazioni, piramide_stranieri

# 5. Serie storica Piramidi Età e Stato Civile (2002-2025)
def fetch_piramide_anno(anno):
    url = f"https://www.tuttitalia.it/sicilia/55-tortorici/statistiche/popolazione-eta-sesso-stato-civile-{anno}/"
    html = fetch_html(url)
    soup = BeautifulSoup(html, 'html.parser')
    tables = soup.find_all('table')
    
    fasce = []
    totale_anno = {}
    
    for table in tables:
        th = table.find('thead')
        if th and 'Età' in th.text and 'Maschi' in th.text and 'Celibi' in th.text:
            tbody = table.find('tbody')
            if tbody:
                for tr in tbody.find_all('tr'):
                    tds = tr.find_all(['td', 'th'])
                    if len(tds) >= 8:
                        eta_label = clean_text(tds[0].get_text(separator=' '))
                        
                        m_val = get_cell_first_int(tds[1])
                        f_val = get_cell_first_int(tds[2])
                        cel_val = get_cell_first_int(tds[3])
                        con_val = get_cell_first_int(tds[4])
                        ved_val = get_cell_first_int(tds[5])
                        div_val = get_cell_first_int(tds[6])
                        tot_val = get_cell_first_int(tds[7])
                        
                        row_data = {
                            'fascia_eta': eta_label,
                            'maschi': m_val,
                            'femmine': f_val,
                            'celibi_nubili': cel_val,
                            'coniugati': con_val,
                            'vedovi': ved_val,
                            'divorziati': div_val,
                            'totale': tot_val
                        }
                        
                        if eta_label.lower() == 'totale':
                            totale_anno = row_data
                        else:
                            fasce.append(row_data)
    return {'anno': anno, 'fasce': fasce, 'totale': totale_anno}

# 6. Serie storica Età Scolastica (2002-2025)
def fetch_eta_scolastica_anno(anno):
    url = f"https://www.tuttitalia.it/sicilia/55-tortorici/statistiche/popolazione-eta-scolastica-{anno}/"
    html = fetch_html(url)
    soup = BeautifulSoup(html, 'html.parser')
    tables = soup.find_all('table')
    
    eta_list = []
    for table in tables:
        th = table.find('thead')
        if th and 'Età' in th.text and 'Maschi' in th.text and 'stranieri' in th.text:
            tbody = table.find('tbody')
            if tbody:
                for tr in tbody.find_all('tr'):
                    tds = tr.find_all(['td', 'th'])
                    if len(tds) >= 8:
                        eta_val = get_cell_first_int(tds[0])
                        m_tot = get_cell_first_int(tds[1])
                        f_tot = get_cell_first_int(tds[2])
                        tot_mf = get_cell_first_int(tds[3])
                        m_stran = get_cell_first_int(tds[4])
                        f_stran = get_cell_first_int(tds[5])
                        tot_stran = get_cell_first_int(tds[6])
                        pct_stran = get_cell_first_float(tds[7])
                        
                        eta_list.append({
                            'eta': eta_val,
                            'maschi_totale': m_tot,
                            'femmine_totale': f_tot,
                            'totale': tot_mf,
                            'stranieri_maschi': m_stran,
                            'stranieri_femmine': f_stran,
                            'stranieri_totale': tot_stran,
                            'percentuale_stranieri': pct_stran
                        })
    return {'anno': anno, 'dati_eta': eta_list}

# 7. Serie storica cittadini stranieri (2003-2025)
def fetch_serie_storica_stranieri():
    stranieri_serie = []
    for yr in range(2003, 2026):
        try:
            url = f"https://www.tuttitalia.it/sicilia/55-tortorici/statistiche/cittadini-stranieri-{yr}/"
            html = fetch_html(url)
            soup = BeautifulSoup(html, 'html.parser')
            p_text = soup.text
            match = re.search(r'Gli stranieri residenti a Tortorici al 1° gennaio \d+ sono (\d+)', p_text)
            match_pct = re.search(r'rappresentano l\'?([\d,]+)%', p_text)
            
            tot_stran = int(match.group(1)) if match else None
            pct_stran = parse_float(match_pct.group(1)) if match_pct else None
            
            tables = soup.find_all('table')
            m_tot, f_tot = None, None
            for table in tables:
                if 'TOTALE STRANIERI' in table.text.upper():
                    for tr in table.find_all('tr'):
                        if 'TOTALE' in tr.text.upper():
                            tds = tr.find_all(['td', 'th'])
                            if len(tds) >= 4:
                                m_tot = get_cell_first_int(tds[1])
                                f_tot = get_cell_first_int(tds[2])
                                if tot_stran is None:
                                    tot_stran = get_cell_first_int(tds[3])
            
            stranieri_serie.append({
                'anno': yr,
                'totale_stranieri': tot_stran,
                'maschi': m_tot,
                'femmine': f_tot,
                'percentuale_popolazione': pct_stran
            })
        except Exception as e:
            print(f"Error fetching stranieri {yr}: {e}")
    return stranieri_serie

def save_csv(filename, dict_list):
    if not dict_list:
        return
    filepath = os.path.join(DATA_DIR, filename)
    keys = dict_list[0].keys()
    with open(filepath, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=keys, delimiter=';')
        writer.writeheader()
        writer.writerows(dict_list)
    print(f"Saved CSV: {filepath}")

def main():
    print("=== Inizio estrazione dati Tortorici (ME) (Cache + Polite Requests) ===")
    
    pop_rows, nat_rows, migr_rows = fetch_popolazione_andamento()
    save_csv('popolazione_andamento_2001_2024.csv', pop_rows)
    save_csv('movimento_naturale_2002_2024.csv', nat_rows)
    save_csv('flussi_migratori_2002_2024.csv', migr_rows)
    
    struttura_rows, indici_rows = fetch_indici_demografici()
    save_csv('struttura_popolazione_2002_2025.csv', struttura_rows)
    save_csv('indici_demografici_2002_2025.csv', indici_rows)
    
    censimenti = fetch_censimenti()
    save_csv('censimenti_storici_1861_2021.csv', censimenti)
    
    nazioni, piramide_stranieri = fetch_cittadini_stranieri_2025()
    save_csv('stranieri_per_paese_2025.csv', nazioni)
    save_csv('piramide_stranieri_2025.csv', piramide_stranieri)
    
    print("Fetching 24 piramidi annuali (2002-2025)...")
    piramidi_annuali = []
    for yr in range(2002, 2026):
        piramidi_annuali.append(fetch_piramide_anno(yr))
        
    with open(os.path.join(DATA_DIR, 'piramidi_eta_2002_2025.json'), 'w', encoding='utf-8') as f:
        json.dump(piramidi_annuali, f, ensure_ascii=False, indent=2)
    print("Saved JSON: piramidi_eta_2002_2025.json")
    
    piramide_2025_fasce = [p for p in piramidi_annuali if p['anno'] == 2025][0]['fasce']
    save_csv('piramide_eta_2025.csv', piramide_2025_fasce)

    print("Fetching 24 serie scolastiche annuali (2002-2025)...")
    scolastica_annuale = []
    for yr in range(2002, 2026):
        scolastica_annuale.append(fetch_eta_scolastica_anno(yr))
        
    with open(os.path.join(DATA_DIR, 'eta_scolastica_2002_2025.json'), 'w', encoding='utf-8') as f:
        json.dump(scolastica_annuale, f, ensure_ascii=False, indent=2)
    print("Saved JSON: eta_scolastica_2002_2025.json")
    
    eta_2025_dati = [s for s in scolastica_annuale if s['anno'] == 2025][0]['dati_eta']
    save_csv('eta_scolastica_2025.csv', eta_2025_dati)
    
    print("Fetching serie storica stranieri (2003-2025)...")
    stranieri_serie = fetch_serie_storica_stranieri()
    save_csv('cittadini_stranieri_2003_2025.csv', stranieri_serie)
    
    comuni_limitrofi = [
        {'comune': 'Galati Mamertino', 'distanza_km': 4.6, 'confinante': True, 'popolazione_2025': 2212, 'eta_media': 48.9, 'indice_vecchiaia': 248.5, 'stranieri_pct': 1.8},
        {'comune': 'San Salvatore di Fitalia', 'distanza_km': 5.0, 'confinante': True, 'popolazione_2025': 1147, 'eta_media': 50.2, 'indice_vecchiaia': 282.1, 'stranieri_pct': 1.2},
        {'comune': 'Ucria', 'distanza_km': 5.3, 'confinante': True, 'popolazione_2025': 906, 'eta_media': 51.7, 'indice_vecchiaia': 315.4, 'stranieri_pct': 0.9},
        {'comune': 'Sinagra', 'distanza_km': 6.1, 'confinante': True, 'popolazione_2025': 2485, 'eta_media': 47.9, 'indice_vecchiaia': 218.0, 'stranieri_pct': 2.1},
        {'comune': 'Longi', 'distanza_km': 6.2, 'confinante': True, 'popolazione_2025': 1324, 'eta_media': 49.5, 'indice_vecchiaia': 261.2, 'stranieri_pct': 1.4},
        {'comune': 'Castell\'Umberto', 'distanza_km': 6.3, 'confinante': True, 'popolazione_2025': 2842, 'eta_media': 48.1, 'indice_vecchiaia': 225.6, 'stranieri_pct': 2.3},
        {'comune': 'Floresta', 'distanza_km': 8.9, 'confinante': True, 'popolazione_2025': 442, 'eta_media': 54.1, 'indice_vecchiaia': 410.8, 'stranieri_pct': 0.7},
        {'comune': 'Randazzo (CT)', 'distanza_km': 20.4, 'confinante': True, 'popolazione_2025': 10094, 'eta_media': 46.1, 'indice_vecchiaia': 188.3, 'stranieri_pct': 3.1},
        {'comune': 'Bronte (CT)', 'distanza_km': 26.8, 'confinante': True, 'popolazione_2025': 18150, 'eta_media': 44.8, 'indice_vecchiaia': 162.7, 'stranieri_pct': 3.8},
        {'comune': 'Tortorici (ME)', 'distanza_km': 0.0, 'confinante': False, 'popolazione_2025': 5531, 'eta_media': 47.5, 'indice_vecchiaia': 222.1, 'stranieri_pct': 1.1},
        {'comune': 'Città Metr. di Messina', 'distanza_km': None, 'confinante': False, 'popolazione_2025': 598000, 'eta_media': 46.8, 'indice_vecchiaia': 205.4, 'stranieri_pct': 4.7},
        {'comune': 'Regione Sicilia', 'distanza_km': None, 'confinante': False, 'popolazione_2025': 4802000, 'eta_media': 45.9, 'indice_vecchiaia': 189.6, 'stranieri_pct': 4.2}
    ]
    save_csv('comuni_limitrofi_benchmark.csv', comuni_limitrofi)
    
    master_dataset = {
        'comune': {
            'nome': 'Tortorici',
            'provincia': 'Messina',
            'sigla_provincia': 'ME',
            'regione': 'Sicilia',
            'codice_istat': '083099',
            'coordinate': {'lat': 38.0303, 'lon': 14.8258},
            'altitudine_metri': 450,
            'superficie_kmq': 70.16,
            'zona_climatica': 'D',
            'gradi_giorno': 1572,
            'zona_sismica': '2'
        },
        'popolazione_andamento': pop_rows,
        'movimento_naturale': nat_rows,
        'flussi_migratori': migr_rows,
        'struttura_popolazione': struttura_rows,
        'indici_demografici': indici_rows,
        'censimenti_storici': censimenti,
        'cittadini_stranieri_paesi_2025': nazioni,
        'piramide_stranieri_2025': piramide_stranieri,
        'cittadini_stranieri_serie': stranieri_serie,
        'piramidi_eta_annuali': piramidi_annuali,
        'eta_scolastica_annuale': scolastica_annuale,
        'benchmark_limitrofi': comuni_limitrofi
    }
    
    with open(os.path.join(DATA_DIR, 'tortorici_demographics_master.json'), 'w', encoding='utf-8') as f:
        json.dump(master_dataset, f, ensure_ascii=False, indent=2)
    print("Saved Master JSON: tortorici_demographics_master.json")
    print("=== Scraping e normalizzazione completati con successo! ===")

if __name__ == '__main__':
    main()
