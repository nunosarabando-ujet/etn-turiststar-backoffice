/* ETN Turistar · Backoffice de Servicio — agent-facing console, designed to be iframed in the UJET Agent Desktop.
 * Vanilla JS, no build step. Context arrives by URL params, postMessage, or the demo-control panel. */
(function () {
  'use strict';

  const STORE_KEY = 'etn-backoffice-state-v2';
  const LANG_KEY = 'etn-backoffice-lang';
  const $ = (s, el = document) => el.querySelector(s);
  const params = new URLSearchParams(location.search);

  // ---------- state ----------
  function load() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) { const s = JSON.parse(raw); if (s && s.version === 2) return s; }
    } catch (e) { /* storage blocked (e.g. third-party iframe) → in-memory only */ }
    return window.ETN_SEED();
  }
  let state = load();
  let lang = params.get('lang') || 'es';
  try { if (!params.get('lang')) lang = localStorage.getItem(LANG_KEY) || 'es'; } catch (e) {}
  if (!['es', 'en'].includes(lang)) lang = 'es';
  function save() { try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) {} }

  // ---------- helpers ----------
  const t = (k) => (window.ETN_I18N[lang] && window.ETN_I18N[lang][k]) || window.ETN_I18N.es[k] || k;
  const L = (x) => (x && typeof x === 'object' ? x[lang] || x.es : x == null ? '' : x);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const locale = () => (lang === 'es' ? 'es-MX' : 'en-US');
  const money = (n) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n) + ' MXN';
  const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
  const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;
  const num = (n) => new Intl.NumberFormat(locale()).format(n);
  const parseDate = (d) => { const [y, m, dd] = d.split('-').map(Number); return new Date(y, m - 1, dd); };
  const fmtDate = (d) => new Intl.DateTimeFormat(locale(), { weekday: 'short', day: 'numeric', month: 'short' }).format(parseDate(d));
  const isToday = (ts) => new Date(ts).toDateString() === new Date().toDateString();
  const fmtTs = (ts) => {
    const d = new Date(ts);
    const time = d.toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit', hour12: false });
    return isToday(ts) ? time : `${new Intl.DateTimeFormat(locale(), { day: 'numeric', month: 'short' }).format(d)} ${time}`;
  };
  const dayOffset = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const TODAY = () => dayOffset(0), TOMORROW = () => dayOffset(1);
  const depTime = (date, time) => { const d = parseDate(date); const [h, m] = time.split(':').map(Number); d.setHours(h, m); return d.getTime(); };
  const normPhone = (p) => String(p || '').replace(/\D/g, '');

  const cust = (id) => state.customers.find((c) => c.id === id);
  const ticket = (f) => state.tickets.find((x) => x.folio === f);
  const sched = (id) => state.schedules.find((s) => s.id === id);
  const findSched = (o, d, date, time) => state.schedules.find((s) => s.origin === o && s.destination === d && s.date === date && s.time === time);
  const findCustomer = ({ ani, email, account }) => state.customers.find((c) =>
    (ani && normPhone(c.phone) === normPhone(ani)) || (email && c.email.toLowerCase() === String(email).toLowerCase()) || (account && c.doters === account));
  const chLabel = (c) => t('ch_' + c);
  const levelBadge = (lv) => (lv ? `<span class="badge lvl-${lv.toLowerCase()}">Doters ${esc(lv)}</span>` : '');
  const initials = (n) => (n || '?').split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();

  const ICON = {
    phone: '<svg viewBox="0 0 24 24"><path d="M5 3h4l2 5-3 2a11 11 0 0 0 6 6l2-3 5 2v4a2 2 0 0 1-2 2A17 17 0 0 1 3 5a2 2 0 0 1 2-2z"/></svg>',
    chat: '<svg viewBox="0 0 24 24"><path d="M4 4h16v12H8l-4 4z"/></svg>',
    mobile: '<svg viewBox="0 0 24 24"><path d="M7 2h10v20H7zM11 18h2"/></svg>',
    wa: '<svg viewBox="0 0 24 24"><path d="M4 20l1.3-4A8 8 0 1 1 8 19z"/></svg>',
    store: '<svg viewBox="0 0 24 24"><path d="M3 9l2-5h14l2 5M4 9v11h16V9M3 9h18"/></svg>',
    bus: '<svg viewBox="0 0 24 24"><path d="M5 17V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v12zM5 11h14M5 17v3M19 17v3M8 14h.01M16 14h.01"/></svg>',
    bot: '<svg viewBox="0 0 24 24"><path d="M5 9h14v10H5zM12 5v4M9 13h.01M15 13h.01M9 16h6M3 13v2M21 13v2"/></svg>',
    headset: '<svg viewBox="0 0 24 24"><path d="M4 14v-2a8 8 0 0 1 16 0v2M4 14h3v6H4zM17 14h3v6h-3zM20 20a3 3 0 0 1-3 3h-4"/></svg>',
    play: '<svg viewBox="0 0 24 24"><path d="M7 4l13 8-13 8z"/></svg>',
    check: '<svg viewBox="0 0 24 24"><path d="M5 12l5 5 9-10"/></svg>',
  };
  const chIcon = (c) => ({ voice: ICON.phone, web: ICON.chat, mobile: ICON.mobile, whatsapp: ICON.wa, app: ICON.mobile, counter: ICON.store }[c] || ICON.chat);

  // ---------- domain actions ----------
  const AGENT = () => t('agent');
  function addMsgs(sesId, msgs) {
    const s = state.interactions.find((i) => i.id === sesId);
    if (s) s.transcript.push(...msgs.map(([from, text]) => ({ from, text, tool: from === 'tool' })));
  }
  function startSession({ id, channel, identity, customerId, intents }) {
    if (state.interactions.find((i) => i.id === id)) return;
    state.interactions.unshift({ id, channel, identity, customerId, startedAt: Date.now(), duration: 0, language: 'es-MX', intents: intents || [], outcome: 'active', csat: null, summary: { es: '', en: '' }, transcript: [] });
  }
  function endSession(id, outcome, summary) {
    const s = state.interactions.find((i) => i.id === id); if (!s) return;
    s.outcome = outcome; s.summary = summary; s.duration = Math.max(45, Math.round((Date.now() - s.startedAt) / 1000));
  }
  function addIntent(sesId, intent) { const s = state.interactions.find((i) => i.id === sesId); if (s && !s.intents.includes(intent)) s.intents.push(intent); }

  function modifyTicket(folio, newSchedId, by, ref) {
    const tk = ticket(folio), ns = sched(newSchedId);
    if (!tk || !ns) return;
    const old = findSched(tk.origin, tk.destination, tk.date, tk.time);
    if (old) old.sold = Math.max(0, old.sold - 1);
    ns.sold = Math.min(ns.capacity, ns.sold + 1);
    const prev = tk.time;
    const free = depTime(tk.date, tk.time) - Date.now() >= 3 * 3600 * 1000;
    tk.date = ns.date; tk.time = ns.time; tk.bus = ns.bus; tk.status = 'modified';
    tk.modRef = ref || `MOD-${folio.replace('ETN-', '')}-${new Date().getFullYear()}`;
    tk.history.push({ ts: Date.now(), text: { es: `Itinerario modificado ${prev} → ${ns.time} · asiento ${tk.seat} · ${free ? 'sin costo (≥3 h)' : 'con cargo'} · ${tk.modRef} · por ${by}`, en: `Itinerary changed ${prev} → ${ns.time} · seat ${tk.seat} · ${free ? 'free of charge (≥3h)' : 'fee applied'} · ${tk.modRef} · by ${by}` } });
    return tk.modRef;
  }
  function openTicket(folio, by) {
    const tk = ticket(folio); if (!tk) return;
    tk.status = 'open'; tk.openUntil = dayOffset(182);
    tk.history.push({ ts: Date.now(), text: { es: `Convertido a Boleto Abierto (6 meses) por ${by}`, en: `Converted to Open Ticket (6 months) by ${by}` } });
  }
  function issueCfdi(folio, rfc, by, channel, forcedId) {
    const tk = ticket(folio); if (!tk) return;
    const id = forcedId || `CFDI-ETN-${new Date().getFullYear()}-${8842 + state.invoices.length}`;
    if (state.invoices.find((i) => i.id === id)) return id;
    const hex = () => Math.random().toString(16).slice(2, 10).toUpperCase().padEnd(8, '0');
    state.invoices.unshift({ id, folio, customerId: tk.customerId, rfc, uso: 'G03', amount: tk.fare, issuedAt: Date.now(), channel, by, uuid: `${hex()}-${hex().slice(0, 4)}-4${hex().slice(0, 3)}-9${hex().slice(0, 3)}-${hex()}${hex().slice(0, 4)}`, status: 'stamped' });
    tk.history.push({ ts: Date.now(), text: { es: `CFDI 4.0 ${id} timbrado (RFC ${rfc}) por ${by}`, en: `CFDI 4.0 ${id} stamped (RFC ${rfc}) by ${by}` } });
    return id;
  }
  function createEscalation(e) {
    const x = Object.assign({ id: `ESC-${7100 + state.escalations.length + 1}`, createdAt: Date.now(), status: 'active' }, e);
    state.escalations.unshift(x);
    return x;
  }
  function completeSale(id) {
    const e = state.escalations.find((x) => x.id === id); if (!e || e.saleFolio) return;
    const c = cust(e.customerId), s = sched(e.scheduleId), cfg = window.ETN_DEMO.sale;
    const folio = 'ETN-790233';
    if (!ticket(folio)) {
      state.tickets.unshift({ folio, customerId: c.id, origin: s.origin, destination: s.destination, date: s.date, time: s.time, seat: cfg.seat, fare: s.fareWeb, fareType: 'web', channel: 'voice', status: 'confirmed', bus: s.bus,
        history: [{ ts: Date.now(), text: { es: `Venta asistida por ${AGENT()} (transferencia de Turi, ${id}) · tarifa en línea respetada · pase enviado a ${c.email}`, en: `Assisted sale by ${AGENT()} (Turi handover, ${id}) · online fare honored · pass sent to ${c.email}` } }] });
      s.sold = Math.min(s.capacity, s.sold + 1);
      c.points += Math.round(s.fareWeb * 0.1);
    }
    e.saleFolio = folio; e.status = 'resolved'; e.resolvedAt = Date.now();
    return folio;
  }
  function resolveEscalation(id) {
    const e = state.escalations.find((x) => x.id === id); if (!e) return;
    e.status = 'resolved'; e.resolvedAt = Date.now();
    const lf = e.caseId && state.lostFound.find((x) => x.id === e.caseId);
    if (lf && (lf.status === 'reported' || lf.status === 'searching')) {
      lf.status = 'found';
      lf.notes = { es: 'Operador confirmó la mochila en el asiento 02A al llegar a Terminal Monterrey. En resguardo en Sala VIP.', en: 'Driver confirmed the bag at seat 02A on arrival at Monterrey terminal. Held at the VIP Lounge.' };
    }
  }
  const LF_FLOW = ['reported', 'searching', 'found', 'ready', 'delivered'];
  function advanceLost(id) { const lf = state.lostFound.find((x) => x.id === id); if (!lf) return; const i = LF_FLOW.indexOf(lf.status); if (i < LF_FLOW.length - 1) lf.status = LF_FLOW[i + 1]; }

  // ---------- interaction context (what UJET hands to this iframe) ----------
  function setContext(ctx) {
    state.context = Object.assign({ startedAt: Date.now() }, ctx);
    save();
    if (location.hash !== '#/interaction') location.hash = '#/interaction'; else render();
  }
  function contextFromPayload(src) {
    let payload = src.payload;
    if (typeof payload === 'string') {
      try { payload = JSON.parse(payload); } catch (e) { try { payload = JSON.parse(atob(payload)); } catch (e2) { payload = null; } }
    }
    payload = payload || {};
    let ani = String(src.ani || payload.ani || '').trim() || null;
    if (ani && /^\d+$/.test(ani)) ani = '+' + ani; // '+' arrives as a space when not URL-encoded
    const email = src.email || payload.email;
    const sessionId = payload.gecx_session_id;
    // link to a demo escalation if one matches (same session, or same caller still active)
    const linked = state.escalations.find((e) => (sessionId && e.sessionId === sessionId) || (e.status === 'active' && ((ani && normPhone(e.payload.ani) === normPhone(ani)) || (email && e.payload.email === email))));
    return { escalationId: linked ? linked.id : null, ani, email, folio: src.folio || payload.ticket_folio, channel: src.channel || (ani ? 'voice' : 'web'), payload: Object.keys(payload).length ? payload : null, source: src.source || 'url' };
  }
  function resolveContext(ctx) {
    const e = ctx.escalationId ? state.escalations.find((x) => x.id === ctx.escalationId) : null;
    const payload = ctx.payload || (e && e.payload) || {};
    const c = (e && cust(e.customerId)) || findCustomer({ ani: ctx.ani || payload.ani, email: ctx.email || payload.email, account: payload.account_id });
    const folio = ctx.folio || payload.ticket_folio || (e && e.folio);
    const caseId = (e && e.caseId) || payload.case_id;
    return {
      e, payload, c,
      tk: folio ? ticket(folio) : null,
      s: e && e.scheduleId ? sched(e.scheduleId) : null,
      lf: caseId ? state.lostFound.find((l) => l.id === caseId) : null,
      ses: state.interactions.find((i) => i.id === ((e && e.sessionId) || payload.gecx_session_id)),
      reason: payload.reason_for_escalation || (e && e.reason) || '',
      channel: (e && e.channel) || ctx.channel || 'voice',
    };
  }

  // ---------- demo script (mirrors the GECX demo instructions) ----------
  const ALE = { ani: '+525512345678', email: 'alejandro.morales@ejemplo.mx' };
  const saleSched = () => { const c = window.ETN_DEMO.sale; return findSched(c.origin, c.destination, dayOffset(c.dayOffset), c.time); };
  let schedFilter = { day: 1, route: 'CDMX Norte|Guadalajara' };
  const STEPS = [
    { id: 'a2_start', act: 'act2', label: { es: 'Alejandro abre Web Chat · Turi lo reconoce por email', en: 'Alejandro opens Web Chat · Turi recognizes him by email' }, run() {
      startSession({ id: 'SES-25001', channel: 'web', identity: { type: 'email', value: ALE.email }, customerId: 'C-1001' });
      addMsgs('SES-25001', [['system', `Web SDK → session params: email="${ALE.email}"`], ['tool', `lookup_customer(email="${ALE.email}") → C-1001 · DOT-1001 Oro · ETN-784512`], ['turi', '¡Hola Alejandro! Soy Turi, de ETN Turistar. Veo tu viaje de mañana a Guadalajara a las 07:30. ¿En qué te ayudo?']]);
      return 'customers/C-1001';
    } },
    { id: 'a2_sched', act: 'act2', label: { es: 'Consulta horarios CDMX → GDL mañana por la tarde', en: 'Asks for CDMX → GDL departures tomorrow afternoon' }, run() {
      addIntent('SES-25001', 'schedules');
      const s = ['16:30', '22:00', '23:30'].map((h) => findSched('CDMX Norte', 'Guadalajara', TOMORROW(), h));
      addMsgs('SES-25001', [['user', '¿Qué horarios tienes de Ciudad de México a Guadalajara mañana por la tarde?'], ['tool', `search_schedules(origin="CDMX Norte", destination="Guadalajara", date="${TOMORROW()}", window="tarde") → ${s.map((x) => `${x.time} (${x.capacity - x.sold} disp.)`).join(', ')}`], ['turi', 'Tengo salidas en autobús de doble piso Marco Polo a las 16:30, 22:00 y 23:30. Comprando en línea tu tarifa es de $1,215 MXN (10% de descuento).']]);
      schedFilter = { day: 1, route: 'CDMX Norte|Guadalajara' };
      return 'schedules';
    } },
    { id: 'a2_modify', act: 'act2', label: { es: 'Modifica ETN-784512: 07:30 → 16:30, asiento 12A (sin costo)', en: 'Changes ETN-784512: 07:30 → 16:30, seat 12A (free)' }, run() {
      addIntent('SES-25001', 'modify');
      const ns = findSched('CDMX Norte', 'Guadalajara', TOMORROW(), '16:30');
      addMsgs('SES-25001', [['user', 'Cámbiame mi boleto ETN-784512 a las 16:30, mismo asiento 12A'], ['tool', 'route → sub-agent "modificaciones" (silent internal routing)'], ['tool', `modify_itinerary(folio="ETN-784512", new_departure="${TOMORROW()} 16:30", seat="12A") → MOD-784512-2026 · fee=0 (≥3h)`], ['turi', 'Listo, Alejandro. Tu boleto quedó para mañana a las 16:30, asiento 12A, sin costo. Tu confirmación es MOD-784512-2026.']]);
      modifyTicket('ETN-784512', ns.id, 'Turi', 'MOD-784512-2026');
      return 'tickets/ETN-784512';
    } },
    { id: 'a2_cfdi', act: 'act2', label: { es: 'Genera CFDI 4.0 con RFC MORA850314AB1 · cierre contenido', en: 'Generates CFDI 4.0 with RFC MORA850314AB1 · contained close' }, run() {
      addIntent('SES-25001', 'cfdi');
      addMsgs('SES-25001', [['user', 'Genérame mi factura CFDI con RFC MORA850314AB1'], ['tool', 'generate_cfdi(folio="ETN-784512", rfc="MORA850314AB1", uso="G03", email=<session.email>) → CFDI-ETN-2026-8841'], ['turi', `Tu factura CFDI-ETN-2026-8841 ya fue enviada a ${ALE.email}. ¡Buen viaje!`]]);
      const id = issueCfdi('ETN-784512', 'MORA850314AB1', 'Turi', 'web', 'CFDI-ETN-2026-8841');
      endSession('SES-25001', 'contained', { es: 'Tres intenciones resueltas sin asesor: horarios, modificación gratuita a las 16:30 (MOD-784512-2026) y CFDI-ETN-2026-8841.', en: 'Three intents resolved with no agent: schedules, free change to 16:30 (MOD-784512-2026) and CFDI-ETN-2026-8841.' });
      setTimeout(() => showCfdi(id), 60);
      return 'invoices';
    } },
    { id: 'a3a_call', act: 'act3a', label: { es: 'Alejandro llama (ANI) · consulta su regreso GDL → CDMX 07:30', en: 'Alejandro calls (ANI) · asks about his GDL → CDMX 07:30 return' }, run() {
      const s = saleSched();
      state.context = null;
      startSession({ id: 'SES-25002', channel: 'voice', identity: { type: 'ani', value: ALE.ani }, customerId: 'C-1001', intents: ['schedules'] });
      addMsgs('SES-25002', [['system', `UJET IVR → GECX Turn 0: ani="${ALE.ani}"`], ['tool', `lookup_customer(ani="${ALE.ani}") → C-1001 · Alejandro Morales · DOT-1001 Oro`], ['turi', 'Hola Alejandro, soy Turi de ETN Turistar. ¿En qué te puedo ayudar?'], ['user', `Quiero mi regreso de ${s.origin} a la Ciudad de México, temprano`], ['tool', `search_schedules(origin="${s.origin}", destination="${s.destination}", date="${s.date}", window="mañana") → ${s.time} (${s.capacity - s.sold} disp.)`], ['turi', `Hay lugares en la corrida de las ${s.time} en doble piso, y tu asiento 12A está libre. Son ${money(s.fareWeb)} en línea o ${money(s.fareStd)} tarifa estándar.`]]);
      return 'interaction';
    } },
    { id: 'a3a_escalate', act: 'act3a', label: { es: 'Pide comprar con un asesor → TELEPHONY_PAYLOAD → screen-pop', en: 'Asks to buy with an agent → TELEPHONY_PAYLOAD → screen-pop' }, run() {
      addIntent('SES-25002', 'buy');
      const s = saleSched();
      addMsgs('SES-25002', [['user', 'No tengo la app a la mano, ¿me puedes comunicar con alguien para comprar este boleto rápido?'], ['tool', 'set_session_params(TELEPHONY_PAYLOAD={ani, customer_name, account_id, selected_schedule_summary, conversation_summary, reason_for_escalation:"assisted_purchase"})'], ['turi', `Claro que sí. Te comunico con un asesor que ya tiene en pantalla la corrida de las ${s.time} para completar tu compra.`], ['tool', 'end_session(transfer → UJET queue "Ventas")']]);
      endSession('SES-25002', 'escalated', { es: `Alejandro (Doters Oro) consultó su regreso ${s.origin} → ${s.destination} a las ${s.time} y pidió comprar con un asesor. Corrida precargada, asiento 12A libre.`, en: `Alejandro (Doters Gold) asked about his ${s.origin} → ${s.destination} ${s.time} return and asked to buy with an agent. Departure preloaded, seat 12A free.` });
      const e = createEscalation({ channel: 'voice', reason: 'assisted_purchase', queue: 'Ventas', sessionId: 'SES-25002', customerId: 'C-1001', scheduleId: s.id,
        opening: { es: `¡Hola Alejandro! Veo en pantalla que deseas adquirir el boleto de las ${s.time} de ${s.origin} a ${s.destination}, asiento 12A; con gusto procesamos tu compra ahora mismo.`, en: `Hi Alejandro! I can see you want the ${s.time} ticket from ${s.origin} to ${s.destination}, seat 12A; let's complete your purchase right now.` },
        payload: { ani: ALE.ani, customer_name: 'Alejandro Morales', account_id: 'DOT-1001', doters_level: 'Oro', ticket_folio: null, selected_schedule_summary: `${s.origin} → ${s.destination} · ${s.date} ${s.time} · ${s.bus} · ${money(s.fareWeb)} en línea / ${money(s.fareStd)} estándar · asiento 12A disponible`, conversation_summary: `Alejandro consultó su regreso ${s.origin} → ${s.destination} y eligió la salida de las ${s.time}. No tiene la app a la mano; solicita comprar con un asesor.`, reason_for_escalation: 'assisted_purchase', language: 'es-MX', gecx_session_id: 'SES-25002' } });
      state.context = { escalationId: e.id, ani: ALE.ani, channel: 'voice', source: 'ujet', startedAt: Date.now() };
      return 'interaction';
    } },
    { id: 'a3a_agent', act: 'act3a', label: { es: 'Asesor completa la compra (ETN-790233)', en: 'Agent completes the purchase (ETN-790233)' }, run() {
      const e = state.escalations.find((x) => x.sessionId === 'SES-25002'); if (e) completeSale(e.id);
      return 'interaction';
    } },
    { id: 'a3b_call', act: 'act3b', label: { es: 'Carlos Mendoza llama (ANI) · olvidó su laptop en el asiento 02A', en: 'Carlos Mendoza calls (ANI) · left his laptop at seat 02A' }, run() {
      state.context = null;
      startSession({ id: 'SES-25003', channel: 'voice', identity: { type: 'ani', value: '+528123456789' }, customerId: 'C-4004', intents: ['lost_item'] });
      addMsgs('SES-25003', [['system', 'UJET IVR → GECX Turn 0: ani="+528123456789"'], ['tool', 'lookup_customer(ani="+528123456789") → C-4004 · Carlos Mendoza · DOT-4004 Oro'], ['turi', 'Hola Carlos, soy Turi de ETN Turistar. ¿En qué te ayudo?'], ['user', 'Acabo de bajar del autobús de Ciudad de México a Monterrey y dejé mi mochila con la laptop en el asiento 02A'], ['tool', 'get_ticket(customer="C-4004", date=today) → ETN-664310 · CDMX Norte → Monterrey 09:00 · asiento 02A'], ['turi', 'Lo siento mucho, Carlos. Confirmo tu boleto ETN-664310 de las 09:00, asiento 02A. Voy a registrar el reporte y comunicarte con un especialista de inmediato.']]);
      return 'interaction';
    } },
    { id: 'a3b_escalate', act: 'act3b', label: { es: 'Crea reporte OBJ-2026-0412 → transferencia VIP → screen-pop', en: 'Creates report OBJ-2026-0412 → VIP handover → screen-pop' }, run() {
      state.lostFound.unshift({ id: 'OBJ-2026-0412', customerId: 'C-4004', folio: 'ETN-664310', item: { es: 'Mochila negra con laptop', en: 'Black backpack with laptop' }, seat: '02A', route: 'CDMX Norte → Monterrey 09:00', status: 'reported', createdAt: Date.now(), channel: 'voice' });
      addMsgs('SES-25003', [['tool', 'create_lost_item_report(folio="ETN-664310", seat="02A", item="mochila con laptop") → OBJ-2026-0412'], ['tool', 'set_session_params(TELEPHONY_PAYLOAD={ticket_folio, customer_name, account_id, seat, doters_level, conversation_summary, reason_for_escalation:"lost_item_vip"})'], ['turi', 'Tu reporte es OBJ-2026-0412. Te transfiero con un especialista que ya tiene todos los datos de tu viaje; no tendrás que repetir nada.'], ['tool', 'end_session(transfer → UJET queue "VIP Doters Oro")']]);
      endSession('SES-25003', 'escalated', { es: 'Doters Oro reporta laptop olvidada en asiento 02A de ETN-664310 (CDMX → MTY 09:00). Reporte OBJ-2026-0412 creado; transferido a VIP con prioridad alta.', en: 'Doters Gold reports laptop left at seat 02A on ETN-664310 (CDMX → MTY 09:00). Report OBJ-2026-0412 created; handed to VIP with high priority.' });
      const e = createEscalation({ channel: 'voice', reason: 'lost_item_vip', queue: 'VIP Doters Oro', priority: 'high', sessionId: 'SES-25003', customerId: 'C-4004', folio: 'ETN-664310', caseId: 'OBJ-2026-0412',
        opening: { es: 'Carlos, ya tengo tu reporte OBJ-2026-0412 en pantalla: mochila con laptop en el asiento 02A del autobús de las 09:00. Estoy contactando al operador en Terminal Monterrey ahora mismo.', en: 'Carlos, I already have report OBJ-2026-0412 on screen: backpack with laptop at seat 02A on the 09:00 bus. I\'m contacting the driver at the Monterrey terminal right now.' },
        payload: { ani: '+528123456789', customer_name: 'Carlos Mendoza', account_id: 'DOT-4004', doters_level: 'Oro', ticket_folio: 'ETN-664310', selected_schedule_summary: `CDMX Norte → Monterrey · ${TODAY()} 09:00 · Marco Polo G8 DD · asiento 02A`, case_id: 'OBJ-2026-0412', conversation_summary: 'Pasajero Doters Oro acaba de descender en Monterrey y olvidó mochila con laptop en el asiento 02A. Boleto verificado. Reporte de objeto olvidado creado.', reason_for_escalation: 'lost_item_vip', language: 'es-MX', gecx_session_id: 'SES-25003' } });
      state.context = { escalationId: e.id, ani: '+528123456789', channel: 'voice', source: 'ujet', startedAt: Date.now() };
      return 'interaction';
    } },
    { id: 'a3b_agent', act: 'act3b', label: { es: 'Especialista VIP resuelve · objeto localizado en Monterrey', en: 'VIP specialist resolves · item located in Monterrey' }, run() {
      const e = state.escalations.find((x) => x.sessionId === 'SES-25003'); if (e) resolveEscalation(e.id);
      return 'interaction';
    } },
  ];
  function runStep(id) {
    const st = STEPS.find((s) => s.id === id);
    if (!st || state.demoDone[id]) return;
    closeModal();
    const idx = STEPS.indexOf(st);
    STEPS.slice(0, idx).filter((p) => p.act === st.act && !state.demoDone[p.id]).forEach((p) => { p.run(); state.demoDone[p.id] = Date.now(); });
    const route = st.run();
    state.demoDone[id] = Date.now();
    save();
    toast(L(st.label));
    if (route && location.hash !== '#/' + route) location.hash = '#/' + route; else render();
  }
  function runNext() { const n = STEPS.find((s) => !state.demoDone[s.id]); if (n) runStep(n.id); }

  // ---------- UI primitives ----------
  function toast(msg) {
    const el = document.createElement('div'); el.className = 'toast'; el.innerHTML = `${ICON.check}<span>${esc(msg)}</span>`;
    const box = $('#toasts'); box.appendChild(el); while (box.children.length > 3) box.firstChild.remove();
    setTimeout(() => el.classList.add('out'), 3000); setTimeout(() => el.remove(), 3500);
  }
  function modal(title, body) { $('#modal-title').textContent = title; $('#modal-body').innerHTML = body; $('#modal').classList.add('open'); }
  function closeModal() { $('#modal').classList.remove('open'); }
  const statusBadge = (s) => `<span class="badge st-${s}">${esc(t('st_' + s))}</span>`;
  const outBadge = (o) => `<span class="badge out-${o}">${esc(t('out_' + o))}</span>`;
  const lfBadge = (s) => `<span class="badge lf-${s}">${esc(t('lf_' + s))}</span>`;
  const chChip = (c) => `<span class="chip">${chIcon(c)}${esc(chLabel(c))}</span>`;
  const empty = (msg) => `<div class="empty">${esc(msg || t('none'))}</div>`;
  const pageHead = (title, extra = '') => `<div class="page-head"><h1>${esc(title)}</h1><div class="page-tools">${extra}</div></div>`;
  const reasonLabel = (r) => (window.ETN_I18N[lang]['r_' + r] ? t('r_' + r) : r || t('r_other'));

  // ---------- views ----------
  function customerCards(list) {
    return `<div class="pcards">${list.map((c) => `<a class="pcard" href="#/customers/${c.id}"><span class="avatar">${initials(c.name)}</span><div class="grow"><b>${esc(c.name)}</b><div class="muted small">${esc(c.email)} · ${esc(c.phone)}</div></div>${levelBadge(c.level)}</a>`).join('')}</div>`;
  }

  function vInteraction() {
    const ctx = state.context;
    const recent = state.escalations.length ? `<section class="card"><h3>${esc(t('recent'))}</h3>${state.escalations.map((e) => { const c = cust(e.customerId); return `<a class="listrow" data-act="loadesc" data-id="${e.id}">${chChip(e.channel)}<span class="grow"><b>${esc(c ? c.name : e.payload.ani)}</b> · ${esc(reasonLabel(e.reason))}</span>${e.status === 'resolved' ? `<span class="badge st-confirmed">${esc(t('resolved'))}</span>` : `<span class="badge out-active">${esc(t('out_active'))}</span>`}<time>${fmtTs(e.createdAt)}</time></a>`; }).join('')}</section>` : '';
    if (!ctx) {
      return `<section class="card waiting">${ICON.headset}<h2>${esc(t('waiting_title'))}</h2><p class="muted">${esc(t('waiting_sub'))}</p></section>
        <section class="card"><h3>${esc(t('or_search'))}</h3>${customerCards(state.customers)}</section>${recent}`;
    }
    const r = resolveContext(ctx);
    const { c, e, tk, s, lf, ses, payload } = r;
    const resolved = e && e.status === 'resolved';
    const idType = ctx.email && !ctx.ani ? 'email' : 'ANI';
    const idVal = idType === 'email' ? ctx.email : (ctx.ani || payload.ani);
    const opening = e ? L(e.opening) : c ? (lang === 'es' ? `¡Hola ${c.name.split(' ')[0]}! Ya tengo en pantalla lo que platicaste con Turi; continuemos desde ahí.` : `Hi ${c.name.split(' ')[0]}! I already have your conversation with Turi on screen; let's pick up from there.`) : '';
    const summary = ses && L(ses.summary) ? L(ses.summary) : payload.conversation_summary;

    const cards = [];
    if (e && e.saleFolio) { const nt = ticket(e.saleFolio); cards.push(`<div class="ctx ok"><small>${esc(t('ticket_ctx'))} · ${esc(t('resolved'))}</small><b><a href="#/tickets/${nt.folio}">${esc(nt.folio)}</a></b><span class="big">${esc(nt.time)} <em>${fmtDate(nt.date)}</em></span><span>${esc(nt.origin)} → ${esc(nt.destination)} · ${esc(t('seat'))} <b>${esc(nt.seat)}</b></span><span><b>${money(nt.fare)}</b> · ${statusBadge(nt.status)}</span></div>`); }
    else if (s) cards.push(`<div class="ctx"><small>${esc(t('sel_schedule'))}</small><b>${esc(s.origin)} → ${esc(s.destination)}</b><span class="big">${esc(s.time)} <em>${fmtDate(s.date)}</em></span><span>${esc(s.bus)} · ${s.capacity - s.sold} ${esc(t('available'))}</span><span><b class="teal-t">${money(s.fareWeb)}</b> ${esc(t('fare_online').toLowerCase())} · ${money(s.fareStd)}</span></div>`);
    else if (payload.selected_schedule_summary && !tk) cards.push(`<div class="ctx"><small>${esc(t('sel_schedule'))}</small><span>${esc(payload.selected_schedule_summary)}</span></div>`);
    if (tk) cards.push(`<div class="ctx"><small>${esc(t('ticket_ctx'))}</small><b><a href="#/tickets/${tk.folio}">${esc(tk.folio)}</a></b><span class="big">${esc(tk.time)} <em>${fmtDate(tk.date)}</em></span><span>${esc(tk.origin)} → ${esc(tk.destination)}</span><span>${esc(t('seat'))} <b>${esc(tk.seat)}</b> · ${statusBadge(tk.status)}</span></div>`);
    if (lf) cards.push(`<div class="ctx ${lf.status === 'found' ? 'ok' : ''}"><small>${esc(t('case_ctx'))}</small><b><a href="#/lost">${esc(lf.id)}</a></b><span>${esc(L(lf.item))}</span><span>${esc(t('seat'))} <b>${esc(lf.seat)}</b> · ${esc(lf.route)}</span>${lfBadge(lf.status)}${lf.notes ? `<span class="muted small">${esc(L(lf.notes))}</span>` : ''}</div>`);

    let actions = '';
    if (e && !resolved) actions = r.reason === 'assisted_purchase' ? `<button class="btn teal" data-act="sale" data-id="${e.id}">${esc(t('complete_sale'))}</button>` : `<button class="btn teal" data-act="resolve" data-id="${e.id}">${esc(t('resolve'))}</button>`;
    else if (resolved) actions = `<span class="done-pill">${ICON.check}${esc(t('resolved'))}</span>`;
    if (c) actions += `<a class="btn ghost" href="#/customers/${c.id}">${esc(t('open_profile'))}</a>`;
    actions += `<button class="btn ghost" data-act="endctx">${esc(t('end_interaction'))}</button>`;

    const upcoming = c ? state.tickets.filter((x) => x.customerId === c.id && x.status !== 'used' && !(tk && x.folio === tk.folio) && !(e && x.folio === e.saleFolio)) : [];

    return `<section class="card caller">
        <div class="caller-top"><span class="avatar lg ${c ? '' : 'anon'}">${c ? initials(c.name) : '?'}</span>
          <div class="grow"><h2>${esc(c ? c.name : t('unknown_caller'))} ${c ? levelBadge(c.level) : ''}</h2>
          <div class="meta">${chChip(r.channel)}<span>${esc(t('identified_by'))} <b>${esc(idType)}</b> <code>${esc(idVal || '—')}</code></span>${c && c.doters ? `<span><code>${esc(c.doters)}</code> · ${num(c.points)} ${esc(t('points'))}</span>` : ''}</div></div>
          ${resolved ? '' : `<span class="timer" data-since="${ctx.startedAt}"></span>`}</div>
        <div class="handoff">${ICON.bot}<span><b>${esc(t('handoff'))}</b>${r.reason ? ` · ${esc(t('reason'))}: ${esc(reasonLabel(r.reason))}` : ''}${e && e.queue ? ` · ${esc(e.queue)}` : ''}</span></div>
      </section>
      <div class="zr">${ICON.check}${esc(t('zero_repeat'))}</div>
      ${opening ? `<div class="opening"><small>${esc(t('suggested_opening'))}</small><p>“${esc(opening)}”</p></div>` : ''}
      ${cards.length ? `<div class="ctx-row">${cards.join('')}</div>` : ''}
      <div class="actionbar">${actions}</div>
      <div class="grid g-2">
        <section class="card"><h3>${esc(t('ai_summary'))}</h3><p class="summary">${esc(summary || '—')}</p>${ses ? `<a class="btn ghost sm" href="#/conversations/${ses.id}">${esc(t('transcript'))} →</a>` : ''}
          ${upcoming.length ? `<h3 class="mt">${esc(t('upcoming'))}</h3>${upcoming.map((x) => `<a class="listrow" href="#/tickets/${x.folio}"><code>${esc(x.folio)}</code><span class="grow">${esc(x.origin)} → ${esc(x.destination)} · ${fmtDate(x.date)} ${esc(x.time)}</span>${statusBadge(x.status)}</a>`).join('')}` : ''}</section>
        <section class="card"><details ${Object.keys(payload).length ? 'open' : ''}><summary>${esc(t('payload'))}</summary><pre class="json">${esc(JSON.stringify(payload, null, 2))}</pre></details></section>
      </div>${recent}`;
  }

  function vCustomers() { return `${pageHead(t('customers_title'))}<section class="card">${customerCards(state.customers)}</section>`; }

  function ticketRows(list) {
    if (!list.length) return `<tr><td colspan="6">${empty()}</td></tr>`;
    return list.map((x) => `<tr data-href="#/tickets/${x.folio}"><td><code>${esc(x.folio)}</code></td><td>${esc(x.origin)} <span class="arr">→</span> ${esc(x.destination)}</td><td>${fmtDate(x.date)} · <b>${esc(x.time)}</b></td><td>${esc(x.seat)}</td><td class="num">${money(x.fare)}</td><td>${statusBadge(x.status)}</td></tr>`).join('');
  }
  const ticketHead = () => `<thead><tr><th>${esc(t('folio'))}</th><th>${esc(t('route'))}</th><th>${esc(t('departure'))}</th><th>${esc(t('seat'))}</th><th class="num">${esc(t('fare'))}</th><th>${esc(t('status'))}</th></tr></thead>`;

  function vCustomer(id) {
    const c = cust(id); if (!c) return empty();
    const tks = state.tickets.filter((x) => x.customerId === id);
    const up = tks.filter((x) => x.status !== 'used'), past = tks.filter((x) => x.status === 'used');
    const ints = state.interactions.filter((i) => i.customerId === id);
    const invs = state.invoices.filter((i) => i.customerId === id);
    const cases = state.lostFound.filter((l) => l.customerId === id);
    const doters = c.doters ? `<div class="doters lvl-bg-${c.level.toLowerCase()}"><div class="dt-top"><span>Doters</span><b>${esc(c.level)}</b></div><div class="dt-pts">${num(c.points)} <small>${esc(t('points'))}</small></div><div class="dt-meta"><code>${esc(c.doters)}</code><span>${esc(t('member_since'))} ${c.since ? c.since.slice(0, 4) : ''}</span></div></div>` : `<div class="empty small">${esc(t('no_doters'))}</div>`;
    const intList = ints.length ? ints.map((i) => `<a class="listrow" href="#/conversations/${i.id}">${chChip(i.channel)}<span class="grow">${esc(L(i.summary) || i.intents.map((k) => t('in_' + k)).join(', '))}</span>${outBadge(i.outcome)}<time>${fmtTs(i.startedAt)}</time></a>`).join('') : empty();
    const invList = invs.length ? invs.map((i) => `<a class="listrow" data-act="cfdi" data-id="${i.id}"><code>${esc(i.id)}</code><span class="grow">${esc(i.folio)} · ${money(i.amount)}</span><span class="badge st-confirmed">${esc(t('stamped'))}</span></a>`).join('') : empty();
    const caseList = cases.length ? `<section class="card"><h3>${esc(t('cases'))}</h3>${cases.map((l) => `<a class="listrow" href="#/lost"><code>${esc(l.id)}</code><span class="grow">${esc(L(l.item))} · ${esc(l.seat)}</span>${lfBadge(l.status)}</a>`).join('')}</section>` : '';
    return `${pageHead(c.name, state.context ? `<a class="btn ghost sm" href="#/interaction">← ${esc(t('nav_interaction'))}</a>` : '')}
    <div class="grid g-1-2">
      <div class="stack">
        <section class="card"><div class="who big"><span class="avatar lg">${initials(c.name)}</span><div><h2>${esc(c.name)}</h2>${levelBadge(c.level)}</div></div>
          <dl><dt>${esc(t('email'))}</dt><dd>${esc(c.email)}</dd><dt>${esc(t('phone'))}</dt><dd>${esc(c.phone)}</dd><dt>${esc(t('rfc'))}</dt><dd>${esc(c.rfc || '—')}</dd><dt>${esc(t('city'))}</dt><dd>${esc(c.city)}</dd><dt>${esc(t('seat_pref'))}</dt><dd>${esc(L(c.pref))}</dd><dt>${esc(t('language'))}</dt><dd>${esc(c.lang)}</dd></dl></section>
        <section class="card"><h3>${esc(t('doters_card'))}</h3>${doters}</section>
      </div>
      <div class="stack">
        <section class="card flush"><h3 class="pad">${esc(t('upcoming'))}</h3><div class="tscroll"><table>${ticketHead()}<tbody>${ticketRows(up)}</tbody></table></div></section>
        <section class="card"><h3>${esc(t('interactions'))}</h3>${intList}</section>
        <section class="card"><h3>${esc(t('invoices'))}</h3>${invList}</section>
        ${caseList}
        <section class="card flush"><h3 class="pad">${esc(t('past'))}</h3><div class="tscroll"><table>${ticketHead()}<tbody>${ticketRows(past)}</tbody></table></div></section>
      </div>
    </div>`;
  }

  function vTickets() {
    const rows = state.tickets.map((x) => { const c = cust(x.customerId); return `<tr data-href="#/tickets/${x.folio}"><td><code>${esc(x.folio)}</code></td><td>${esc(c ? c.name : '—')}</td><td>${esc(x.origin)} <span class="arr">→</span> ${esc(x.destination)}</td><td>${fmtDate(x.date)} · <b>${esc(x.time)}</b></td><td>${esc(x.seat)}</td><td>${statusBadge(x.status)}</td></tr>`; }).join('');
    return `${pageHead(t('tickets_title'))}<section class="card flush"><div class="tscroll"><table><thead><tr><th>${esc(t('folio'))}</th><th>${esc(t('passenger'))}</th><th>${esc(t('route'))}</th><th>${esc(t('departure'))}</th><th>${esc(t('seat'))}</th><th>${esc(t('status'))}</th></tr></thead><tbody>${rows}</tbody></table></div></section>`;
  }

  function vTicket(folio) {
    const x = ticket(folio); if (!x) return empty();
    const c = cust(x.customerId);
    const s = findSched(x.origin, x.destination, x.date, x.time);
    const hist = x.history.slice().reverse().map((h) => `<li><time>${fmtTs(h.ts)}</time><span>${esc(L(h.text))}</span></li>`).join('');
    const canAct = x.status === 'confirmed' || x.status === 'modified';
    return `${pageHead(x.folio, `<a class="btn ghost sm" href="javascript:history.back()">← ${esc(t('back'))}</a>`)}
    <div class="grid g-2-1">
      <section class="card boarding">
        <div class="bp-head"><img src="assets/etn-wordmark.png" alt="ETN Turistar" /><div>${statusBadge(x.status)}${x.modRef ? ` <code>${esc(x.modRef)}</code>` : ''}</div></div>
        <div class="bp-route"><div><small>${esc(t('departure'))}</small><b>${esc(x.origin)}</b><span>${esc(x.time)}</span></div><div class="bp-line">${ICON.bus}</div><div class="r"><small>${esc(t('arrival'))}</small><b>${esc(x.destination)}</b><span>${esc(s ? s.arrival : '—')}</span></div></div>
        <div class="bp-grid"><div><small>${esc(t('passenger'))}</small><b>${c ? `<a href="#/customers/${c.id}">${esc(c.name)}</a>` : '—'}</b></div><div><small>${esc(x.status === 'open' ? t('open_until') : t('date'))}</small><b>${fmtDate(x.status === 'open' ? x.openUntil : x.date)}</b></div><div><small>${esc(t('seat'))}</small><b>${esc(x.seat)}</b></div><div><small>${esc(t('bus'))}</small><b>${esc(x.bus)}</b></div><div><small>${esc(t('fare'))}</small><b>${money(x.fare)}</b><em>${esc(t('fare_' + x.fareType))}</em></div><div><small>${esc(t('channel'))}</small><b>${chChip(x.channel)}</b></div></div>
        ${c && c.level ? `<div class="bp-foot">${levelBadge(c.level)} <span class="muted">${esc(c.doters)} · Sala VIP</span></div>` : ''}
      </section>
      <section class="card"><h3>${esc(t('actions'))}</h3><div class="btns">
        <button class="btn" data-act="modify" data-id="${x.folio}" ${canAct ? '' : 'disabled'}>${esc(t('act_modify'))}</button>
        <button class="btn ghost" data-act="open" data-id="${x.folio}" ${canAct ? '' : 'disabled'}>${esc(t('act_open'))}</button>
        <button class="btn ghost" data-act="bp" data-id="${x.folio}">${esc(t('act_bp'))}</button>
        <button class="btn ghost" data-act="mkcfdi" data-id="${x.folio}" ${c && c.rfc ? '' : 'disabled'}>${esc(t('act_cfdi'))}</button></div>
        <h3 class="mt">${esc(t('history'))}</h3><ul class="timeline">${hist}</ul></section>
    </div>`;
  }

  function vSchedules() {
    const date = dayOffset(schedFilter.day);
    const routes = [...new Set(state.schedules.map((s) => `${s.origin}|${s.destination}`))];
    const list = state.schedules.filter((s) => s.date === date && (schedFilter.route === 'all' || `${s.origin}|${s.destination}` === schedFilter.route));
    const opts = `<option value="all">${esc(t('all_routes'))}</option>` + routes.map((r) => `<option value="${esc(r)}" ${r === schedFilter.route ? 'selected' : ''}>${esc(r.replace('|', ' → '))}</option>`).join('');
    const dayBtn = (n, label) => `<button class="seg-btn ${schedFilter.day === n ? 'on' : ''}" data-act="sday" data-id="${n}">${esc(label)}</button>`;
    const rows = list.map((s) => { const avail = s.capacity - s.sold; const lf = pct(s.sold, s.capacity); const mine = state.tickets.filter((x) => x.origin === s.origin && x.destination === s.destination && x.date === s.date && x.time === s.time && x.status !== 'open'); return `<tr><td><b class="t-big">${esc(s.time)}</b><div class="muted small">→ ${esc(s.arrival)} · ${esc(s.duration)}</div></td><td>${esc(s.origin)} <span class="arr">→</span> ${esc(s.destination)}<div class="muted small">${esc(s.bus)}${s.capacity === 41 ? ` · ${esc(t('double_deck'))}` : ''}</div></td><td><div class="occ"><div class="mixbar ${lf > 90 ? 'hot' : ''}"><i style="width:${lf}%"></i></div><span>${avail ? `${avail}` : esc(t('sold_out'))}</span></div></td><td class="num">${money(s.fareStd)}</td><td class="num teal-t"><b>${money(s.fareWeb)}</b></td><td>${mine.map((m) => `<a href="#/tickets/${m.folio}"><code>${m.folio}</code></a>`).join(' ')}</td></tr>`; }).join('');
    return `${pageHead(t('schedules_title'), `<div class="segmented">${dayBtn(0, t('today'))}${dayBtn(1, t('tomorrow'))}${dayBtn(2, fmtDate(dayOffset(2)))}</div><select data-act="sroute">${opts}</select>`)}
    <section class="card flush"><div class="tscroll"><table><thead><tr><th>${esc(t('time'))}</th><th>${esc(t('route'))}</th><th>${esc(t('available'))}</th><th class="num">${esc(t('fare_std'))}</th><th class="num">${esc(t('fare_online'))}</th><th>${esc(t('tickets_title'))}</th></tr></thead><tbody>${rows || `<tr><td colspan="6">${empty()}</td></tr>`}</tbody></table></div></section>`;
  }

  function vInvoices() {
    const rows = state.invoices.map((i) => { const c = cust(i.customerId); return `<tr data-act="cfdi" data-id="${i.id}"><td><code>${esc(i.id)}</code></td><td>${esc(c ? c.name : '—')}<div class="muted small">${esc(i.rfc)}</div></td><td>${esc(i.folio)}</td><td class="num">${money(i.amount)}</td><td>${i.by === 'Turi' ? `<span class="chip turi">${ICON.bot}Turi</span>` : esc(i.by)}<div class="muted small">${chLabel(i.channel)}</div></td><td>${fmtTs(i.issuedAt)}</td></tr>`; }).join('');
    return `${pageHead(t('invoices_title'))}<section class="card flush"><div class="tscroll"><table><thead><tr><th>${esc(t('invoice'))}</th><th>${esc(t('passenger'))}</th><th>${esc(t('folio'))}</th><th class="num">${esc(t('amount'))}</th><th>${esc(t('issued_by'))}</th><th>${esc(t('issued'))}</th></tr></thead><tbody>${rows}</tbody></table></div></section>`;
  }
  function showCfdi(id) {
    const i = state.invoices.find((x) => x.id === id); if (!i) return;
    const c = cust(i.customerId), tk = ticket(i.folio);
    const sub = i.amount / 1.16;
    modal(`${t('cfdi_preview')} · ${i.id}`, `<div class="cfdi">
      <div class="cfdi-head"><img src="assets/etn-wordmark.png" alt="" /><div><b>CFDI 4.0 · Ingreso</b><div class="muted small">${esc(t('uuid'))}</div><code>${esc(i.uuid)}</code></div></div>
      <div class="grid g-2"><div><small>${esc(t('emitter'))}</small><b>Enlaces Terrestres Nacionales, S.A. de C.V.</b><div class="muted small">RFC ETN000000XX0 (demo) · Régimen 601</div></div><div><small>${esc(t('receiver'))}</small><b>${esc(c ? c.name.toUpperCase() : '')}</b><div class="muted small">RFC ${esc(i.rfc)} · ${esc(t('uso'))} ${esc(i.uso)}</div></div></div>
      <table><thead><tr><th>${esc(t('concept'))}</th><th class="num">${esc(t('amount'))}</th></tr></thead><tbody><tr><td>78111802 · Transporte de pasajeros ${esc(tk ? `${tk.origin} → ${tk.destination}` : '')} · ${esc(i.folio)}</td><td class="num">${money(sub)}</td></tr></tbody></table>
      <div class="cfdi-tot"><div><span>${esc(t('subtotal'))}</span><b>${money(sub)}</b></div><div><span>${esc(t('iva'))}</span><b>${money(i.amount - sub)}</b></div><div class="tot"><span>${esc(t('total'))}</span><b>${money(i.amount)}</b></div></div>
      <div class="cfdi-foot"><span class="muted small">${esc(t('issued_by'))}: ${esc(i.by)} · ${chLabel(i.channel)} · ${fmtTs(i.issuedAt)} · ${esc(t('stamped'))} (demo)</span><button class="btn ghost sm" data-act="resendcfdi" data-id="${i.id}">${esc(t('resend'))}</button></div></div>`);
  }

  function vLost() {
    const rows = state.lostFound.map((l) => { const c = cust(l.customerId); return `<tr><td><code>${esc(l.id)}</code><div class="muted small">${fmtTs(l.createdAt)}</div></td><td>${esc(c ? c.name : '—')} ${c ? levelBadge(c.level) : ''}</td><td><b>${esc(L(l.item))}</b> · ${esc(t('seat'))} ${esc(l.seat)}<div class="muted small">${esc(l.route)} · <a href="#/tickets/${l.folio}">${esc(l.folio)}</a></div>${l.notes ? `<div class="muted small">${esc(L(l.notes))}</div>` : ''}</td><td>${lfBadge(l.status)}</td><td>${l.status !== 'delivered' ? `<button class="btn sm ghost" data-act="lfadv" data-id="${l.id}">${esc(t('advance'))}</button>` : ''}</td></tr>`; }).join('');
    return `${pageHead(t('lost_title'))}<section class="card flush"><div class="tscroll"><table><thead><tr><th>ID</th><th>${esc(t('passenger'))}</th><th>${esc(t('item'))}</th><th>${esc(t('status'))}</th><th></th></tr></thead><tbody>${rows || `<tr><td colspan="5">${empty()}</td></tr>`}</tbody></table></div></section>`;
  }

  function vConversations(id) {
    const s = state.interactions.find((i) => i.id === id);
    if (s) {
      const c = cust(s.customerId);
      const msgs = s.transcript.map((m) => m.from === 'tool' || m.from === 'system' ? `<div class="msg ${m.from}"><span class="tool-tag">${m.from === 'tool' ? esc(t('tool_call')) : 'SYS'}</span><code>${esc(m.text)}</code></div>` : `<div class="msg ${m.from}"><div class="bubble">${m.from === 'turi' ? '<b>Turi</b>' : `<b>${esc(c ? c.name.split(' ')[0] : '?')}</b>`}${esc(m.text)}</div></div>`).join('');
      return `${pageHead(s.id, `<a class="btn ghost sm" href="javascript:history.back()">← ${esc(t('back'))}</a>`)}<section class="card convo"><div class="meta">${chChip(s.channel)} ${outBadge(s.outcome)} <span class="muted small">${esc(s.identity.type)}=${esc(s.identity.value)} · ${esc(s.language)} · ${fmtTs(s.startedAt)}</span></div>${L(s.summary) ? `<p class="summary">${esc(L(s.summary))}</p>` : ''}<div class="transcript">${msgs}</div></section>`;
    }
    const rows = state.interactions.map((i) => { const c = cust(i.customerId); return `<tr data-href="#/conversations/${i.id}"><td>${chChip(i.channel)}<div class="muted small">${fmtTs(i.startedAt)}</div></td><td>${esc(c ? c.name : i.identity.value)}</td><td>${i.intents.map((k) => `<span class="tag">${esc(t('in_' + k))}</span>`).join(' ')}</td><td>${outBadge(i.outcome)}</td></tr>`; }).join('');
    return `${pageHead(t('conv_title'))}<section class="card flush"><div class="tscroll"><table><thead><tr><th>${esc(t('channel'))}</th><th>${esc(t('passenger'))}</th><th>${esc(t('intents'))}</th><th>${esc(t('outcome'))}</th></tr></thead><tbody>${rows}</tbody></table></div></section>`;
  }

  // ---------- demo drawer ----------
  function renderDemo() {
    const next = STEPS.find((s) => !state.demoDone[s.id]);
    $('#demo-body').innerHTML = `<p class="muted small">${esc(t('demo_sub'))}</p>` + ['act2', 'act3a', 'act3b'].map((a) => `<div class="act"><h4>${esc(t(a))}</h4>${STEPS.filter((s) => s.act === a).map((s) => { const done = state.demoDone[s.id]; return `<div class="step ${done ? 'done' : ''} ${next && next.id === s.id ? 'next' : ''}"><span class="dot">${done ? ICON.check : STEPS.indexOf(s) + 1}</span><span class="grow">${esc(L(s.label))}</span>${done ? '' : `<button class="btn sm" data-act="step" data-id="${s.id}">${esc(t('run'))}</button>`}</div>`; }).join('')}</div>`).join('') +
      `<div class="demo-foot"><button class="btn teal" data-act="next" ${next ? '' : 'disabled'}>${ICON.play}${esc(t('run_next'))}</button><button class="btn ghost" data-act="reset">${esc(t('reset'))}</button></div><p class="muted small">${esc(t('shortcut_hint'))}</p>`;
    $('#demo-title').textContent = t('demo_title');
  }

  // ---------- router ----------
  const TABS = ['interaction', 'customers', 'tickets', 'schedules', 'invoices', 'lost', 'conversations'];
  function render() {
    const [view, id] = (location.hash.replace(/^#\/?/, '') || 'interaction').split('/');
    const views = { interaction: vInteraction, customers: () => (id ? vCustomer(id) : vCustomers()), tickets: () => (id ? vTicket(id) : vTickets()), schedules: vSchedules, invoices: vInvoices, lost: vLost, conversations: () => vConversations(id) };
    const live = state.context && !((resolveContext(state.context).e || {}).resolvedAt);
    $('#tabs').innerHTML = TABS.map((k) => `<a href="#/${k}" class="${view === k ? 'on' : ''}">${esc(t('nav_' + k))}${k === 'interaction' && live ? '<i class="live-dot"></i>' : ''}</a>`).join('');
    $('#main').innerHTML = (views[view] || vInteraction)();
    document.documentElement.lang = lang === 'es' ? 'es-MX' : 'en';
    $('#search').placeholder = t('search_ph');
    $('#app-sub').textContent = t('app_title');
    document.querySelectorAll('[data-lang]').forEach((b) => b.classList.toggle('on', b.dataset.lang === lang));
    renderDemo();
    tick();
  }
  function tick() { document.querySelectorAll('[data-since]').forEach((el) => { el.textContent = mmss(Math.max(0, (Date.now() - Number(el.dataset.since)) / 1000)); }); }

  // ---------- events ----------
  function openModify(folio) {
    const x = ticket(folio);
    const opts = state.schedules.filter((s) => s.origin === x.origin && s.destination === x.destination && !(s.date === x.date && s.time === x.time) && depTime(s.date, s.time) > Date.now() && s.capacity > s.sold);
    const free = depTime(x.date, x.time) - Date.now() >= 3 * 3600 * 1000;
    modal(`${t('act_modify')} · ${folio}`, `<p class="muted">${esc(t('modify_pick'))}</p><div class="notice ${free ? 'ok' : 'warn'}">${esc(free ? t('modify_free') : t('modify_fee'))}</div><div class="picklist">${opts.map((s) => `<button class="pick" data-act="domodify" data-id="${folio}" data-sched="${esc(s.id)}"><b>${esc(s.time)}</b><span>${fmtDate(s.date)} · ${esc(s.bus)}</span><span>${s.capacity - s.sold} ${esc(t('available'))}</span></button>`).join('') || empty()}</div>`);
  }
  const ACTIONS = {
    'toggle-demo': () => document.body.classList.toggle('demo-open'),
    step: (id) => runStep(id), next: runNext,
    reset: () => { if (confirm(t('reset_confirm'))) { state = window.ETN_SEED(); save(); toast(t('reset_done')); location.hash = '#/interaction'; render(); } },
    sday: (id) => { schedFilter.day = Number(id); render(); },
    cfdi: (id) => showCfdi(id),
    resendcfdi: (id) => { const i = state.invoices.find((x) => x.id === id); const c = cust(i.customerId); toast(`${id} → ${c.email}`); },
    modify: (id) => openModify(id),
    domodify: (id, el) => { const ref = modifyTicket(id, el.dataset.sched, AGENT()); save(); closeModal(); toast(`${id} → ${ref}`); render(); },
    open: (id) => { openTicket(id, AGENT()); save(); toast(`${id} · ${t('st_open')}`); render(); },
    bp: (id) => { const c = cust(ticket(id).customerId); toast(`${t('act_bp')} · ${c ? c.email : id}`); },
    mkcfdi: (id) => { const tk = ticket(id); const c = cust(tk.customerId); const inv = issueCfdi(id, c.rfc, AGENT(), tk.channel); save(); render(); showCfdi(inv); },
    lfadv: (id) => { advanceLost(id); save(); render(); },
    resolve: (id) => { resolveEscalation(id); save(); render(); },
    sale: (id) => { const f = completeSale(id); save(); if (f) toast(f); render(); },
    endctx: () => { state.context = null; save(); toast(t('interaction_ended')); render(); notifyParent({ type: 'etn:interaction_ended' }); },
    loadesc: (id) => { const e = state.escalations.find((x) => x.id === id); setContext({ escalationId: id, ani: e.payload.ani, channel: e.channel, source: 'history', startedAt: e.createdAt }); },
    'close-modal': closeModal,
  };
  document.addEventListener('click', (ev) => {
    const a = ev.target.closest('[data-act]');
    const link = ev.target.closest('a[href]');
    if (a && a.tagName !== 'SELECT' && !(link && link !== a && !link.dataset.act && a.contains(link))) { ev.preventDefault(); const fn = ACTIONS[a.dataset.act]; if (fn) fn(a.dataset.id, a); return; }
    const l = ev.target.closest('[data-lang]');
    if (l) { lang = l.dataset.lang; try { localStorage.setItem(LANG_KEY, lang); } catch (e) {} render(); return; }
    const row = ev.target.closest('tr[data-href]');
    if (row && !ev.target.closest('a')) location.hash = row.dataset.href;
    if (ev.target.id === 'modal') closeModal();
  });
  document.addEventListener('change', (ev) => { if (ev.target.dataset.act === 'sroute') { schedFilter.route = ev.target.value; render(); } });
  document.addEventListener('keydown', (ev) => {
    if (ev.target.matches('input, select, textarea') || ev.metaKey || ev.ctrlKey || ev.altKey) return;
    if (ev.key === 'Escape') { closeModal(); document.body.classList.remove('demo-open'); }
    if (ev.key === 'n' || ev.key === 'N') runNext();
    if (ev.key === 'd' || ev.key === 'D') document.body.classList.toggle('demo-open');
  });
  $('#search-form').addEventListener('submit', (ev) => {
    ev.preventDefault();
    const q = $('#search').value.trim().toLowerCase().replace(/\s+/g, ''); if (!q) return;
    const tk = state.tickets.find((x) => x.folio.toLowerCase().includes(q)); if (tk) { location.hash = '#/tickets/' + tk.folio; return; }
    const inv = state.invoices.find((x) => x.id.toLowerCase().includes(q)); if (inv) { location.hash = '#/invoices'; setTimeout(() => showCfdi(inv.id), 50); return; }
    const c = state.customers.find((x) => [x.email, x.phone, x.doters, x.name.replace(/\s/g, ''), x.rfc].some((v) => v && v.toLowerCase().includes(q))); if (c) { location.hash = '#/customers/' + c.id; return; }
    const lf = state.lostFound.find((x) => x.id.toLowerCase().includes(q)); if (lf) { location.hash = '#/lost'; return; }
    const s = state.interactions.find((x) => x.id.toLowerCase().includes(q)); if (s) { location.hash = '#/conversations/' + s.id; return; }
    toast(t('not_found'));
  });
  window.addEventListener('hashchange', () => { closeModal(); render(); });
  window.addEventListener('storage', (ev) => { if (ev.key === STORE_KEY) { state = load(); render(); } });
  setInterval(tick, 1000);

  // ---------- host integration (UJET Agent Desktop iframe) ----------
  const framed = window.parent !== window;
  if (framed) document.body.classList.add('embedded');
  function notifyParent(msg) { if (framed) try { window.parent.postMessage(msg, '*'); } catch (e) {} }
  // parent → iframe:  { type: 'etn:context', ani, email, folio, channel, payload }
  //                   { type: 'etn:clear' } · { type: 'etn:step', id } · { type: 'etn:lang', lang: 'es'|'en' }
  window.addEventListener('message', (ev) => {
    const d = ev.data; if (!d || typeof d !== 'object' || typeof d.type !== 'string' || !d.type.startsWith('etn:')) return;
    if (d.type === 'etn:context') setContext(contextFromPayload(Object.assign({ source: 'message' }, d)));
    if (d.type === 'etn:clear') { state.context = null; save(); render(); }
    if (d.type === 'etn:step') (d.id === 'next' ? runNext() : runStep(d.id));
    if (d.type === 'etn:lang' && ['es', 'en'].includes(d.lang)) { lang = d.lang; render(); }
  });

  // Console hook: ETN.next(), ETN.runStep('a3a_escalate'), ETN.setContext({ ani: '+525512345678' }), ETN.reset()
  window.ETN = { runStep, next: runNext, steps: STEPS.map((s) => s.id), setContext: (o) => setContext(contextFromPayload(o)), reset: () => { state = window.ETN_SEED(); save(); render(); }, get state() { return state; } };

  // URL params: ?ani=+525512345678 · ?email=… · ?folio=ETN-784512 · ?payload=<json|base64> · ?lang=en · ?step=next
  render();
  if (params.get('ani') || params.get('email') || params.get('folio') || params.get('payload')) {
    setContext(contextFromPayload({ ani: params.get('ani'), email: params.get('email'), folio: params.get('folio'), channel: params.get('channel'), payload: params.get('payload'), source: 'url' }));
  }
  const qs = params.get('step');
  if (qs) qs === 'next' ? runNext() : runStep(qs);
  notifyParent({ type: 'etn:ready' });
})();
