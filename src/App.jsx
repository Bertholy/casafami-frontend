import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import SiteEditorBar from './components/site/SiteEditorBar';
import { SiteContentProvider } from './context/SiteContentContext';
import Accueil from './pages/Accueil';
import Services from './pages/Services';
import PrendreRdv from './pages/PrendreRdv';
import MesRdv from './pages/MesRdv';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Calendrier from './pages/Calendrier';
import Statistiques from './pages/Statistiques';
import DossierPatient from './pages/DossierPatient';
import AssistantOrdonnance from './pages/AssistantOrdonnance';
import MaladiesMedecin from './pages/MaladiesMedecin';
import AdminUsers from './pages/AdminUsers';
import AdminServices from './pages/AdminServices';
import AdminTheme from './pages/AdminTheme';
import AdminPlanning from './pages/AdminPlanning';
import AdminJournal from './pages/AdminJournal';
import AdminOccupation from './pages/AdminOccupation';
import Corbeille from './pages/Corbeille';

// Pages qui ont leur propre barre latérale (AdminLayout) : ni barre de navigation publique ni pied de page.
const STAFF_PREFIXES = ['/medecin/dashboard', '/medecin/maladies', '/espace/', '/admin', '/corbeille', '/calendrier', '/statistiques', '/patients', '/assistant'];

function NotFound() {
    return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-4 text-center">
            <p className="text-6xl font-bold text-teal-600">404</p>
            <p className="text-gray-600 dark:text-gray-300">Cette page n’existe pas.</p>
            <Link to="/" className="rounded-xl bg-teal-600 px-5 py-2.5 font-semibold text-white hover:bg-teal-700">Retour à l’accueil</Link>
        </div>
    );
}

function AppContent() {
    const location = useLocation();
    const isStaffPage = STAFF_PREFIXES.some(prefix => location.pathname.startsWith(prefix));
    const isLogin = location.pathname === '/medecin/login';
    const isPublicPage = !isStaffPage && !isLogin;
    return (
        <>
            <ScrollToTop />
            <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900 transition-colors">
                {isPublicPage && <Navbar />}
                <main className="grow">
                    <Routes>
                        <Route path="/" element={<Accueil />} />
                        <Route path="/services" element={<Services />} />
                        <Route path="/prendre-rdv" element={<PrendreRdv />} />
                        <Route path="/mes-rdv" element={<MesRdv />} />
                        <Route path="/medecin/login" element={<Login />} />
                        <Route path="/medecin/dashboard" element={<Dashboard />} />
                        <Route path="/espace/sage-femme" element={<Dashboard />} />
                        <Route path="/espace/secretariat" element={<Dashboard />} />
                        <Route path="/admin/dashboard" element={<Dashboard />} />
                        <Route path="/calendrier" element={<Calendrier />} />
                        <Route path="/statistiques" element={<Statistiques />} />
                        <Route path="/patients/dossier" element={<DossierPatient />} />
                        <Route path="/assistant/ordonnance" element={<AssistantOrdonnance />} />
                        <Route path="/corbeille" element={<Corbeille />} />
                        <Route path="/admin/utilisateurs" element={<AdminUsers />} />
                        <Route path="/admin/services" element={<AdminServices />} />
                        <Route path="/admin/planning" element={<AdminPlanning />} />
                        <Route path="/admin/journal" element={<AdminJournal />} />
                        <Route path="/admin/occupation" element={<AdminOccupation />} />
                        <Route path="/admin/personnalisation" element={<AdminTheme />} />
                        <Route path="/medecin/maladies" element={<MaladiesMedecin />} />
                        <Route path="*" element={<NotFound />} />
                    </Routes>
                </main>
                {isPublicPage && <Footer />}
            </div>
            {isPublicPage && <SiteEditorBar />}
        </>
    );
}

function App() {
    return (
        <BrowserRouter>
            <SiteContentProvider>
                <AppContent />
            </SiteContentProvider>
        </BrowserRouter>
    );
}

export default App;
