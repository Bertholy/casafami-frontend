import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './montagne.css';
import './staff.css';
import App from './App.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import './domGuard'; // ← Ajoute cette ligne tout en haut




createRoot(document.getElementById('root')).render(
    <StrictMode>
        <ThemeProvider>
            <App />
        </ThemeProvider>
    </StrictMode>
);