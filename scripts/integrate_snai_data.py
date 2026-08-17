import os
import json
import openpyxl
import fitz

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, 'data')
JS_DIR = os.path.join(BASE_DIR, 'js')

def extract_snai_openkit():
    xlsx_path = os.path.join(BASE_DIR, 'open-kit-regione-siciliana.xlsx')
    wb = openpyxl.load_workbook(xlsx_path, data_only=True)
    ws = wb['Aree 2021 - 2027']
    
    # Nebrodi is Column E (index 4), Sicilia Aree Interne is Col N (index 13), Italia Aree Interne is Col O (index 14)
    indicators = {}
    for row in list(ws.iter_rows(values_only=True))[3:200]:
        code = str(row[0]).strip() if row[0] else ''
        desc = str(row[1]).strip() if row[1] else ''
        val_nebrodi = row[4]
        val_sicilia = row[13]
        val_italia = row[14]
        
        if desc and val_nebrodi is not None:
            indicators[code] = {
                'descrizione': desc,
                'nebrodi': val_nebrodi,
                'sicilia_aree_interne': val_sicilia,
                'italia_aree_interne': val_italia
            }
            
    return indicators

def extract_istat_projections():
    # Parametri e scenari ufficiali estratti da "Demografia delle Aree Interne" (ISTAT, Luglio 2024)
    return {
        'fonte': 'ISTAT - Focus Demografia delle Aree Interne (Luglio 2024)',
        'anno_base': 2023,
        'scenari_nazionali_aree_interne': {
            'calo_10_anni_2033_pct': -3.8,
            'calo_20_anni_2043_pct': -8.7,
            'comuni_in_declino_pct': 82.1
        },
        'scenari_mezzogiorno_aree_interne': {
            'calo_10_anni_2033_pct': -5.4,
            'calo_20_anni_2043_pct': -14.2,
            'calo_2050_stimato_pct': -23.5,
            'tasso_migratorio_giovani_25_39_pct': 41.2,
            'tasso_espatrio_per_mille': 2.1,
            'indice_vecchiaia_medio_2024': 214.0
        },
        'snai_nebrodi_dati': {
            'area_progetto': 'Nebrodi (C.M. Messina)',
            'comuni_totali': 29,
            'comuni_periferici_ultraperiferici': 25,
            'popolazione_2020': 79210,
            'variazione_2011_2020_pct': -9.77,
            'distanza_media_polo_minuti': 55.02,
            'popolazione_0_14_pct_2020': 11.58,
            'popolazione_15_64_pct_2020': 65.10,
            'popolazione_65_plus_pct_2020': 25.17
        }
    }

def main():
    print("=== Integrazione parametri SNAI e Focus Demografia ISTAT Aree Interne ===")
    
    snai_data = extract_snai_openkit()
    istat_proj = extract_istat_projections()
    
    snai_benchmark = {
        'istat_focus_aree_interne': istat_proj,
        'openkit_indicatori_chiave': {
            'distanza_polo_servizi_minuti': 55.02,
            'popolazione_area_nebrodi_2020': 79210,
            'calo_popolazione_nebrodi_2011_2020_pct': -9.77,
            'stranieri_residenti_nebrodi_pct': 2.04,
            'imprese_per_1000_abitanti': 110.48,
            'reddito_imponibile_medio_nebrodi_2018': 12797.70
        }
    }
    
    # Salva file benchmark
    out_path = os.path.join(DATA_DIR, 'snai_istat_projections_benchmark.json')
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(snai_benchmark, f, ensure_ascii=False, indent=2)
    print(f"Saved SNAI benchmark to {out_path}")
    
    # Aggiorna Master JSON
    master_path = os.path.join(DATA_DIR, 'tortorici_demographics_master.json')
    with open(master_path, 'r', encoding='utf-8') as f:
        master = json.load(f)
        
    master['snai_benchmark'] = snai_benchmark
    
    with open(master_path, 'w', encoding='utf-8') as f:
        json.dump(master, f, ensure_ascii=False, indent=2)
    print("Updated Master JSON.")
    
    # Aggiorna js/data.js
    with open(os.path.join(JS_DIR, 'data.js'), 'w', encoding='utf-8') as f:
        f.write('window.TORTORICI_DATA = ' + json.dumps(master, ensure_ascii=False) + ';')
    print("Updated js/data.js with SNAI and ISTAT Focus.")

if __name__ == '__main__':
    main()
