import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def test_frontend_integration():
    print("=== Test di integrazione Frontend e Coerenza DOM ===")

    html_path = os.path.join(BASE_DIR, 'index.html')
    assert os.path.exists(html_path), "index.html mancante!"
    with open(html_path, 'r', encoding='utf-8') as f:
        html_content = f.read()

    css_path = os.path.join(BASE_DIR, 'css', 'styles.css')
    assert os.path.exists(css_path), "styles.css mancante!"

    for js_file in ['data.js', 'charts.js', 'map.js', 'simulator.js', 'app.js']:
        p = os.path.join(BASE_DIR, 'js', js_file)
        assert os.path.exists(p), f"File JS mancante: {js_file}"
        assert os.path.getsize(p) > 0, f"File JS vuoto: {js_file}"
        print(f"  [OK] File JavaScript presente: {js_file}")

    required_ids = [
        'kpi-popolazione',
        'kpi-eta-media',
        'kpi-indice-vecchiaia',
        'kpi-ricambio-attiva',
        'kpi-saldo-naturale',
        'kpi-stranieri',
        'sticky-year-controller',
        'sticky-year-display',
        'sticky-time-slider',
        'btn-sticky-play',
        'btn-sticky-prev',
        'btn-sticky-next',
        'pyramid-chart-container',
        'flow-diagram-wrapper',
        'school-chart-container',
        'redditi-chart-container',
        'veicoli-chart-container',
        'world-map-wrapper',
        'foreign-pyramid-wrapper',
        'country-cards-wrapper',
        'history-chart-svg',
        'sim-fertility-slider',
        'sim-migration-slider',
        'sim-mortality-slider',
        'simulation-chart-svg',
        'benchmark-table-container',
        'dataset-selector',
        'table-search-input',
        'btn-download-active-csv',
        'explorer-table-container'
    ]

    for dom_id in required_ids:
        assert f'id="{dom_id}"' in html_content or f"id='{dom_id}'" in html_content, f"ID DOM mancante in index.html: {dom_id}"
        print(f"  [OK] ID DOM verificato: {dom_id}")

    data_js_path = os.path.join(BASE_DIR, 'js', 'data.js')
    with open(data_js_path, 'r', encoding='utf-8') as f:
        js_data_content = f.read()
    assert 'window.TORTORICI_DATA =' in js_data_content
    assert 'redditi_irpef' in js_data_content
    assert 'parco_veicolare' in js_data_content
    
    print("\n=========================================================")
    print(" TUTTI I TEST DI INTEGRAZIONE FRONTEND SONO SUPERATI AL 100%!")
    print("=========================================================")

if __name__ == '__main__':
    test_frontend_integration()
