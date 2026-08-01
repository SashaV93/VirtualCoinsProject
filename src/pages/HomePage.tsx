import { Alert, Box, Button, CircularProgress, Container, Stack, Typography } from '@mui/material';
import { useEffect } from 'react';
import CoinCard from '../components/CoinCard';
import Hero from '../components/Hero';
import { loadCoins, selectFilteredCoins, selectSearch } from '../store/coinsSlice';
import { useAppDispatch, useAppSelector } from '../store/hooks';

export default function HomePage() {
  const dispatch = useAppDispatch();
  const coins = useAppSelector(selectFilteredCoins);
  const search = useAppSelector(selectSearch);
  const status = useAppSelector((s) => s.coins.status);
  const error = useAppSelector((s) => s.coins.error);
  const total = useAppSelector((s) => s.coins.list.length);

  // The thunk's `condition` makes this a no-op once the list is in the store,
  // so navigating back here never hits the network again.
  useEffect(() => {
    void dispatch(loadCoins());
  }, [dispatch]);

  return (
    <>
      <Hero />
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1}
          sx={{ mb: 3, justifyContent: 'space-between', alignItems: { sm: 'baseline' } }}
        >
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Top virtual coins
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {search
              ? `${coins.length} of ${total} coins match “${search}”`
              : `${total} coins`}
          </Typography>
        </Stack>

        {status === 'loading' && (
          <Stack spacing={2} sx={{ py: 8, alignItems: 'center' }}>
            <CircularProgress />
            <Typography color="text.secondary">Loading coins…</Typography>
          </Stack>
        )}

        {status === 'failed' && (
          <Alert
            severity="error"
            action={
              <Button color="inherit" size="small" onClick={() => void dispatch(loadCoins())}>
                Retry
              </Button>
            }
          >
            {error}
          </Alert>
        )}

        {status === 'succeeded' && coins.length === 0 && search && (
          <Alert severity="info">No coin matches “{search}”. Try a different name or symbol.</Alert>
        )}

        {/* A 200 OK with an empty body is not the same thing as "no match". */}
        {status === 'succeeded' && total === 0 && (
          <Alert
            severity="warning"
            action={
              <Button color="inherit" size="small" onClick={() => window.location.reload()}>
                Reload
              </Button>
            }
          >
            CoinGecko returned no coins. This usually means the free-tier rate limit was hit —
            wait a minute and reload.
          </Alert>
        )}

        {coins.length > 0 && (
          <Box
            sx={{
              display: 'grid',
              gap: 2,
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(3, 1fr)',
                lg: 'repeat(4, 1fr)',
                xl: 'repeat(5, 1fr)',
              },
            }}
          >
            {coins.map((coin) => (
              <CoinCard key={coin.id} coin={coin} />
            ))}
          </Box>
        )}
      </Container>
    </>
  );
}
