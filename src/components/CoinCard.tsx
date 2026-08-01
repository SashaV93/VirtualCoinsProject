import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Collapse,
  Divider,
  Stack,
  Switch,
  Tooltip,
  Typography,
} from '@mui/material';
import { memo } from 'react';
import { loadCoinPrices, toggleExpanded } from '../store/coinsSlice';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { toggleCoin } from '../store/selectionSlice';
import type { Coin } from '../types/coin';
import { formatPrice } from '../utils/format';

/** The three currencies "More Info" has to show, with their signs. */
const CURRENCIES = [
  { key: 'usd', sign: '$', label: 'USD' },
  { key: 'eur', sign: '€', label: 'EUR' },
  { key: 'ils', sign: '₪', label: 'ILS' },
] as const;

interface Props {
  coin: Coin;
}

function CoinCard({ coin }: Props) {
  const dispatch = useAppDispatch();
  const isSelected = useAppSelector((s) => s.selection.ids.includes(coin.id));
  const isExpanded = useAppSelector((s) => s.coins.expanded.includes(coin.id));
  const priceEntry = useAppSelector((s) => s.coins.prices[coin.id]);

  function handleMoreInfo() {
    dispatch(toggleExpanded(coin.id));
    // The thunk short-circuits when the prices are already cached.
    if (!isExpanded) dispatch(loadCoinPrices(coin.id));
  }

  const change = coin.price_change_percentage_24h;

  return (
    <Card sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          <Avatar src={coin.image} alt={coin.name} sx={{ width: 44, height: 44 }} />
          <Box sx={{ minWidth: 0, flexGrow: 1 }}>
            <Typography variant="subtitle1" noWrap title={coin.name} sx={{ fontWeight: 700 }}>
              {coin.name}
            </Typography>
            <Typography variant="body2" sx={{ color: 'primary.main', letterSpacing: '0.06em' }}>
              {coin.symbol.toUpperCase()}
            </Typography>
          </Box>
          <Tooltip
            title={
              isSelected
                ? 'Selected — appears in Live Reports and AI Insight'
                : 'Select to track in Live Reports and AI Insight'
            }
          >
            <Switch
              checked={isSelected}
              onChange={() => dispatch(toggleCoin(coin.id))}
              slotProps={{ input: { 'aria-label': `Track ${coin.name}` } }}
            />
          </Tooltip>
        </Stack>

        <Stack direction="row" spacing={1} sx={{ mt: 2, alignItems: 'center' }}>
          <Typography variant="h6">${formatPrice(coin.current_price)}</Typography>
          {change !== null && (
            <Chip
              size="small"
              label={`${change >= 0 ? '▲' : '▼'} ${Math.abs(change).toFixed(2)}%`}
              color={change >= 0 ? 'success' : 'error'}
              variant="outlined"
            />
          )}
        </Stack>

        <Collapse in={isExpanded} timeout={350} unmountOnExit>
          <Divider sx={{ my: 2 }} />
          {priceEntry?.status === 'loading' && (
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <CircularProgress size={18} />
              <Typography variant="body2" color="text.secondary">
                Loading exchange rates…
              </Typography>
            </Stack>
          )}
          {priceEntry?.status === 'failed' && (
            <Alert severity="error" variant="outlined">
              {priceEntry.error}
            </Alert>
          )}
          {priceEntry?.status === 'succeeded' && priceEntry.data && (
            <Stack spacing={0.75}>
              {CURRENCIES.map((c) => (
                <Stack key={c.key} direction="row" sx={{ justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    {c.label}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {c.sign}
                    {formatPrice(priceEntry.data![c.key])}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          )}
        </Collapse>
      </CardContent>

      <Box sx={{ px: 2, pb: 2 }}>
        <Button
          fullWidth
          size="small"
          variant={isExpanded ? 'contained' : 'outlined'}
          onClick={handleMoreInfo}
          endIcon={isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        >
          More Info
        </Button>
      </Box>
    </Card>
  );
}

// The home page renders 100 of these; memo keeps typing in the search box smooth.
export default memo(CoinCard);
