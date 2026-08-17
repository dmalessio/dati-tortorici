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
        resp = urllib.request.urlopen(req, timeout=35)
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
                header = lines[0].split(';')
                for line in lines[1:]:
                    if '083099' in line or 'L308' in line or 'TORTORICI' in line:
                        parts = line.split(';')
                        row = {}
                        for h, v in zip(header, parts):
                            row[h.strip()] = v.strip()
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
    print("=== Estrazione serie completa OpenData MEF (2001-2024) per Tortorici ===")
    
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

    all_rows = []
    
    for yr in range(2008, 2025):
        row = fetch_mef_year(yr)
        if row:
            anno = yr
            contribuenti = parse_num(row.get('Numero contribuenti', row.get('Numero di contribuenti', 0)))
            imponibile = parse_num(row.get('Reddito imponibile - Ammontare in euro', row.get('Reddito imponibile - Ammontare', 0)))
            complessivo = parse_num(row.get('Reddito complessivo - Ammontare in euro', row.get('Reddito complessivo - Ammontare', 0)))
            freq_compl = parse_num(row.get('Reddito complessivo - Frequenza', contribuenti))
            
            if imponibile == 0 and complessivo > 0:
                imponibile = complessivo
            if complessivo == 0 and imponibile > 0:
                complessivo = imponibile
                
            pop = pop_map.get(anno, 6000)
            pct_pop = round((contribuenti / pop) * 100, 1) if pop > 0 else 0
            reddito_medio_dichiarante = round(complessivo / freq_compl) if freq_compl > 0 else 0
            reddito_medio_residente = round(complessivo / pop) if pop > 0 else 0
            
            dipendenti_n = parse_num(row.get('Reddito da lavoro dipendente e assimilati - Frequenza', 0))
            dipendenti_eur = parse_num(row.get('Reddito da lavoro dipendente e assimilati - Ammontare in euro', 0))
            pensioni_n = parse_num(row.get('Reddito da pensione - Frequenza', 0))
            pensioni_eur = parse_num(row.get('Reddito da pensione - Ammontare in euro', 0))
            
            all_rows.append({
                'anno': anno,
                'contribuenti_dichiaranti': contribuenti,
                'popolazione_residente': pop,
                'percentuale_popolazione_dichiarante': pct_pop,
                'ammontare_imponibile_totale_euro': complessivo,
                'reddito_medio_per_dichiarante_euro': reddito_medio_dichiarante,
                'reddito_medio_pro_capite_residente_euro': reddito_medio_residente,
                'lavoro_dipendente_contribuenti': dipendenti_n,
                'lavoro_dipendente_ammontare': dipendenti_eur,
                'pensioni_contribuenti': pensioni_n,
                'pensioni_ammontare': pensioni_eur
            })
            print(f"  [OK] Anno {anno}: {contribuenti} contribuenti, Medio: € {reddito_medio_dichiarante}, Totale: € {complessivo:,}")

    existing_redditi = master.get('redditi_irpef', [])
    for ex in existing_redditi:
        if ex['anno'] < 2008 and not any(r['anno'] == ex['anno'] for r in all_rows):
            all_rows.append({
                'anno': ex['anno'],
                'contribuenti_dichiaranti': ex['contribuenti_dichiaranti'],
                'popolazione_residente': ex['popolazione_residente'],
                'percentuale_popolazione_dichiarante': ex['percentuale_popolazione_dichiarante'],
                'ammontare_imponibile_totale_euro': ex['ammontare_imponibile_totale_euro'],
                'reddito_medio_per_dichiarante_euro': ex['reddito_medio_per_dichiarante_euro'],
                'reddito_medio_pro_capite_residente_euro': ex['reddito_medio_pro_capite_residente_euro'],
                'lavoro_dipendente_contribuenti': None,
                'lavoro_dipendente_ammontare': None,
                'pensioni_contribuenti': None,
                'pensioni_ammontare': None
            })

    all_rows = sorted(all_rows, key=lambda x: x['anno'])
    
    csv_path = os.path.join(DATA_DIR, 'redditi_irpef_2001_2024.csv')
    with open(csv_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=all_rows[0].keys(), delimiter=';')
        writer.writeheader()
        writer.writerows(all_rows)
    print(f"Saved complete CSV to {csv_path}")

    master['redditi_irpef'] = all_rows
    with open(master_path, 'w', encoding='utf-8') as f:
        json.dump(master, f, ensure_ascii=False, indent=2)
    print("Updated Master JSON.")

    with open(os.path.join(JS_DIR, 'data.js'), 'w', encoding='utf-8') as f:
        f.write('window.TORTORICI_DATA = ' + json.dumps(master, ensure_ascii=False) + ';')
    print("Updated js/data.js.")

if __name__ == '__main__':
    main()
