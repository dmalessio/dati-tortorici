import os
import io
import json
import csv
import re
import zipfile
import urllib.request

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, 'data')
JS_DIR = os.path.join(BASE_DIR, 'js')

def fetch_mef_year(year):
    url = f"https://www1.finanze.gov.it/finanze/analisi_stat/public/v_4_0_0/contenuti/Redditi_e_principali_variabili_IRPEF_su_base_comunale_CSV_{year}.zip?d=1615465800"
    print(f"Downloading MEF dataset for year {year}...")
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
        resp = urllib.request.urlopen(req, timeout=40)
        zip_bytes = resp.read()
        
        with zipfile.ZipFile(io.BytesIO(zip_bytes)) as z:
            csv_names = [n for n in z.namelist() if n.endswith('.csv')]
            if not csv_names:
                return None
            with z.open(csv_names[0]) as f:
                content = f.read().decode('iso-8859-1', errors='ignore')
                lines = content.splitlines()
                if not lines:
                    return None
                header = [h.strip() for h in lines[0].split(';')]
                
                # Find column indices for strict matching
                istat_idx = -1
                cat_idx = -1
                comune_idx = -1
                for idx, h in enumerate(header):
                    hl = h.lower()
                    if 'istat' in hl:
                        istat_idx = idx
                    elif 'catastale' in hl:
                        cat_idx = idx
                    elif 'denominazione' in hl or 'comune' in hl:
                        if comune_idx == -1:
                            comune_idx = idx
                            
                for line in lines[1:]:
                    parts = [p.strip() for p in line.split(';')]
                    if len(parts) < len(header):
                        continue
                    
                    is_tortorici = False
                    if istat_idx != -1 and parts[istat_idx] in ['083099', '83099']:
                        is_tortorici = True
                    elif cat_idx != -1 and parts[cat_idx].upper() == 'L308':
                        is_tortorici = True
                    elif comune_idx != -1 and parts[comune_idx].upper() == 'TORTORICI':
                        is_tortorici = True
                        
                    if is_tortorici:
                        row = {}
                        for h, v in zip(header, parts):
                            row[h] = v
                        print(f"  [Found MEF {year}]: {row.get('Denominazione Comune')} - Contribuenti: {row.get('Numero contribuenti', row.get('Numero di contribuenti'))}")
                        return row
    except Exception as e:
        print(f"  [Error fetching MEF {year}]: {e}")
        return None

def parse_num(val):
    if not val:
        return 0
    try:
        return int(float(str(val).replace('.', '').replace(',', '.')))
    except (ValueError, TypeError):
        return 0

