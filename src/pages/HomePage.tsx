import { Alert, Box, Button, CircularProgress, Container, Stack, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
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

  /**
   * A first attempt takes well under a second. If we are still loading after
   * three, the service is sitting in its rate-limit backoff — say so instead of
   * showing a spinner that looks stuck.
   */
  const [slowLoad, setSlowLoad] = useState(false);
  useEffect(() => {
    if (status !== 'loading') {
      setSlowLoad(false);
      return;
    }
    const timer = window.setTimeout(() => setSlowLoad(true), 3000);
    return () => window.clearTimeout(timer);
  }, [status]);

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
            <Typography color="text.secondary">
              {slowLoad
                ? 'CoinGecko is rate-limiting us — waiting for the limit to reset…'
                : 'Loading coins…'}
            </Typography>
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
