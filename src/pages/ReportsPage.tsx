import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Avatar,
  Box,
  Chip,
  Container,
  FormControlLabel,
  Link,
  MenuItem,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  PROVIDER_LABELS,
  fetchLiveQuote,
  type LiveProvider,
} from '../services/liveFeed';
import { loadCoins } from '../store/coinsSlice';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { selectSelectedIds } from '../store/selectionSlice';
import {
  selectCryptoCompareKey,
  selectLiveProvider,
  setCryptoCompareKey,
  setLiveProvider,
} from '../store/settingsSlice';
import { formatPrice } from '../utils/format';

/** How many seconds of history the chart keeps on screen. */
const HISTORY_POINTS = 60;
const POLL_MS = 1000;

const LINE_COLORS = ['#f0b90b', '#22d3ee', '#16c784', '#c084fc', '#fb7185'];

const PROVIDER_NOTES: Record<LiveProvider, string> = {
  coinbase: 'Keyless. One call returns every currency Coinbase lists.',
  binance: 'Keyless. Quotes against USDT — widest altcoin coverage.',
  cryptocompare: 'The endpoint named in the task sheet. Needs a free API key.',
  demo: 'Prices are generated in your browser. Nothing is fetched.',
};

type ChartRow = { label: string } & Record<string, number | string>;

