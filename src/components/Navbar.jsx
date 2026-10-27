import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Calendar, CircleChevronRight, House, Menu, Moon, Search, Sun, X } from 'lucide-react';
import Editable from './site/Editable';
import LangSwitch from './LangSwitch';
import Movable from './site/Movable';
import { useLang } from '../i18n/LangContext';

/** Barre de navigation du site public : bandeau bleu marine, liens en majuscules, choix de la langue toujours visible. */
function Navbar() {
    const { t } = useLang();
    const location = useLocation();
    const [menuOpen, setMenuOpen] = useState(false);
    const { theme, toggleTheme } = useTheme();
    const retourAccueil = () => {
        setMenuOpen(false);
        if (location.pathname === '/') window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const liens = [
        { path: '/', label: t("Accueil"), Icone: House },
        { path: '/services', label: t("Nos services") },
        { path: '/mes-rdv', label: t("Mes rendez-vous") },
    ];
    const bouton = 'rounded-sm p-2 text-white/90 transition hover:bg-white/10';

    return (
        <nav className="mt-marine sticky top-0 z-50 shadow-md" aria-label={t("Accueil")}>
            <div className="mx-auto flex h-[78px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">

                {/* Logo et nom : retour à l'accueil (et en haut de la page si l'on y est déjà) */}
                <Link to="/" onClick={retourAccueil} aria-label={t("Retour à l’accueil")} className="flex shrink-0 items-center gap-3">
                    <img src="/logo_casafami.png" alt={t("casafami")} className="h-12 w-12 bg-white object-contain p-1" />
                    <div className="hidden sm:block">
                        <Editable id="nav.titre" as="p" className="font-titre text-[11px] font-bold uppercase leading-tight tracking-[0.28em] text-white/85">Cabinet d'Accouchement</Editable>
                        <Editable id="nav.sous-titre" as="p" className="font-titre text-xl font-extrabold uppercase leading-tight tracking-[0.3em] text-white">casafami</Editable>
                    </div>
                </Link>

                {/* Liens (ordinateur) */}
                <div className="hidden items-center gap-8 md:flex">
                    {liens.map(lien => (
                        <Link key={lien.path} to={lien.path} className="mt-lien-nav inline-flex items-center gap-1.5" aria-current={location.pathname === lien.path ? 'page' : undefined}>{lien.Icone && <lien.Icone className="h-[18px] w-[18px]" aria-hidden="true" />}{lien.label}</Link>
                    ))}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 sm:gap-3">
                    <Link to="/mes-rdv" className={bouton} aria-label={t("Retrouver mon rendez-vous")} title={t("Retrouver mon rendez-vous")}><Search className="h-5 w-5" /></Link>
                    <LangSwitch variante="sombre" className="[&_svg]:hidden sm:[&_svg]:block" />
                    <button onClick={toggleTheme} className={bouton} aria-label={t("Changer de thème")}>
                        {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                    </button>
                    <Movable id="nav.btn-rdv" as={Link} to="/prendre-rdv" className="mt-btn-blanc hidden lg:inline-flex">
                        <Calendar className="h-4 w-4" />
                        <Editable id="nav.btn-rdv.label">Prendre rendez-vous</Editable>
                    </Movable>
                    <button onClick={() => setMenuOpen(!menuOpen)} className={`${bouton} md:hidden`} aria-label={menuOpen ? t("Fermer") : t("Menu")} aria-expanded={menuOpen}>
                        {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                    </button>
                </div>
            </div>

            {/* Menu (téléphone) */}
            {menuOpen && (
                <div className="border-t border-white/15 bg-black/20 px-4 py-3 md:hidden">
                    {liens.map(lien => (
                        <Link key={lien.path} to={lien.path} onClick={() => setMenuOpen(false)} aria-current={location.pathname === lien.path ? 'page' : undefined}
                            className={`flex items-center justify-between border-l-4 px-4 py-3 text-sm font-extrabold uppercase tracking-wide text-white ${location.pathname === lien.path ? 'border-white bg-white/10' : 'border-transparent hover:bg-white/5'}`}>
                            {lien.label}
                            <CircleChevronRight className="h-5 w-5 text-white/80" aria-hidden="true" />
                        </Link>
                    ))}
                    <Link to="/prendre-rdv" onClick={() => setMenuOpen(false)} className="mt-btn-blanc-plein mt-3 w-full">
                        <Calendar className="h-4 w-4" />{t("Prendre rendez-vous")}
                    </Link>
                </div>
            )}
        </nav>
    );
}

export default Navbar;
