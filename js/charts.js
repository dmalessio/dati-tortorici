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
    renderFlowDiagram(currentYear > 2024 ? 2024 : currentYear);
    renderHistoryChart();
    renderSchoolChart(currentYear);
    renderRedditiChart(currentYear);
    renderVeicoliChart(currentYear);
    renderBenchmarkChart();
  }

  function setYear(year) {
    currentYear = year;
    renderKPIs(year);
    renderPyramid(year, pyramidMode);
    renderFlowDiagram(year > 2024 ? 2024 : year);
    renderSchoolChart(year);
    renderRedditiChart(year);
    renderVeicoliChart(year);
    highlightHistoryYear(year);
  }

  function setPyramidMode(mode) {
    pyramidMode = mode;
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

  // 2. Piramide delle Età (Scala globale fissa a 210 residenti per classe)
  function renderPyramid(year, mode = 'gender') {
    const container = document.getElementById('pyramid-chart-container');
    if (!container) return;

    const piramideData = data.piramidi_eta_annuali.find(p => p.anno === year);
    if (!piramideData || !piramideData.fasce) return;

    const fasce = piramideData.fasce;
    const maxVal = GLOBAL_MAX_PYRAMID;

    let html = '<div class="pyramid-container">';

    for (let i = fasce.length - 1; i >= 0; i--) {
      const f = fasce[i];
      const mPct = Math.min(100, (f.maschi / maxVal) * 100);
      const fPct = Math.min(100, (f.femmine / maxVal) * 100);
      const totCohort = f.totale;

      html += `<div class="pyramid-row">`;
      
      if (mode === 'gender') {
        const mTip = `Maschi: <strong>${formatInt(f.maschi)}</strong> (${formatPct(totCohort > 0 ? (f.maschi/totCohort)*100 : 0)} della classe)<br>Totale classe: <strong>${formatInt(totCohort)}</strong> residenti`;
        const fTip = `Femmine: <strong>${formatInt(f.femmine)}</strong> (${formatPct(totCohort > 0 ? (f.femmine/totCohort)*100 : 0)} della classe)<br>Totale classe: <strong>${formatInt(totCohort)}</strong> residenti`;
        const rowTip = `Fascia ${f.fascia_eta} anni (${year})<br>Totale: <strong>${formatInt(totCohort)}</strong> residenti<br><span style="color:#38bdf8;">●</span> Maschi: <strong>${formatInt(f.maschi)}</strong> (${formatPct(totCohort > 0 ? (f.maschi/totCohort)*100 : 0)})<br><span style="color:#f43f5e;">●</span> Femmine: <strong>${formatInt(f.femmine)}</strong> (${formatPct(totCohort > 0 ? (f.femmine/totCohort)*100 : 0)})`;

        html += `<div class="pyramid-side male">
                  <div class="pyramid-bar male-bar" style="width: ${mPct}%;" 
                       onmouseenter="window.AppCharts.showTooltip(event, 'Maschi ${f.fascia_eta} anni (${year})', '${mTip}')" 
                       onclick="window.AppCharts.showTooltip(event, 'Maschi ${f.fascia_eta} anni (${year})', '${mTip}')"
                       onmouseleave="window.AppCharts.hideTooltip()"></div>
                </div>`;

        html += `<div class="pyramid-label" 
                      onmouseenter="window.AppCharts.showTooltip(event, 'Fascia ${f.fascia_eta} anni (${year})', '${rowTip}')"
                      onclick="window.AppCharts.showTooltip(event, 'Fascia ${f.fascia_eta} anni (${year})', '${rowTip}')"
                      onmouseleave="window.AppCharts.hideTooltip()">${f.fascia_eta}</div>`;

        html += `<div class="pyramid-side female">
                  <div class="pyramid-bar female-bar" style="width: ${fPct}%;" 
                       onmouseenter="window.AppCharts.showTooltip(event, 'Femmine ${f.fascia_eta} anni (${year})', '${fTip}')" 
                       onclick="window.AppCharts.showTooltip(event, 'Femmine ${f.fascia_eta} anni (${year})', '${fTip}')"
                       onmouseleave="window.AppCharts.hideTooltip()"></div>
                </div>`;
      } else if (mode === 'civil') {
        const celPct = totCohort > 0 ? (f.celibi_nubili / totCohort) : 0;
        const conPct = totCohort > 0 ? (f.coniugati / totCohort) : 0;
        const vedPct = totCohort > 0 ? (f.vedovi / totCohort) : 0;
        const divPct = totCohort > 0 ? (f.divorziati / totCohort) : 0;

        const tipAll = `Fascia ${f.fascia_eta} anni (${year})<br>` +
          `Totale residenti: <strong>${formatInt(totCohort)}</strong><br>` +
          `<span style="color:#60a5fa;">●</span> Celibi / Nubili: <strong>${formatInt(f.celibi_nubili)}</strong> (<strong>${formatPct(celPct * 100)}</strong>)<br>` +
          `<span style="color:#34d399;">●</span> Coniugati: <strong>${formatInt(f.coniugati)}</strong> (<strong>${formatPct(conPct * 100)}</strong>)<br>` +
          `<span style="color:#cbd5e1;">●</span> Vedovi: <strong>${formatInt(f.vedovi)}</strong> (<strong>${formatPct(vedPct * 100)}</strong>)<br>` +
          `<span style="color:#fbbf24;">●</span> Divorziati: <strong>${formatInt(f.divorziati)}</strong> (<strong>${formatPct(divPct * 100)}</strong>)`;

        const tipCel = `Celibi / Nubili • ${f.fascia_eta} anni (${year})<br>Conteggio: <strong>${formatInt(f.celibi_nubili)}</strong> residenti<br>Incidenza: <strong>${formatPct(celPct * 100)}</strong> della fascia`;
        const tipCon = `Coniugati • ${f.fascia_eta} anni (${year})<br>Conteggio: <strong>${formatInt(f.coniugati)}</strong> residenti<br>Incidenza: <strong>${formatPct(conPct * 100)}</strong> della fascia`;
        const tipVed = `Vedovi • ${f.fascia_eta} anni (${year})<br>Conteggio: <strong>${formatInt(f.vedovi)}</strong> residenti<br>Incidenza: <strong>${formatPct(vedPct * 100)}</strong> della fascia`;
        const tipDiv = `Divorziati • ${f.fascia_eta} anni (${year})<br>Conteggio: <strong>${formatInt(f.divorziati)}</strong> residenti<br>Incidenza: <strong>${formatPct(divPct * 100)}</strong> della fascia`;

        const renderSideCivil = (pctWidth, genderLabel) => `
          <div class="pyramid-stacked-bar" style="width: ${pctWidth}%;"
               onmouseenter="window.AppCharts.showTooltip(event, '${genderLabel} ${f.fascia_eta} anni (${year})', '${tipAll}')"
               onclick="window.AppCharts.showTooltip(event, '${genderLabel} ${f.fascia_eta} anni (${year})', '${tipAll}')"
               onmouseleave="window.AppCharts.hideTooltip()">
            <div class="stacked-segment segment-celibi" style="width: ${celPct * 100}%;"
                 onmouseenter="event.stopPropagation(); window.AppCharts.showTooltip(event, 'Celibi/Nubili • ${f.fascia_eta} anni', '${tipCel}')"
                 onclick="event.stopPropagation(); window.AppCharts.showTooltip(event, 'Celibi/Nubili • ${f.fascia_eta} anni', '${tipCel}')"></div>
            <div class="stacked-segment segment-coniugati" style="width: ${conPct * 100}%;"
                 onmouseenter="event.stopPropagation(); window.AppCharts.showTooltip(event, 'Coniugati • ${f.fascia_eta} anni', '${tipCon}')"
                 onclick="event.stopPropagation(); window.AppCharts.showTooltip(event, 'Coniugati • ${f.fascia_eta} anni', '${tipCon}')"></div>
            <div class="stacked-segment segment-vedovi" style="width: ${vedPct * 100}%;"
                 onmouseenter="event.stopPropagation(); window.AppCharts.showTooltip(event, 'Vedovi • ${f.fascia_eta} anni', '${tipVed}')"
                 onclick="event.stopPropagation(); window.AppCharts.showTooltip(event, 'Vedovi • ${f.fascia_eta} anni', '${tipVed}')"></div>
            <div class="stacked-segment segment-divorziati" style="width: ${divPct * 100}%;"
                 onmouseenter="event.stopPropagation(); window.AppCharts.showTooltip(event, 'Divorziati • ${f.fascia_eta} anni', '${tipDiv}')"
                 onclick="event.stopPropagation(); window.AppCharts.showTooltip(event, 'Divorziati • ${f.fascia_eta} anni', '${tipDiv}')"></div>
          </div>
        `;

        html += `<div class="pyramid-side male">${renderSideCivil(mPct, 'Maschi')}</div>`;

        html += `<div class="pyramid-label"
                      onmouseenter="window.AppCharts.showTooltip(event, 'Stato civile • Fascia ${f.fascia_eta} anni', '${tipAll}')"
                      onclick="window.AppCharts.showTooltip(event, 'Stato civile • Fascia ${f.fascia_eta} anni', '${tipAll}')"
                      onmouseleave="window.AppCharts.hideTooltip()">${f.fascia_eta}</div>`;

        html += `<div class="pyramid-side female">${renderSideCivil(fPct, 'Femmine')}</div>`;
      }

      html += `</div>`;
    }

    html += '</div>';

    // Legenda
    if (mode === 'gender') {
      html += `<div class="pyramid-legend">
                <div class="legend-item"><span class="legend-color" style="background: var(--color-male);"></span> Maschi (${formatInt(piramideData.totale.maschi)})</div>
                <div class="legend-item"><span class="legend-color" style="background: var(--color-female);"></span> Femmine (${formatInt(piramideData.totale.femmine)})</div>
                <div class="legend-item" style="color: var(--text-subtle); font-size: 0.8rem;">Popolazione ${year}: <strong>${formatInt(piramideData.totale.totale)}</strong> residenti</div>
              </div>`;
    } else if (mode === 'civil') {
      html += `<div class="pyramid-legend">
                <div class="legend-item"><span class="legend-color" style="background: var(--color-celibi);"></span> Celibi / Nubili (${formatInt(piramideData.totale.celibi_nubili)})</div>
                <div class="legend-item"><span class="legend-color" style="background: var(--color-coniugati);"></span> Coniugati (${formatInt(piramideData.totale.coniugati)})</div>
                <div class="legend-item"><span class="legend-color" style="background: var(--color-vedovi);"></span> Vedovi (${formatInt(piramideData.totale.vedovi)})</div>
                <div class="legend-item"><span class="legend-color" style="background: var(--color-divorziati);"></span> Divorziati (${formatInt(piramideData.totale.divorziati)})</div>
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

  // 6. Sezione Redditi IRPEF (Dati MEF senza clipping)
  function renderRedditiChart(year) {
    const container = document.getElementById('redditi-chart-container');
    if (!container || !data.redditi_irpef) return;

    const list = data.redditi_irpef;
    const current = list.find(r => r.anno === year) || list.find(r => r.anno === Math.min(2016, Math.max(2001, year))) || list[list.length - 1];

    let html = `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 0.85rem; margin-bottom: 0.75rem;">
        <div class="flow-card">
          <div class="flow-card-header"><span>Reddito medio / dichiarante</span></div>
          <div class="flow-card-val">${formatEuro(current.reddito_medio_per_dichiarante_euro)}</div>
          <small>Dati MEF per l'anno ${current.anno}</small>
        </div>
        <div class="flow-card">
          <div class="flow-card-header"><span>Reddito medio / residente</span></div>
          <div class="flow-card-val">${formatEuro(current.reddito_medio_pro_capite_residente_euro)}</div>
          <small>Pro capite sull'intera popolazione</small>
        </div>
        <div class="flow-card">
          <div class="flow-card-header"><span>Contribuenti dichiaranti</span></div>
          <div class="flow-card-val">${formatInt(current.contribuenti_dichiaranti)}</div>
          <small>${formatPct(current.percentuale_popolazione_dichiarante)} dei residenti totali</small>
        </div>
        <div class="flow-card">
          <div class="flow-card-header"><span>Monte imponibile complessivo</span></div>
          <div class="flow-card-val" style="font-size: 1.15rem;">${formatEuro(current.ammontare_imponibile_totale_euro)}</div>
          <small>Totale addizionale IRPEF dichiarata</small>
        </div>
      </div>
    `;

    container.innerHTML = html;
  }

  // 7. Sezione Parco Veicolare (Dati ACI senza clipping)
  function renderVeicoliChart(year) {
    const container = document.getElementById('veicoli-chart-container');
    if (!container || !data.parco_veicolare) return;

    const list = data.parco_veicolare;
    const current = list.find(v => v.anno === year) || list.find(v => v.anno === Math.min(2016, Math.max(2004, year))) || list[list.length - 1];

    let html = `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 0.85rem; margin-bottom: 0.75rem;">
        <div class="flow-card">
          <div class="flow-card-header"><span>Tasso di motorizzazione</span></div>
          <div class="flow-card-val">${current.auto_per_mille_abitanti} auto</div>
          <small>Ogni 1.000 residenti (anno ${current.anno})</small>
        </div>
        <div class="flow-card">
          <div class="flow-card-header"><span>Automobili registrate</span></div>
          <div class="flow-card-val">${formatInt(current.automobili)}</div>
          <small>Autovetture private al PRA</small>
        </div>
        <div class="flow-card">
          <div class="flow-card-header"><span>Mezzi trasporto merci</span></div>
          <div class="flow-card-val">${formatInt(current.trasporto_merci)}</div>
          <small>Autocarri e veicoli commerciali</small>
        </div>
        <div class="flow-card">
          <div class="flow-card-header"><span>Totale parco veicolare</span></div>
          <div class="flow-card-val">${formatInt(current.totale_parco_veicolare)}</div>
          <small>Inclusi motocicli, autobus e speciali</small>
        </div>
      </div>
    `;

    container.innerHTML = html;
  }

  // 8. Benchmark Nebrodi
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

  // Tooltip con protezione bordi viewport mobile
  function showTooltip(event, title, content) {
    let tooltip = document.getElementById('app-universal-tooltip');
    if (!tooltip) {
      tooltip = document.createElement('div');
      tooltip.id = 'app-universal-tooltip';
      tooltip.className = 'custom-tooltip';
      document.body.appendChild(tooltip);
      
      document.addEventListener('touchstart', (e) => {
        if (!e.target.closest('.history-point-group') && !e.target.closest('.pyramid-bar') && !e.target.closest('.country-card')) {
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
    showTooltip,
    hideTooltip
  };
})();
