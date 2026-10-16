(() => {
  'use strict';
  const D = window.ONMarket;
  const terms = [
    {name: 'Spot', color: '#315f49', dash: '', note: 'Interruptible'},
    {name: 'On-demand', color: '#6389ae', dash: '8 5', note: 'No commitment'},
    {name: 'Reserved', color: '#ac8748', dash: '2 5', note: '1 year · No upfront'},
  ];
  const cache = new Map(), hidden = new Set();
  let timer = null, active = null, generation = 0;
  const number = value => typeof value === 'number' && Number.isFinite(value);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[char]));
  const money = value => number(value) ? '$' + value.toFixed(4) : '—';
  const timeLabel = value => value ? new Date(value).toLocaleString('en-GB', {day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'UTC'}) + ' UTC' : 'Not observed';
  function queryFor(S) {
    const query = new URLSearchParams({gpuModel: D.modelOf(S.model).canonical, gpuCount: String(S.count), region: S.region === 'All regions' ? 'all' : D.regionCode(S.region), period: S.period || '1M'});
    if (/PCIe|SXM|NVL72/i.test(S.model)) query.set('formFactor', /PCIe|SXM|NVL72/i.exec(S.model)[0]);
    if (['A100 80GB', 'A100 PCIe'].includes(S.model)) query.set('gpuMemoryGb', '80');
    return query.toString();
  }
  const bucketLabel = minutes => !minutes ? '5-minute' : minutes < 60 ? minutes + '-minute' : minutes < 1440 ? minutes / 60 + '-hour' : 'Daily';
  function referenceText(S, meta) {
    const ref = meta?.reference;
    if (!ref) return 'No single offering matches this configuration yet.';
    const parts = [ref.gpuCount + ' × ' + S.model, number(ref.gpuMemoryGb) ? ref.gpuMemoryGb + ' GB' : null, ref.formFactor, ref.area ? D.regionLabel(ref.area) : 'Other region'].filter(Boolean);
    return `Reference offering: ${parts.join(' · ')} (chosen from ${meta.matchingOfferings} matching ${meta.matchingOfferings === 1 ? 'offering' : 'offerings'}: live Spot first, then most complete, then lowest On-demand).`;
  }
  function summary(S) {return cache.get(queryFor(S)) || null;}
  function header(S, data) {
    const selected = data.latest?.[S.term] || data.latest?.Spot;
    const label = document.getElementById('marketPriceLabel');
    if (label) label.textContent = (terms.some(t => t.name === S.term) ? S.term.toUpperCase() : 'SPOT') + ' / GPU-HR';
    const price = document.getElementById('marketPrice'); if (price) price.textContent = money(selected?.value);
    const caption = document.getElementById('historyPrimaryCaption'); if (caption) caption.textContent = 'Same-offering reference';
    const count = document.getElementById('marketRecords'); if (count) count.textContent = String((data.points || []).filter(point => terms.some(term => number(point.values[term.name]?.value))).length);
    const change = document.getElementById('marketChange');
    if (change) {
      const values = (data.points || []).map(point => point.values[S.term]?.value).filter(number);
      const delta = values.length > 1 && values[0] > 0 ? (values.at(-1) / values[0] - 1) * 100 : null;
      change.textContent = delta === null ? '—' : (delta >= 0 ? '+' : '') + delta.toFixed(2) + '%';
      change.className = delta === null ? '' : delta >= 0 ? 'positive' : 'negative';
    }
  }
  function markup(S, data) {
    const points = data.points || [];
    const values = points.flatMap(p => terms.filter(term => !hidden.has(term.name)).map(term => p.values[term.name]?.value)).filter(number);
    const cards = terms.map(term => {
      const entry = data.latest?.[term.name];
      return `<button class="capacity-rate ${hidden.has(term.name) ? 'muted' : ''}" data-capacity-term="${term.name}" aria-pressed="${!hidden.has(term.name)}" style="--rate-color:${term.color}"><span><i style="border-top-style:${term.name === 'Spot' ? 'solid' : term.name === 'Reserved' ? 'dotted' : 'dashed'}"></i>${term.name}</span><strong>${money(entry?.value)}</strong><small>${term.note}</small><small>${number(entry?.value) ? timeLabel(entry.observedAt) : 'No matching quote'}</small></button>`;
    }).join('');
    const controls = `<div class="capacity-heading"><div><span class="eyebrow">GPU PRICE COMPARISON</span><h3>Three ways to rent compute</h3></div><span class="capacity-live ${data.meta?.sourceIssue ? 'partial' : ''}"><i></i>${data.meta?.syncing ? 'Updating' : data.meta?.sourceIssue ? 'Partial coverage' : 'Auto refresh · 30s'}</span></div><div class="capacity-rates" aria-label="Price type legend">${cards}</div><div class="history-controls"><div class="periods">${['1D','1W','1M','3M'].map(period => `<button class="period ${S.period === period ? 'active' : ''}" data-act="period" data-value="${period}">${period}</button>`).join('')}</div><span class="capacity-unit">USD / GPU-hour · One offering, three prices</span></div>`;
    if (!values.length) return controls + `<div class="aws-history-empty"><h3>${data.meta?.syncing ? 'Collecting price observations…' : 'No prices for this configuration yet'}</h3><p>Missing prices remain empty. Try another model, region or GPU count.</p><button class="btn secondary small" data-capacity-example>Compare A10G · 1 GPU</button></div>`;
    const w = Math.max(360, Math.min(1000, (document.getElementById('capacityHistory')?.clientWidth || 900) - 40));
    const h = 320, left = 28, right = 92, top = 24, bottom = 43;
    const low = Math.min(...values), high = Math.max(...values), pad = Math.max((high - low) * .16, high * .05, .03);
    const min = Math.max(0, low - pad), max = high + pad;
    const from = Date.parse(points[0].time), to = Date.parse(points.at(-1).time);
    const x = value => from === to ? (left + w - right) / 2 : left + (value - from) / (to - from) * (w - left - right);
    const y = value => top + (max - value) / (max - min) * (h - top - bottom);
    const grid = Array.from({length: 4}, (_, index) => {const value = min + (max - min) * index / 3, py = y(value);return `<line x1="${left}" x2="${w - right}" y1="${py}" y2="${py}" stroke="#e3ebe5" stroke-dasharray="4 7"/><text x="${w - right + 14}" y="${py + 4}" class="history-axis">$${value.toFixed(2)}</text>`;}).join('');
    // Points arrive as consecutive buckets; an empty bucket or a gap breaks the line instead of joining it.
    const gap = 1.5 * (data.meta?.bucketMinutes || 5) * 60000;
    const paths = terms.filter(term => !hidden.has(term.name)).map(term => {
      const runs = [];
      for (const point of points) {
        const value = point.values[term.name]?.value, time = Date.parse(point.time), run = runs.at(-1);
        if (!number(value)) {if (run) run.done = true; continue;}
        if (!run || run.done || time - run.at(-1).time > gap) runs.push(Object.assign([], {done: false}));
        runs.at(-1).push({time, value});
      }
      const d = runs.map(run => run.map((p, i) => (i ? 'L' : 'M') + x(p.time).toFixed(2) + ',' + y(p.value).toFixed(2)).join(' ')).join(' ');
      const dots = runs.flatMap(run => run.length === 1 ? run : [run[0], run.at(-1)]), last = runs.at(-1)?.at(-1);
      return `<path data-capacity-line="${term.name}" d="${d}" fill="none" stroke="${term.color}" stroke-width="2.5" stroke-dasharray="${term.dash}" stroke-linejoin="round"/>${dots.map(p => `<circle cx="${x(p.time)}" cy="${y(p.value)}" r="3" fill="${term.color}"/>`).join('')}${last ? `<text x="${x(last.time) < left + 90 ? x(last.time) + 5 : x(last.time) - 5}" y="${y(last.value) - 10}" text-anchor="${x(last.time) < left + 90 ? 'start' : 'end'}" fill="${term.color}" class="history-end-name">${term.name}</text>` : ''}`;
    }).join('');
    const tickCount = w < 600 ? 3 : 4;
    const ticks = from === to ? [from] : Array.from({length: tickCount}, (_, i) => from + (to - from) * i / (tickCount - 1));
    const axis = ticks.map((time, i) => `<text class="history-axis" x="${x(time)}" y="${h - 12}" text-anchor="${ticks.length === 1 ? 'middle' : i === 0 ? 'start' : i === ticks.length - 1 ? 'end' : 'middle'}">${esc(new Date(time).toLocaleString('en-GB', {day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'UTC'}))}</text>`).join('');
    const rows = points.filter(point => terms.some(term => number(point.values[term.name]?.value))).slice(-12).reverse().map(point => `<tr><td>${timeLabel(point.time)}</td>${terms.map(term => `<td>${money(point.values[term.name]?.value)}</td>`).join('')}</tr>`).join('');
    return controls + `<div class="history-plot capacity-plot"><svg data-plot-width="${w}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(S.model)} Spot, On-demand and Reserved price comparison">${grid}${paths}${axis}<line class="capacity-crosshair" y1="${top}" y2="${h - bottom}" stroke="#90a493" stroke-dasharray="3 4" visibility="hidden"/><rect class="capacity-hit" x="${left}" y="${top}" width="${w - left - right}" height="${h - top - bottom}" fill="transparent" tabindex="0" role="slider" aria-label="Price observation time" aria-valuemin="0" aria-valuemax="${points.length - 1}" aria-valuenow="${points.length - 1}"/></svg><div class="history-tooltip capacity-tooltip" hidden></div></div><div class="capacity-footnote"><span>${bucketLabel(data.meta?.bucketMinutes)} buckets · UTC · No inferred inventory</span><span>Updated ${timeLabel(data.meta?.lastSync)}</span></div><div class="capacity-method">${esc(referenceText(S, data.meta))} All three prices come from this one offering: the same GPU configuration from the same supplier in the same region. Reserved: 12 months, no upfront. Quotes do not confirm capacity.${points.length < 4 ? ' History is building from real observations.' : ''}</div>${!number(data.latest?.Reserved?.value) ? '<div class="capacity-coverage">This offering has no 1-year reserved rate. <button class="text-link" data-capacity-example>View a complete A10G comparison</button></div>' : ''}<details class="capacity-data"><summary>View recorded prices</summary><div class="table-scroll"><table><thead><tr><th>TIME · UTC</th><th>SPOT</th><th>ON-DEMAND</th><th>RESERVED · 1 YEAR</th></tr></thead><tbody>${rows}</tbody></table></div></details>`;
  }
  function render() {return '<section id="capacityHistory" class="capacity-history"><div class="aws-history-empty"><h3>Loading Spot, On-demand and Reserved prices…</h3></div></section>';}
  function bind(S) {
    if (timer) clearTimeout(timer);
    const target = document.getElementById('capacityHistory'); if (!target) {generation++; active = null; return;}
    const snapshot = {model: S.model, region: S.region, count: S.count, period: S.period, term: S.term};
    const key = queryFor(snapshot), token = ++generation;
    active = {snapshot}; let data = cache.get(key);
    function bindPlot() {
      const svg = target.querySelector('svg'), hit = target.querySelector('.capacity-hit'), tip = target.querySelector('.capacity-tooltip');
      if (!svg || !hit || !data?.points?.length) return;
      const points = data.points, from = Date.parse(points[0].time), to = Date.parse(points.at(-1).time);
      const plotWidth = Number(svg.dataset.plotWidth), innerWidth = plotWidth - 120;
      let selected = points.length - 1;
      function show(index) {
        selected = Math.max(0, Math.min(points.length - 1, index)); const point = points[selected];
        const px = from === to ? (plotWidth - 64) / 2 : 28 + (Date.parse(point.time) - from) / (to - from) * innerWidth;
        const cross = svg.querySelector('.capacity-crosshair'); cross.setAttribute('x1', px); cross.setAttribute('x2', px); cross.setAttribute('visibility', 'visible');
        tip.innerHTML = `<strong>${timeLabel(point.time)}</strong>${terms.map(term => `<div class="capacity-tip-row"><span>${term.name}</span><b>${money(point.values[term.name]?.value)}</b></div>`).join('')}<small>USD / GPU-hour · — means not observed</small>`;
        tip.hidden = false; const width = svg.getBoundingClientRect().width;
        tip.style.left = Math.max(4, Math.min(width - 250, px / plotWidth * width + 12)) + 'px'; tip.style.top = '12px';
        hit.setAttribute('aria-valuenow', String(selected));
        hit.setAttribute('aria-valuetext', timeLabel(point.time) + '; ' + terms.map(term => term.name + ' ' + money(point.values[term.name]?.value)).join('; '));
      }
      hit.addEventListener('pointermove', event => {
        const rect = svg.getBoundingClientRect(), x = (event.clientX - rect.left) / rect.width * plotWidth;
        const time = from + Math.max(0, Math.min(1, (x - 28) / innerWidth)) * (to - from);
        let best = 0; for (let i = 1; i < points.length; i++) if (Math.abs(Date.parse(points[i].time) - time) < Math.abs(Date.parse(points[best].time) - time)) best = i;
        show(best);
      });
      const leave = () => {tip.hidden = true; svg.querySelector('.capacity-crosshair').setAttribute('visibility', 'hidden');};
      hit.addEventListener('pointerleave', leave); hit.addEventListener('blur', leave); hit.addEventListener('focus', () => show(selected));
      hit.addEventListener('keydown', event => {if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {event.preventDefault(); show(event.key === 'Home' ? 0 : event.key === 'End' ? points.length - 1 : selected + (event.key === 'ArrowRight' ? 1 : -1));}});
    }
    function repaint(value) {
      data = value; if (!target.isConnected || generation !== token || target.contains(document.activeElement)) return;
      const open = target.querySelector('details')?.open;
      target.innerHTML = markup(snapshot, value); if (open) target.querySelector('details')?.setAttribute('open', '');
      header(snapshot, value); bindPlot();
    }
    target.onclick = event => {
      const toggle = event.target.closest('[data-capacity-term]');
      if (toggle && data) {const name = toggle.dataset.capacityTerm; if (hidden.has(name)) hidden.delete(name); else if (hidden.size < 2) hidden.add(name); toggle.blur(); repaint(data);}
      if (event.target.closest('[data-capacity-example]')) {Object.assign(window.ONPreview.state, {model: 'A10G', count: 1, region: 'All regions'}); window.ONPreview.navigate('market');}
    };
    async function refresh() {
      if (generation !== token || !target.isConnected) return;
      if (!document.hidden) {
        try {
          const response = await fetch('/api/pricing/capacity-history?' + key, {signal: AbortSignal.timeout(15000), cache: 'no-store'});
          if (!response.ok) throw Error('Price history unavailable');
          const value = await response.json(); cache.set(key, value); repaint(value);
        } catch {if (!data && target.isConnected) target.innerHTML = '<div class="aws-history-empty"><h3>Price service is temporarily unavailable</h3><p>The chart will retry automatically. Existing observations are retained.</p></div>';}
      }
      if (generation === token && target.isConnected) timer = setTimeout(refresh, data?.meta?.syncing ? 5000 : 30000);
    }
    if (data) repaint(data); refresh();
  }
  window.OpenNEXTHistory = {render, bind, summary, refresh: () => {if (active) bind(active.snapshot);}};
})();
