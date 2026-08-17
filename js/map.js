/**
 * OSSERVATORIO DEMOGRAFICO TORTORICI - MAPPA ORIGINI COMUNITÀ STRANIERE
 * Visualizzazione geografica vettoriale interattiva dei paesi di provenienza
 */

window.AppMap = (function() {
  const data = window.TORTORICI_DATA;

  // Coordinate approssimate dei paesi di provenienza e di Tortorici su proiezione Equirettangolare (800x400)
  const coords = {
    'Tortorici': { x: 433, y: 165, lat: 38.0, lon: 14.8 },
    'Romania': { x: 455, y: 140, lat: 45.9, lon: 24.9 },
    'Repubblica Popolare Cinese': { x: 630, y: 165, lat: 35.8, lon: 104.1 },
    'Germania': { x: 422, y: 125, lat: 51.1, lon: 10.4 },
    'Malta': { x: 432, y: 172, lat: 35.9, lon: 14.3 },
    'Ucraina': { x: 470, y: 130, lat: 48.3, lon: 31.1 },
    'Guatemala': { x: 198, y: 200, lat: 15.7, lon: -90.2 },
    'Marocco': { x: 385, y: 180, lat: 31.7, lon: -7.0 },
    'India': { x: 575, y: 195, lat: 20.5, lon: 78.9 },
    'Nepal': { x: 588, y: 182, lat: 28.3, lon: 84.1 },
    'Stati Uniti d\'America': { x: 180, y: 150, lat: 37.0, lon: -95.7 },
    'Tunisia': { x: 420, y: 175, lat: 33.8, lon: 9.5 },
    'Albania': { x: 445, y: 155, lat: 41.1, lon: 20.1 },
    'Paesi Bassi': { x: 410, y: 122, lat: 52.1, lon: 5.2 },
    'Polonia': { x: 442, y: 124, lat: 51.9, lon: 19.1 },
    'Ungheria': { x: 442, y: 136, lat: 47.1, lon: 19.5 },
    'Federazione Russa': { x: 530, y: 110, lat: 61.5, lon: 105.3 }
  };

  function init() {
    renderMap();
    renderCountryCards();
    renderForeignPyramid();
  }

  function renderMap() {
    const container = document.getElementById('world-map-wrapper');
    if (!container) return;

    const nazioni = data.cittadini_stranieri_paesi_2025;
    const dest = coords['Tortorici'];

    let svg = `
      <svg viewBox="0 0 800 400" class="world-map-svg">
        <defs>
          <linearGradient id="arcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.8"/>
            <stop offset="100%" stop-color="#f59e0b" stop-opacity="0.9"/>
          </linearGradient>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        <!-- Sfondo oceano -->
        <rect width="800" height="400" fill="#0f172a"/>

        <!-- Linee reticolari di latitudine / longitudine -->
        <line x1="0" y1="200" x2="800" y2="200" stroke="rgba(255,255,255,0.05)" stroke-dasharray="2"/>
        <line x1="400" y1="0" x2="400" y2="400" stroke="rgba(255,255,255,0.05)" stroke-dasharray="2"/>

        <!-- Sagome stilizzate continenti (Coordinate SVG approssimate) -->
        <!-- Europa -->
        <path d="M 390 100 Q 430 90 460 110 Q 480 140 450 160 Q 410 165 395 140 Z" fill="#1e293b" stroke="#334155" stroke-width="1"/>
        <!-- Asia -->
        <path d="M 460 100 Q 600 80 720 130 Q 740 210 650 240 Q 560 230 480 170 Z" fill="#1e293b" stroke="#334155" stroke-width="1"/>
        <!-- Africa -->
        <path d="M 370 170 Q 460 170 480 250 Q 450 340 400 350 Q 350 250 370 170 Z" fill="#1e293b" stroke="#334155" stroke-width="1"/>
        <!-- America del Nord -->
        <path d="M 80 80 Q 240 70 260 160 Q 200 220 140 180 Q 80 140 80 80 Z" fill="#1e293b" stroke="#334155" stroke-width="1"/>
        <!-- America del Sud -->
        <path d="M 180 220 Q 280 240 260 350 Q 200 370 180 280 Z" fill="#1e293b" stroke="#334155" stroke-width="1"/>
        <!-- Oceania -->
        <path d="M 640 280 Q 720 270 730 330 Q 660 350 640 280 Z" fill="#1e293b" stroke="#334155" stroke-width="1"/>

        <!-- Archi di migrazione verso Tortorici -->
    `;

    nazioni.forEach((n) => {
      const orig = coords[n.paese];
      if (!orig) return;

      // Calcola punto di controllo per arco curvilineo
      const midX = (orig.x + dest.x) / 2;
      const midY = Math.min(orig.y, dest.y) - Math.abs(orig.x - dest.x) * 0.18;
      const strokeWidth = Math.max(1.2, Math.min(4.5, (n.totale / 28) * 4));

      svg += `
        <path d="M ${orig.x} ${orig.y} Q ${midX} ${midY} ${dest.x} ${dest.y}" 
              fill="none" stroke="url(#arcGrad)" stroke-width="${strokeWidth}" stroke-linecap="round" opacity="0.75"
              style="transition: all 0.2s;" />
        
        <!-- Punto paese di origine -->
        <circle cx="${orig.x}" cy="${orig.y}" r="${Math.max(3, Math.min(7, (n.totale / 28) * 6))}" fill="#38bdf8" stroke="#ffffff" stroke-width="1.5"
                style="cursor: pointer;"
                onmouseenter="window.AppCharts.showTooltip(event, '${n.paese} (${n.continente})', 'Residenti a Tortorici: <strong>${n.totale}</strong> (${n.maschi} M, ${n.femmine} F)<br>Quota su stranieri: <strong>${n.percentuale_su_stranieri.toLocaleString('it-IT')}%</strong>')"
                onmouseleave="window.AppCharts.hideTooltip()" />
      `;
    });

    // Punto Destinazione Tortorici (Pulsante oro con alone)
    svg += `
      <circle cx="${dest.x}" cy="${dest.y}" r="9" fill="#f59e0b" filter="url(#glow)"/>
      <circle cx="${dest.x}" cy="${dest.y}" r="5" fill="#ffffff"/>
      <text x="${dest.x}" y="${dest.y - 12}" font-size="11" font-weight="bold" fill="#f59e0b" text-anchor="middle" font-family="Plus Jakarta Sans, sans-serif">Tortorici (ME)</text>
    `;

    svg += `</svg>`;
    container.innerHTML = svg;
  }

  function renderCountryCards() {
    const container = document.getElementById('country-cards-wrapper');
    if (!container) return;

    const nazioni = data.cittadini_stranieri_paesi_2025;
    let html = '<div class="country-card-list">';

    nazioni.forEach((n) => {
      html += `
        <div class="country-card" onmouseenter="window.AppCharts.showTooltip(event, '${n.paese}', 'Comunità di ${n.totale} residenti (${n.maschi} maschi e ${n.femmine} femmine)')" onmouseleave="window.AppCharts.hideTooltip()">
          <div>
            <div class="country-name">${n.paese}</div>
            <div class="country-sub">${n.area_geografica} • ${n.maschi}M / ${n.femmine}F</div>
          </div>
          <div class="country-count">${n.totale}</div>
        </div>
      `;
    });

    html += '</div>';
    container.innerHTML = html;
  }

  function renderForeignPyramid() {
    const container = document.getElementById('foreign-pyramid-wrapper');
    if (!container) return;

    const piramide = data.piramide_stranieri_2025;
    let html = `
      <div style="display: flex; flex-direction: column; gap: 4px; padding: 0.5rem 0;">
    `;

    const maxVal = Math.max(...piramide.map(p => Math.max(p.maschi, p.femmine)), 8);

    for (let i = piramide.length - 1; i >= 0; i--) {
      const p = piramide[i];
      const mPct = (p.maschi / maxVal) * 100;
      const fPct = (p.femmine / maxVal) * 100;

      html += `
        <div class="pyramid-row">
          <div class="pyramid-side male">
            <div class="pyramid-bar male-bar" style="width: ${mPct}%;"
                 onmouseenter="window.AppCharts.showTooltip(event, 'Maschi stranieri ${p.fascia_eta}', '${p.maschi} residenti')" onmouseleave="window.AppCharts.hideTooltip()"></div>
          </div>
          <div class="pyramid-label">${p.fascia_eta}</div>
          <div class="pyramid-side female">
            <div class="pyramid-bar female-bar" style="width: ${fPct}%;"
                 onmouseenter="window.AppCharts.showTooltip(event, 'Femmine straniere ${p.fascia_eta}', '${p.femmine} residenti')" onmouseleave="window.AppCharts.hideTooltip()"></div>
          </div>
        </div>
      `;
    }

    html += `
      </div>
      <div class="pyramid-legend">
        <div class="legend-item"><span class="legend-color" style="background: var(--color-male);"></span> Maschi stranieri (13)</div>
        <div class="legend-item"><span class="legend-color" style="background: var(--color-female);"></span> Femmine straniere (50)</div>
      </div>
    `;

    container.innerHTML = html;
  }

  return {
    init
  };
})();
