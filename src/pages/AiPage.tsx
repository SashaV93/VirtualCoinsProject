import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ThumbDownAltIcon from '@mui/icons-material/ThumbDownAlt';
import ThumbUpAltIcon from '@mui/icons-material/ThumbUpAlt';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { getRecommendation } from '../services/aiService';
import { fetchAiPayload } from '../services/coinsApi';
import { loadCoins } from '../store/coinsSlice';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { selectSelectedIds } from '../store/selectionSlice';
import { selectApiKey, selectModel } from '../store/settingsSlice';
import type { AiPayload, AiRecommendation, LoadStatus } from '../types/coin';
import { formatCompactUsd, formatPrice } from '../utils/format';

interface Entry {
  status: LoadStatus;
  payload: AiPayload | null;
  result: AiRecommendation | null;
  error: string | null;
}

const pct = (n: number) => `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`;

export default function AiPage() {
  const dispatch = useAppDispatch();
  const coins = useAppSelector((s) => s.coins.list);
  const selectedIds = useAppSelector(selectSelectedIds);
  const apiKey = useAppSelector(selectApiKey);
  const model = useAppSelector(selectModel);

  const [entries, setEntries] = useState<Record<string, Entry>>({});

  useEffect(() => {
    void dispatch(loadCoins());
  }, [dispatch]);

  const selectedCoins = selectedIds
    .map((id) => coins.find((c) => c.id === id))
    .filter((c): c is NonNullable<typeof c> => Boolean(c));

  async function analyse(coinId: string, coinName: string) {
    setEntries((prev) => ({
      ...prev,
      [coinId]: { status: 'loading', payload: null, result: null, error: null },
    }));
    try {
      // API #4 gives us exactly the seven fields the prompt needs…
      const payload = await fetchAiPayload(coinId, coinName);
      // …and API #5 (or the local fallback) turns them into a verdict.
      const result = await getRecommendation(payload, apiKey, model);
      setEntries((prev) => ({
        ...prev,
        [coinId]: { status: 'succeeded', payload, result, error: null },
      }));
    } catch (err) {
      setEntries((prev) => ({
        ...prev,
        [coinId]: {
          status: 'failed',
          payload: null,
          result: null,
          error: err instanceof Error ? err.message : 'Analysis failed.',
        },
      }));
    }
  }

  if (selectedCoins.length === 0) {
    return (
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 700 }}>
          AI Insight
        </Typography>
        <Alert severity="info">
          No coins are selected. Go to the{' '}
          <RouterLink to="/" style={{ color: '#f0b90b' }}>
            home page
          </RouterLink>{' '}
          and switch on the coins you want an AI recommendation for.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h5" sx={{ fontWeight: 700 }}>
        AI Insight
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Ask for a buy / avoid recommendation on each of the coins you are tracking.
      </Typography>

      <Stack spacing={2} sx={{ mt: 3 }}>
        {selectedCoins.map((coin) => {
          const entry = entries[coin.id];
          return (
            <Paper key={coin.id} sx={{ p: 2.5 }}>
              <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                <Avatar src={coin.image} alt={coin.name} />
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 700 }}>{coin.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {coin.symbol.toUpperCase()} · ${formatPrice(coin.current_price)}
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  startIcon={
                    entry?.status === 'loading' ? (
                      <CircularProgress size={16} color="inherit" />
                    ) : (
                      <AutoAwesomeIcon />
                    )
                  }
                  disabled={entry?.status === 'loading'}
                  onClick={() => void analyse(coin.id, coin.name)}
                >
                  {entry?.result ? 'Re-analyse' : 'Get recommendation'}
                </Button>
              </Stack>

              {entry?.status === 'failed' && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {entry.error}
                </Alert>
              )}

              {entry?.status === 'succeeded' && entry.result && entry.payload && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Stack direction="row" spacing={1} sx={{ mb: 1.5, alignItems: 'center' }}>
                    <Chip
                      icon={entry.result.worthBuying ? <ThumbUpAltIcon /> : <ThumbDownAltIcon />}
                      color={entry.result.worthBuying ? 'success' : 'error'}
                      label={entry.result.worthBuying ? 'Worth buying' : 'Not worth buying'}
                    />
                    {/* Never let a locally-computed verdict pass for a ChatGPT one. */}
                    <Chip
                      size="small"
                      variant="outlined"
                      label={
                        entry.result.source === 'openai' ? `ChatGPT · ${model}` : 'Rule-based analysis'
                      }
                    />
                  </Stack>

                  <Typography variant="body2" sx={{ lineHeight: 1.7 }}>
                    {entry.result.explanation}
                  </Typography>

                  <Box
                    sx={{
                      mt: 2,
                      display: 'grid',
                      gap: 1,
                      gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)' },
                    }}
                  >
                    {[
                      ['Price', `$${formatPrice(entry.payload.current_price_usd)}`],
                      ['Market cap', formatCompactUsd(entry.payload.market_cap_usd)],
                      ['24h volume', formatCompactUsd(entry.payload.volume_24h_usd)],
                      ['30 days', pct(entry.payload.price_change_percentage_30d_in_currency)],
                      ['60 days', pct(entry.payload.price_change_percentage_60d_in_currency)],
                      ['200 days', pct(entry.payload.price_change_percentage_200d_in_currency)],
                    ].map(([label, value]) => (
                      <Box
                        key={label}
                        sx={{ p: 1, borderRadius: 2, backgroundColor: 'rgba(148,163,184,0.08)' }}
                      >
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                          {label}
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {value}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </>
              )}
            </Paper>
          );
        })}
      </Stack>

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 3 }}>
        For learning purposes only — not financial advice.
      </Typography>
    </Container>
  );
}
