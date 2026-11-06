import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import App from './App';
import './styles.css';

const theme = createTheme({ palette: { mode: 'dark', primary: { main: '#6c63ff' }, background: { default: '#0d1117', paper: '#151b24' } }, typography: { fontFamily: 'Inter, Segoe UI, sans-serif' }, shape: { borderRadius: 10 } });
createRoot(document.getElementById('root')!).render(<StrictMode><ThemeProvider theme={theme}><CssBaseline /><App /></ThemeProvider></StrictMode>);
