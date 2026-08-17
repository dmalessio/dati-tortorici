import os
import re
import json
import csv
import urllib.request
from bs4 import BeautifulSoup

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, 'data')
JS_DIR = os.path.join(BASE_DIR, 'js')

def fetch_html_comuni_italiani(page):
    url = f'http://www.comuni-italiani.it/083/099/statistiche/{page}'
    print(f"Fetching from comuni-italiani.it: {url}")
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
    html = urllib.request.urlopen(req, timeout=15).read().decode('iso-8859-1')
    return html

def parse_int(text):
    if not text:
        return None
    cleaned = text.replace('.', '').replace(',', '.').replace('%', '').strip()
    try:
        return int(float(cleaned))
    except (ValueError, TypeError):
        return None

def parse_float(text):
    if not text:
        return None
    cleaned = text.replace('.', '').replace(',', '.').replace('%', '').strip()
    try:
        return float(cleaned)
    except (ValueError, TypeError):
        return None

def extract_redditi():
    html = fetch_html_comuni_italiani('redditi.html')
    soup = BeautifulSoup(html, 'html.parser')
    
    rows = []
    for table in soup.find_all('table'):
        for tr in table.find_all('tr'):
            tds = [td.text.strip().replace('\xa0', ' ') for td in tr.find_all(['td', 'th'])]
            if len(tds) == 7 and tds[0].isdigit() and len(tds[0]) == 4:
                anno = parse_int(tds[0])
                dichiaranti = parse_int(tds[1])
                popolazione = parse_int(tds[2])
                pct_pop = parse_float(tds[3])
                ammontare_totale_euro = parse_int(tds[4])
                reddito_medio_dichiarante = parse_int(tds[5])
                reddito_medio_residente = parse_int(tds[6])
                
                rows.append({
                    'anno': anno,
                    'contribuenti_dichiaranti': dichiaranti,
                    'popolazione_residente': popolazione,
                    'percentuale_popolazione_dichiarante': pct_pop,
                    'ammontare_imponibile_totale_euro': ammontare_totale_euro,
                    'reddito_medio_per_dichiarante_euro': reddito_medio_dichiarante,
                    'reddito_medio_pro_capite_residente_euro': reddito_medio_residente
                })
    # Sort chronologically
    rows = sorted(rows, key=lambda x: x['anno'])
    return rows

def extract_veicoli():
    html = fetch_html_comuni_italiani('veicoli.html')
    soup = BeautifulSoup(html, 'html.parser')
    
    veicoli_totali = []
    veicoli_commerciali = []
    
    for table in soup.find_all('table'):
        for tr in table.find_all('tr'):
            tds = [td.text.strip().replace('\xa0', ' ') for td in tr.find_all(['td', 'th'])]
            # Table 1: Parco totale (len 9)
            if len(tds) == 9 and tds[0].isdigit() and len(tds[0]) == 4:
                veicoli_totali.append({
                    'anno': parse_int(tds[0]),
                    'automobili': parse_int(tds[1]),
                    'motocicli': parse_int(tds[2]),
                    'autobus': parse_int(tds[3]),
                    'trasporto_merci': parse_int(tds[4]),
                    'veicoli_speciali': parse_int(tds[5]),
                    'trattori_e_altri': parse_int(tds[6]),
                    'totale_parco_veicolare': parse_int(tds[7]),
                    'auto_per_mille_abitanti': parse_int(tds[8])
                })
            # Table 2: Dettaglio commerciali (len 9)
            elif len(tds) == 9 and tds[0].isdigit() and len(tds[0]) == 4:
                pass
                
    # Sort chronologically
    veicoli_totali = sorted(veicoli_totali, key=lambda x: x['anno'])
    return veicoli_totali

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
    print("=== Estrazione statistiche economico-fiscali e veicolari (MEF e ACI) ===")
    
    redditi = extract_redditi()
    save_csv('redditi_irpef_2001_2016.csv', redditi)
    
    veicoli = extract_veicoli()
    save_csv('parco_veicolare_2004_2016.csv', veicoli)
    
    # Aggiorna Master JSON
    master_path = os.path.join(DATA_DIR, 'tortorici_demographics_master.json')
    with open(master_path, 'r', encoding='utf-8') as f:
        master = json.load(f)
        
    master['redditi_irpef'] = redditi
    master['parco_veicolare'] = veicoli
    
    with open(master_path, 'w', encoding='utf-8') as f:
        json.dump(master, f, ensure_ascii=False, indent=2)
    print("Saved Master JSON with Redditi & Veicoli.")
    
    # Aggiorna js/data.js
    with open(os.path.join(JS_DIR, 'data.js'), 'w', encoding='utf-8') as f:
        f.write('window.TORTORICI_DATA = ' + json.dumps(master, ensure_ascii=False) + ';')
    print("Updated js/data.js.")

if __name__ == '__main__':
    main()
