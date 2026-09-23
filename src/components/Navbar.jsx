import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Moon, Sun, Menu, X, Calendar } from 'lucide-react';

function Navbar() {
    const location = useLocation();
    const [menuOpen, setMenuOpen] = useState(false);
    const { theme, toggleTheme } = useTheme();

    const liens = [
        { path: '/', label: 'Accueil' },
        { path: '/services', label: 'Nos services' },
        { path: '/prendre-rdv', label: 'Prendre RDV' },
        { path: '/mes-rdv', label: 'Mes RDV' },
    ];

    return (
        <nav className="bg-white dark:bg-gray-900 shadow-sm sticky top-0 z-50 border-b border-gray-100 dark:border-gray-800 transition-colors">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-20">

                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-3">
                        <img
                            src="/logo_casafami.png"
                            alt="casafami"
                            className="h-14 w-auto"
                        />
                        <div className="hidden sm:block">
                            <p className="text-lg font-bold text-gray-800 dark:text-white leading-tight">
                                Cabinet d'Accouchement
                            </p>
                            <p className="text-sm text-teal-600 dark:text-teal-400 font-semibold">
                                casafami
                            </p>
                        </div>
                    </Link>

                    {/* Liens navigation (desktop) */}
                    <div className="hidden md:flex items-center space-x-1">
                        {liens.map((lien) => (
                            <Link
                                key={lien.path}
                                to={lien.path}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                                    location.pathname === lien.path
                                        ? 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30'
                                        : 'text-gray-700 dark:text-gray-300 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                                }`}
                            >
                                {lien.label}
                            </Link>
                        ))}
                    </div>

                    {/* Actions (droite) */}
                    <div className="hidden md:flex items-center gap-3">
                        {/* Bouton thème */}
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-yellow-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                            aria-label="Changer de thème"
                        >
                            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                        </button>

                        {/* Bouton RDV */}
                        <Link
                            to="/prendre-rdv"
                            className="bg-teal-600 text-white px-6 py-3 rounded-lg text-sm font-bold hover:bg-teal-700 transition shadow-md hover:shadow-lg inline-flex items-center gap-2"
                        >
                            <Calendar className="w-4 h-4" />
                            Prendre rendez-vous
                        </Link>
                    </div>

                    {/* Menu burger (mobile) */}
                    <div className="md:hidden flex items-center gap-2">
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-yellow-400"
                        >
                            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                        </button>
                        <button
                            onClick={() => setMenuOpen(!menuOpen)}
                            className="text-gray-700 dark:text-white focus:outline-none"
                        >
                            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>

                {/* Menu mobile */}
                {menuOpen && (
                    <div className="md:hidden py-4 border-t border-gray-100 dark:border-gray-800">
                        {liens.map((lien) => (
                            <Link
                                key={lien.path}
                                to={lien.path}
                                onClick={() => setMenuOpen(false)}
                                className={`block px-4 py-3 rounded-md text-base font-medium ${
                                    location.pathname === lien.path
                                        ? 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30'
                                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                                }`}
                            >
                                {lien.label}
                            </Link>
                        ))}
                        <Link
                            to="/prendre-rdv"
                            onClick={() => setMenuOpen(false)}
                            className="mt-2 bg-teal-600 text-white px-4 py-3 rounded-lg font-bold flex items-center justify-center gap-2"
                        >
                            <Calendar className="w-4 h-4" />
                            Prendre rendez-vous
                        </Link>
                    </div>
                )}
            </div>
        </nav>
    );
}

export default Navbar;