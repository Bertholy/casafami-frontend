import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import SiteEditorBar from './components/site/SiteEditorBar';
import TextesAjoutes from './components/site/TextesAjoutes';
import { SiteContentProvider } from './context/SiteContentContext';
import { LangProvider } from './i18n/LangContext';
import { PAGES_EDITABLES, STAFF_PREFIXES } from './constants/routes';

// Chaque page est chargée seulement quand on la visite : le premier affichage du site est beaucoup plus léger.
const Accueil = lazy(() => import('./pages/Accueil'));
const Services = lazy(() => import('./pages/Services'));
const PrendreRdv = lazy(() => import('./pages/PrendreRdv'));
const MesRdv = lazy(() => import('./pages/MesRdv'));
const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Calendrier = lazy(() => import('./pages/Calendrier'));
const Statistiques = lazy(() => import('./pages/Statistiques'));
const DossierPatient = lazy(() => import('./pages/DossierPatient'));
const AssistantOrdonnance = lazy(() => import('./pages/AssistantOrdonnance'));
const MaladiesMedecin = lazy(() => import('./pages/MaladiesMedecin'));
const AdminUsers = lazy(() => import('./pages/AdminUsers'));
const AdminServices = lazy(() => import('./pages/AdminServices'));
const AdminTheme = lazy(() => import('./pages/AdminTheme'));
const AdminPlanning = lazy(() => import('./pages/AdminPlanning'));
const AdminJournal = lazy(() => import('./pages/AdminJournal'));
const AdminOccupation = lazy(() => import('./pages/AdminOccupation'));
const AdminSauvegardes = lazy(() => import('./pages/AdminSauvegardes'));
const AdminPermissions = lazy(() => import('./pages/AdminPermissions'));
const MesPatients = lazy(() => import('./pages/MesPatients'));
const SuiviMaternite = lazy(() => import('./pages/SuiviMaternite'));
const Messagerie = lazy(() => import('./pages/Messagerie'));
const MotDePasseOublie = lazy(() => import('./pages/MotDePasseOublie'));
const ReinitialiserMotDePasse = lazy(() => import('./pages/ReinitialiserMotDePasse'));
const Corbeille = lazy(() => import('./pages/Corbeille'));

function Chargement() {
    return (
        <div className="flex min-h-[50vh] items-center justify-center" role="status" aria-label="Chargement">
            <span className="h-8 w-8 animate-spin rounded-full border-4 border-teal-200 border-t-teal-600" />
        </div>
    );
}

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
    const isLogin = ['/medecin/login', '/medecin/mot-de-passe-oublie', '/medecin/reinitialiser'].includes(location.pathname);
    const isPublicPage = !isStaffPage && !isLogin;
    return (
        <>
            <ScrollToTop />
            <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900 transition-colors">
                {isPublicPage && <Navbar />}
                <main className="grow">
                    {isPublicPage && PAGES_EDITABLES[location.pathname] && <TextesAjoutes page={PAGES_EDITABLES[location.pathname]} zone="haut" />}
                    <Suspense fallback={<Chargement />}>
                    <Routes>
                        <Route path="/" element={<Accueil />} />
                        <Route path="/services" element={<Services />} />
                        <Route path="/prendre-rdv" element={<PrendreRdv />} />
                        <Route path="/mes-rdv" element={<MesRdv />} />
                        <Route path="/medecin/login" element={<Login />} />
                        <Route path="/medecin/mot-de-passe-oublie" element={<MotDePasseOublie />} />
                        <Route path="/medecin/reinitialiser" element={<ReinitialiserMotDePasse />} />
                        <Route path="/medecin/dashboard" element={<Dashboard />} />
                        <Route path="/espace/sage-femme" element={<Dashboard />} />
                        <Route path="/espace/secretariat" element={<Dashboard />} />
                        <Route path="/admin/dashboard" element={<Dashboard />} />
                        <Route path="/calendrier" element={<Calendrier />} />
                        <Route path="/statistiques" element={<Statistiques />} />
                        <Route path="/patients/dossier" element={<DossierPatient />} />
                        <Route path="/patients/maternite" element={<SuiviMaternite />} />
                        <Route path="/espace/mes-patients" element={<MesPatients />} />
                        <Route path="/assistant/ordonnance" element={<AssistantOrdonnance />} />
                        <Route path="/corbeille" element={<Corbeille />} />
                        <Route path="/messagerie" element={<Messagerie />} />
                        <Route path="/admin/utilisateurs" element={<AdminUsers />} />
                        <Route path="/admin/services" element={<AdminServices />} />
                        <Route path="/admin/planning" element={<AdminPlanning />} />
                        <Route path="/admin/journal" element={<AdminJournal />} />
                        <Route path="/admin/occupation" element={<AdminOccupation />} />
                        <Route path="/admin/sauvegardes" element={<AdminSauvegardes />} />
                        <Route path="/admin/permissions" element={<AdminPermissions />} />
                        <Route path="/admin/personnalisation" element={<AdminTheme />} />
                        <Route path="/medecin/maladies" element={<MaladiesMedecin />} />
                        <Route path="*" element={<NotFound />} />
                    </Routes>
                    </Suspense>
                    {isPublicPage && PAGES_EDITABLES[location.pathname] && <TextesAjoutes page={PAGES_EDITABLES[location.pathname]} zone="bas" />}
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
            <LangProvider>
                <SiteContentProvider>
                    <AppContent />
                </SiteContentProvider>
            </LangProvider>
        </BrowserRouter>
    );
}

export default App;
