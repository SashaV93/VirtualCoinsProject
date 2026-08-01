import { Box, Container, Typography } from '@mui/material';
import { Navigate, Route, Routes } from 'react-router-dom';
import LimitDialog from './components/LimitDialog';
import Navbar from './components/Navbar';
import AboutPage from './pages/AboutPage';
import AiPage from './pages/AiPage';
import HomePage from './pages/HomePage';
import ReportsPage from './pages/ReportsPage';

export default function App() {
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <Box component="main" sx={{ flexGrow: 1 }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/ai" element={<AiPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Box>

      {/* Rendered once at app level so the 5-coin rule holds on every page. */}
      <LimitDialog />

      <Box component="footer" sx={{ py: 3, mt: 4, borderTop: '1px solid rgba(148,163,184,0.16)' }}>
        <Container maxWidth="xl">
          <Typography variant="caption" color="text.secondary">
            Cryptonite — John Bryce Full Stack Web Developer, second project. Data from CoinGecko
            and CryptoCompare. Not financial advice.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}
