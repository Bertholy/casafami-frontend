import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import Accueil from './pages/Accueil';
import Services from './pages/Services';
import PrendreRdv from './pages/PrendreRdv';
import MesRdv from './pages/MesRdv';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import MaladiesMedecin from './pages/MaladiesMedecin';

function App() {
    return (
        <BrowserRouter>
            <ScrollToTop />
            <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900 transition-colors">
                <Navbar />
                <main className="grow">
                    <Routes>
                        <Route path="/" element={<Accueil />} />
                        <Route path="/services" element={<Services />} />
                        <Route path="/prendre-rdv" element={<PrendreRdv />} />
                        <Route path="/mes-rdv" element={<MesRdv />} />
                        <Route path="/medecin/login" element={<Login />} />
                        <Route path="/medecin/dashboard" element={<Dashboard />} />
                        <Route path="/medecin/maladies" element={<MaladiesMedecin />} />
                    </Routes>
                </main>
                <Footer />
            </div>
        </BrowserRouter>
    );
}

export default App;