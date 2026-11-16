/* ETN Turistar Backoffice — seed (mock) data, aligned with the GECX "Turi" demo dataset.
 * Dates are relative to the day the page is opened, so "mañana" is always tomorrow.
 */

/* Act 3A (assisted sale) — which departure Alejandro buys over the phone.
 * Default: return trip Guadalajara → CDMX Norte, 07:30, the day after tomorrow
 * (he travels CDMX → GDL tomorrow). Change it to match what Turi offers in the call. */
window.ETN_DEMO = {
  sale: { origin: 'Guadalajara', destination: 'CDMX Norte', dayOffset: 2, time: '07:30', seat: '12A' },
};

window.ETN_SEED = function () {
  const pad = (n) => String(n).padStart(2, '0');
  const day = (offset) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + offset);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };
  const at = (offset, hhmm) => {
    const [h, m] = hhmm.split(':').map(Number);
    const d = new Date();
    d.setDate(d.getDate() + offset);
    d.setHours(h, m, 0, 0);
    return d.getTime();
  };
  const TODAY = day(0), TOMORROW = day(1);

  const customers = [
    { id: 'C-1001', name: 'Alejandro Morales', email: 'alejandro.morales@ejemplo.mx', phone: '+525512345678', doters: 'DOT-1001', level: 'Oro', points: 18450, since: '2019-03-12', rfc: 'MORA850314AB1', city: 'Ciudad de México', pref: { es: 'Ventanilla, piso inferior (12A)', en: 'Window, lower deck (12A)' }, lang: 'es-MX' },
    { id: 'C-4004', name: 'Carlos Mendoza', email: 'carlos.mendoza@ejemplo.mx', phone: '+528123456789', doters: 'DOT-4004', level: 'Oro', points: 22910, since: '2017-08-02', rfc: 'MERC790622KL4', city: 'Monterrey', pref: { es: 'Asiento 02A, fila preferente', en: 'Seat 02A, front row' }, lang: 'es-MX' },
  ];

  const tickets = [
    { folio: 'ETN-784512', customerId: 'C-1001', origin: 'CDMX Norte', destination: 'Guadalajara', date: TOMORROW, time: '07:30', seat: '12A', fare: 1215, fareType: 'web', channel: 'web', status: 'confirmed', bus: 'Marco Polo G8 DD', history: [{ ts: at(-6, '20:14'), text: { es: 'Compra en etn.com.mx (-10% en línea)', en: 'Purchased on etn.com.mx (-10% online)' } }] },
    { folio: 'ETN-761930', customerId: 'C-1001', origin: 'Guadalajara', destination: 'CDMX Norte', date: day(-24), time: '23:30', seat: '12A', fare: 1215, fareType: 'web', channel: 'app', status: 'used', bus: 'Marco Polo G8 DD', history: [{ ts: at(-27, '09:40'), text: { es: 'Compra en App ETN', en: 'Purchased on ETN App' } }, { ts: at(-24, '23:12'), text: { es: 'Abordaje registrado · Sala VIP Guadalajara', en: 'Boarding scanned · VIP Lounge Guadalajara' } }] },
    { folio: 'ETN-748215', customerId: 'C-1001', origin: 'CDMX Norte', destination: 'Guadalajara', date: day(-26), time: '07:30', seat: '12A', fare: 1215, fareType: 'web', channel: 'web', status: 'used', bus: 'Marco Polo G8 DD', history: [{ ts: at(-30, '21:05'), text: { es: 'Compra en etn.com.mx', en: 'Purchased on etn.com.mx' } }, { ts: at(-26, '07:11'), text: { es: 'Abordaje registrado · Sala VIP CDMX Norte', en: 'Boarding scanned · VIP Lounge CDMX Norte' } }] },
    { folio: 'ETN-664310', customerId: 'C-4004', origin: 'CDMX Norte', destination: 'Monterrey', date: TODAY, time: '09:00', seat: '02A', fare: 1701, fareType: 'web', channel: 'app', status: 'used', bus: 'Marco Polo G8 DD', history: [{ ts: at(-3, '11:02'), text: { es: 'Compra en App ETN', en: 'Purchased on ETN App' } }, { ts: at(0, '08:41'), text: { es: 'Abordaje registrado · Sala VIP CDMX Norte', en: 'Boarding scanned · VIP Lounge CDMX Norte' } }] },
    { folio: 'ETN-640118', customerId: 'C-4004', origin: 'Monterrey', destination: 'CDMX Norte', date: day(-10), time: '21:30', seat: '02A', fare: 1701, fareType: 'web', channel: 'app', status: 'used', bus: 'Marco Polo G8 DD', history: [{ ts: at(-14, '18:30'), text: { es: 'Compra en App ETN', en: 'Purchased on ETN App' } }] },
  ];

  // Corridas (departures). capacity: double-decker = 41 seats, Lujo = 25 seats.
  const mk = (origin, destination, date, time, arrival, duration, std, bus, cap, sold) => ({
    id: `${origin}|${destination}|${date}|${time}`, origin, destination, date, time, arrival, duration,
    fareStd: std, fareWeb: Math.round(std * 0.9), bus, capacity: cap, sold,
  });
  const schedules = [];
  [0, 1, 2].forEach((i) => {
    const dt = day(i), f = (a, b, c) => [a, b, c][i];
    schedules.push(
      mk('CDMX Norte', 'Guadalajara', dt, '07:30', '14:15', '6h 45m', 1350, 'Marco Polo G8 DD', 41, f(38, 29, 17)),
      mk('CDMX Norte', 'Guadalajara', dt, '10:00', '16:45', '6h 45m', 1350, 'Volvo 9800 Lujo', 25, f(22, 14, 9)),
      mk('CDMX Norte', 'Guadalajara', dt, '13:00', '19:45', '6h 45m', 1350, 'Volvo 9800 Lujo', 25, f(19, 11, 6)),
      mk('CDMX Norte', 'Guadalajara', dt, '16:30', '23:15', '6h 45m', 1350, 'Marco Polo G8 DD', 41, f(35, 23, 12)),
      mk('CDMX Norte', 'Guadalajara', dt, '22:00', '04:45', '6h 45m', 1350, 'Marco Polo G8 DD', 41, f(39, 31, 20)),
      mk('CDMX Norte', 'Guadalajara', dt, '23:30', '06:15', '6h 45m', 1350, 'Marco Polo G8 DD', 41, f(40, 27, 18)),
      mk('Guadalajara', 'CDMX Norte', dt, '07:30', '14:15', '6h 45m', 1350, 'Marco Polo G8 DD', 41, f(37, 26, 21)),
      mk('Guadalajara', 'CDMX Norte', dt, '16:30', '23:15', '6h 45m', 1350, 'Marco Polo G8 DD', 41, f(33, 19, 14)),
      mk('Guadalajara', 'CDMX Norte', dt, '23:30', '06:15', '6h 45m', 1350, 'Marco Polo G8 DD', 41, f(41, 33, 25)),
      mk('CDMX Norte', 'Monterrey', dt, '09:00', '20:30', '11h 30m', 1890, 'Marco Polo G8 DD', 41, f(41, 18, 15)),
      mk('CDMX Norte', 'Monterrey', dt, '21:30', '09:00', '11h 30m', 1890, 'Marco Polo G8 DD', 41, f(36, 30, 22)),
      mk('Monterrey', 'CDMX Norte', dt, '21:30', '09:00', '11h 30m', 1890, 'Marco Polo G8 DD', 41, f(34, 28, 19)),
    );
  });

  const invoices = [
    { id: 'CFDI-ETN-2026-8655', folio: 'ETN-761930', customerId: 'C-1001', rfc: 'MORA850314AB1', uso: 'G03', amount: 1215, issuedAt: at(-23, '10:31'), channel: 'mobile', by: 'Turi', uuid: '3C9E1B07-55A2-4E6D-9F31-8A0B2C4D6E71', status: 'stamped' },
    { id: 'CFDI-ETN-2026-8812', folio: 'ETN-640118', customerId: 'C-4004', rfc: 'MERC790622KL4', uso: 'G03', amount: 1701, issuedAt: at(-9, '18:22'), channel: 'mobile', by: 'Turi', uuid: 'A02D4E61-7B3C-4F18-9E27-5B6C8D0F4A12', status: 'stamped' },
  ];

  const S = (from, text) => ({ from, text, tool: from === 'tool' });
  const interactions = [
    { id: 'SES-24702', channel: 'mobile', identity: { type: 'email', value: 'alejandro.morales@ejemplo.mx' }, customerId: 'C-1001', startedAt: at(-23, '10:28'), duration: 81, language: 'es-MX', intents: ['cfdi'], outcome: 'contained', csat: 5,
      summary: { es: 'Generó CFDI 4.0 para ETN-761930 con su RFC guardado.', en: 'Generated CFDI 4.0 for ETN-761930 with his saved RFC.' },
      transcript: [S('system', 'Mobile SDK → session params: email="alejandro.morales@ejemplo.mx"'), S('turi', '¡Hola Alejandro! ¿En qué te ayudo?'), S('user', 'Necesito la factura de mi viaje de regreso de Guadalajara'), S('tool', 'generate_cfdi(folio="ETN-761930", rfc="MORA850314AB1") → CFDI-ETN-2026-8655'), S('turi', 'Listo, tu CFDI-ETN-2026-8655 ya está en tu correo.')] },
    { id: 'SES-24420', channel: 'voice', identity: { type: 'ani', value: '+525512345678' }, customerId: 'C-1001', startedAt: at(-31, '19:02'), duration: 64, language: 'es-MX', intents: ['doters'], outcome: 'contained', csat: 5,
      summary: { es: 'Consultó saldo Doters (Nivel Oro).', en: 'Checked Doters balance (Gold tier).' },
      transcript: [S('system', 'UJET IVR → GECX Turn 0: ani="+525512345678"'), S('turi', 'Hola Alejandro, soy Turi de ETN Turistar. ¿En qué te ayudo?'), S('user', '¿Cuántos puntos Doters tengo?'), S('tool', 'get_doters_balance(account_id="DOT-1001") → 17,230 pts · Oro'), S('turi', 'Tienes 17,230 puntos Doters y conservas tu Nivel Oro.')] },
    { id: 'SES-24876', channel: 'mobile', identity: { type: 'email', value: 'carlos.mendoza@ejemplo.mx' }, customerId: 'C-4004', startedAt: at(-9, '18:19'), duration: 74, language: 'es-MX', intents: ['cfdi'], outcome: 'contained', csat: 5,
      summary: { es: 'Generó CFDI 4.0 para ETN-640118 con RFC guardado.', en: 'Generated CFDI 4.0 for ETN-640118 with saved RFC.' },
      transcript: [S('turi', '¡Hola Carlos! ¿En qué te ayudo hoy?'), S('user', 'Necesito la factura de mi viaje de Monterrey'), S('tool', 'generate_cfdi(folio="ETN-640118", rfc="MERC790622KL4") → CFDI-ETN-2026-8812'), S('turi', 'Listo, tu CFDI-ETN-2026-8812 ya está en tu correo.')] },
  ];

  return { version: 2, customers, tickets, schedules, invoices, lostFound: [], interactions, escalations: [], context: null, demoDone: {} };
};
