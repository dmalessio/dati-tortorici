import os
import json
import csv

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, 'data')

def reconstruct_and_validate():
    print("=== Normalizzazione e Validazione Matematica dei Dataset ===")
    
    # 1. Piramidi 2002-2025
    piramidi_path = os.path.join(DATA_DIR, 'piramidi_eta_2002_2025.json')
    with open(piramidi_path, 'r', encoding='utf-8') as f:
        piramidi = json.load(f)
        
    for item in piramidi:
        anno = item['anno']
        for f in item['fasce']:
            tot = f['celibi_nubili'] + f['coniugati'] + f['vedovi'] + f['divorziati']
            f['totale'] = tot
            if tot == 0:
                f['maschi'] = 0
                f['femmine'] = 0
                continue
                
            raw_m = str(f['maschi'])
            candidates = []
            for m in range(tot + 1):
                s_m = str(m)
                if raw_m.startswith(s_m):
                    candidates.append(m)
            
            if len(candidates) == 1:
                m_found = candidates[0]
            elif len(candidates) > 1:
                # Find candidate where remaining digits match percentage
                best = None
                for m in candidates:
                    rem = raw_m[len(str(m)):]
                    pct = round((m / tot) * 100, 1)
                    pct_str = f"{pct:.1f}".replace('.', '')
                    if not rem or pct_str.startswith(rem) or rem.startswith(pct_str[:len(rem)]):
                        best = m
                        break
                m_found = best if best is not None else candidates[0]
            else:
                m_found = int(raw_m) if int(raw_m) <= tot else tot // 2
                
            f['maschi'] = m_found
            f['femmine'] = tot - m_found
            
        tot_m = sum(f['maschi'] for f in item['fasce'])
        tot_f = sum(f['femmine'] for f in item['fasce'])
        tot_c = sum(f['totale'] for f in item['fasce'])
        tot_cel = sum(f['celibi_nubili'] for f in item['fasce'])
        tot_con = sum(f['coniugati'] for f in item['fasce'])
        tot_ved = sum(f['vedovi'] for f in item['fasce'])
        tot_div = sum(f['divorziati'] for f in item['fasce'])
        
        item['totale'] = {
            'fascia_eta': 'Totale',
            'maschi': tot_m,
            'femmine': tot_f,
            'celibi_nubili': tot_cel,
            'coniugati': tot_con,
            'vedovi': tot_ved,
            'divorziati': tot_div,
            'totale': tot_c
        }
        
    with open(piramidi_path, 'w', encoding='utf-8') as f:
        json.dump(piramidi, f, ensure_ascii=False, indent=2)
    print("  [OK] piramidi_eta_2002_2025.json normalizzato e validato.")
    
    # Save 2025 CSV
    p2025_fasce = [p for p in piramidi if p['anno'] == 2025][0]['fasce']
    with open(os.path.join(DATA_DIR, 'piramide_eta_2025.csv'), 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=p2025_fasce[0].keys(), delimiter=';')
        writer.writeheader()
        writer.writerows(p2025_fasce)
    print("  [OK] piramide_eta_2025.csv aggiornato.")

    # 2. Età Scolastica 2002-2025
    scol_path = os.path.join(DATA_DIR, 'eta_scolastica_2002_2025.json')
    with open(scol_path, 'r', encoding='utf-8') as f:
        scol = json.load(f)
        
    for item in scol:
        for row in item['dati_eta']:
            tot = row['totale']
            # If maschi_totale was concatenated
            if row['maschi_totale'] is not None and row['maschi_totale'] > tot:
                raw_m = str(row['maschi_totale'])
                for m in range(tot + 1):
                    if raw_m.startswith(str(m)):
                        row['maschi_totale'] = m
                        row['femmine_totale'] = tot - m
                        break
            if row['stranieri_totale'] is None:
                row['stranieri_totale'] = 0
            if row['stranieri_maschi'] is None:
                row['stranieri_maschi'] = 0
            if row['stranieri_femmine'] is None:
                row['stranieri_femmine'] = 0
                
    with open(scol_path, 'w', encoding='utf-8') as f:
        json.dump(scol, f, ensure_ascii=False, indent=2)
    print("  [OK] eta_scolastica_2002_2025.json normalizzato e validato.")
    
    # Save 2025 Scolastica CSV
    s2025_dati = [s for s in scol if s['anno'] == 2025][0]['dati_eta']
    with open(os.path.join(DATA_DIR, 'eta_scolastica_2025.csv'), 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=s2025_dati[0].keys(), delimiter=';')
        writer.writeheader()
        writer.writerows(s2025_dati)
    print("  [OK] eta_scolastica_2025.csv aggiornato.")

    # 3. Master JSON Update
    master_path = os.path.join(DATA_DIR, 'tortorici_demographics_master.json')
    with open(master_path, 'r', encoding='utf-8') as f:
        master = json.load(f)
        
    master['piramidi_eta_annuali'] = piramidi
    master['eta_scolastica_annuale'] = scol
    
    with open(master_path, 'w', encoding='utf-8') as f:
        json.dump(master, f, ensure_ascii=False, indent=2)
    print("  [OK] tortorici_demographics_master.json aggiornato e pronto per il frontend!")

if __name__ == '__main__':
    reconstruct_and_validate()
