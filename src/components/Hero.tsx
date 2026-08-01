import { Box, Typography } from '@mui/material';
import heroBg from '../assets/hero-bg.svg';

/**
 * Parallax hero. `background-attachment: fixed` keeps the artwork still while
 * the page scrolls over it, which is the movement the task asks for.
 */
export default function Hero() {
  return (
    <Box
      // Not <header> — the AppBar already is one, and two per page is invalid.
      component="section"
      aria-label="Cryptonite"
      sx={{
        position: 'relative',
        minHeight: { xs: 280, md: 420 },
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        px: 2,
        backgroundImage: `url(${heroBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        borderBottom: '1px solid rgba(148,163,184,0.18)',
        '&::after': {
          content: '""',
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, rgba(5,10,23,0.35) 0%, rgba(11,17,32,0.92) 100%)',
        },
      }}
    >
      <Box sx={{ position: 'relative', zIndex: 1 }}>
        <Typography
          variant="h1"
          sx={{
            fontSize: { xs: '2.75rem', sm: '4rem', md: '5.5rem' },
            background: 'linear-gradient(90deg, #f0b90b 0%, #ffe58a 45%, #22d3ee 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '0 0 60px rgba(240,185,11,0.25)',
          }}
        >
          Cryptonite
        </Typography>
        <Typography variant="h6" sx={{ mt: 1, color: 'text.secondary', fontWeight: 400 }}>
          Live prices, real-time reports and AI insight for the top 100 virtual coins
        </Typography>
      </Box>
    </Box>
  );
}
