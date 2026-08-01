import CloseIcon from '@mui/icons-material/Close';
import {
  Alert,
  Avatar,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  Radio,
  RadioGroup,
  Stack,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { selectCoins } from '../store/coinsSlice';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  MAX_SELECTED,
  cancelPending,
  selectPendingCoinId,
  selectSelectedIds,
  swapCoin,
} from '../store/selectionSlice';

/**
 * Opens when the user tries to switch on a sixth coin.
 * Every exit route other than "Replace" leaves the selection untouched, so a
 * sixth coin can never slip in via Esc, the backdrop, or the X.
 */
export default function LimitDialog() {
  const dispatch = useAppDispatch();
  const pendingId = useAppSelector(selectPendingCoinId);
  const selectedIds = useAppSelector(selectSelectedIds);
  const coins = useAppSelector(selectCoins);

  const [toRemove, setToRemove] = useState('');

  // Default to the first selected coin each time the dialog opens.
  useEffect(() => {
    if (pendingId) setToRemove(selectedIds[0] ?? '');
  }, [pendingId, selectedIds]);

  const pendingCoin = coins.find((c) => c.id === pendingId);
  const selectedCoins = selectedIds
    .map((id) => coins.find((c) => c.id === id))
    .filter((c): c is NonNullable<typeof c> => Boolean(c));

  const close = () => dispatch(cancelPending());

  return (
    <Dialog open={Boolean(pendingId)} onClose={close} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ pr: 6 }}>
        You can only track {MAX_SELECTED} coins
        <IconButton onClick={close} aria-label="Close" sx={{ position: 'absolute', right: 8, top: 8 }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Alert severity="info" variant="outlined" sx={{ mb: 2 }}>
          To add <strong>{pendingCoin?.name ?? 'this coin'}</strong>, pick a coin to remove.
        </Alert>

        <RadioGroup value={toRemove} onChange={(e) => setToRemove(e.target.value)}>
          {selectedCoins.map((coin) => (
            <FormControlLabel
              key={coin.id}
              value={coin.id}
              control={<Radio />}
              sx={{ borderRadius: 2, m: 0, py: 0.5, '&:hover': { backgroundColor: 'rgba(148,163,184,0.08)' } }}
              label={
                <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                  <Avatar src={coin.image} alt={coin.name} sx={{ width: 28, height: 28 }} />
                  <Typography>{coin.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {coin.symbol.toUpperCase()}
                  </Typography>
                </Stack>
              }
            />
          ))}
        </RadioGroup>
      </DialogContent>

      <DialogActions>
        <Button onClick={close} color="inherit">
          Cancel
        </Button>
        <Button
          variant="contained"
          disabled={!toRemove}
          onClick={() => dispatch(swapCoin(toRemove))}
        >
          Replace
        </Button>
      </DialogActions>
    </Dialog>
  );
}
