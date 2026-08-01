import CurrencyBitcoinIcon from '@mui/icons-material/CurrencyBitcoin';
import SearchIcon from '@mui/icons-material/Search';
import {
  AppBar,
  Badge,
  Box,
  Button,
  InputAdornment,
  TextField,
  Toolbar,
  Typography,
} from '@mui/material';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { selectSearch, setSearch } from '../store/coinsSlice';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { MAX_SELECTED, selectSelectedIds } from '../store/selectionSlice';

const LINKS = [
  { to: '/', label: 'Home' },
  { to: '/reports', label: 'Live Reports' },
  { to: '/ai', label: 'AI Insight' },
  { to: '/about', label: 'About' },
];

export default function Navbar() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const search = useAppSelector(selectSearch);
  const selectedCount = useAppSelector(selectSelectedIds).length;

  /** Searching only makes sense on the home page, so typing takes you there. */
  function handleSearch(value: string) {
    dispatch(setSearch(value));
    if (value && location.pathname !== '/') navigate('/');
  }

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        backgroundColor: 'rgba(11, 17, 32, 0.85)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(148,163,184,0.18)',
      }}
    >
      <Toolbar sx={{ gap: 1, flexWrap: 'wrap', py: 1 }}>
        <CurrencyBitcoinIcon sx={{ color: 'primary.main', fontSize: 32 }} />
        <Typography variant="h6" sx={{ mr: 2, letterSpacing: '0.08em' }}>
          CRYPTONITE
        </Typography>

        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
          {LINKS.map((link) => (
            <Button
              key={link.to}
              component={NavLink}
              to={link.to}
              end={link.to === '/'}
              // The badge wraps the label, so name the link explicitly.
              aria-label={link.label}
              sx={{
                color: 'text.secondary',
                '&.active': {
                  color: 'primary.main',
                  backgroundColor: 'rgba(240,185,11,0.10)',
                },
              }}
            >
              {link.label === 'Live Reports' || link.label === 'AI Insight' ? (
                <Badge
                  badgeContent={selectedCount}
                  color="primary"
                  invisible={selectedCount === 0}
                  sx={{ '& .MuiBadge-badge': { right: -10, top: 2 } }}
                >
                  {link.label}
                </Badge>
              ) : (
                link.label
              )}
            </Button>
          ))}
        </Box>

        <Box sx={{ flexGrow: 1 }} />

        <TextField
          size="small"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search name or symbol…"
          slotProps={{
            htmlInput: { 'aria-label': 'Search coins' },
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                </InputAdornment>
              ),
            },
          }}
          sx={{
            minWidth: { xs: '100%', sm: 260 },
            '& .MuiOutlinedInput-root': { backgroundColor: 'rgba(148,163,184,0.08)' },
          }}
        />

        <Typography variant="caption" sx={{ color: 'text.secondary', ml: 1 }}>
          {selectedCount}/{MAX_SELECTED} selected
        </Typography>
      </Toolbar>
    </AppBar>
  );
}
