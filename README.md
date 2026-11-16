# ETN Turistar · Backoffice de Servicio (Demo)

An agent-facing backoffice for the **Grupo IAMSA / ETN Turistar** demo. It is built to be **iframed in the UJET Agent Desktop** next to the call or chat that **Turi** (Google GECX) hands over.
It's plain HTML/CSS/JS with no build step and no backend, so it runs as-is on GitHub Pages.

> Demo only. Passengers, folios, RFCs, CFDI UUIDs and fares are mock data that matches the GECX demo dataset (Alejandro Morales, Carlos Mendoza).

## Tabs

| Tab | What the agent sees |
| --- | --- |
| **Interacción** (home) | Screen-pop for the live interaction: who the caller is (identified by ANI or email), why Turi handed them over, a suggested opening line, the selected departure, ticket and report cards, Turi's summary and the raw `TELEPHONY_PAYLOAD`. Actions: complete the purchase, mark resolved, end the interaction |
| **Pasajeros** | Passenger 360: profile, Doters card, upcoming and past trips, CFDIs, reports, Turi history |
| **Boletos** | Boarding-pass view, history and actions: change itinerary (free when ≥3h before departure), Open Ticket, resend pass, generate CFDI |
| **Corridas** | Departures for today, tomorrow and the day after, with seats left and standard vs. -10% online fare |
| **Facturas CFDI** | CFDI 4.0 list and fiscal preview |
| **Objetos olvidados** | Lost-item reports with a status flow |
| **Historial Turi** | Every Turi session with transcript, tool calls and session params |

The ES / EN toggle is in the top bar. Width is responsive from about 360px up.

## Passing interaction context into the iframe

Use either method. The backoffice matches the passenger by `ani` (phone), `email`, or the payload's `account_id`.

**1. URL parameters** (set on the iframe `src`)

```
index.html?ani=%2B525512345678
index.html?email=alejandro.morales@ejemplo.mx
index.html?ani=%2B528123456789&folio=ETN-664310
index.html?payload=<URL-encoded JSON or base64 JSON of TELEPHONY_PAYLOAD>
index.html?lang=en
```

If the `+` isn't encoded it arrives as a space. That's handled: digits-only ANIs get the `+` added back.

**2. postMessage** (from the host page)

```js
iframe.contentWindow.postMessage({ type: 'etn:context', ani: '+525512345678', payload: { /* TELEPHONY_PAYLOAD */ } }, '*');
iframe.contentWindow.postMessage({ type: 'etn:clear' }, '*');
iframe.contentWindow.postMessage({ type: 'etn:lang', lang: 'en' }, '*');
```

The iframe sends `{ type: 'etn:ready' }` to the parent on load and `{ type: 'etn:interaction_ended' }` when the agent ends the interaction.

`embed-test.html` is a mock Agent Desktop for testing all of this locally.

## Demo control (presenter only)

Click the small ▶ button at the top right, or press **D**. Press **N** to run the next step. Each step makes the same change Turi makes in the widget or call:

- **Act 2 · Web/App SDK (email), contained:** Turi recognizes Alejandro → afternoon CDMX→GDL departures → `ETN-784512` moves from 07:30 to 16:30, seat 12A (`MOD-784512-2026`) → `CFDI-ETN-2026-8841`. No agent is involved; the tabs show the records Turi changed.
- **Act 3A · Voice (ANI) → assisted purchase:** Alejandro calls about his return GDL→CDMX at 07:30 → Turi hands over with `TELEPHONY_PAYLOAD` → the screen-pop appears under **Interacción** → the agent completes the purchase (`ETN-790233`).
- **Act 3B · Voice (ANI) → VIP lost item:** Carlos Mendoza → report `OBJ-2026-0412` for seat 02A on `ETN-664310` → VIP screen-pop → the item is located.

The Act 3A departure is set in `js/data.js` (`window.ETN_DEMO.sale`). The default is Guadalajara → CDMX Norte at 07:30, the day after tomorrow. Change it to match what Turi offers.

Other triggers: `?step=next` or `?step=a3a_escalate` in the URL, `postMessage({ type: 'etn:step', id: 'next' })`, or the console (`ETN.next()`, `ETN.runStep(id)`, `ETN.setContext({ ani })`, `ETN.reset()`).

State is kept in `localStorage`, so it syncs across tabs on the same origin. Some browsers block storage in third-party iframes; the app then keeps state in memory only. Use **Reiniciar demo** before each run. Dates are relative to today.

## Deploy to GitHub Pages

```bash
git init && git add . && git commit -m "ETN Turistar backoffice"
git branch -M main
git remote add origin https://github.com/<you>/etn-backoffice.git
git push -u origin main
```

Go to **Settings → Pages → Deploy from branch → `main` / root**. GitHub Pages doesn't send `X-Frame-Options`, so the page can be iframed.
To run locally: `python3 -m http.server` in this folder, then open `embed-test.html`.

## Structure

```
index.html        backoffice (iframe this)
embed-test.html   local mock Agent Desktop with postMessage buttons
css/styles.css
js/i18n.js        ES/EN strings
js/data.js        seed data + Act 3A config
js/app.js         views, context handling, demo steps
assets/           ETN logo + wordmark
```
