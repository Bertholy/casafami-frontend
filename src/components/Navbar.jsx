import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Moon, Sun, Menu, X, Calendar } from 'lucide-react';
import Editable from './site/Editable';
import LangSwitch from './LangSwitch';
import Movable from './site/Movable';
import { useLang } from '../i18n/LangContext';

/** Barre de navigation du site public (design doux) : fond clair translucide, liens en pilules, langue toujours visible. */
function Navbar() {
    const { t } = useLang();
    const location = useLocation();
    const [menuOpen, setMenuOpen] = useState(false);
    const { theme, toggleTheme } = useTheme();

    const liens = [
        { path: '/', label: t("Accueil") },
        { path: '/services', label: t("Nos services") },
        { path: '/prendre-rdv', label: t("Prendre RDV") },
        { path: '/mes-rdv', label: t("Mes RDV") },
    ];
    const bouton = 'flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-600 shadow-[0_0_0_1px_#dce9f0] transition hover:text-teal-700 dark:bg-gray-800 dark:text-gray-200 dark:shadow-none';

    return (
        <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md dark:bg-gray-900/80" aria-label={t("Accueil")}>
            <div className="mx-auto flex h-[78px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">

                {/* Logo */}
                <Link to="/" className="flex shrink-0 items-center gap-3">
                    <img src="/logo_casafami.png" alt={t("casafami")} className="h-12 w-12 rounded-2xl bg-white object-contain p-1 shadow-[0_6px_18px_rgba(15,80,120,.14)]" />
                    <div className="hidden sm:block">
                        <Editable id="nav.sous-titre" as="p" className="text-[15px] font-extrabold uppercase leading-tight tracking-[0.16em] text-slate-800 dark:text-white">casafami</Editable>
                        <Editable id="nav.titre" as="p" className="text-xs leading-tight text-slate-500 dark:text-gray-400">Cabinet d'Accouchement</Editable>
                    </div>
                </Link>

                {/* Liens (ordinateur) */}
                <div className="hidden items-center gap-1 md:flex">
                    {liens.map(lien => (
                        <Link key={lien.path} to={lien.path} className="mt-lien-nav" aria-current={location.pathname === lien.path ? 'page' : undefined}>{lien.label}</Link>
                    ))}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 sm:gap-3">
                    <LangSwitch className="[&_svg]:hidden sm:[&_svg]:block" />
                    <button onClick={toggleTheme} className={bouton} aria-label={t("Changer de thème")}>
                        {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                    </button>
                    <Movable id="nav.btn-rdv" as={Link} to="/prendre-rdv" className="mt-btn hidden lg:inline-flex">
                        <Calendar className="h-4 w-4" />
                        <Editable id="nav.btn-rdv.label">Prendre rendez-vous</Editable>
                    </Movable>
                    <button onClick={() => setMenuOpen(!menuOpen)} className={`${bouton} md:hidden`} aria-label={menuOpen ? t("Fermer") : t("Menu")} aria-expanded={menuOpen}>
                        {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </button>
                </div>
            </div>

            {/* Menu (téléphone) */}
            {menuOpen && (
                <div className="mx-4 mb-3 rounded-3xl bg-white p-3 shadow-[0_20px_50px_rgba(15,80,120,.14)] dark:bg-gray-800 md:hidden">
                    {liens.map(lien => (
                        <Link key={lien.path} to={lien.path} onClick={() => setMenuOpen(false)} aria-current={location.pathname === lien.path ? 'page' : undefined}
                            className={`block rounded-2xl px-4 py-3 text-sm font-bold ${location.pathname === lien.path ? 'bg-teal-50 text-teal-700 dark:bg-gray-700 dark:text-teal-300' : 'text-slate-700 hover:bg-slate-50 dark:text-gray-200 dark:hover:bg-gray-700'}`}>
                            {lien.label}
                        </Link>
                    ))}
                    <Link to="/prendre-rdv" onClick={() => setMenuOpen(false)} className="mt-btn mt-2 w-full">
                        <Calendar className="h-4 w-4" />{t("Prendre rendez-vous")}
                    </Link>
                </div>
            )}
        </nav>
    );
}

export default Navbar;
