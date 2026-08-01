import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
// HashRouter (not BrowserRouter) so deep links survive a refresh on static
// hosts such as GitHub Pages, which have no server-side rewrite rules.
import { HashRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { store } from './store/store';
import { theme } from './theme';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <HashRouter>
          <App />
        </HashRouter>
      </ThemeProvider>
    </Provider>
  </StrictMode>,
);
