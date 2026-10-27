import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './montagne.css';
import './staff.css';
import './doux.css';
import './shadcn.css';
import './staff-marine.css'; // nouveau thème du personnel ; supprimer cette ligne pour revenir à l'ancien aspect
import './staff-neumorphisme.css'; // style « neumorphisme » au choix dans l'espace du personnel (bouton de l'en-tête)
import './staff-encoche.css'; // style « encoche » au choix dans l'espace du personnel : menu bleu, onglet blanc qui suit le curseur
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
// Application installable (PWA) : le service worker n'est enregistré qu'en production, pour ne pas gêner le rechargement de Vite en développement.
// L'invitation à installer peut arriver avant que le bouton « Installer l'application » soit affiché : on la garde ici.
window.addEventListener('beforeinstallprompt', evenement => { evenement.preventDefault(); window.invitationInstallation = evenement; });
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(erreur => console.warn('Service worker non enregistré', erreur));
    });
}

// Retire le préchargeur (index.html) : au moins 0,7 s d'affichage, une fois le site dessiné et les polices prêtes (1,5 s au plus).
const precharge = document.getElementById('precharge');
if (precharge) {
    const police = Promise.race([document.fonts?.ready ?? Promise.resolve(), new Promise(resolve => setTimeout(resolve, 1500))]);
    requestAnimationFrame(() => requestAnimationFrame(() => {
        police.then(() => setTimeout(() => {
            precharge.classList.add('precharge-fin');
            setTimeout(() => precharge.remove(), 700);
        }, Math.max(0, 700 - performance.now())));
    }));
}
