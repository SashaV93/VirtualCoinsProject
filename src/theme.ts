import { createTheme } from '@mui/material/styles';

/** Dark "crypto terminal" look: deep navy surfaces with a gold accent. */
export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#f0b90b' },
    secondary: { main: '#22d3ee' },
    success: { main: '#16c784' },
    error: { main: '#ea3943' },
    background: { default: '#0b1120', paper: '#141c2f' },
    text: { primary: '#e9eef7', secondary: '#94a3b8' },
  },
  typography: {
    fontFamily: '"Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    h1: { fontWeight: 800, letterSpacing: '0.06em' },
    h6: { fontWeight: 700 },
  },
  shape: { borderRadius: 14 },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: '1px solid rgba(148, 163, 184, 0.16)',
          transition: 'transform .18s ease, border-color .18s ease',
          '&:hover': { transform: 'translateY(-4px)', borderColor: 'rgba(240, 185, 11, 0.5)' },
        },
      },
    },
    MuiButton: { styleOverrides: { root: { textTransform: 'none', fontWeight: 600 } } },
  },
});
