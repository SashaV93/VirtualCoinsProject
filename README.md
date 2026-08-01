# Cryptonite — Virtual Coins

Second project for the John Bryce **Full Stack Web Developer** course.
A single-page application that tracks the top 100 virtual coins: live prices, a real-time
report, and an AI buy/avoid recommendation.

Built with **React 19 + TypeScript + Redux Toolkit + React Router + Material UI + Recharts**, bundled by **Vite**.

---

## Links

- **GitHub repository:** <https://github.com/SashaV93/VirtualCoinsProject>
- **Live site (GitHub Pages):** <https://sashav93.github.io/VirtualCoinsProject/>

---

## Running locally

```bash
npm install
npm run dev
```

Then open the URL Vite prints (default <http://localhost:5173>).

| Script | What it does |
| --- | --- |
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Type-check (`tsc -b`) and build to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Lint with oxlint |

---

## The live price feed

**Everything works with no API key.** The Reports page defaults to Coinbase, which needs none.

The task sheet names `min-api.cryptocompare.com/data/pricemulti` for the live report, but
since CoinDesk took CryptoCompare over that endpoint answers `401 API key required`. The
obvious substitute — CoinGecko's `simple/price` — cannot sustain one call per second
either. Measured over 40 consecutive calls, one per second:

| Provider | Result | Coverage of the top 100 | Key |
| --- | --- | --- | --- |
| CryptoCompare `pricemulti` | `401` on every call | — | required |
| CoinGecko `simple/price` | **429 from the 5th call on** | 100 | none |
| **Coinbase** `exchange-rates` | 40/40 OK | 54 | none |
| **Binance** `ticker/price` | 40/40 OK | 58 | none |

So the report has a **provider picker** (Reports page → *Live feed settings*), and every
provider keeps the rule the task cares about: **one HTTP request per second returning all
selected coins at once, in USD** — never one request per coin.

- **Coinbase** (default) — a single fixed URL returns every currency it lists.
- **Binance** — quotes against USDT; widest altcoin coverage. Learns the valid pair list
  once, then batches all selected symbols into one `symbols=[…]` query.
- **CryptoCompare** — the endpoint from the task sheet, used as soon as you paste a free
  key from <https://developers.coindesk.com/>. Sent as an `Authorization: Apikey` header.
- **Demo** — prices generated in the browser. Clearly labelled; never a silent fallback.

If the chosen provider does not quote one of your coins, the page names that coin and
suggests switching — it does not silently drop it.

### OpenAI key (optional)

Without one the AI page computes a transparent rule-based verdict from the same market
data, labelled "Local rules". With one it calls ChatGPT. Set it in *OpenAI settings* on
the AI page, or copy `.env.example` to `.env`. Note Vite inlines `VITE_*` variables into
the bundle, so a key added that way is visible on a public deployment — the in-app field
keeps it in your own browser's `localStorage` instead.

---

## How the requirements are implemented

| Requirement | Where |
| --- | --- |
| SPA, React + TypeScript | `src/`, Vite `react-ts` template |
| Redux for global state | `src/store/` — `coinsSlice`, `selectionSlice`, `settingsSlice` |
| Avoid redundant server calls | `loadCoins` / `loadCoinPrices` use RTK `condition` to skip already-cached fetches |
| Navbar with menu + search | `src/components/Navbar.tsx` |
| Title + parallax background | `src/components/Hero.tsx` (`background-attachment: fixed`) |
| 100 coins as cards | `src/pages/HomePage.tsx` + `src/components/CoinCard.tsx` |
| Card: icon, symbol, name, More Info, Switch | `src/components/CoinCard.tsx` |
| Search on every keystroke, name **or** symbol, case-insensitive, no server call | `selectFilteredCoins` in `src/store/coinsSlice.ts` |
| More Info → price in USD / EUR / ILS with signs, animated | `CoinCard` + MUI `Collapse`; prices cached per coin |
| Switch marks a coin for the report + AI pages | `src/store/selectionSlice.ts` |
| Switches survive closing the browser | `localStorage`, wired in `src/store/store.ts` |
| Max 5 coins; the 6th opens a dialog with radio buttons | `src/components/LimitDialog.tsx` |
| No 6th coin via Esc / backdrop / X / Cancel | Only the **Replace** button mutates state |
| One report for all selected coins | `src/pages/ReportsPage.tsx` |
| One request per second for **all** coins together | `fetchLiveQuote` in `src/services/liveFeed.ts` — every provider issues exactly one request per tick |
| Report in USD only | All providers quote in USD |
| AI page lists only switched-on coins | `src/pages/AiPage.tsx` |
| Recommendation = verdict + explanation paragraph | `src/services/aiService.ts` |
| Prompt carries the 7 required fields | `fetchAiPayload` in `src/services/coinsApi.ts` |
| About page: project, personal details, photo | `src/pages/AboutPage.tsx` + `src/data/aboutData.ts` |

### APIs used

| # | Endpoint | Used for |
| --- | --- | --- |
| 1 | `api.coingecko.com/api/v3/coins/markets?vs_currency=usd` | Home page coin list |
| 2 | `api.coingecko.com/api/v3/coins/<id>` | More Info (USD / EUR / ILS) |
| 3 | `min-api.cryptocompare.com/data/pricemulti?tsyms=usd&fsyms=<symbols>` | Live report — kept, but needs a key (see above) |
| 3a | `api.coinbase.com/v2/exchange-rates?currency=USD` | Live report, keyless default |
| 3b | `api.binance.com/api/v3/ticker/price?symbols=[…]` | Live report, keyless alternative |
| 4 | `api.coingecko.com/api/v3/coins/<id>?market_data=true` | Data sent to ChatGPT |
| 5 | `api.openai.com/v1/chat/completions` | The recommendation |

Endpoint #1 is sent with `&order=market_cap_desc&per_page=100&page=1`. Those are
CoinGecko's own defaults, spelled out so the "100 coins" the task asks for cannot drift.

---

## Before you submit

1. **Edit `src/data/aboutData.ts`** — name, contact details, GitHub and LinkedIn URLs.
2. **Replace the photo** — drop your picture at `public/profile.jpg` and change `photo`
   in `aboutData.ts` to `` `${import.meta.env.BASE_URL}profile.jpg` ``.
3. `git push` — the site redeploys automatically.
4. Delete `node_modules`, zip the folder, upload it.

The GitHub repository and the live site are already up; the links are at the top of this
file.

---

## Deploying

`vite.config.ts` sets `base: './'` and the app uses `HashRouter`, so the build works from
any sub-path and deep links survive a refresh without server rewrite rules.

Serving the production build from a sub-path was verified locally before deploying:
`dist/` was served at `http://localhost:5199/VirtualCoinsProject/` and the home page, a
hard refresh on the deep link `#/about`, and the `public/profile.svg` image all resolved
correctly.

### GitHub Pages

Already live. `.github/workflows/deploy.yml` builds and publishes on every push to
`main`, with **Settings → Pages → Source** set to **GitHub Actions**. Just push and the
site updates:

```bash
git push
```

### Firebase Hosting

```bash
npm install -g firebase-tools
```

```bash
firebase login
```

```bash
firebase init hosting
```

Answer `dist` as the public directory and **yes** to "single-page app", then:

```bash
npm run build
```

```bash
firebase deploy
```

---

## Notes

- CoinGecko's free tier allows only a few calls per minute. If the home page comes back
  empty, that is the rate limit — wait a minute and reload. The app says so explicitly
  rather than showing an empty grid.
- `npm audit` reports a react-router advisory about RSC-mode CSRF. This app is a static
  client-side SPA with no server actions, so it is not affected.
- The AI page is a learning exercise, not financial advice.