export default function ReportsPage() {
  const dispatch = useAppDispatch();
  const coins = useAppSelector((s) => s.coins.list);
  const selectedIds = useAppSelector(selectSelectedIds);
  const ccKey = useAppSelector(selectCryptoCompareKey);
  const provider = useAppSelector(selectLiveProvider);

  const [rows, setRows] = useState<ChartRow[]>([]);
  const [latest, setLatest] = useState<Record<string, number>>({});
  const [missing, setMissing] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [ticks, setTicks] = useState(0);

  /** Latest simulated tick, kept in a ref so the poller stays a stable closure. */
  const demoPrices = useRef<Record<string, number>>({});

  /** null = pick automatically from the price spread; boolean = user's choice. */
  const [scaleOverride, setScaleOverride] = useState<boolean | null>(null);

  // Needed when the user lands straight on /reports — we still want coin metadata.
  useEffect(() => {
    void dispatch(loadCoins());
  }, [dispatch]);

  /** One entry per distinct symbol; first coin wins if two share a symbol. */
  const tracked = useMemo(() => {
    const bySymbol = new Map<
      string,
      { id: string; name: string; symbol: string; image: string; seedPrice: number }
    >();
    for (const id of selectedIds) {
      const coin = coins.find((c) => c.id === id);
      if (!coin) continue;
      const symbol = coin.symbol.toUpperCase();
      if (!bySymbol.has(symbol)) {
        bySymbol.set(symbol, {
          id: coin.id,
          name: coin.name,
          symbol,
          image: coin.image,
          seedPrice: coin.current_price,
        });
      }
    }
    return [...bySymbol.values()];
  }, [selectedIds, coins]);

  const symbolKey = tracked.map((t) => t.symbol).join(',');
  const seedKey = tracked.map((t) => `${t.symbol}:${t.seedPrice}`).join(',');

  useEffect(() => {
    // Starting a new set of coins means the old series is meaningless.
    setRows([]);
    setLatest({});
    setMissing([]);
    setError(null);
    setTicks(0);
    demoPrices.current = {};

    if (!symbolKey) return;

    const symbols = symbolKey.split(',');
    const seeds = Object.fromEntries(
      seedKey.split(',').map((pair) => {
        const [symbol, price] = pair.split(':');
        return [symbol, Number(price)];
      }),
    );
    let cancelled = false;
    let inFlight = false;

    async function poll() {
      // Skip a beat rather than stacking requests if the network is slow.
      if (inFlight) return;
      inFlight = true;
      try {
        // A SINGLE request returns every selected coin at once.
        const quote = await fetchLiveQuote(provider, symbols, {
          cryptoCompareKey: ccKey,
          demoPrevious: demoPrices.current,
          demoSeeds: seeds,
        });
        if (provider === 'demo') demoPrices.current = quote.prices;
        if (cancelled) return;

        setError(null);
        setMissing(quote.missing);
        setLatest(quote.prices);
        setTicks((t) => t + 1);
        setRows((prev) => {
          const row: ChartRow = {
            label: new Date().toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            }),
            ...quote.prices,
          };
          return [...prev, row].slice(-HISTORY_POINTS);
        });
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Live update failed.');
      } finally {
        inFlight = false;
      }
    }

    void poll();
    const timer = window.setInterval(() => void poll(), POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [symbolKey, seedKey, ccKey, provider]);

  /**
   * A $90,000 coin and a $0.20 coin on one linear axis flattens the cheap one
   * into the baseline, so default to a log axis once the spread gets wide.
   */
  const useLog = useMemo(() => {
    if (scaleOverride !== null) return scaleOverride;
    const values = Object.values(latest).filter((v) => v > 0);
    if (values.length < 2) return false;
    return Math.max(...values) / Math.min(...values) > 20;
  }, [scaleOverride, latest]);

  /** Only the coins this provider actually quotes get a line on the chart. */
  const plotted = tracked.filter((c) => !missing.includes(c.symbol));

  /** Provider picker + CryptoCompare key, shown in both page states. */
  const settingsPanel = (
    <Accordion sx={{ mt: 3, backgroundImage: 'none' }}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <Typography>Live feed settings</Typography>
          <Chip
            size="small"
            variant="outlined"
            color={provider === 'demo' ? 'warning' : 'success'}
            label={PROVIDER_LABELS[provider]}
          />
        </Stack>
      </AccordionSummary>
      <AccordionDetails>
        <Stack spacing={2}>
          <TextField
            select
            size="small"
            fullWidth
            label="Price provider"
            value={provider}
            onChange={(e) => dispatch(setLiveProvider(e.target.value as LiveProvider))}
            helperText={PROVIDER_NOTES[provider]}
          >
            {(Object.keys(PROVIDER_LABELS) as LiveProvider[]).map((key) => (
              <MenuItem key={key} value={key}>
                {PROVIDER_LABELS[key]}
              </MenuItem>
            ))}
          </TextField>

          {provider === 'cryptocompare' && (
            <TextField
              label="CryptoCompare (CoinDesk) API key"
              type="password"
              size="small"
              fullWidth
              value={ccKey}
              onChange={(e) => dispatch(setCryptoCompareKey(e.target.value))}
              helperText={
                <>
                  Free keys at{' '}
                  <Link href="https://developers.coindesk.com/" target="_blank" rel="noopener noreferrer">
                    developers.coindesk.com
                  </Link>
                  . Stored only in this browser's localStorage.
                </>
              }
            />
          )}
        </Stack>
      </AccordionDetails>
    </Accordion>
  );

  if (tracked.length === 0) {
    return (
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 700 }}>
          Live Reports
        </Typography>
        <Alert severity="info">
          No coins are being tracked yet. Go to the{' '}
          <RouterLink to="/" style={{ color: '#f0b90b' }}>
            home page
          </RouterLink>{' '}
          and switch on up to five coins to see them here in real time.
        </Alert>
        {settingsPanel}
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1}
        sx={{ mb: 3, justifyContent: 'space-between', alignItems: { sm: 'center' } }}
      >
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Live Reports
          </Typography>
          <Typography variant="body2" color="text.secondary">
            One request per second returns all {tracked.length} coins together — prices in USD.
          </Typography>
        </Box>
        <Chip
          color={error ? 'error' : provider === 'demo' ? 'warning' : 'success'}
          variant="outlined"
          label={
            error
              ? 'Disconnected'
              : `${provider === 'demo' ? 'Simulated' : PROVIDER_LABELS[provider]} · ${ticks} updates`
          }
        />
      </Stack>

      {provider === 'demo' && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <strong>Demo mode is on.</strong> These prices are generated in the browser, not fetched
          from an exchange. Pick a real provider in Live feed settings below.
        </Alert>
      )}

      {error && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {error} — retrying every second.
        </Alert>
      )}

      {missing.length > 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {PROVIDER_LABELS[provider]} does not quote {missing.join(', ')}. Those coins are left off
          the chart — try another provider in Live feed settings below.
        </Alert>
      )}

      <Box
        sx={{
          display: 'grid',
          gap: 1.5,
          gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: `repeat(${tracked.length}, 1fr)` },
          mb: 3,
        }}
      >
        {tracked.map((coin, i) => (
          <Paper
            key={coin.symbol}
            sx={{ p: 1.5, borderTop: `3px solid ${LINE_COLORS[i % LINE_COLORS.length]}` }}
          >
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <Avatar src={coin.image} alt={coin.name} sx={{ width: 24, height: 24 }} />
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                {coin.symbol}
              </Typography>
            </Stack>
            <Typography variant="h6" sx={{ mt: 0.5 }}>
              {latest[coin.symbol] !== undefined ? `$${formatPrice(latest[coin.symbol])}` : '—'}
            </Typography>
          </Paper>
        ))}
      </Box>

      <Stack direction="row" sx={{ justifyContent: 'flex-end', mb: 1 }}>
        <FormControlLabel
          control={
            <Switch
              size="small"
              checked={useLog}
              onChange={(e) => setScaleOverride(e.target.checked)}
            />
          }
          label={<Typography variant="body2">Logarithmic scale</Typography>}
        />
      </Stack>

      <Paper sx={{ p: 2, height: 460 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={rows} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.16)" />
            <XAxis dataKey="label" stroke="#94a3b8" fontSize={12} minTickGap={40} />
            <YAxis
              stroke="#94a3b8"
              fontSize={12}
              scale={useLog ? 'log' : 'linear'}
              domain={['auto', 'auto']}
              width={80}
              tickFormatter={(v: number) => `$${v.toLocaleString()}`}
            />
            <Tooltip
              contentStyle={{
                background: '#141c2f',
                border: '1px solid rgba(148,163,184,0.3)',
                borderRadius: 10,
              }}
              formatter={(value) => [`$${formatPrice(Number(value))}`, '']}
            />
            <Legend />
            {plotted.map((coin) => (
              <Line
                key={coin.symbol}
                type="monotone"
                dataKey={coin.symbol}
                name={`${coin.name} (${coin.symbol})`}
                stroke={LINE_COLORS[tracked.indexOf(coin) % LINE_COLORS.length]}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </Paper>

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
        Showing the last {HISTORY_POINTS} seconds. Source:{' '}
        {provider === 'demo' ? 'simulated locally' : PROVIDER_LABELS[provider]}.
      </Typography>

      {settingsPanel}
    </Container>
  );
}
