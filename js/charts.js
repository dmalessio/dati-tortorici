/**
 * OSSERVATORIO DEMOGRAFICO TORTORICI - MOTORE GRAFICI E VISUALIZZAZIONI
 * Rendering sobrio, reattivo, con scale costanti e testi sempre leggibili per intero
 */

window.AppCharts = (function() {
  const data = window.TORTORICI_DATA;
  let currentYear = 2025;
  let pyramidMode = 'gender'; // 'gender' | 'civil'

  // Costanti di scala fissa globale (evitano salti di dimensione tra un anno e l'altro)
  const GLOBAL_MAX_PYRAMID = 210; // Max storico per classe quinquennale M/F
  const GLOBAL_MAX_SCHOOL = 90;   // Max storico per singolo anno scolastico 0-18

  // Formattatori numerici italiani
  const formatInt = (n) => n !== null && n !== undefined ? n.toLocaleString('it-IT') : '-';
  const formatFloat = (n, decimals = 1) => {
    if (n === null || n === undefined) return '-';
    return Number(n).toLocaleString('it-IT', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  };
  const formatPct = (n) => n !== null && n !== undefined ? `${formatFloat(n, 1)}%` : '-';
  const formatEuro = (n) => n !== null && n !== undefined ? `€ ${formatInt(n)}` : '-';

  function init() {
    renderKPIs(currentYear);
    renderPyramid(currentYear, pyramidMode);
    renderAdvancedStructure(currentYear);
    renderFlowDiagram(currentYear > 2024 ? 2024 : currentYear);
    renderAdvancedFlows(currentYear > 2024 ? 2024 : currentYear);
    renderHistoryChart();
    renderSchoolChart(currentYear);
    renderAdvancedSchool(currentYear);
    renderRedditiChart(currentYear);
    renderVeicoliChart(currentYear);
    renderAdvancedEconomy(currentYear);
    renderBenchmarkChart();
  }

  function setYear(year) {
    currentYear = year;
    renderKPIs(year);
    renderPyramid(year, pyramidMode);
    renderAdvancedStructure(year);
    renderFlowDiagram(year > 2024 ? 2024 : year);
    renderAdvancedFlows(year > 2024 ? 2024 : year);
    renderSchoolChart(year);
    renderAdvancedSchool(year);
    renderRedditiChart(year);
    renderVeicoliChart(year);
    renderAdvancedEconomy(year);
    highlightHistoryYear(year);
  }

  function setPyramidMode(mode) {
    pyramidMode = mode;
    const titleEl = document.getElementById('pyramid-card-title');
    const subEl = document.getElementById('pyramid-card-subtitle');
    if (pyramidMode === 'gender') {
      if (titleEl) titleEl.textContent = 'Piramide demografica per età e genere';
      if (subEl) subEl.textContent = 'Maschi a sinistra (azzurro), femmine a destra (bordeaux)';
    } else {
      if (titleEl) titleEl.textContent = 'Composizione demografica per stato civile';
      if (subEl) subEl.textContent = 'Ripartizione per classe d’età (Celibi/Nubili, Coniugati, Vedovi, Divorziati)';
    }
    renderPyramid(currentYear, pyramidMode);
  }

  // 1. Schede KPI Principali
  function renderKPIs(year) {
    const struttura = data.struttura_popolazione.find(s => s.anno.includes(String(year))) || data.struttura_popolazione[data.struttura_popolazione.length - 1];
    const indici = data.indici_demografici.find(i => i.anno.includes(String(year))) || data.indici_demografici[data.indici_demografici.length - 1];
    const mov = data.movimento_naturale.find(m => m.anno_riferimento.includes(String(year > 2024 ? 2024 : year))) || data.movimento_naturale[data.movimento_naturale.length - 1];
    const stran = data.cittadini_stranieri_serie.find(s => s.anno === year) || data.cittadini_stranieri_serie[data.cittadini_stranieri_serie.length - 1];

    const elPop = document.getElementById('kpi-popolazione');
    const elEta = document.getElementById('kpi-eta-media');
    const elVec = document.getElementById('kpi-indice-vecchiaia');
    const elRic = document.getElementById('kpi-ricambio-attiva');
    const elNat = document.getElementById('kpi-saldo-naturale');
    const elStr = document.getElementById('kpi-stranieri');

    if (elPop) elPop.textContent = formatInt(struttura.totale_residenti);
    if (elEta) elEta.textContent = `${formatFloat(struttura.eta_media)} anni`;
    if (elVec) elVec.textContent = formatFloat(indici.indice_vecchiaia);
    if (elRic) elRic.textContent = formatFloat(indici.indice_ricambio_popolazione_attiva);
    if (elNat) elNat.textContent = mov.saldo_naturale > 0 ? `+${mov.saldo_naturale}` : formatInt(mov.saldo_naturale);
    if (elStr) elStr.textContent = `${formatInt(stran.totale_stranieri)} (${formatPct(stran.percentuale_popolazione)})`;

    document.querySelectorAll('.kpi-year-label').forEach(el => el.textContent = year);
  }

  // 2. Piramide delle Età (Genere) oppure Composizione per Stato Civile
  function renderPyramid(year, mode = 'gender') {
    const container = document.getElementById('pyramid-chart-container');
    if (!container) return;

    const piramideData = data.piramidi_eta_annuali.find(p => p.anno === year);
    if (!piramideData || !piramideData.fasce) return;

    const fasce = piramideData.fasce;
    const maxVal = GLOBAL_MAX_PYRAMID;

    let html = '';

    if (mode === 'gender') {
      html += '<div class="pyramid-container">';

      for (let i = fasce.length - 1; i >= 0; i--) {
        const f = fasce[i];
        const mPct = Math.min(100, (f.maschi / maxVal) * 100);
        const fPct = Math.min(100, (f.femmine / maxVal) * 100);

        html += `
          <div class="pyramid-row">
            <div class="pyramid-side male">
              <div class="pyramid-bar male-bar" style="width: ${mPct}%;" 
                   onmouseenter="window.AppCharts.showPyramidGenderTip(event, ${year}, ${i}, 'male')" 
                   onclick="window.AppCharts.showPyramidGenderTip(event, ${year}, ${i}, 'male')"
                   onmouseleave="window.AppCharts.hideTooltip()"></div>
            </div>
            <div class="pyramid-label" 
                 onmouseenter="window.AppCharts.showPyramidGenderTip(event, ${year}, ${i}, 'row')"
                 onclick="window.AppCharts.showPyramidGenderTip(event, ${year}, ${i}, 'row')"
                 onmouseleave="window.AppCharts.hideTooltip()">${f.fascia_eta}</div>
            <div class="pyramid-side female">
              <div class="pyramid-bar female-bar" style="width: ${fPct}%;" 
                 onmouseenter="window.AppCharts.showPyramidGenderTip(event, ${year}, ${i}, 'female')" 
                 onclick="window.AppCharts.showPyramidGenderTip(event, ${year}, ${i}, 'female')"
                 onmouseleave="window.AppCharts.hideTooltip()"></div>
            </div>
          </div>
        `;
      }

      html += '</div>';

      // Legenda Genere
      html += `<div class="pyramid-legend">
                <div class="legend-item"><span class="legend-color" style="background: var(--color-male);"></span> Maschi (${formatInt(piramideData.totale.maschi)} • ${formatPct((piramideData.totale.maschi/piramideData.totale.totale)*100)})</div>
                <div class="legend-item"><span class="legend-color" style="background: var(--color-female);"></span> Femmine (${formatInt(piramideData.totale.femmine)} • ${formatPct((piramideData.totale.femmine/piramideData.totale.totale)*100)})</div>
                <div class="legend-item" style="color: var(--text-subtle); font-size: 0.8rem;">Popolazione ${year}: <strong>${formatInt(piramideData.totale.totale)}</strong> residenti</div>
              </div>`;
    } else {
      // Vista Stato Civile a Barre Proporzionali alla popolazione di coorte
      html += '<div class="civil-container">';
      const maxCohort = GLOBAL_MAX_PYRAMID * 2; // Scala equivalente coerente con la piramide

      for (let i = fasce.length - 1; i >= 0; i--) {
        const f = fasce[i];
        const totCohort = f.totale;
        const barWidthPct = Math.min(100, (totCohort / maxCohort) * 100);
        const celPct = totCohort > 0 ? (f.celibi_nubili / totCohort) : 0;
        const conPct = totCohort > 0 ? (f.coniugati / totCohort) : 0;
        const vedPct = totCohort > 0 ? (f.vedovi / totCohort) : 0;
        const divPct = totCohort > 0 ? (f.divorziati / totCohort) : 0;

        html += `
          <div class="civil-row"
               onmouseenter="window.AppCharts.showPyramidCivilTip(event, ${year}, ${i}, 'all')"
               onclick="window.AppCharts.showPyramidCivilTip(event, ${year}, ${i}, 'all')"
               onmouseleave="window.AppCharts.hideTooltip()">
            
            <div class="civil-age-label">${f.fascia_eta}</div>

            <div class="civil-track-wrapper">
              <div class="civil-stacked-bar" style="width: ${barWidthPct}%;">
                <div class="stacked-segment segment-celibi" style="width: ${celPct * 100}%;"
                     onmouseenter="event.stopPropagation(); window.AppCharts.showPyramidCivilTip(event, ${year}, ${i}, 'celibi')"
                     onclick="event.stopPropagation(); window.AppCharts.showPyramidCivilTip(event, ${year}, ${i}, 'celibi')"></div>
                <div class="stacked-segment segment-coniugati" style="width: ${conPct * 100}%;"
                     onmouseenter="event.stopPropagation(); window.AppCharts.showPyramidCivilTip(event, ${year}, ${i}, 'coniugati')"
                     onclick="event.stopPropagation(); window.AppCharts.showPyramidCivilTip(event, ${year}, ${i}, 'coniugati')"></div>
                <div class="stacked-segment segment-vedovi" style="width: ${vedPct * 100}%;"
                     onmouseenter="event.stopPropagation(); window.AppCharts.showPyramidCivilTip(event, ${year}, ${i}, 'vedovi')"
                     onclick="event.stopPropagation(); window.AppCharts.showPyramidCivilTip(event, ${year}, ${i}, 'vedovi')"></div>
                <div class="stacked-segment segment-divorziati" style="width: ${divPct * 100}%;"
                     onmouseenter="event.stopPropagation(); window.AppCharts.showPyramidCivilTip(event, ${year}, ${i}, 'divorziati')"
                     onclick="event.stopPropagation(); window.AppCharts.showPyramidCivilTip(event, ${year}, ${i}, 'divorziati')"></div>
              </div>
            </div>

            <div class="civil-cohort-total">${formatInt(totCohort)} ab.</div>
          </div>
        `;
      }

      html += '</div>';

      // Legenda Stato Civile con totali e percentuali
      const tot = piramideData.totale.totale;
      html += `<div class="pyramid-legend">
                <div class="legend-item"><span class="legend-color" style="background: var(--color-celibi);"></span> Celibi / Nubili (${formatInt(piramideData.totale.celibi_nubili)} • ${formatPct((piramideData.totale.celibi_nubili/tot)*100)})</div>
                <div class="legend-item"><span class="legend-color" style="background: var(--color-coniugati);"></span> Coniugati (${formatInt(piramideData.totale.coniugati)} • ${formatPct((piramideData.totale.coniugati/tot)*100)})</div>
                <div class="legend-item"><span class="legend-color" style="background: var(--color-vedovi);"></span> Vedovi (${formatInt(piramideData.totale.vedovi)} • ${formatPct((piramideData.totale.vedovi/tot)*100)})</div>
                <div class="legend-item"><span class="legend-color" style="background: var(--color-divorziati);"></span> Divorziati (${formatInt(piramideData.totale.divorziati)} • ${formatPct((piramideData.totale.divorziati/tot)*100)})</div>
              </div>`;
    }

    container.innerHTML = html;
  }

  // 3. Diagramma di Flusso Demografico Annuale
  function renderFlowDiagram(year) {
    const container = document.getElementById('flow-diagram-wrapper');
    if (!container) return;

    const nat = data.movimento_naturale.find(m => m.anno_riferimento.includes(String(year))) || data.movimento_naturale[data.movimento_naturale.length - 1];
    const migr = data.flussi_migratori.find(m => m.anno_riferimento.includes(String(year))) || data.flussi_migratori[data.flussi_migratori.length - 1];
    const pop = data.popolazione_andamento.find(p => p.anno_riferimento.includes(String(year))) || data.popolazione_andamento[data.popolazione_andamento.length - 1];

    const totInflows = (nat.nascite || 0) + (migr.iscritti_da_altri_comuni || 0) + (migr.iscritti_da_estero || 0) + (migr.iscritti_altri || 0);
    const totOutflows = (nat.decessi || 0) + (migr.cancellati_per_altri_comuni || 0) + (migr.cancellati_per_estero || 0) + (migr.cancellati_altri || 0);
    const netBalance = totInflows - totOutflows;

    let html = `
      <div class="flow-diagram-container">
        <!-- Colonna Entrate -->
        <div class="flow-column">
          <div class="flow-card inflow">
            <div class="flow-card-header">
              <span>Nascite</span>
              <span class="badge badge-istat">Naturale</span>
            </div>
            <div class="flow-card-val">+${formatInt(nat.nascite)}</div>
            <small>Nati nel corso dell'anno ${year}</small>
          </div>
          <div class="flow-card inflow">
            <div class="flow-card-header">
              <span>Immigrati da altri comuni</span>
              <span class="badge" style="background: #eff6ff; color: #1e40af;">Interno</span>
            </div>
            <div class="flow-card-val">+${formatInt(migr.iscritti_da_altri_comuni)}</div>
            <small>Iscrizioni anagrafiche in entrata</small>
          </div>
          <div class="flow-card inflow">
            <div class="flow-card-header">
              <span>Immigrati dall'estero</span>
              <span class="badge" style="background: #fdf4ff; color: #7e22ce;">Estero</span>
            </div>
            <div class="flow-card-val">+${formatInt(migr.iscritti_da_estero)}</div>
            <small>Nuovi arrivi registrati dall'estero</small>
          </div>
        </div>

        <!-- Nodo Centrale Tortorici -->
        <div class="flow-center-node">
          <div class="flow-node-title">Comune di Tortorici (${year})</div>
          <div class="flow-node-val">${formatInt(pop.popolazione_residente)}</div>
          <div style="font-size: 0.8rem; color: #94a3b8;">Residenti al 31 dicembre</div>
          <div class="flow-node-badge" style="background: ${netBalance >= 0 ? '#065f46' : '#991b1b'}; color: #ffffff;">
            Bilancio annuo: ${netBalance >= 0 ? '+' : ''}${formatInt(netBalance)} ab.
          </div>
        </div>

        <!-- Colonna Uscite -->
        <div class="flow-column">
          <div class="flow-card outflow">
            <div class="flow-card-header">
              <span>Decessi</span>
              <span class="badge" style="background: #fef2f2; color: #b91c1c;">Naturale</span>
            </div>
            <div class="flow-card-val">-${formatInt(nat.decessi)}</div>
            <small>Deceduti nel corso dell'anno ${year}</small>
          </div>
          <div class="flow-card outflow">
            <div class="flow-card-header">
              <span>Emigrati per altri comuni</span>
              <span class="badge" style="background: #fff7ed; color: #c2410c;">Interno</span>
            </div>
            <div class="flow-card-val">-${formatInt(migr.cancellati_per_altri_comuni)}</div>
            <small>Cancellazioni per altri comuni italiani</small>
          </div>
          <div class="flow-card outflow">
            <div class="flow-card-header">
              <span>Emigrati per l'estero</span>
              <span class="badge" style="background: #fef2f2; color: #b91c1c;">Estero</span>
            </div>
            <div class="flow-card-val">-${formatInt(migr.cancellati_per_estero)}</div>
            <small>Cancellazioni anagrafiche per l'estero</small>
          </div>
        </div>
      </div>
    `;

    container.innerHTML = html;
  }

  let historyMode = 'censuses'; // 'censuses' | 'annual'

  function setHistoryMode(mode) {
    historyMode = mode;
    renderHistoryChart();
    highlightHistoryYear(currentYear);
  }

  // 4. Grafico Storico: Censimenti (1861-2021) oppure Andamento Annuale (2001-2024)
  function renderHistoryChart() {
    const container = document.getElementById('history-chart-svg');
    if (!container) return;

    const cardTitle = document.getElementById('history-card-title');
    const cardSubtitle = document.getElementById('history-card-subtitle');

    if (historyMode === 'censuses') {
      if (cardTitle) cardTitle.textContent = 'Popolazione legale ai censimenti generali ISTAT';
      if (cardSubtitle) cardSubtitle.textContent = '160 anni di rilevazioni ufficiali: dal 1861 al censimento permanente 2021';
      renderCensusesView(container);
    } else {
      if (cardTitle) cardTitle.textContent = 'Andamento annuale della popolazione residente (2001–2024)';
      if (cardSubtitle) cardSubtitle.textContent = 'Rilevamento ISTAT al 31 dicembre con bilancio delle famiglie';
      renderAnnualPopulationView(container);
    }
  }

  function renderCensusesView(container) {
    const censimenti = data.censimenti_storici;
    const width = 800;
    const height = 310;
    const padding = { top: 40, right: 30, bottom: 45, left: 55 };

    const minYear = 1861;
    const maxYear = 2021;
    const maxPop = 18000;
    const minPop = 0;

    const xScale = (yr) => padding.left + ((yr - minYear) / (maxYear - minYear)) * (width - padding.left - padding.right);
    const yScale = (val) => height - padding.bottom - ((val - minPop) / (maxPop - minPop)) * (height - padding.top - padding.bottom);

    let pathD = '';
    censimenti.forEach((c, idx) => {
      const x = xScale(c.anno);
      const y = yScale(c.popolazione_residente);
      pathD += (idx === 0 ? `M ${x},${y}` : ` L ${x},${y}`);
    });

    let svg = `<svg viewBox="0 0 ${width} ${height}" class="w-full h-auto" style="overflow: visible;">
      <!-- Griglia orizzontale di riferimento -->
      <line x1="${padding.left}" y1="${yScale(5000)}" x2="${width - padding.right}" y2="${yScale(5000)}" stroke="#e2e8f0" stroke-dasharray="3"/>
      <text x="${padding.left - 8}" y="${yScale(5000) + 4}" font-size="10" fill="#64748b" text-anchor="end">5.000</text>

      <line x1="${padding.left}" y1="${yScale(10000)}" x2="${width - padding.right}" y2="${yScale(10000)}" stroke="#e2e8f0" stroke-dasharray="3"/>
      <text x="${padding.left - 8}" y="${yScale(10000) + 4}" font-size="10" fill="#64748b" text-anchor="end">10.000</text>

      <line x1="${padding.left}" y1="${yScale(15000)}" x2="${width - padding.right}" y2="${yScale(15000)}" stroke="#e2e8f0" stroke-dasharray="3"/>
      <text x="${padding.left - 8}" y="${yScale(15000) + 4}" font-size="10" fill="#64748b" text-anchor="end">15.000</text>

      <defs>
        <linearGradient id="historyGradSober" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#1e40af" stop-opacity="0.18"/>
          <stop offset="100%" stop-color="#1e40af" stop-opacity="0.0"/>
        </linearGradient>
      </defs>
      <path d="${pathD} L ${xScale(2021)},${yScale(0)} L ${xScale(1861)},${yScale(0)} Z" fill="url(#historyGradSober)"/>
      <path d="${pathD}" fill="none" stroke="#1e40af" stroke-width="2.5" stroke-linecap="round"/>
    `;

    censimenti.forEach((c) => {
      const x = xScale(c.anno);
      const y = yScale(c.popolazione_residente);
      const isPeak = c.anno === 1921;
      const yOffset = c.anno === 1936 ? -20 : (c.anno === 1921 ? -14 : -9);

      svg += `
        <g class="history-point-group" id="point-year-${c.anno}" style="cursor: pointer;"
           onmouseenter="window.AppCharts.showTooltip(event, 'Censimento ${c.anno}', 'Popolazione legale: <strong>${formatInt(c.popolazione_residente)}</strong> ab.<br>${c.note_storiche}')"
           onmouseleave="window.AppCharts.hideTooltip()">
          
          <circle cx="${x}" cy="${y}" r="${isPeak ? 6 : 4}" fill="${isPeak ? '#dc2626' : '#1e40af'}" stroke="#ffffff" stroke-width="2"/>
          
          <text x="${x}" y="${y + yOffset}" font-size="${isPeak ? 10.5 : 8.8}" font-weight="${isPeak ? '800' : '700'}" 
                fill="${isPeak ? '#dc2626' : '#0f172a'}" text-anchor="middle" font-family="var(--font-mono)"
                style="paint-order: stroke fill; stroke: #ffffff; stroke-width: 3.5px; stroke-linejoin: round;">
            ${isPeak ? 'Picco: ' : ''}${formatInt(c.popolazione_residente)}
          </text>

          <text x="${x}" y="${height - padding.bottom + 16}" font-size="10" fill="#64748b" text-anchor="middle" transform="rotate(-45, ${x}, ${height - padding.bottom + 16})">${c.anno}</text>
        </g>
      `;
    });

    svg += `</svg>`;
    container.innerHTML = svg;
  }

  function renderAnnualPopulationView(container) {
    const list = data.popolazione_andamento.map(p => {
      const yr = parseInt(String(p.anno_riferimento).replace(/\D/g, ''));
      return {
        anno: yr,
        popolazione: p.popolazione_residente,
        variazione_assoluta: p.variazione_assoluta,
        variazione_percentuale: p.variazione_percentuale,
        famiglie: p.numero_famiglie,
        componenti_famiglia: p.media_componenti_famiglia
      };
    }).sort((a, b) => a.anno - b.anno);

    const width = 800;
    const height = 310;
    const padding = { top: 40, right: 30, bottom: 45, left: 55 };

    const minYear = 2001;
    const maxYear = 2024;
    const maxPop = 8000;
    const minPop = 5000;

    const xScale = (yr) => padding.left + ((yr - minYear) / (maxYear - minYear)) * (width - padding.left - padding.right);
    const yScale = (val) => height - padding.bottom - ((val - minPop) / (maxPop - minPop)) * (height - padding.top - padding.bottom);

    let pathD = '';
    list.forEach((p, idx) => {
      const x = xScale(p.anno);
      const y = yScale(p.popolazione);
      pathD += (idx === 0 ? `M ${x},${y}` : ` L ${x},${y}`);
    });

    let svg = `<svg viewBox="0 0 ${width} ${height}" class="w-full h-auto" style="overflow: visible;">
      <!-- Griglia orizzontale di riferimento -->
      <line x1="${padding.left}" y1="${yScale(5500)}" x2="${width - padding.right}" y2="${yScale(5500)}" stroke="#e2e8f0" stroke-dasharray="3"/>
      <text x="${padding.left - 8}" y="${yScale(5500) + 4}" font-size="10" fill="#64748b" text-anchor="end">5.500</text>

      <line x1="${padding.left}" y1="${yScale(6000)}" x2="${width - padding.right}" y2="${yScale(6000)}" stroke="#e2e8f0" stroke-dasharray="3"/>
      <text x="${padding.left - 8}" y="${yScale(6000) + 4}" font-size="10" fill="#64748b" text-anchor="end">6.000</text>

      <line x1="${padding.left}" y1="${yScale(6500)}" x2="${width - padding.right}" y2="${yScale(6500)}" stroke="#e2e8f0" stroke-dasharray="3"/>
      <text x="${padding.left - 8}" y="${yScale(6500) + 4}" font-size="10" fill="#64748b" text-anchor="end">6.500</text>

      <line x1="${padding.left}" y1="${yScale(7000)}" x2="${width - padding.right}" y2="${yScale(7000)}" stroke="#e2e8f0" stroke-dasharray="3"/>
      <text x="${padding.left - 8}" y="${yScale(7000) + 4}" font-size="10" fill="#64748b" text-anchor="end">7.000</text>

      <line x1="${padding.left}" y1="${yScale(7500)}" x2="${width - padding.right}" y2="${yScale(7500)}" stroke="#e2e8f0" stroke-dasharray="3"/>
      <text x="${padding.left - 8}" y="${yScale(7500) + 4}" font-size="10" fill="#64748b" text-anchor="end">7.500</text>

      <defs>
        <linearGradient id="annualPopGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#0284c7" stop-opacity="0.22"/>
          <stop offset="100%" stop-color="#0284c7" stop-opacity="0.0"/>
        </linearGradient>
      </defs>
      <path d="${pathD} L ${xScale(2024)},${yScale(minPop)} L ${xScale(2001)},${yScale(minPop)} Z" fill="url(#annualPopGrad)"/>
      <path d="${pathD}" fill="none" stroke="#0284c7" stroke-width="2.5" stroke-linecap="round"/>
    `;

    list.forEach((p, idx) => {
      const x = xScale(p.anno);
      const y = yScale(p.popolazione);
      const yOffset = (idx % 2 === 0) ? -10 : -22;
      const isKey = p.anno === 2001 || p.anno === 2024 || p.anno === 2011 || p.anno === currentYear;

      const varText = p.variazione_assoluta !== null ? `${p.variazione_assoluta > 0 ? '+' : ''}${p.variazione_assoluta} ab. (${p.variazione_percentuale}%)` : 'Anno base di partenza';
      const famText = p.famiglie ? `<br>Famiglie: <strong>${formatInt(p.famiglie)}</strong> (media: ${formatFloat(p.componenti_famiglia)} comp.)` : '';

      svg += `
        <g class="history-point-group" id="point-year-${p.anno}" style="cursor: pointer;"
           onmouseenter="window.AppCharts.showTooltip(event, 'Popolazione al 31 dic ${p.anno}', 'Residenti: <strong>${formatInt(p.popolazione)}</strong> ab.<br>Variazione annua: <strong>${varText}</strong>${famText}')"
           onmouseleave="window.AppCharts.hideTooltip()">
          
          <circle cx="${x}" cy="${y}" r="${p.anno === currentYear ? 6 : 3.5}" fill="${p.anno === currentYear ? '#d97706' : '#0284c7'}" stroke="#ffffff" stroke-width="2"/>
          
          <!-- Etichette sfalsate per evitare sovrapposizioni -->
          <text x="${x}" y="${y + yOffset}" font-size="${isKey ? 8.8 : 7.8}" font-weight="${isKey ? '800' : '600'}" 
                fill="${p.anno === currentYear ? '#d97706' : '#0f172a'}" text-anchor="middle" font-family="var(--font-mono)"
                style="paint-order: stroke fill; stroke: #ffffff; stroke-width: 3px; stroke-linejoin: round;">
            ${formatInt(p.popolazione)}
          </text>

          <text x="${x}" y="${height - padding.bottom + 16}" font-size="9.5" fill="#64748b" text-anchor="middle" transform="rotate(-45, ${x}, ${height - padding.bottom + 16})">${p.anno}</text>
        </g>
      `;
    });

    svg += `</svg>`;
    container.innerHTML = svg;
  }

  function highlightHistoryYear(year) {
    document.querySelectorAll('.history-point-group circle').forEach(c => {
      if (c.getAttribute('fill') !== '#dc2626') {
        c.setAttribute('fill', historyMode === 'censuses' ? '#1e40af' : '#0284c7');
        c.setAttribute('r', '3.5');
      }
    });
    const target = document.getElementById(`point-year-${year}`);
    if (target) {
      const circle = target.querySelector('circle');
      if (circle) {
        circle.setAttribute('fill', '#d97706');
        circle.setAttribute('r', '6.5');
      }
    }
  }

  // 5. Osservatorio Scuola (0-18 anni) - Scala fissa globale a 90 alunni
  function renderSchoolChart(year) {
    const container = document.getElementById('school-chart-container');
    if (!container) return;

    const scolData = data.eta_scolastica_annuale.find(s => s.anno === year) || data.eta_scolastica_annuale[data.eta_scolastica_annuale.length - 1];
    const items = scolData.dati_eta;

    const nido = items.filter(d => d.eta >= 0 && d.eta <= 2).reduce((a, b) => a + b.totale, 0);
    const infanzia = items.filter(d => d.eta >= 3 && d.eta <= 5).reduce((a, b) => a + b.totale, 0);
    const primaria = items.filter(d => d.eta >= 6 && d.eta <= 10).reduce((a, b) => a + b.totale, 0);
    const secondaria1 = items.filter(d => d.eta >= 11 && d.eta <= 13).reduce((a, b) => a + b.totale, 0);
    const secondaria2 = items.filter(d => d.eta >= 14 && d.eta <= 18).reduce((a, b) => a + b.totale, 0);

    let html = `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 0.75rem; margin-bottom: 1rem;">
        <div class="flow-card" style="border-left: 3px solid #0284c7;">
          <div class="flow-card-header"><span>Nido (0–2 anni)</span></div>
          <div class="flow-card-val">${formatInt(nido)}</div>
          <small>Fascia asilo nido</small>
        </div>
        <div class="flow-card" style="border-left: 3px solid #4f46e5;">
          <div class="flow-card-header"><span>Infanzia (3–5 anni)</span></div>
          <div class="flow-card-val">${formatInt(infanzia)}</div>
          <small>Scuola dell'infanzia</small>
        </div>
        <div class="flow-card" style="border-left: 3px solid #059669;">
          <div class="flow-card-header"><span>Primaria (6–10 anni)</span></div>
          <div class="flow-card-val">${formatInt(primaria)}</div>
          <small>Scuola primaria</small>
        </div>
        <div class="flow-card" style="border-left: 3px solid #d97706;">
          <div class="flow-card-header"><span>Medie (11–13 anni)</span></div>
          <div class="flow-card-val">${formatInt(secondaria1)}</div>
          <small>Secondaria I grado</small>
        </div>
        <div class="flow-card" style="border-left: 3px solid #be123c;">
          <div class="flow-card-header"><span>Superiori (14–18 anni)</span></div>
          <div class="flow-card-val">${formatInt(secondaria2)}</div>
          <small>Secondaria II grado</small>
        </div>
      </div>

      <div style="display: flex; align-items: flex-end; height: 160px; gap: 5px; padding: 0.75rem 0; border-bottom: 1px solid var(--border-light);">
    `;

    const maxAgeVal = GLOBAL_MAX_SCHOOL;

    items.forEach(item => {
      const hPct = Math.min(100, (item.totale / maxAgeVal) * 100);
      let cycleColor = '#0284c7';
      if (item.eta >= 3 && item.eta <= 5) cycleColor = '#4f46e5';
      else if (item.eta >= 6 && item.eta <= 10) cycleColor = '#059669';
      else if (item.eta >= 11 && item.eta <= 13) cycleColor = '#d97706';
      else if (item.eta >= 14) cycleColor = '#be123c';

      html += `
        <div style="flex: 1; display: flex; flex-direction: column; align-items: center; height: 100%; justify-content: flex-end;">
          <div style="width: 100%; height: ${hPct}%; background-color: ${cycleColor}; border-radius: 2px 2px 0 0; cursor: pointer; transition: height 0.25s ease;"
               onmouseenter="window.AppCharts.showTooltip(event, 'Età: ${item.eta} anni (${year})', 'Totale: <strong>${item.totale}</strong> alunni (${item.maschi_totale} M, ${item.femmine_totale} F)<br>Alunni stranieri: ${item.stranieri_totale}')"
               onmouseleave="window.AppCharts.hideTooltip()"></div>
          <div style="font-size: 0.7rem; margin-top: 3px; font-weight: 700; color: var(--text-subtle);">${item.eta}</div>
        </div>
      `;
    });

    html += `</div>`;
    container.innerHTML = html;
  }

  // 6. Sezione Redditi IRPEF (Dati MEF Dipartimento delle Finanze)
  function renderRedditiChart(year) {
    const container = document.getElementById('redditi-chart-container');
    if (!container || !data.redditi_irpef) return;

    const list = data.redditi_irpef;
    const exact = list.find(r => r.anno === year);
    const past = list.filter(r => r.anno <= year);
    const current = exact || (past.length > 0 ? past[past.length - 1] : list[list.length - 1]);
    const isLatestFallback = !exact && year > current.anno;

    let html = `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 0.85rem; margin-bottom: 0.75rem;">
        <div class="flow-card">
          <div class="flow-card-header"><span>Reddito medio / dichiarante</span></div>
          <div class="flow-card-val">${formatEuro(current.reddito_medio_per_dichiarante_euro)}</div>
          <small>Dati MEF per l'anno ${current.anno}${isLatestFallback ? ' (ultimo disponibile)' : ''}</small>
        </div>
        <div class="flow-card">
          <div class="flow-card-header"><span>Reddito medio / residente</span></div>
          <div class="flow-card-val">${formatEuro(current.reddito_medio_pro_capite_residente_euro)}</div>
          <small>Pro capite su intera popolazione (${current.anno})</small>
        </div>
        <div class="flow-card">
          <div class="flow-card-header"><span>Contribuenti dichiaranti</span></div>
          <div class="flow-card-val">${formatInt(current.contribuenti_dichiaranti)}</div>
          <small>${formatPct(current.percentuale_popolazione_dichiarante)} dei residenti (${current.anno})</small>
        </div>
        <div class="flow-card">
          <div class="flow-card-header"><span>Monte imponibile complessivo</span></div>
          <div class="flow-card-val" style="font-size: 1.15rem;">${formatEuro(current.ammontare_imponibile_totale_euro)}</div>
          <small>Totale addizionale IRPEF dichiarata (${current.anno})</small>
        </div>
      </div>
    `;

    container.innerHTML = html;
  }

  // 7. Sezione Parco Veicolare (Dati ACI / PRA)
  function renderVeicoliChart(year) {
    const container = document.getElementById('veicoli-chart-container');
    if (!container || !data.parco_veicolare) return;

    const list = data.parco_veicolare;
    const exact = list.find(v => v.anno === year);
    const past = list.filter(v => v.anno <= year);
    const current = exact || (past.length > 0 ? past[past.length - 1] : list[list.length - 1]);
    const isLatestFallback = !exact && year > current.anno;

    let html = `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 0.85rem; margin-bottom: 0.75rem;">
        <div class="flow-card">
          <div class="flow-card-header"><span>Tasso di motorizzazione</span></div>
          <div class="flow-card-val">${current.auto_per_mille_abitanti} auto</div>
          <small>Ogni 1.000 residenti (anno ${current.anno}${isLatestFallback ? ' - ultimo ACI' : ''})</small>
        </div>
        <div class="flow-card">
          <div class="flow-card-header"><span>Automobili registrate</span></div>
          <div class="flow-card-val">${formatInt(current.automobili)}</div>
          <small>Autovetture private al PRA (${current.anno})</small>
        </div>
        <div class="flow-card">
          <div class="flow-card-header"><span>Mezzi trasporto merci</span></div>
          <div class="flow-card-val">${formatInt(current.trasporto_merci)}</div>
          <small>Autocarri e commerciali (${current.anno})</small>
        </div>
        <div class="flow-card">
          <div class="flow-card-header"><span>Totale parco veicolare</span></div>
          <div class="flow-card-val">${formatInt(current.totale_parco_veicolare)}</div>
          <small>Inclusi motocicli e speciali (${current.anno})</small>
        </div>
      </div>
    `;

    container.innerHTML = html;
  }

  // 8. Indicatori Analitici di Ricambio, Struttura e Invecchiamento Profondo (Standard ISTAT / Eurostat)
  function renderAdvancedStructure(year) {
    const container = document.getElementById('advanced-structure-container');
    if (!container || !data.piramidi_eta_annuali) return;

    const piramideData = data.piramidi_eta_annuali.find(p => p.anno === year) || data.piramidi_eta_annuali[data.piramidi_eta_annuali.length - 1];
    if (!piramideData || !piramideData.fasce) return;

    const fasce = piramideData.fasce;
    const getF = (fname) => fasce.find(f => f.fascia_eta === fname);

    // Totali
    const totResidenti = piramideData.totale_residenti || fasce.reduce((a, b) => a + b.totale, 0);
    const maschiTot = fasce.reduce((a, b) => a + b.maschi, 0);
    const femmineTot = fasce.reduce((a, b) => a + b.femmine, 0);

    // Fasce per indici di dipendenza (Eurostat / ISTAT)
    const p0_14 = ['0-4', '5-9', '10-14'].reduce((acc, age) => acc + (getF(age) ? getF(age).totale : 0), 0);
    const p15_64 = ['15-19', '20-24', '25-29', '30-34', '35-39', '40-44', '45-49', '50-54', '55-59', '60-64'].reduce((acc, age) => acc + (getF(age) ? getF(age).totale : 0), 0);
    const p65Plus = ['65-69', '70-74', '75-79', '80-84', '85-89', '90-94', '95-99', '100+'].reduce((acc, age) => acc + (getF(age) ? getF(age).totale : 0), 0);

    const ids = p15_64 > 0 ? (((p0_14 + p65Plus) / p15_64) * 100).toFixed(1) : '0';
    const idg = p15_64 > 0 ? ((p0_14 / p15_64) * 100).toFixed(1) : '0';
    const ida = p15_64 > 0 ? ((p65Plus / p15_64) * 100).toFixed(1) : '0';

    // Età Mediana (Eurostat)
    const half = totResidenti / 2;
    let cum = 0;
    let medianAge = 0;
    for (let i = 0; i < fasce.length; i++) {
      const f = fasce[i];
      if (cum + f.totale >= half) {
        if (f.fascia_eta.includes('-')) {
          const parts = f.fascia_eta.split('-');
          const low = parseInt(parts[0]);
          const width = parseInt(parts[1]) - low + 1;
          medianAge = f.totale > 0 ? (low + ((half - cum) / f.totale) * width) : low;
        } else {
          medianAge = 100;
        }
        break;
      }
      cum += f.totale;
    }
    const medianAgeFormatted = medianAge.toFixed(1);

    // Ricambio Forze Lavoro: IRCA (15-29 / 50-64) e ISPA (40-64 / 15-39)
    const p15_29 = ['15-19', '20-24', '25-29'].reduce((acc, age) => acc + (getF(age) ? getF(age).totale : 0), 0);
    const p50_64 = ['50-54', '55-59', '60-64'].reduce((acc, age) => acc + (getF(age) ? getF(age).totale : 0), 0);
    const irca = p50_64 > 0 ? ((p15_29 / p50_64) * 100).toFixed(1) : '0';

    const p40_64 = ['40-44', '45-49', '50-54', '55-59', '60-64'].reduce((acc, age) => acc + (getF(age) ? getF(age).totale : 0), 0);
    const p15_39 = ['15-19', '20-24', '25-29', '30-34', '35-39'].reduce((acc, age) => acc + (getF(age) ? getF(age).totale : 0), 0);
    const ispa = p15_39 > 0 ? ((p40_64 / p15_39) * 100).toFixed(1) : '0';

    // Genere, Fecondità e Longevità
    const rm = femmineTot > 0 ? ((maschiTot / femmineTot) * 100).toFixed(1) : '0';
    const f0_4 = getF('0-4');
    const pop0_4 = f0_4 ? f0_4.totale : 0;
    const fertileAges = ['15-19', '20-24', '25-29', '30-34', '35-39', '40-44', '45-49'];
    const donne15_49 = fertileAges.reduce((acc, age) => acc + (getF(age) ? getF(age).femmine : 0), 0);
    const cwr = donne15_49 > 0 ? ((pop0_4 / donne15_49) * 1000).toFixed(1) : '0';

    const over80Ages = ['80-84', '85-89', '90-94', '95-99', '100+'];
    const pop80Plus = over80Ages.reduce((acc, age) => acc + (getF(age) ? getF(age).totale : 0), 0);
    const ivp = p65Plus > 0 ? ((pop80Plus / p65Plus) * 100).toFixed(1) : '0';
    const psr = p50_64 > 0 ? ((pop80Plus / p50_64) * 100).toFixed(1) : '0';

    const over75Ages = ['75-79', '80-84', '85-89', '90-94', '95-99', '100+'];
    const uom75Plus = over75Ages.reduce((acc, age) => acc + (getF(age) ? getF(age).maschi : 0), 0);
    const don75Plus = over75Ages.reduce((acc, age) => acc + (getF(age) ? getF(age).femmine : 0), 0);
    const sr75 = don75Plus > 0 ? ((uom75Plus / don75Plus) * 100).toFixed(1) : '0';

    const over65Ages = ['65-69', '70-74', '75-79', '80-84', '85-89', '90-94', '95-99', '100+'];
    const vedovi65 = over65Ages.reduce((acc, age) => acc + (getF(age) ? (getF(age).vedovi || 0) : 0), 0);
    const tva = p65Plus > 0 ? ((vedovi65 / p65Plus) * 100).toFixed(1) : '0';

    container.innerHTML = `
      <div style="margin-bottom: 0.75rem; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem; border-top: 1px solid var(--border-light); padding-top: 1rem;">
        <h4 style="font-size: 0.95rem; font-weight: 800; color: var(--text-main); margin: 0;">
          Indicatori analitici di struttura, dipendenza e ricambio (Standard ISTAT / Eurostat • ${year})
        </h4>
        <span style="font-size: 0.725rem; color: var(--text-subtle);">Elaborazione deterministica su micro-coorti anagrafiche</span>
      </div>

      <!-- Gruppo 1: Dipendenza Strutturale -->
      <div style="font-size: 0.75rem; font-weight: 800; text-transform: uppercase; color: var(--text-subtle); margin-bottom: 0.4rem; letter-spacing: 0.04em;">
        1. Carico sociale e dipendenza generazionale (IDS = IDG + IDA)
      </div>
      <div class="indicator-matrix-grid" style="margin-bottom: 1rem;">
        <div class="indicator-card" style="border-left: 3px solid #0284c7;">
          <div class="indicator-card-head">
            <span class="indicator-title">Dipendenza Strutturale (IDS)</span>
            <span class="indicator-acronym">Totale</span>
          </div>
          <div class="indicator-val" style="color: #0284c7;">${ids}%</div>
          <div class="indicator-formula">(Pop 0–14 + Pop 65+) / Pop 15–64 × 100</div>
          <div class="indicator-desc">Carico demografico complessivo teorico: residenti non attivi (giovani + anziani) ogni 100 persone in età lavorativa.</div>
        </div>

        <div class="indicator-card" style="border-left: 3px solid #059669;">
          <div class="indicator-card-head">
            <span class="indicator-title">Dipendenza Giovanile (IDG)</span>
            <span class="indicator-acronym">Under 15</span>
          </div>
          <div class="indicator-val" style="color: #059669;">${idg}%</div>
          <div class="indicator-formula">Pop 0–14 / Pop 15–64 × 100</div>
          <div class="indicator-desc">Quota di minori a carico della popolazione attiva; isola la componente giovanile dal carico totale.</div>
        </div>

        <div class="indicator-card" style="border-left: 3px solid #b91c1c;">
          <div class="indicator-card-head">
            <span class="indicator-title">Dipendenza Anziani (IDA)</span>
            <span class="indicator-acronym">Over 65</span>
          </div>
          <div class="indicator-val" style="color: #b91c1c;">${ida}%</div>
          <div class="indicator-formula">Pop 65+ / Pop 15–64 × 100</div>
          <div class="indicator-desc">Carico previdenziale e sociosanitario senile: ${ida} anziani ogni 100 residenti in età lavorativa.</div>
        </div>
      </div>

      <!-- Gruppo 2: Età Mediana e Ricambio Forze Lavoro -->
      <div style="font-size: 0.75rem; font-weight: 800; text-transform: uppercase; color: var(--text-subtle); margin-bottom: 0.4rem; letter-spacing: 0.04em;">
        2. Struttura delle coorti, età mediana e mercato del lavoro
      </div>
      <div class="indicator-matrix-grid" style="margin-bottom: 1rem;">
        <div class="indicator-card">
          <div class="indicator-card-head">
            <span class="indicator-title">Età Mediana (Eurostat)</span>
            <span class="indicator-acronym">Bipartizione 50%</span>
          </div>
          <div class="indicator-val" style="color: #4f46e5;">${medianAgeFormatted} anni</div>
          <div class="indicator-formula">Punto mediano esatto (50% &lt; / 50% &gt;)</div>
          <div class="indicator-desc">Età che divide la popolazione in due parti uguali; parametro cardine Eurostat meno sensibile ai valori estremi dell'età media.</div>
        </div>

        <div class="indicator-card">
          <div class="indicator-card-head">
            <span class="indicator-title">Rinnovamento Contingente Attivo (IRCA)</span>
            <span class="indicator-acronym">ISTAT Ricambio</span>
          </div>
          <div class="indicator-val" style="color: ${parseFloat(irca) < 100 ? '#b91c1c' : '#059669'};">${irca}%</div>
          <div class="indicator-formula">(Pop 15–29 / Pop 50–64) × 100</div>
          <div class="indicator-desc">Capacità di ricambio a medio termine: giovani occupabili (15–29) rispetto ai lavoratori vicini alla pensione (50–64).</div>
        </div>

        <div class="indicator-card">
          <div class="indicator-card-head">
            <span class="indicator-title">Invecchiamento Forze Lavoro (ISPA)</span>
            <span class="indicator-acronym">Struttura attiva</span>
          </div>
          <div class="indicator-val" style="color: #d97706;">${ispa}%</div>
          <div class="indicator-formula">(Pop 40–64 / Pop 15–39) × 100</div>
          <div class="indicator-desc">Rapporto tra lavoratori maturi e giovani. Valori > 100% indicano una forza lavoro sbilanciata verso l'anzianità lavorativa.</div>
        </div>
      </div>

      <!-- Gruppo 3: Genere, Famiglia e Longevità Profonda -->
      <div style="font-size: 0.75rem; font-weight: 800; text-transform: uppercase; color: var(--text-subtle); margin-bottom: 0.4rem; letter-spacing: 0.04em;">
        3. Squilibri di genere, fecondità indiretta, stato civile e longevità
      </div>
      <div class="indicator-matrix-grid">
        <div class="indicator-card">
          <div class="indicator-card-head">
            <span class="indicator-title">Rapporto Bambini-Donne (CWR)</span>
            <span class="indicator-acronym">Fecondità apparente</span>
          </div>
          <div class="indicator-val" style="color: #0284c7;">${cwr} ‰</div>
          <div class="indicator-formula">(Pop 0–4 / Donne 15–49) × 1.000</div>
          <div class="indicator-desc">Bambini sotto i 5 anni per 1.000 donne in età fertile. Proxy robusta di fecondità al netto della mortalità neonatale.</div>
        </div>

        <div class="indicator-card">
          <div class="indicator-card-head">
            <span class="indicator-title">Rapporto di Mascolinità (RM)</span>
            <span class="indicator-acronym">Sex Ratio Totale</span>
          </div>
          <div class="indicator-val" style="color: #0891b2;">${rm}%</div>
          <div class="indicator-formula">(Pop Maschile / Pop Femminile) × 100</div>
          <div class="indicator-desc">Equilibrio di genere complessivo: ${maschiTot} maschi ogni ${femmineTot} femmine residenti.</div>
        </div>

        <div class="indicator-card">
          <div class="indicator-card-head">
            <span class="indicator-title">Tasso di Vedovanza Anziana (TVA)</span>
            <span class="indicator-acronym">Solitudine senile</span>
          </div>
          <div class="indicator-val" style="color: #be123c;">${tva}%</div>
          <div class="indicator-formula">(Vedovi/e 65+ / Pop 65+) × 100</div>
          <div class="indicator-desc">Isola la fragilità abitativa e familiare: quota di anziani vedovi/e privi di coniuge convivente (${vedovi65} residenti).</div>
        </div>

        <div class="indicator-card">
          <div class="indicator-card-head">
            <span class="indicator-title">Vecchiaia Profonda (IVP)</span>
            <span class="indicator-acronym">Grandi anziani</span>
          </div>
          <div class="indicator-val" style="color: #be123c;">${ivp}%</div>
          <div class="indicator-formula">(Pop 80+ / Pop 65+) × 100</div>
          <div class="indicator-desc">Quota di ultraottantenni sul totale anziani: isola il bacino ad alto fabbisogno sociosanitario continuo.</div>
        </div>

        <div class="indicator-card">
          <div class="indicator-card-head">
            <span class="indicator-title">Carico di Cura Figli-Genitori (PSR)</span>
            <span class="indicator-acronym">Parent Support</span>
          </div>
          <div class="indicator-val" style="color: #7c3aed;">${psr}%</div>
          <div class="indicator-formula">(Pop 80+ / Pop 50–64) × 100</div>
          <div class="indicator-desc">Grandi anziani (80+) ogni 100 figli maturi (50–64 anni): pressione di cura informale intrafamiliare.</div>
        </div>

        <div class="indicator-card">
          <div class="indicator-card-head">
            <span class="indicator-title">Sex Ratio Longevità (SR 75+)</span>
            <span class="indicator-acronym">Genere senile</span>
          </div>
          <div class="indicator-val" style="color: #059669;">${sr75}%</div>
          <div class="indicator-formula">(Uomini 75+ / Donne 75+) × 100</div>
          <div class="indicator-desc">Sopravvivenza differenziale: valori &lt; 100 riflettono la marcata prevalenza femminile nelle coorti longeve.</div>
        </div>
      </div>
    `;
  }

  // 9. Modulo Tipologia Demografica di Webb & Tassi Standardizzati Eurostat (Crude Rates)
  function renderAdvancedFlows(year) {
    const container = document.getElementById('advanced-flow-container');
    if (!container) return;

    const yrFlow = year > 2024 ? 2024 : year;
    const m = data.movimento_naturale.find(m => m.anno_riferimento.includes(String(yrFlow))) || data.movimento_naturale[data.movimento_naturale.length - 1];
    const f = data.flussi_migratori.find(m => m.anno_riferimento.includes(String(yrFlow))) || data.flussi_migratori[data.flussi_migratori.length - 1];
    const pCurr = data.popolazione_andamento.find(p => p.anno_riferimento.includes(String(yrFlow))) || data.popolazione_andamento[data.popolazione_andamento.length - 1];
    const pPrev = data.popolazione_andamento.find(p => p.anno_riferimento.includes(String(yrFlow - 1))) || pCurr;

    if (!m || !f) return;

    const sn = m.saldo_naturale;
    const sm = f.saldo_migratorio_totale;
    const imm = (f.iscritti_da_altri_comuni || 0) + (f.iscritti_da_estero || 0) + (f.iscritti_altri || 0);
    const emi = (f.cancellati_per_altri_comuni || 0) + (f.cancellati_per_estero || 0) + (f.cancellati_altri || 0);

    const popStart = pPrev ? pPrev.popolazione_residente : 6000;
    const popEnd = pCurr ? pCurr.popolazione_residente : popStart;
    const pMed = (popStart + popEnd) / 2;

    // Tassi Standardizzati Eurostat (Crude Rates per 1.000 abitanti medi)
    const crnc = pMed > 0 ? (((m.nascite - m.decessi) / pMed) * 1000).toFixed(2) : '0';
    const crnm = pMed > 0 ? ((sm / pMed) * 1000).toFixed(2) : '0';
    const crtc = pMed > 0 ? (((sn + sm) / pMed) * 1000).toFixed(2) : '0';

    // Webb classification
    let webbTipo = 'G';
    let webbBadgeClass = 'type-g';
    let webbFormula = '|SM| > |SN|';
    let webbDesc = 'Declino demografico a dominanza migratoria (l\'esodo verso l\'esterno supera il saldo naturale negativo)';

    const tc = sn + sm;
    if (tc >= 0) {
      webbBadgeClass = 'type-prog';
      if (sn >= 0 && sm < 0 && Math.abs(sn) >= Math.abs(sm)) { webbTipo = 'A'; webbFormula = 'SN(+) ≥ |SM(-)|'; webbDesc = 'Crescita: incremento naturale positivo supera perdite migratorie'; }
      else if (sn >= 0 && sm >= 0 && sn >= sm) { webbTipo = 'B'; webbFormula = 'SN(+) ≥ SM(+)'; webbDesc = 'Crescita: incremento naturale prevale su immigrazione'; }
      else if (sn >= 0 && sm >= 0 && sm > sn) { webbTipo = 'C'; webbFormula = 'SM(+) > SN(+)'; webbDesc = 'Crescita: immigrazione prevale su incremento naturale'; }
      else if (sn < 0 && sm >= 0 && sm >= Math.abs(sn)) { webbTipo = 'D'; webbFormula = 'SM(+) ≥ |SN(-)|'; webbDesc = 'Crescita: immigrazione compensa e supera declino naturale'; }
    } else {
      if (sn < 0 && sm >= 0 && Math.abs(sn) > sm) { webbTipo = 'E'; webbBadgeClass = 'type-f'; webbFormula = '|SN(-)| > SM(+)'; webbDesc = 'Declino: declino naturale non compensato da immigrazione positiva'; }
      else if (sn < 0 && sm < 0 && Math.abs(sn) >= Math.abs(sm)) { webbTipo = 'F'; webbBadgeClass = 'type-f'; webbFormula = '|SN(-)| ≥ |SM(-)|'; webbDesc = 'Declino a dominanza naturale/senile (mortalità e calo nascite pesano più dell\'esodo migratorio)'; }
      else if (sn < 0 && sm < 0 && Math.abs(sm) > Math.abs(sn)) { webbTipo = 'G'; webbBadgeClass = 'type-g'; webbFormula = '|SM(-)| > |SN(-)|'; webbDesc = 'Declino a dominanza migratoria (l\'esodo migratorio supera il declino naturale negativo)'; }
      else if (sn >= 0 && sm < 0 && Math.abs(sm) > sn) { webbTipo = 'H'; webbBadgeClass = 'type-h'; webbFormula = '|SM(-)| > SN(+)'; webbDesc = 'Declino: emigrazione negativa supera e annulla incremento naturale positivo'; }
    }

    // MEI, TCM, TTD
    const mei = (imm + emi) > 0 ? ((Math.abs(imm - emi) / (imm + emi)) * 100).toFixed(1) : '0';
    const tcm = Math.abs(sn) > 0 ? (sm / Math.abs(sn)).toFixed(2) : '0';
    const ttd = pMed > 0 ? (((m.nascite + m.decessi + imm + emi) / pMed) * 1000).toFixed(1) : '0';

    container.innerHTML = `
      <div class="webb-panel">
        <div class="webb-header">
          <div>
            <div style="font-size: 0.75rem; text-transform: uppercase; font-weight: 800; color: var(--text-subtle); letter-spacing: 0.05em; margin-bottom: 0.2rem;">
              Classificazione Dinamica di John W. Webb (1963) • Anno ${yrFlow}
            </div>
            <div style="font-size: 1.05rem; font-weight: 800; color: var(--text-main);">
              Tipologia Demografica: <span class="webb-badge-type ${webbBadgeClass}">TIPO ${webbTipo} • ${webbFormula}</span>
            </div>
          </div>
          <div style="font-size: 0.775rem; color: var(--text-subtle); max-width: 380px; text-align: right;">
            Fonti: <em>J.W. Webb (1963)</em>; <em>Eurostat Regional Demographic Indicators</em>; <em>ISTAT</em>.
          </div>
        </div>

        <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.85rem; line-height: 1.45;">
          <strong>Diagnosi:</strong> ${webbDesc}. Nella serie storica ventennale 2002–2024, Tortorici è classificato come <strong>Tipo G per l'82,6% del tempo</strong> (19 anni su 23), evidenziando come l'esodo migratorio sia stato il vettore primario dello spopolamento (68,8% della perdita totale).
        </p>

        <!-- Tassi Standardizzati Eurostat (Crude Rates) -->
        <div style="font-size: 0.75rem; font-weight: 800; text-transform: uppercase; color: var(--text-subtle); margin-bottom: 0.4rem; letter-spacing: 0.04em;">
          Tassi generici standardizzati annuali (Standard Eurostat • per 1.000 ab. medi = ${formatInt(Math.round(pMed))})
        </div>
        <div class="indicator-matrix-grid" style="margin-bottom: 0.85rem;">
          <div class="indicator-card">
            <div class="indicator-card-head">
              <span class="indicator-title">Crescita Naturale (CRNC)</span>
              <span class="indicator-acronym">Eurostat</span>
            </div>
            <div class="indicator-val" style="color: ${parseFloat(crnc) < 0 ? '#b91c1c' : '#059669'};">${crnc} ‰</div>
            <div class="indicator-formula">(Nascite - Decessi) / P_med × 1.000</div>
            <div class="indicator-desc">Tasso generico di saldo naturale per 1.000 residenti medi (${m.nascite} nati, ${m.decessi} morti).</div>
          </div>

          <div class="indicator-card">
            <div class="indicator-card-head">
              <span class="indicator-title">Migrazione Netta (CRNM)</span>
              <span class="indicator-acronym">Eurostat</span>
            </div>
            <div class="indicator-val" style="color: ${parseFloat(crnm) < 0 ? '#b91c1c' : '#059669'};">${crnm} ‰</div>
            <div class="indicator-formula">(Iscritti - Cancellati) / P_med × 1.000</div>
            <div class="indicator-desc">Tasso generico di saldo migratorio per 1.000 residenti medi (${imm} iscritti, ${emi} cancellati).</div>
          </div>

          <div class="indicator-card">
            <div class="indicator-card-head">
              <span class="indicator-title">Variazione Totale (CRTC)</span>
              <span class="indicator-acronym">CRNC + CRNM</span>
            </div>
            <div class="indicator-val" style="color: ${parseFloat(crtc) < 0 ? '#b91c1c' : '#059669'};">${crtc} ‰</div>
            <div class="indicator-formula">Δ Popolazione Totale / P_med × 1.000</div>
            <div class="indicator-desc">Velocità annua di crescita o contrazione demografica complessiva del territorio.</div>
          </div>
        </div>

        <!-- Efficacia Flussi & Turnover -->
        <div style="font-size: 0.75rem; font-weight: 800; text-transform: uppercase; color: var(--text-subtle); margin-bottom: 0.4rem; letter-spacing: 0.04em;">
          Indicatori di dinamica idraulica ed efficacia dei flussi
        </div>
        <div class="indicator-matrix-grid">
          <div class="indicator-card">
            <div class="indicator-card-head">
              <span class="indicator-title">Efficacia Migratoria (MEI)</span>
              <span class="indicator-acronym">Direzionalità</span>
            </div>
            <div class="indicator-val" style="color: #0284c7;">${mei}%</div>
            <div class="indicator-formula">|Immigrati - Emigrati| / (Imm + Emi) × 100</div>
            <div class="indicator-desc">Misura l'asimmetria dei flussi (0% = perfetta rotazione neutrale, 100% = flusso puramente unidirezionale in uscita).</div>
          </div>

          <div class="indicator-card">
            <div class="indicator-card-head">
              <span class="indicator-title">Compensazione Migratoria (TCM)</span>
              <span class="indicator-acronym">Impatto netto</span>
            </div>
            <div class="indicator-val" style="color: ${parseFloat(tcm) < 0 ? '#b91c1c' : '#059669'};">${tcm}</div>
            <div class="indicator-formula">Saldo Migratorio / |Saldo Naturale|</div>
            <div class="indicator-desc">${parseFloat(tcm) < 0 ? 'Negativo: l\'esodo migratorio aggrava il deficit tra nascite e decessi anziché compensarlo.' : 'Positivo: i flussi in entrata attenuano o superano il calo naturale.'}</div>
          </div>

          <div class="indicator-card">
            <div class="indicator-card-head">
              <span class="indicator-title">Turnover Demografico (TTD)</span>
              <span class="indicator-acronym">Mobilità totale</span>
            </div>
            <div class="indicator-val" style="color: #7c3aed;">${ttd} ‰</div>
            <div class="indicator-formula">(Nascite + Decessi + Iscr + Canc) / P_med × 1.000</div>
            <div class="indicator-desc">Intensità globale di ricambio e mobilità: ${ttd} eventi anagrafici annui ogni 1.000 residenti.</div>
          </div>
        </div>
      </div>
    `;
  }

  // 10. Pianificazione Servizi Educativi (RPS)
  function renderAdvancedSchool(year) {
    const container = document.getElementById('advanced-school-container');
    if (!container || !data.eta_scolastica_annuale) return;

    const scolData = data.eta_scolastica_annuale.find(s => s.anno === year) || data.eta_scolastica_annuale[data.eta_scolastica_annuale.length - 1];
    const items = scolData ? scolData.dati_eta : [];

    let nido = items.filter(d => d.eta >= 0 && d.eta <= 2).reduce((a, b) => a + b.totale, 0);
    let primaria = items.filter(d => d.eta >= 6 && d.eta <= 10).reduce((a, b) => a + b.totale, 0);

    // Fallback 2002 if dati_eta is empty
    if (items.length === 0) {
      const piramideData = data.piramidi_eta_annuali.find(p => p.anno === year);
      if (piramideData && piramideData.fasce) {
        const f0_4 = piramideData.fasce.find(f => f.fascia_eta === '0-4');
        const f5_9 = piramideData.fasce.find(f => f.fascia_eta === '5-9');
        nido = f0_4 ? Math.round(f0_4.totale * 0.6) : 0;
        primaria = f5_9 ? f5_9.totale : 0;
      }
    }

    const rps = primaria > 0 ? ((nido / primaria) * (5 / 3)).toFixed(2) : '0';
    const isWarning = parseFloat(rps) < 1.0;

    container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem;">
        <div>
          <div style="font-size: 0.75rem; font-weight: 800; text-transform: uppercase; color: var(--text-subtle); margin-bottom: 0.15rem;">
            Pianificazione Servizi Educativi • Coorti Mobili Prospettiche (${year})
          </div>
          <div style="font-size: 0.95rem; font-weight: 700; color: var(--text-main);">
            Rapporto di Pressione Scolastica Prospettica (RPS): 
            <span style="font-size: 1.15rem; font-family: var(--font-mono); font-weight: 800; color: ${isWarning ? '#b91c1c' : '#059669'}; margin-left: 0.35rem;">${rps}</span>
            <span class="badge" style="background: ${isWarning ? '#fef2f2' : '#ecfdf5'}; color: ${isWarning ? '#b91c1c' : '#059669'}; border-color: ${isWarning ? '#fecaca' : '#a7f3d0'}; margin-left: 0.5rem;">
              ${isWarning ? 'Rischio contrazione classi (< 1,0)' : 'Stabilità coorti (≥ 1,0)'}
            </span>
          </div>
        </div>
        <div style="font-size: 0.75rem; color: var(--text-muted); max-width: 480px; line-height: 1.35;">
          <strong>Formula:</strong> <code>(Pop 0–2 / Pop 6–10) × 5/3</code>. Misura il rapporto tra i bambini del nido e gli alunni della primaria normalizzato sui 5 anni di corso. Un valore inferiore a 1 indica una contrazione strutturale del numero di classi elementari nell'arco di 4–6 anni.
        </div>
      </div>
    `;
  }

  // 11. Indicatori Ibridi Demografia, Fisco MEF e Mobilità ACI
  function renderAdvancedEconomy(year) {
    const container = document.getElementById('advanced-economy-container');
    if (!container || !data.redditi_irpef) return;

    // MEF
    const rList = data.redditi_irpef;
    const exactR = rList.find(r => r.anno === year);
    const pastR = rList.filter(r => r.anno <= year);
    const r = exactR || (pastR.length > 0 ? pastR[pastR.length - 1] : rList[rList.length - 1]);

    // Piramide for active population
    const piramideData = data.piramidi_eta_annuali.find(p => p.anno === year) || data.piramidi_eta_annuali[data.piramidi_eta_annuali.length - 1];
    const fasce = piramideData ? piramideData.fasce : [];
    const getF = (fname) => fasce.find(f => f.fascia_eta === fname);

    const activeAges = ['15-19', '20-24', '25-29', '30-34', '35-39', '40-44', '45-49', '50-54', '55-59', '60-64'];
    const pop15_64 = activeAges.reduce((acc, age) => acc + (getF(age) ? getF(age).totale : 0), 0);

    const popTot = piramideData ? piramideData.totale_residenti : (r ? r.popolazione_residente : 6000);
    const contr = r ? r.contribuenti_dichiaranti : 1;
    const impTot = r ? r.ammontare_imponibile_totale_euro : 0;

    const dipEco = contr > 0 ? ((popTot - contr) / contr).toFixed(2) : '0';
    const pressAttiva = pop15_64 > 0 ? Math.round(impTot / pop15_64) : 0;

    // ACI
    const vList = data.parco_veicolare || [];
    const exactV = vList.find(v => v.anno === year);
    const pastV = vList.filter(v => v.anno <= year);
    const v = exactV || (pastV.length > 0 ? pastV[pastV.length - 1] : vList[vList.length - 1]);

    const driveAges = ['20-24', '25-29', '30-34', '35-39', '40-44', '45-49', '50-54', '55-59', '60-64', '65-69'];
    let pop18_69 = driveAges.reduce((acc, age) => acc + (getF(age) ? getF(age).totale : 0), 0);
    const f15_19 = getF('15-19');
    if (f15_19) pop18_69 += Math.round(f15_19.totale * 0.4);

    const auto = v ? v.automobili : 0;
    const motAttiva = pop18_69 > 0 ? Math.round((auto / pop18_69) * 1000) : 0;

    container.innerHTML = `
      <div style="margin-bottom: 0.5rem; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem;">
        <h4 style="font-size: 0.925rem; font-weight: 700; color: var(--text-main); margin: 0;">
          Indicatori ibridi integrati: Demografia, Fisco MEF e Mobilità ACI (${year})
        </h4>
        <span style="font-size: 0.725rem; color: var(--text-subtle);">Incrocio anagrafico con dichiarazioni IRPEF e PRA</span>
      </div>
      <div class="indicator-matrix-grid">
        <div class="indicator-card">
          <div class="indicator-card-head">
            <span class="indicator-title">Dipendenza Economica Effettiva</span>
            <span class="indicator-acronym">Carico fiscale</span>
          </div>
          <div class="indicator-val" style="color: #0284c7;">${dipEco}</div>
          <div class="indicator-formula">(Pop Totale - Contribuenti) / Contribuenti</div>
          <div class="indicator-desc">Numero di residenti non dichiaranti (minori, studenti, disoccupati, inattivi) a carico di ciascun contribuente IRPEF.</div>
        </div>

        <div class="indicator-card">
          <div class="indicator-card-head">
            <span class="indicator-title">Capacità Imponibile / Pop. Attiva</span>
            <span class="indicator-acronym">Produttività potenziale</span>
          </div>
          <div class="indicator-val" style="color: #059669;">${formatEuro(pressAttiva)}</div>
          <div class="indicator-formula">Imponibile Totale MEF / Pop 15–64</div>
          <div class="indicator-desc">Monte imponibile dichiarato rapportato ai soli residenti in età lavorativa (15–64 anni) anziché alla popolazione totale.</div>
        </div>

        <div class="indicator-card">
          <div class="indicator-card-head">
            <span class="indicator-title">Motorizzazione su Popolazione Attiva</span>
            <span class="indicator-acronym">Dipendenza auto</span>
          </div>
          <div class="indicator-val" style="color: #d97706;">${formatInt(motAttiva)} auto</div>
          <div class="indicator-formula">(Autovetture / Pop 18–69) × 1.000</div>
          <div class="indicator-desc">Autovetture private per 1.000 residenti in età di guida effettiva (18–69 anni), depurato da minori e anziani non guidatori.</div>
        </div>
      </div>
    `;
  }

  // 12. Benchmark Nebrodi
  function renderBenchmarkChart() {
    const container = document.getElementById('benchmark-table-container');
    if (!container) return;

    const list = data.benchmark_limitrofi;
    let html = `
      <table class="data-table">
        <thead>
          <tr>
            <th>Comune / Entità territoriale</th>
            <th>Distanza</th>
            <th>Popolazione 2025</th>
            <th>Età media</th>
            <th>Indice vecchiaia</th>
            <th>Stranieri (%)</th>
          </tr>
        </thead>
        <tbody>
    `;

    list.forEach(item => {
      const isTortorici = item.comune.includes('Tortorici');
      html += `
        <tr style="${isTortorici ? 'background-color: #eff6ff; font-weight: 700;' : ''}">
          <td>${item.comune} ${item.confinante ? '<span class="badge" style="background:#e0f2fe; color:#0369a1; font-size:0.7rem; padding:1px 5px;">Confinante</span>' : ''}</td>
          <td>${item.distanza_km !== null ? `${formatFloat(item.distanza_km)} km` : '-'}</td>
          <td>${formatInt(item.popolazione_2025)}</td>
          <td>${formatFloat(item.eta_media)} anni</td>
          <td>${formatFloat(item.indice_vecchiaia)}</td>
          <td>${formatPct(item.stranieri_pct)}</td>
        </tr>
      `;
    });

    html += `</tbody></table>`;
    container.innerHTML = html;
  }

  function showPyramidGenderTip(event, year, ageIndex, side) {
    const piramideData = data.piramidi_eta_annuali.find(p => p.anno === year);
    if (!piramideData || !piramideData.fasce || !piramideData.fasce[ageIndex]) return;
    const f = piramideData.fasce[ageIndex];
    const totCohort = f.totale;

    if (side === 'male') {
      const pct = totCohort > 0 ? (f.maschi / totCohort) * 100 : 0;
      const content = `Maschi: <strong>${formatInt(f.maschi)}</strong> residenti (<strong>${formatPct(pct)}</strong> della classe)<br>Totale classe: <strong>${formatInt(totCohort)}</strong> residenti`;
      showTooltip(event, `Maschi ${f.fascia_eta} anni (${year})`, content);
    } else if (side === 'female') {
      const pct = totCohort > 0 ? (f.femmine / totCohort) * 100 : 0;
      const content = `Femmine: <strong>${formatInt(f.femmine)}</strong> residenti (<strong>${formatPct(pct)}</strong> della classe)<br>Totale classe: <strong>${formatInt(totCohort)}</strong> residenti`;
      showTooltip(event, `Femmine ${f.fascia_eta} anni (${year})`, content);
    } else {
      const mPct = totCohort > 0 ? (f.maschi / totCohort) * 100 : 0;
      const fPct = totCohort > 0 ? (f.femmine / totCohort) * 100 : 0;
      const content = `Totale residenti: <strong>${formatInt(totCohort)}</strong><br>` +
        `<span style="color:#38bdf8;">●</span> Maschi: <strong>${formatInt(f.maschi)}</strong> (${formatPct(mPct)})<br>` +
        `<span style="color:#f43f5e;">●</span> Femmine: <strong>${formatInt(f.femmine)}</strong> (${formatPct(fPct)})`;
      showTooltip(event, `Fascia ${f.fascia_eta} anni (${year})`, content);
    }
  }

  function showPyramidCivilTip(event, year, ageIndex, subType) {
    const piramideData = data.piramidi_eta_annuali.find(p => p.anno === year);
    if (!piramideData || !piramideData.fasce || !piramideData.fasce[ageIndex]) return;
    const f = piramideData.fasce[ageIndex];
    const totCohort = f.totale;

    const celPct = totCohort > 0 ? (f.celibi_nubili / totCohort) * 100 : 0;
    const conPct = totCohort > 0 ? (f.coniugati / totCohort) * 100 : 0;
    const vedPct = totCohort > 0 ? (f.vedovi / totCohort) * 100 : 0;
    const divPct = totCohort > 0 ? (f.divorziati / totCohort) * 100 : 0;

    if (subType === 'celibi') {
      const content = `Conteggio: <strong>${formatInt(f.celibi_nubili)}</strong> residenti<br>Incidenza: <strong>${formatPct(celPct)}</strong> della fascia`;
      showTooltip(event, `Celibi / Nubili • ${f.fascia_eta} anni (${year})`, content);
    } else if (subType === 'coniugati') {
      const content = `Conteggio: <strong>${formatInt(f.coniugati)}</strong> residenti<br>Incidenza: <strong>${formatPct(conPct)}</strong> della fascia`;
      showTooltip(event, `Coniugati • ${f.fascia_eta} anni (${year})`, content);
    } else if (subType === 'vedovi') {
      const content = `Conteggio: <strong>${formatInt(f.vedovi)}</strong> residenti<br>Incidenza: <strong>${formatPct(vedPct)}</strong> della fascia`;
      showTooltip(event, `Vedovi • ${f.fascia_eta} anni (${year})`, content);
    } else if (subType === 'divorziati') {
      const content = `Conteggio: <strong>${formatInt(f.divorziati)}</strong> residenti<br>Incidenza: <strong>${formatPct(divPct)}</strong> della fascia`;
      showTooltip(event, `Divorziati • ${f.fascia_eta} anni (${year})`, content);
    } else {
      const content = `Totale residenti: <strong>${formatInt(totCohort)}</strong><br>` +
        `<span style="color:#60a5fa;">●</span> Celibi / Nubili: <strong>${formatInt(f.celibi_nubili)}</strong> (<strong>${formatPct(celPct)}</strong>)<br>` +
        `<span style="color:#34d399;">●</span> Coniugati: <strong>${formatInt(f.coniugati)}</strong> (<strong>${formatPct(conPct)}</strong>)<br>` +
        `<span style="color:#cbd5e1;">●</span> Vedovi: <strong>${formatInt(f.vedovi)}</strong> (<strong>${formatPct(vedPct)}</strong>)<br>` +
        `<span style="color:#fbbf24;">●</span> Divorziati: <strong>${formatInt(f.divorziati)}</strong> (<strong>${formatPct(divPct)}</strong>)`;
      showTooltip(event, `Stato civile • ${f.fascia_eta} anni (${year})`, content);
    }
  }

  // Tooltip con protezione bordi viewport mobile
  function showTooltip(event, title, content) {
    let tooltip = document.getElementById('app-universal-tooltip');
    if (!tooltip) {
      tooltip = document.createElement('div');
      tooltip.id = 'app-universal-tooltip';
      tooltip.className = 'custom-tooltip';
      document.body.appendChild(tooltip);
      
      document.addEventListener('touchstart', (e) => {
        if (!e.target.closest('.history-point-group') && !e.target.closest('.pyramid-bar') && !e.target.closest('.country-card') && !e.target.closest('.pyramid-stacked-bar') && !e.target.closest('.pyramid-row')) {
          hideTooltip();
        }
      }, { passive: true });
    }

    tooltip.innerHTML = `<div class="tooltip-title">${title}</div><div>${content}</div>`;
    tooltip.style.opacity = '1';

    const pageX = event.pageX || (event.touches && event.touches[0] ? event.touches[0].pageX : 0);
    const pageY = event.pageY || (event.touches && event.touches[0] ? event.touches[0].pageY : 0);
    const tooltipWidth = 240;
    const windowWidth = document.documentElement.clientWidth || window.innerWidth;

    let left = pageX + 12;
    if (left + tooltipWidth > windowWidth - 10) {
      left = Math.max(10, windowWidth - tooltipWidth - 15);
    }

    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${Math.max(10, pageY - 32)}px`;
  }

  function hideTooltip() {
    const tooltip = document.getElementById('app-universal-tooltip');
    if (tooltip) {
      tooltip.style.opacity = '0';
    }
  }

  return {
    init,
    setYear,
    setPyramidMode,
    setHistoryMode,
    showPyramidGenderTip,
    showPyramidCivilTip,
    showTooltip,
    hideTooltip
  };
})();
