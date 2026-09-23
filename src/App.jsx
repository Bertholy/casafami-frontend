import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Accueil from './pages/Accueil';
import Services from './pages/Services';

function App() {
    return (
        <BrowserRouter>
            <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900 transition-colors">
                <Navbar />
                <main className="grow">
                    <Routes>
                        <Route path="/" element={<Accueil />} />
                        <Route path="/services" element={<Services />} />
                    </Routes>
                </main>
                <Footer />
            </div>
        </BrowserRouter>
    );
}

export default App;