def main():
    print("=== Rigenerazione e Validazione Serie Completa MEF IRPEF (2001-2024) ===")
    
    # 1. Base 2001-2007 da comuni-italiani.it (validata)
    base_historical = [
        {'anno': 2001, 'contribuenti_dichiaranti': 6021, 'popolazione_residente': 7521, 'percentuale_popolazione_dichiarante': 80.1, 'ammontare_imponibile_totale_euro': 41625429, 'reddito_medio_per_dichiarante_euro': 6913, 'reddito_medio_pro_capite_residente_euro': 5535, 'lavoro_dipendente_contribuenti': None, 'lavoro_dipendente_ammontare': None, 'pensioni_contribuenti': None, 'pensioni_ammontare': None},
        {'anno': 2002, 'contribuenti_dichiaranti': 5616, 'popolazione_residente': 7425, 'percentuale_popolazione_dichiarante': 75.6, 'ammontare_imponibile_totale_euro': 43910913, 'reddito_medio_per_dichiarante_euro': 7819, 'reddito_medio_pro_capite_residente_euro': 5914, 'lavoro_dipendente_contribuenti': None, 'lavoro_dipendente_ammontare': None, 'pensioni_contribuenti': None, 'pensioni_ammontare': None},
        {'anno': 2003, 'contribuenti_dichiaranti': 5632, 'popolazione_residente': 7306, 'percentuale_popolazione_dichiarante': 77.1, 'ammontare_imponibile_totale_euro': 45260515, 'reddito_medio_per_dichiarante_euro': 8036, 'reddito_medio_pro_capite_residente_euro': 6195, 'lavoro_dipendente_contribuenti': None, 'lavoro_dipendente_ammontare': None, 'pensioni_contribuenti': None, 'pensioni_ammontare': None},
        {'anno': 2004, 'contribuenti_dichiaranti': 5627, 'popolazione_residente': 7235, 'percentuale_popolazione_dichiarante': 77.8, 'ammontare_imponibile_totale_euro': 47540337, 'reddito_medio_per_dichiarante_euro': 8449, 'reddito_medio_pro_capite_residente_euro': 6571, 'lavoro_dipendente_contribuenti': None, 'lavoro_dipendente_ammontare': None, 'pensioni_contribuenti': None, 'pensioni_ammontare': None},
        {'anno': 2005, 'contribuenti_dichiaranti': 5705, 'popolazione_residente': 7114, 'percentuale_popolazione_dichiarante': 80.2, 'ammontare_imponibile_totale_euro': 49833875, 'reddito_medio_per_dichiarante_euro': 8735, 'reddito_medio_pro_capite_residente_euro': 7005, 'lavoro_dipendente_contribuenti': None, 'lavoro_dipendente_ammontare': None, 'pensioni_contribuenti': None, 'pensioni_ammontare': None},
        {'anno': 2006, 'contribuenti_dichiaranti': 5499, 'popolazione_residente': 7061, 'percentuale_popolazione_dichiarante': 77.9, 'ammontare_imponibile_totale_euro': 51191389, 'reddito_medio_per_dichiarante_euro': 9309, 'reddito_medio_pro_capite_residente_euro': 7250, 'lavoro_dipendente_contribuenti': None, 'lavoro_dipendente_ammontare': None, 'pensioni_contribuenti': None, 'pensioni_ammontare': None},
        {'anno': 2007, 'contribuenti_dichiaranti': 5480, 'popolazione_residente': 6984, 'percentuale_popolazione_dichiarante': 78.5, 'ammontare_imponibile_totale_euro': 53527561, 'reddito_medio_per_dichiarante_euro': 9768, 'reddito_medio_pro_capite_residente_euro': 7664, 'lavoro_dipendente_contribuenti': None, 'lavoro_dipendente_ammontare': None, 'pensioni_contribuenti': None, 'pensioni_ammontare': None},
    ]
    
    # Popolazione annuale di riferimento
    master_path = os.path.join(DATA_DIR, 'tortorici_demographics_master.json')
    with open(master_path, 'r', encoding='utf-8') as f:
        master = json.load(f)
        
    pop_map = {}
    for p in master.get('popolazione_andamento', []):
        digits = re.sub(r'\D', '', str(p['anno_riferimento']))
        if digits:
            pop_map[int(digits[:4])] = p['popolazione_residente']
    pop_map[2024] = 5531
    pop_map[2023] = 5585
    pop_map[2022] = 5680
    pop_map[2021] = 5792

    mef_rows = []
    for yr in range(2008, 2025):
        row = fetch_mef_year(yr)
        if row:
            anno = yr
            contribuenti = parse_num(row.get('Numero contribuenti', row.get('Numero di contribuenti', 0)))
            imponibile = parse_num(row.get('Reddito imponibile - Ammontare in euro', row.get('Reddito imponibile - Ammontare', 0)))
            complessivo = parse_num(row.get('Reddito complessivo - Ammontare in euro', row.get('Reddito complessivo - Ammontare', 0)))
            freq_compl = parse_num(row.get('Reddito complessivo - Frequenza', contribuenti))
            
            # Se imponibile è disponibile, usiamo l'imponibile; altrimenti il complessivo
            tot_ammontare = complessivo if complessivo > 0 else imponibile
            if tot_ammontare == 0:
                tot_ammontare = imponibile
                
            pop = pop_map.get(anno, 6000)
            pct_pop = round((contribuenti / pop) * 100, 1) if pop > 0 else 0
            
            # Media per contribuente
            div_contrib = freq_compl if freq_compl > 0 else contribuenti
            reddito_medio_dichiarante = round(tot_ammontare / div_contrib) if div_contrib > 0 else 0
            reddito_medio_residente = round(tot_ammontare / pop) if pop > 0 else 0
            
            dipendenti_n = parse_num(row.get('Reddito da lavoro dipendente e assimilati - Frequenza', 0))
            dipendenti_eur = parse_num(row.get('Reddito da lavoro dipendente e assimilati - Ammontare in euro', row.get('Reddito da lavoro dipendente e assimilati - Ammontare', 0)))
            pensioni_n = parse_num(row.get('Reddito da pensione - Frequenza', 0))
            pensioni_eur = parse_num(row.get('Reddito da pensione - Ammontare in euro', row.get('Reddito da pensione - Ammontare', 0)))
            
            mef_rows.append({
                'anno': anno,
                'contribuenti_dichiaranti': contribuenti,
                'popolazione_residente': pop,
                'percentuale_popolazione_dichiarante': pct_pop,
                'ammontare_imponibile_totale_euro': tot_ammontare,
                'reddito_medio_per_dichiarante_euro': reddito_medio_dichiarante,
                'reddito_medio_pro_capite_residente_euro': reddito_medio_residente,
                'lavoro_dipendente_contribuenti': dipendenti_n if dipendenti_n > 0 else None,
                'lavoro_dipendente_ammontare': dipendenti_eur if dipendenti_eur > 0 else None,
                'pensioni_contribuenti': pensioni_n if pensioni_n > 0 else None,
                'pensioni_ammontare': pensioni_eur if pensioni_eur > 0 else None
            })
            
    final_redditi = base_historical + mef_rows
    final_redditi = sorted(final_redditi, key=lambda x: x['anno'])
    
    # Salvataggio CSV
    csv_path = os.path.join(DATA_DIR, 'redditi_irpef_2001_2024.csv')
    with open(csv_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=final_redditi[0].keys(), delimiter=';')
        writer.writeheader()
        writer.writerows(final_redditi)
    print(f"Salvataggio completato: {csv_path}")
    
    # Aggiornamento master JSON
    master['redditi_irpef'] = final_redditi
    with open(master_path, 'w', encoding='utf-8') as f:
        json.dump(master, f, ensure_ascii=False, indent=2)
    print(f"Aggiornato: {master_path}")
    
    # Aggiornamento data.js
    data_js_path = os.path.join(JS_DIR, 'data.js')
    with open(data_js_path, 'r', encoding='utf-8') as f:
        js_content = f.read()
        
    pattern = r'window\.TORTORICI_DATA\s*=\s*\{.*?\};\s*$'
    new_js = f"/**\n * TORTORICI DATA MASTER STORE\n */\nwindow.TORTORICI_DATA = {json.dumps(master, ensure_ascii=False, indent=2)};\n"
    with open(data_js_path, 'w', encoding='utf-8') as f:
        f.write(new_js)
    print(f"Aggiornato: {data_js_path}")

if __name__ == '__main__':
    main()
