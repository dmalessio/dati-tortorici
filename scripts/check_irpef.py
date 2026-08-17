import csv
import json

print("=== LETTURA DA redditi_irpef_2001_2024.csv ===")
with open('data/redditi_irpef_2001_2024.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for r in reader:
        print(f"Anno Dich: {r.get('anno_dichiarazione')} | Anno Imposta: {r.get('anno_imposta')} | Contribuenti: {r.get('contribuenti')} | Reddito Compl: {r.get('reddito_complessivo_euro')} | Medio: {r.get('reddito_medio_euro')}")

print("\n=== LETTURA DA tortorici_demographics_master.json ===")
with open('data/tortorici_demographics_master.json', 'r', encoding='utf-8') as f:
    master = json.load(f)
    redditi = master.get('redditi_irpef', [])
    for r in redditi:
        print(r)
