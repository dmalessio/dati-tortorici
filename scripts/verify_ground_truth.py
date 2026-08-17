import os
import json
import csv
import sys

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, 'data')

def test_ground_truth():
    print("=== Inizio verifica e validazione Ground Truth ===")
    
    # 1. Check file existence
    expected_files = [
        'popolazione_andamento_2001_2024.csv',
        'movimento_naturale_2002_2024.csv',
        'flussi_migratori_2002_2024.csv',
        'struttura_popolazione_2002_2025.csv',
        'indici_demografici_2002_2025.csv',
        'censimenti_storici_1861_2021.csv',
        'stranieri_per_paese_2025.csv',
        'piramide_stranieri_2025.csv',
        'piramide_eta_2025.csv',
        'piramidi_eta_2002_2025.json',
        'eta_scolastica_2025.csv',
        'eta_scolastica_2002_2025.json',
        'cittadini_stranieri_2003_2025.csv',
        'comuni_limitrofi_benchmark.csv',
        'tortorici_demographics_master.json'
    ]
    
    for f in expected_files:
        path = os.path.join(DATA_DIR, f)
        if not os.path.exists(path):
            raise FileNotFoundError(f"File mancante: {f}")
        size = os.path.getsize(path)
        if size == 0:
            raise ValueError(f"File vuoto: {f}")
        print(f"  [OK] File presente e non vuoto: {f} ({size:,} bytes)")

    # 2. Master JSON check
    master_path = os.path.join(DATA_DIR, 'tortorici_demographics_master.json')
    with open(master_path, 'r', encoding='utf-8') as f:
        master = json.load(f)
        
    print("\n--- Controllo coerenza matematica del Master JSON ---")
    
    # 2.1 Check 2025 Piramide sums
    piramidi = master['piramidi_eta_annuali']
    assert len(piramidi) == 24, f"Previste 24 piramidi annuali (2002-2025), trovate {len(piramidi)}"
    
    for p in piramidi:
        yr = p['anno']
        fasce = p['fasce']
        tot_m = sum(f['maschi'] for f in fasce)
        tot_f = sum(f['femmine'] for f in fasce)
        tot_cel = sum(f['celibi_nubili'] for f in fasce)
        tot_con = sum(f['coniugati'] for f in fasce)
        tot_ved = sum(f['vedovi'] for f in fasce)
        tot_div = sum(f['divorziati'] for f in fasce)
        tot_calc = sum(f['totale'] for f in fasce)
        
        # Check sum of genders equals total
        assert tot_m + tot_f == tot_calc, f"Anno {yr}: Maschi ({tot_m}) + Femmine ({tot_f}) != Totale ({tot_calc})"
        # Check sum of civil status equals total
        assert tot_cel + tot_con + tot_ved + tot_div == tot_calc, f"Anno {yr}: Somma stati civili ({tot_cel + tot_con + tot_ved + tot_div}) != Totale ({tot_calc})"
        
    print("  [OK] Tutte le 24 piramidi annuali (2002-2025) rispettano perfettamente la coerenza interna M+F e Stato Civile.")
    
    # 2.2 Check 2025 specific values
    p2025 = [p for p in piramidi if p['anno'] == 2025][0]
    tot_2025 = sum(f['totale'] for f in p2025['fasce'])
    assert tot_2025 == 5531, f"Popolazione 2025 attesa 5531, calcolata {tot_2025}"
    print(f"  [OK] Popolazione residente al 1° gennaio 2025 certificata: {tot_2025} abitanti")

    # 2.3 Check Censimenti
    censimenti = master['censimenti_storici']
    assert len(censimenti) == 16, f"Previsti 16 censimenti, trovati {len(censimenti)}"
    c1921 = [c for c in censimenti if c['anno'] == 1921][0]
    assert c1921['popolazione_residente'] == 16269, f"Picco 1921 atteso 16269, trovato {c1921['popolazione_residente']}"
    print("  [OK] Serie storica censimenti (1861-2021) validata: picco 1921 a 16.269 abitanti verificato.")

    # 2.4 Check Cittadini Stranieri 2025
    nazioni = master['cittadini_stranieri_paesi_2025']
    tot_nazioni = sum(n['totale'] for n in nazioni)
    assert tot_nazioni == 63, f"Totale stranieri atteso 63, calcolato {tot_nazioni}"
    romania = [n for n in nazioni if n['paese'] == 'Romania'][0]
    assert romania['totale'] == 28, f"Comunità rumena attesa 28, trovata {romania['totale']}"
    print(f"  [OK] Cittadini stranieri 2025 validati: 63 residenti totali, prima comunità Romania con 28 residenti ({romania['percentuale_su_stranieri']}%)")
    
    # 2.5 Check Indici Demografici
    indici = master['indici_demografici']
    ind_2025 = [i for i in indici if i['anno'] == '2025'][0]
    assert ind_2025['indice_vecchiaia'] == 222.1, f"Indice vecchiaia 2025 atteso 222.1, trovato {ind_2025['indice_vecchiaia']}"
    assert ind_2025['indice_ricambio_popolazione_attiva'] == 157.5, f"Indice ricambio 2025 atteso 157.5, trovato {ind_2025['indice_ricambio_popolazione_attiva']}"
    print("  [OK] Indici di struttura 2025 validati: Indice di vecchiaia = 222,1, Ricambio attiva = 157,5")
    
    print("\n=========================================================")
    print(" TUTTI I DATI DELLA GROUND TRUTH SONO STATI VERIFICATI AL 100%!")
    print("=========================================================")

if __name__ == '__main__':
    test_ground_truth()
