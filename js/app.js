/**
 * OSSERVATORIO DEMOGRAFICO TORTORICI - APPLICAZIONE PRINCIPALE
 * Controller di stato, Sticky Year Scrubber, Navigazione ed Esploratore Dati CSV
 */

document.addEventListener('DOMContentLoaded', () => {
  const data = window.TORTORICI_DATA;
  let currentYear = 2025;
  let isPlaying = false;
  let playInterval = null;

  // Inizializza i moduli
  window.AppCharts.init();
  window.AppMap.init();
  window.AppSimulator.init();

  setupStickyYearBar();
  setupNavigationTabs();
  setupPyramidControls();
  setupHistoryControls();
  setupDataExplorer();

  // 1. Sticky Year Scrubber Controller (Sempre attivo durante lo scorrimento)
  function setupStickyYearBar() {
    const slider = document.getElementById('sticky-time-slider');
    const playBtn = document.getElementById('btn-sticky-play');
    const prevBtn = document.getElementById('btn-sticky-prev');
    const nextBtn = document.getElementById('btn-sticky-next');
    const yearDisplay = document.getElementById('sticky-year-display');
    const quickButtons = document.querySelectorAll('.btn-quick-year');

    function updateYear(year) {
      currentYear = Math.max(2002, Math.min(2025, year));
      if (slider) slider.value = currentYear;
      if (yearDisplay) yearDisplay.textContent = currentYear;
      
      quickButtons.forEach(b => {
        if (Number(b.getAttribute('data-year')) === currentYear) {
          b.classList.add('active');
        } else {
          b.classList.remove('active');
        }
      });

      window.AppCharts.setYear(currentYear);
    }

    if (slider) {
      slider.addEventListener('input', (e) => {
        if (isPlaying) togglePlay();
        updateYear(Number(e.target.value));
      });
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        if (isPlaying) togglePlay();
        updateYear(currentYear - 1);
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        if (isPlaying) togglePlay();
        updateYear(currentYear + 1);
      });
    }

    quickButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        if (isPlaying) togglePlay();
        const yr = Number(btn.getAttribute('data-year'));
        updateYear(yr);
      });
    });

    function togglePlay() {
      isPlaying = !isPlaying;
      if (isPlaying) {
        playBtn.innerHTML = `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
          Pausa
        `;
        if (currentYear >= 2025) currentYear = 2001;

        playInterval = setInterval(() => {
          if (currentYear >= 2025) {
            togglePlay();
            return;
          }
          updateYear(currentYear + 1);
        }, 1100);
      } else {
        playBtn.innerHTML = `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          Avvia
        `;
        clearInterval(playInterval);
      }
    }

    if (playBtn) {
      playBtn.addEventListener('click', togglePlay);
    }
  }

  // 2. Navigazione a Schede con Scorrimento Fluido e ScrollSpy Infallibile
  function setupNavigationTabs() {
    const tabs = Array.from(document.querySelectorAll('.nav-tab-btn'));
    const navTabsContainer = document.querySelector('.nav-tabs');
    const sections = tabs.map(tab => {
      const id = tab.getAttribute('data-target');
      return {
        id: id,
        tab: tab,
        element: document.getElementById(id)
      };
    }).filter(s => s.element !== null);

    let isManualClick = false;
    let manualClickTimer = null;

    function activateTab(activeId, scrollMenu = true) {
      tabs.forEach(tab => {
        const targetId = tab.getAttribute('data-target');
        if (targetId === activeId) {
          tab.classList.add('active');
          if (scrollMenu && navTabsContainer) {
            const tabRect = tab.getBoundingClientRect();
            const containerRect = navTabsContainer.getBoundingClientRect();
            if (tabRect.left < containerRect.left || tabRect.right > containerRect.right) {
              tab.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
            }
          }
        } else {
          tab.classList.remove('active');
        }
      });
    }

    // Click sui tab
    tabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = tab.getAttribute('data-target');
        const targetElement = document.getElementById(targetId);
        if (targetElement) {
          isManualClick = true;
          clearTimeout(manualClickTimer);
          activateTab(targetId, false);

          const headerOffset = 95;
          const elementPosition = targetElement.getBoundingClientRect().top + window.pageYOffset;
          const offsetPosition = elementPosition - headerOffset;

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });

          manualClickTimer = setTimeout(() => {
            isManualClick = false;
          }, 850);
        }
      });
    });

    // ScrollSpy tramite getBoundingClientRect continuo
    function updateScrollSpy() {
      if (isManualClick || sections.length === 0) return;

      const triggerPoint = 150; // Pixel dall'alto dello schermo
      const isAtBottom = (window.innerHeight + window.scrollY) >= (document.documentElement.scrollHeight - 60);

      if (isAtBottom) {
        activateTab(sections[sections.length - 1].id);
        return;
      }

      let currentActiveId = sections[0].id;
      for (let i = 0; i < sections.length; i++) {
        const sec = sections[i];
        const rect = sec.element.getBoundingClientRect();
        if (rect.top <= triggerPoint && rect.bottom > triggerPoint) {
          currentActiveId = sec.id;
          break;
        } else if (rect.top <= triggerPoint) {
          currentActiveId = sec.id;
        }
      }

      activateTab(currentActiveId);
    }

    window.addEventListener('scroll', updateScrollSpy, { passive: true });
    window.addEventListener('resize', updateScrollSpy, { passive: true });
    window.addEventListener('load', updateScrollSpy);
    updateScrollSpy();
  }

  // 3. Controlli vista Piramide delle Età
  function setupPyramidControls() {
    const buttons = document.querySelectorAll('[data-pyramid-mode]');
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        buttons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const mode = btn.getAttribute('data-pyramid-mode');
        window.AppCharts.setPyramidMode(mode);
      });
    });
  }

  // 3b. Controlli vista Storico / Censimenti e Andamento Annuale
  function setupHistoryControls() {
    const buttons = document.querySelectorAll('[data-history-mode]');
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        buttons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const mode = btn.getAttribute('data-history-mode');
        window.AppCharts.setHistoryMode(mode);
      });
    });
  }

  // 4. Centro Dati & Esploratore CSV
  function setupDataExplorer() {
    const selector = document.getElementById('dataset-selector');
    const searchInput = document.getElementById('table-search-input');
    const downloadBtn = document.getElementById('btn-download-active-csv');
    const tableContainer = document.getElementById('explorer-table-container');

    const datasets = {
      'popolazione': {
        title: 'Andamento popolazione residente 2001-2024',
        filename: 'popolazione_andamento_2001_2024.csv',
        data: data.popolazione_andamento,
        columns: [
          { key: 'anno_riferimento', label: 'Anno' },
          { key: 'data_rilevamento', label: 'Data rilevamento' },
          { key: 'popolazione_residente', label: 'Popolazione residente', format: (v) => v ? v.toLocaleString('it-IT') : '-' },
          { key: 'variazione_assoluta', label: 'Variazione assoluta', format: (v) => v ? (v > 0 ? `+${v}` : v) : '-' },
          { key: 'variazione_percentuale', label: 'Variazione %', format: (v) => v !== null ? `${v.toLocaleString('it-IT')}%` : '-' },
          { key: 'numero_famiglie', label: 'Famiglie', format: (v) => v ? v.toLocaleString('it-IT') : '-' },
          { key: 'media_componenti_famiglia', label: 'Media componenti/famiglia', format: (v) => v ? v.toLocaleString('it-IT') : '-' }
        ]
      },
      'movimento': {
        title: 'Movimento naturale e bilancio nascite-decessi (2002-2024)',
        filename: 'movimento_naturale_2002_2024.csv',
        data: data.movimento_naturale,
        columns: [
          { key: 'anno_riferimento', label: 'Anno' },
          { key: 'nascite', label: 'Nascite' },
          { key: 'variazione_nascite', label: 'Variaz. nascite', format: (v) => v !== null ? (v > 0 ? `+${v}` : v) : '-' },
          { key: 'decessi', label: 'Decessi' },
          { key: 'variazione_decessi', label: 'Variaz. decessi', format: (v) => v !== null ? (v > 0 ? `+${v}` : v) : '-' },
          { key: 'saldo_naturale', label: 'Saldo naturale', format: (v) => v > 0 ? `+${v}` : v }
        ]
      },
      'migrazioni': {
        title: 'Flussi migratori iscritti e cancellati (2002-2024)',
        filename: 'flussi_migratori_2002_2024.csv',
        data: data.flussi_migratori,
        columns: [
          { key: 'anno_riferimento', label: 'Anno' },
          { key: 'iscritti_da_altri_comuni', label: 'Iscritti da altri comuni' },
          { key: 'iscritti_da_estero', label: 'Iscritti da estero' },
          { key: 'cancellati_per_altri_comuni', label: 'Cancellati per altri comuni' },
          { key: 'cancellati_per_estero', label: 'Cancellati per estero' },
          { key: 'saldo_migratorio_estero', label: 'Saldo estero', format: (v) => v > 0 ? `+${v}` : v },
          { key: 'saldo_migratorio_totale', label: 'Saldo totale', format: (v) => v > 0 ? `+${v}` : v }
        ]
      },
      'redditi': {
        title: 'Redditi IRPEF e contribuenti (MEF OpenData 2001-2024)',
        filename: 'redditi_irpef_2001_2024.csv',
        data: data.redditi_irpef || [],
        columns: [
          { key: 'anno', label: 'Anno' },
          { key: 'contribuenti_dichiaranti', label: 'Contribuenti', format: (v) => v ? v.toLocaleString('it-IT') : '-' },
          { key: 'popolazione_residente', label: 'Popolazione', format: (v) => v ? v.toLocaleString('it-IT') : '-' },
          { key: 'percentuale_popolazione_dichiarante', label: '% Popolazione', format: (v) => v ? `${v.toLocaleString('it-IT')}%` : '-' },
          { key: 'ammontare_imponibile_totale_euro', label: 'Imponibile totale (€)', format: (v) => v ? `€ ${v.toLocaleString('it-IT')}` : '-' },
          { key: 'reddito_medio_per_dichiarante_euro', label: 'Medio / contribuente (€)', format: (v) => v ? `€ ${v.toLocaleString('it-IT')}` : '-' },
          { key: 'reddito_medio_pro_capite_residente_euro', label: 'Medio / residente (€)', format: (v) => v ? `€ ${v.toLocaleString('it-IT')}` : '-' }
        ]
      },
      'veicoli': {
        title: 'Parco veicolare e motorizzazione (ACI 2004-2016)',
        filename: 'parco_veicolare_2004_2016.csv',
        data: data.parco_veicolare || [],
        columns: [
          { key: 'anno', label: 'Anno' },
          { key: 'automobili', label: 'Automobili', format: (v) => v ? v.toLocaleString('it-IT') : '-' },
          { key: 'motocicli', label: 'Motocicli', format: (v) => v ? v.toLocaleString('it-IT') : '-' },
          { key: 'trasporto_merci', label: 'Trasporto merci', format: (v) => v ? v.toLocaleString('it-IT') : '-' },
          { key: 'autobus', label: 'Autobus', format: (v) => v ? v.toLocaleString('it-IT') : '-' },
          { key: 'veicoli_speciali', label: 'Speciali', format: (v) => v ? v.toLocaleString('it-IT') : '-' },
          { key: 'totale_parco_veicolare', label: 'Totale veicoli', format: (v) => v ? v.toLocaleString('it-IT') : '-' },
          { key: 'auto_per_mille_abitanti', label: 'Auto / 1.000 ab.', format: (v) => v ? v.toLocaleString('it-IT') : '-' }
        ]
      },
      'indici': {
        title: 'Indici demografici e di struttura (2002-2025)',
        filename: 'indici_demografici_2002_2025.csv',
        data: data.indici_demografici,
        columns: [
          { key: 'anno', label: 'Anno' },
          { key: 'indice_vecchiaia', label: 'Indice vecchiaia', format: (v) => v ? v.toLocaleString('it-IT') : '-' },
          { key: 'indice_dipendenza_strutturale', label: 'Indice dipendenza', format: (v) => v ? v.toLocaleString('it-IT') : '-' },
          { key: 'indice_ricambio_popolazione_attiva', label: 'Indice ricambio attiva', format: (v) => v ? v.toLocaleString('it-IT') : '-' },
          { key: 'carico_figli_donna_feconda', label: 'Carico figli', format: (v) => v ? v.toLocaleString('it-IT') : '-' },
          { key: 'tasso_natalita_per_mille', label: 'Tasso natalità (‰)', format: (v) => v !== null ? v.toLocaleString('it-IT') : '-' },
          { key: 'tasso_mortalita_per_mille', label: 'Tasso mortalità (‰)', format: (v) => v !== null ? v.toLocaleString('it-IT') : '-' }
        ]
      },
      'censimenti': {
        title: 'Censimenti storici della popolazione (1861-2021)',
        filename: 'censimenti_storici_1861_2021.csv',
        data: data.censimenti_storici,
        columns: [
          { key: 'numero_censimento', label: 'Edizione' },
          { key: 'anno', label: 'Anno' },
          { key: 'data_rilevamento', label: 'Data' },
          { key: 'popolazione_residente', label: 'Popolazione', format: (v) => v.toLocaleString('it-IT') },
          { key: 'variazione_percentuale', label: 'Variazione %', format: (v) => v !== null ? `${v > 0 ? '+' : ''}${v.toLocaleString('it-IT')}%` : '-' },
          { key: 'note_storiche', label: 'Note storiche' }
        ]
      },
      'stranieri_paesi': {
        title: 'Cittadini stranieri residenti per paese di origine (2025)',
        filename: 'stranieri_per_paese_2025.csv',
        data: data.cittadini_stranieri_paesi_2025,
        columns: [
          { key: 'paese', label: 'Paese' },
          { key: 'continente', label: 'Continente' },
          { key: 'area_geografica', label: 'Area geografica' },
          { key: 'maschi', label: 'Maschi' },
          { key: 'femmine', label: 'Femmine' },
          { key: 'totale', label: 'Totale residenti' },
          { key: 'percentuale_su_stranieri', label: 'Quota (%)', format: (v) => `${v.toLocaleString('it-IT')}%` }
        ]
      }
    };

    let activeKey = 'popolazione';

    function renderTable(filterQuery = '') {
      const ds = datasets[activeKey];
      if (!ds || !tableContainer) return;

      const q = filterQuery.toLowerCase().trim();
      const filteredRows = ds.data.filter(row => {
        if (!q) return true;
        return Object.values(row).some(val => val !== null && String(val).toLowerCase().includes(q));
      });

      let html = `
        <div class="data-table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                ${ds.columns.map(c => `<th>${c.label}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
      `;

      if (filteredRows.length === 0) {
        html += `<tr><td colspan="${ds.columns.length}" style="text-align: center; padding: 2rem; color: var(--text-subtle);">Nessun dato corrispondente ai criteri di ricerca</td></tr>`;
      } else {
        filteredRows.forEach(row => {
          html += '<tr>';
          ds.columns.forEach(col => {
            const rawVal = row[col.key];
            const formatted = col.format ? col.format(rawVal) : (rawVal !== null && rawVal !== undefined ? rawVal : '-');
            html += `<td>${formatted}</td>`;
          });
          html += '</tr>';
        });
      }

      html += `</tbody></table></div>`;
      tableContainer.innerHTML = html;
    }

    if (selector) {
      selector.addEventListener('change', (e) => {
        activeKey = e.target.value;
        if (searchInput) searchInput.value = '';
        renderTable();
      });
    }

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        renderTable(e.target.value);
      });
    }

    if (downloadBtn) {
      downloadBtn.addEventListener('click', () => {
        const ds = datasets[activeKey];
        if (!ds) return;

        let csvContent = 'data:text/csv;charset=utf-8,\uFEFF';
        const headers = ds.columns.map(c => c.label).join(';');
        csvContent += headers + '\r\n';

        ds.data.forEach(row => {
          const rowValues = ds.columns.map(col => {
            const rawVal = row[col.key];
            if (rawVal === null || rawVal === undefined) return '';
            let s = String(rawVal);
            if (s.includes(';') || s.includes('"') || s.includes('\n')) {
              s = `"${s.replace(/"/g, '""')}"`;
            }
            return s;
          });
          csvContent += rowValues.join(';') + '\r\n';
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', ds.filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      });
    }

    renderTable();
  }
});
