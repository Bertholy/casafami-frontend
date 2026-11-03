import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
    Activity, BarChart3, Baby, Contact, Bolt, House, ShieldCheck, ClipboardCheck, DatabaseBackup, CalendarDays, CalendarPlus, CalendarClock, ChevronUp, CircleChevronDown, ExternalLink, FileSignature, FileText, Loader2, LogOut, Menu, Moon,
    Pencil, ScrollText, ShieldPlus, Squircle, Tags, UserPlus, Building2, ChevronDown, LayoutDashboard, Settings, UsersRound, Stethoscope, Sun, Trash2, UserCog, UserRound, Users, X, HeartPulse,
} from 'lucide-react';
import axiosClient, { assetUrl } from '../api/axiosClient';
import PatientSearch from './PatientSearch';
import { useStylePersonnel } from '../utils/stylePersonnel';
import NotificationBell from './NotificationBell';
import MessagerieBouton from './MessagerieBouton';
import useNouveautes, { sectionDePage } from '../hooks/useNouveautes';
import { useTheme } from '../context/ThemeContext';
import { APP_NAME, getRoleLabel } from '../constants/app';
import { convertirPhoto } from '../utils/image';
import { apiErrorMessage, clearSession, getEmail, getRole, homeForRole, majPermissions, peut } from '../utils/auth';
import ParametresDialog from './ParametresDialog';
import ProfilDialog from './ProfilDialog';
import CommandPalette from './CommandPalette';
import MessageDeGarde from './dashboard/MessageDeGarde';
import NiveauDefilement from './NiveauDefilement';
import Toaster from './ui/toaster';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Tooltip, TooltipProvider } from './ui/tooltip';
import { toast } from '../lib/toast';
import { inactiviteMinutes } from '../utils/preferences';

/** Couleur de fond visible à cet endroit de l'écran, en ignorant le menu lui-même (null si rien d'opaque). */
function fondDerriere(x, y, menu) {
    for (const element of document.elementsFromPoint(x, y)) {
        if (menu.contains(element)) continue;
        const couleur = getComputedStyle(element).backgroundColor;
        if (!couleur || couleur === 'transparent') continue;
        // rgba(r, g, b, a) ou « oklab(... / a) » ; une couleur sans transparence indiquée est opaque
        const alpha = couleur.startsWith('rgba(') ? parseFloat(couleur.split(',').pop()) : parseFloat(/\/\s*([\d.]+)\)$/.exec(couleur)?.[1] ?? '1');
        if (alpha >= 0.85) return couleur;
    }
    return null;
}

/**
 * Coquille commune de tous les espaces du personnel : barre latérale, en-tête, recherche patient,
 * thème clair/sombre et photo de profil. Les enfants peuvent être une fonction recevant le profil chargé.
 */
export default function AdminLayout({ title, subtitle, actions, children }) {
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const nombre = useNouveautes(sectionDePage(pathname));
    const { theme, toggleTheme } = useTheme();
    const { style, suivant, basculerStyle, choisirStyle } = useStylePersonnel();
    const encoche = style === 'encoche';
    const libelleStyle = suivant === 'console' ? 'Revenir au style console' : `Passer au style ${suivant}`;
    // Style « encoche » : l'onglet du menu suit la ligne visée par le curseur ou le clavier, et revient sur la page ouverte quand ils s'en vont.
    const nav = useRef(null);
    const onglet = useRef(null);
    const [vise, setVise] = useState(null);
    const role = getRole();
    const home = homeForRole(role);
    const [menuOpen, setMenuOpen] = useState(false);
    const [profile, setProfile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [paletteOpen, setPaletteOpen] = useState(false);
    const fileInput = useRef(null);
    const [profilOpen, setProfilOpen] = useState(false);   // fenêtre « Mon profil »
    const [parametresOpen, setParametresOpen] = useState(false);   // fenêtre « Paramètres » : photo et mot de passe
    // Par défaut le menu se réduit tout seul à ses icônes (un peu plus grandes) et s'élargit avec les noms dès que la souris est dessus.
    // Le bouton du bas permet de le garder ouvert en permanence ; ce choix est gardé sur cet appareil (« menu-ouvert-fixe »).
    const [reduit, setReduit] = useState(() => { try { return localStorage.getItem('menu-ouvert-fixe') !== '1'; } catch { return true; } });
    // Sections du menu repliables (petite flèche à droite du titre) : celles qui sont fermées sont gardées sur cet appareil.
    // flèche cerclée pleine (section repliée, menu réduit) ; contour seul quand c'est ouvert
    const plein = '[&_circle]:fill-current [&_path]:stroke-(--st-side)';
    // icône de chaque section (la « mère » du menu)
    const ICONES_SECTIONS = { 'Activité': LayoutDashboard, 'Patients': Users, 'Cabinet': Building2, 'Administration': Settings };
    const [fermees, setFermees] = useState(() => {
        try { const liste = JSON.parse(localStorage.getItem('menu-sections-fermees') || '[]'); return Array.isArray(liste) ? liste : []; } catch { return []; }
    });
    const basculerSection = titre => setFermees(liste => {
        const suivante = liste.includes(titre) ? liste.filter(autre => autre !== titre) : [...liste, titre];
        try { localStorage.setItem('menu-sections-fermees', JSON.stringify(suivante)); } catch { /* stockage indisponible : le choix n'est pas gardé */ }
        return suivante;
    });
    // Menu réduit : il s'élargit tant que la souris (ou le clavier) est dessus, et redevient une barre d'icônes quand elle s'en va.
    const [survol, setSurvol] = useState(false);
    // Il reste élargi tant que le menu du compte est ouvert (ce menu s'affiche hors de la barre).
    const [compteOuvert, setCompteOuvert] = useState(false);
    const compact = reduit && !survol && !compteOuvert;
    const basculerMenu = () => setReduit(valeur => {
        const suivant = !valeur;
        try { localStorage.setItem('menu-ouvert-fixe', suivant ? '0' : '1'); } catch { /* stockage indisponible : le choix n'est pas gardé */ }
        return suivant;
    });

    useEffect(() => {
        let cancelled = false;
        axiosClient.get('/profile').then(({ data }) => {
            if (cancelled) return;
            setProfile(data);
            if (majPermissions(data.permissions)) window.location.reload(); // les droits ont changé depuis la dernière visite : la page s'adapte
        }).catch(() => {});
        return () => { cancelled = true; };
    }, []);

    // Ctrl K (ou Cmd K) ouvre la recherche de page, comme dans les consoles d'administration modernes.
    useEffect(() => {
        const touche = event => {
            if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); setPaletteOpen(ouvert => !ouvert); }
        };
        window.addEventListener('keydown', touche);
        return () => window.removeEventListener('keydown', touche);
    }, []);

    const logout = () => { clearSession(); navigate('/medecin/login'); };

    // Déconnexion automatique : après le délai choisi sans souris, clavier, défilement ni toucher, la session se ferme (0 = jamais).
    const [inactivite, setInactivite] = useState(inactiviteMinutes);
    useEffect(() => {
        if (!inactivite) return undefined;
        let derniere = Date.now();
        const activite = () => { derniere = Date.now(); };
        const evenements = ['mousemove', 'mousedown', 'keydown', 'scroll', 'wheel', 'touchstart'];
        evenements.forEach(nom => window.addEventListener(nom, activite, { passive: true }));
        const controle = window.setInterval(() => {
            if (Date.now() - derniere >= inactivite * 60000) { clearSession(); navigate('/medecin/login'); }
        }, 15000);
        return () => { evenements.forEach(nom => window.removeEventListener(nom, activite)); window.clearInterval(controle); };
    }, [inactivite, navigate]);

    const uploadPhoto = async event => {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (!file) return;
        setUploading(true);
        try {
            const photo = await convertirPhoto(file);   // convention : JPEG, 1600 px au plus, avant tout envoi
            const body = new FormData();
            body.append('photo', photo.fichier);
            const { data } = await axiosClient.put('/profile/photo', body, { headers: { 'Content-Type': 'multipart/form-data' } });
            setProfile(data);
            toast.success(`${photo.resume} Photo enregistrée.`);
        } catch (err) {
            toast.error(err.response ? apiErrorMessage(err, 'La photo n’a pas pu être enregistrée.') : err.message);
        } finally { setUploading(false); }
    };

    // Le menu ne montre que ce que la personne a le droit de faire (réglé dans « Rôles et permissions » ; le serveur vérifie de toute façon).
    const si = (code, item) => (peut(code) ? [item] : []);
    const sections = [
        {
            heading: 'Activité',
            items: [
                { to: home, label: ['MEDECIN', 'SAGE_FEMME', 'INFIRMIERE'].includes(role) && !peut('RDV_ATTRIBUER') ? 'Mon espace' : 'Tableau de bord', icon: House, end: true, badge: 'rdv' },
                ...(['MEDECIN', 'SAGE_FEMME', 'INFIRMIERE'].includes(role) ? si('RDV_VOIR', { to: '/espace/mes-patients', label: 'Mes patients', icon: ClipboardCheck, badge: 'aAccepter' }) : []),
                ...si('RDV_CREER', { to: home, state: { create: true }, label: 'Nouveau rendez-vous', icon: CalendarPlus, key: 'new' }),
                ...si('RDV_SANS_RDV', { to: '/patients/sans-rendez-vous', label: 'Patient sans rendez-vous', icon: UserPlus, key: 'walkin' }),
                ...si('RDV_VOIR', { to: '/proforma', label: 'Facture proforma', icon: FileText }),
                ...si('RDV_VOIR', { to: '/calendrier', label: 'Calendrier', icon: CalendarDays, badge: 'calendrier' }),
                ...si('RDV_CORBEILLE', { to: '/corbeille', label: 'Corbeille', icon: Trash2, badge: 'corbeille' }),
            ],
        },
        {
            heading: 'Patients',
            items: [
                ...si('PATIENTS_RECHERCHER', { to: '/patients/liste', label: 'Liste des patients', icon: Contact }),
                ...si('DOSSIERS_LIRE', { to: '/patients/dossier', label: 'Dossiers patients', icon: Users, badge: 'dossiers' }),
                ...si('DOSSIERS_LIRE', { to: '/patients/maternite', label: 'Suivi maternité', icon: Baby, badge: 'maternite' }),
                ...(['SUPER_ADMIN', 'MEDECIN', 'SAGE_FEMME'].includes(role) ? si('MALADIES_LIRE', { to: '/assistant/ordonnance', label: 'Assistant d’ordonnance', icon: FileSignature }) : []),
            ],
        },
        {
            heading: 'Cabinet',
            items: [
                peut('SERVICES_GERER')
                    ? { to: '/admin/services', label: 'Gestion des services', icon: Stethoscope }
                    : { to: '/services', label: 'Services', icon: Stethoscope },
                ...si('RDV_VOIR', { to: '/tarifs', label: 'Services et tarifs', icon: Tags }),
                ...si('GARDE_VOIR', { to: '/garde', label: 'Tour de garde', icon: ShieldPlus }),
                ...si('OCCUPATION_VOIR', { to: '/admin/occupation', label: 'Occupation du personnel', icon: UsersRound }),
                ...si('MALADIES_LIRE', { to: '/medecin/maladies', label: 'Maladies et traitements', icon: Activity }),
                ...si('STATS_VOIR', { to: '/statistiques', label: 'Statistiques', icon: BarChart3 }),
            ],
        },
        {
            heading: 'Administration',
            items: [
                ...si('COMPTES_GERER', { to: '/admin/utilisateurs', label: 'Comptes et accès', icon: UserCog }),
                ...si('PERMISSIONS_GERER', { to: '/admin/permissions', label: 'Rôles et permissions', icon: ShieldCheck }),
                ...si('PLANNING_GERER', { to: '/admin/planning', label: 'Horaires et congés', icon: CalendarClock }),
                ...si('JOURNAL_VOIR', { to: '/admin/journal', label: 'Journal d’audit', icon: ScrollText, badge: 'journal' }),
                ...si('SAUVEGARDES_GERER', { to: '/admin/sauvegardes', label: 'Sauvegardes', icon: DatabaseBackup }),
                ...si('SITE_MODIFIER', { to: '/admin/personnalisation', label: 'Couleurs du site', icon: Bolt }),
                ...si('SITE_MODIFIER', { to: '/?edition=1', label: 'Modifier le site', icon: Pencil, key: 'edit-site' }),
            ],
        },
    ].filter(section => section.items.length > 0);

    const placerOnglet = useCallback(() => {
        const marque = onglet.current, barre = nav.current;
        const ligne = barre?.querySelector('a.encoche-vise');
        if (!marque || !barre) return;
        if (!ligne) { marque.dataset.visible = 'false'; return; }
        const boite = ligne.getBoundingClientRect();
        const decalage = boite.top - barre.getBoundingClientRect().top + barre.scrollTop;
        const marge = 5;   // l'onglet déborde un peu de la ligne, en haut et en bas, comme sur la maquette
        marque.style.transform = 'translateY(' + (decalage - marge) + 'px)';
        marque.style.height = (ligne.offsetHeight + 2 * marge) + 'px';
        marque.dataset.visible = 'true';
        // L'onglet et ses deux angles prennent la couleur de ce qui se trouve réellement derrière le bord du menu (page ou carte du tableau de bord),
        // pour qu'aucune jonction ne se voie ; sans mesure possible, la couleur de la page (voir staff-encoche.css).
        const menu = barre.closest('aside');
        const x = menu.getBoundingClientRect().right + 3;
        const haut = boite.top - marge, bas = boite.bottom + marge, rayon = 13;
        [['--encoche-fond', (haut + bas) / 2], ['--encoche-fond-haut', haut - rayon], ['--encoche-fond-bas', bas + rayon]].forEach(([nom, y]) => {
            const couleur = fondDerriere(x, y, menu);
            if (couleur) marque.style.setProperty(nom, couleur); else marque.style.removeProperty(nom);
        });
    }, []);
    useLayoutEffect(() => {
        if (!encoche) return undefined;
        placerOnglet();
        // le menu s'élargit ou se réduit en 200 ms et la hauteur des lignes change avec les icônes : on replace l'onglet à la fin
        const apres = setTimeout(placerOnglet, 230);
        const observe = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(placerOnglet);
        if (nav.current) observe?.observe(nav.current);
        // la page défile derrière le menu : la couleur derrière l'onglet change
        let image = 0;
        const surDefilement = () => { cancelAnimationFrame(image); image = requestAnimationFrame(placerOnglet); };
        window.addEventListener('scroll', surDefilement, { passive: true });
        return () => { clearTimeout(apres); observe?.disconnect(); cancelAnimationFrame(image); window.removeEventListener('scroll', surDefilement); };
    });

    // L'action principale sort de la liste : un bouton plein en haut du menu. Les autres pages gardent leur ordre.
    const nouveau = sections.flatMap(section => section.items).find(item => item.key === 'new');
    const sansRdv = sections.flatMap(section => section.items).find(item => item.key === 'walkin');
    const sectionsMenu = sections.map(section => ({ ...section, items: section.items.filter(item => item.key !== 'new' && item.key !== 'walkin') })).filter(section => section.items.length > 0);

    // Menu compact : la hauteur des lignes s'adapte à la hauteur de l'écran pour que tout tienne sans défiler.
    const linkClass = ({ isActive }, id) => `${encoche && (vise ? vise === id : isActive) ? 'encoche-vise ' : ''}group relative z-10 flex items-center gap-2.5 rounded-md px-2.5 transition-transform duration-150 ${compact ? 'origin-center lg:justify-center lg:px-0 hover:scale-110' : 'origin-left hover:scale-[1.04]'} py-[clamp(3px,0.75vh,8px)] text-[13px] leading-tight transition ${
        isActive ? 'bg-(--mt-main)/15 font-bold text-(--st-side-strong) shadow-sm dark:bg-white dark:text-slate-900' : 'font-medium text-(--st-side-fg) hover:bg-(--st-side-hover) hover:text-(--st-side-strong)'} focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-(--mt-main)`;

    const nomAffiche = profile?.nom || getEmail();
    const avatar = (taille = 'h-8 w-8') => (
        <span className={`flex ${taille} shrink-0 items-center justify-center overflow-hidden rounded-full bg-(--mt-main)/20 text-(--mt-main-fort) ring-1 ring-(--st-line) dark:text-(--mt-main-clair)`}>
            {profile?.photoUrl ? <img src={assetUrl(profile.photoUrl)} alt="" className="h-full w-full object-cover" /> : <UserRound size={16} />}
        </span>
    );
    const boutonEntete = 'relative h-9 w-9 items-center justify-center rounded-lg border border-(--st-line) bg-(--st-panel) text-slate-600 transition hover:bg-slate-100 dark:text-gray-300 dark:hover:bg-gray-800';

    // Pages proposées par la recherche (Ctrl K) : celles du menu, plus le site public et le changement de thème.
    const pages = [
        ...sections.flatMap(section => section.items.map(item => ({ id: `${item.to}-${item.label}`, label: item.label, groupe: section.heading, icon: item.icon, onSelect: () => navigate(item.to, { state: item.state }) }))),
        { id: 'site', label: 'Voir le site public', groupe: 'Site', icon: ExternalLink, onSelect: () => navigate('/') },
        { id: 'theme', label: theme === 'dark' ? 'Passer au thème clair' : 'Passer au thème sombre', groupe: 'Affichage', icon: theme === 'dark' ? Sun : Moon, onSelect: toggleTheme },
        { id: 'style', label: libelleStyle, groupe: 'Affichage', icon: Squircle, onSelect: basculerStyle },
    ];

    return (
        <TooltipProvider delayDuration={250}>
            <div className="theme-staff min-h-screen bg-(--st-page) text-slate-800 dark:text-gray-100">
                <MessageDeGarde nom={profile?.nom} />
                <aside onMouseEnter={() => setSurvol(true)} onMouseLeave={() => setSurvol(false)} onFocus={() => setSurvol(true)} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setSurvol(false); }}
                    className={`${menuOpen ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-40 flex w-60 ${compact ? 'lg:w-[4.5rem]' : ''} flex-col border-r border-(--st-side-line) bg-(--st-side) text-(--st-side-fg) transition-[transform,width] duration-200 lg:translate-x-0`}>
                    <div className={`flex h-14 shrink-0 items-center gap-2.5 border-b border-(--st-side-line) px-4 ${compact ? 'lg:justify-center lg:px-0' : ''}`}>
                        <img src="/logo_casafami.png" alt="" className="h-9 w-9 rounded-md bg-white object-contain p-0.5 ring-1 ring-(--st-side-line)" />
                        <div className={`min-w-0 ${compact ? 'lg:hidden' : ''}`}>
                            <div className="text-sm font-bold leading-tight tracking-wide text-(--st-side-strong)">{APP_NAME}</div>
                            <div className="flex items-center gap-1 text-[11px] leading-tight text-(--mt-main-fort) dark:text-(--mt-main)"><HeartPulse size={11} />Gestion du cabinet</div>
                        </div>
                        <button onClick={() => setMenuOpen(false)} className="ml-auto rounded-lg p-1 hover:bg-(--st-side-hover) lg:hidden" aria-label="Fermer le menu"><X size={19} /></button>
                    </div>

                    {(nouveau || sansRdv) && (
                        <div className="shrink-0 space-y-1.5 px-2.5 pt-3">
                            {nouveau && (
                                <Tooltip label={compact ? nouveau.label : undefined} side="right">
                                    <NavLink to={nouveau.to} state={nouveau.state} aria-label={compact ? nouveau.label : undefined} onClick={() => setMenuOpen(false)}
                                        className={`flex items-center justify-center gap-2 rounded-lg bg-(--mt-bouton) px-3 py-2 text-[13px] font-bold text-(--mt-sur-bouton) transition hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--mt-main) ${compact ? 'lg:px-0' : ''}`}>
                                        <nouveau.icon size={16} className={`shrink-0 ${compact ? 'lg:h-5 lg:w-5' : ''}`} /><span className={compact ? 'lg:hidden' : ''}>{nouveau.label}</span>
                                    </NavLink>
                                </Tooltip>
                            )}
                            {/* un patient est venu sans rendez-vous : voir qui est libre et le recevoir tout de suite */}
                            {sansRdv && (
                                <Tooltip label={compact ? sansRdv.label : undefined} side="right">
                                    <NavLink to={sansRdv.to} state={sansRdv.state} aria-label={compact ? sansRdv.label : undefined} onClick={() => setMenuOpen(false)}
                                        className={`flex items-center justify-center gap-2 rounded-lg border border-(--mt-main) bg-transparent px-3 py-2 text-[13px] font-bold text-(--st-side-strong) transition hover:bg-(--mt-main)/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--mt-main) ${compact ? 'lg:px-0' : ''}`}>
                                        <sansRdv.icon size={16} className={`shrink-0 ${compact ? 'lg:h-5 lg:w-5' : ''}`} /><span className={compact ? 'lg:hidden' : ''}>{sansRdv.label}</span>
                                    </NavLink>
                                </Tooltip>
                            )}
                        </div>
                    )}
                    <nav ref={nav} onMouseLeave={() => setVise(null)} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setVise(null); }} onScroll={encoche ? placerOnglet : undefined}
                        className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto px-2.5 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="Navigation principale">
                        {encoche && <span ref={onglet} className="encoche-onglet" aria-hidden="true" />}
                        {sectionsMenu.map(section => {
                            const ferme = fermees.includes(section.heading);
                            const IconeSection = ICONES_SECTIONS[section.heading] || LayoutDashboard;
                            const caches = ferme ? section.items.reduce((total, item) => total + (item.badge ? nombre(item.badge) : 0), 0) : 0;
                            return (
                                <div key={section.heading} className={compact ? 'lg:border-t lg:border-(--st-side-line) lg:pt-1.5 lg:first:border-t-0 lg:first:pt-0' : ''}>
                                    {/* la section « mère » : une petite carte avec son icône ; un clic replie ou déplie ses pages (masquée quand le menu est réduit aux icônes ou que l'écran est trop bas) */}
                                    <button type="button" onClick={() => basculerSection(section.heading)} aria-expanded={!ferme}
                                        className={`flex w-full items-center gap-2.5 rounded-lg bg-[color-mix(in_srgb,var(--st-side-strong)_7%,transparent)] px-2.5 py-[clamp(5px,1vh,9px)] text-left text-[13px] font-semibold text-(--st-side-strong) transition hover:bg-[color-mix(in_srgb,var(--st-side-strong)_13%,transparent)] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-(--mt-main) [@media(max-height:700px)]:hidden ${compact ? 'lg:hidden' : ''}`}>
                                        <IconeSection size={18} aria-hidden="true" className="shrink-0 text-(--st-side-muted)" />
                                        <span className="min-w-0 flex-1 truncate">{section.heading}</span>
                                        {caches > 0 && <span aria-label={`${caches} nouveauté${caches > 1 ? 's' : ''} dans cette section`} className="rounded-full bg-sky-500 px-1.5 py-0.5 text-[10px] font-bold leading-none tabular-nums text-white">{caches > 99 ? '99+' : caches}</span>}
                                        <ChevronDown size={16} aria-hidden="true" className={`shrink-0 text-(--st-side-muted) transition-transform duration-200 ${ferme ? '' : 'rotate-180'}`} />
                                    </button>
                                    {/* les pages « enfants » : un trait vertical à gauche (comme un arbre), la page active en pastille ; le repli est animé */}
                                    <div className={`grid transition-[grid-template-rows] duration-200 ease-out ${ferme ? 'grid-rows-[0fr] [@media(max-height:700px)]:grid-rows-[1fr]' : 'grid-rows-[1fr]'} ${compact ? 'lg:grid-rows-[1fr]' : ''}`}>
                                        <div className={`min-h-0 overflow-hidden transition-[visibility] duration-200 ${ferme ? 'invisible [@media(max-height:700px)]:visible' : ''} ${compact ? 'lg:visible' : ''}`}>
                                            <div className={`space-y-0.5 pb-0.5 pt-1 ${compact ? '' : 'ml-[1.4rem] border-l border-(--st-side-line) pl-1.5'}`}>
                                                {section.items.map(item => {
                                                    const Icon = item.icon;
                                                    const n = item.badge ? nombre(item.badge) : 0;
                                                    return (
                                                        <Tooltip key={item.key || item.label} label={compact ? item.label : undefined} side="right">
                                                        <NavLink to={item.to} state={item.state} end={item.end}
                                                            aria-label={compact ? item.label : undefined}
                                                            onClick={() => setMenuOpen(false)}
                                                            onMouseEnter={() => setVise(item.key || item.label)} onFocus={() => setVise(item.key || item.label)}
                                                            className={state => linkClass(item.key ? { isActive: false } : state, item.key || item.label)}>
                                                            <Icon size={16} className={`shrink-0 ${compact ? 'lg:h-[22px] lg:w-[22px]' : ''} transition group-aria-[current=page]:text-(--mt-main-fort) group-hover:scale-110 dark:group-aria-[current=page]:text-(--mt-main-fort)`} /><span className={compact ? 'lg:hidden' : ''}>{item.label}</span>
                                                            {n > 0 && <span aria-label={`${n} nouveau${n > 1 ? 'x' : ''}`} className={`${compact ? 'lg:absolute lg:right-1 lg:top-0 lg:min-w-4 lg:px-1 lg:text-[9px]' : ''} ml-auto inline-flex min-w-[1.5rem] items-center justify-center rounded-full bg-sky-500 px-1.5 py-0.5 text-[11px] font-bold leading-none tabular-nums text-white`}>{n > 99 ? '99+' : n}</span>}
                                                        </NavLink>
                                                        </Tooltip>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </nav>

                    <div className="shrink-0 border-t border-(--st-side-line) px-3 py-2">
                        {/* réduire ou agrandir le menu (ordinateur) */}
                        <Tooltip label={compact ? 'Garder le menu ouvert' : undefined} side="right">
                            <button type="button" onClick={basculerMenu} aria-label={reduit ? 'Garder le menu ouvert' : 'Réduire le menu'} aria-pressed={reduit}
                                className={`mb-2 hidden w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium text-(--st-side-muted) transition hover:bg-(--st-side-hover) hover:text-(--st-side-strong) lg:flex ${compact ? 'justify-center px-0' : ''}`}>
                                <CircleChevronDown size={18} aria-hidden="true" className={`shrink-0 transition-transform duration-200 ${reduit ? `-rotate-90 ${plein}` : 'rotate-90'} ${compact ? 'lg:h-5 lg:w-5' : ''}`} /><span className={compact ? 'hidden' : ''}>{reduit ? 'Garder le menu ouvert' : 'Réduire le menu'}</span>
                            </button>
                        </Tooltip>
                        <input ref={fileInput} type="file" accept="image/*" className="hidden" onChange={uploadPhoto} />
                        <DropdownMenu onOpenChange={setCompteOuvert}>
                            <Tooltip label={compact ? nomAffiche : undefined} side="right">
                                <DropdownMenuTrigger aria-label="Mon compte"
                                    className={`flex w-full items-center gap-2.5 rounded-lg p-1.5 text-left outline-none transition hover:bg-(--st-side-hover) focus-visible:ring-2 focus-visible:ring-(--mt-main) data-[state=open]:bg-(--st-side-hover) ${compact ? 'lg:justify-center lg:p-1' : ''}`}>
                                    {uploading ? <span className="flex h-9 w-9 items-center justify-center"><Loader2 size={16} className="animate-spin" /></span> : avatar('h-9 w-9')}
                                    <span className={`min-w-0 flex-1 ${compact ? 'lg:hidden' : ''}`}>
                                        <span className="block truncate text-[13px] font-semibold leading-tight text-(--st-side-strong)">{nomAffiche}</span>
                                        <span className="block truncate text-[11px] leading-tight text-(--st-side-muted)">{getRoleLabel(role)}</span>
                                    </span>
                                    <ChevronUp size={15} className={`shrink-0 text-(--st-side-muted) ${compact ? 'lg:hidden' : ''}`} />
                                </DropdownMenuTrigger>
                            </Tooltip>
                            <DropdownMenuContent side="top" align="start" sideOffset={8}>
                                <DropdownMenuLabel><span className="block truncate text-sm font-semibold text-foreground">{nomAffiche}</span>{getRoleLabel(role)}</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onSelect={() => setProfilOpen(true)}><UserRound size={15} />Mon profil</DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => setParametresOpen(true)}><Settings size={15} />Paramètres</DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => navigate('/')}><ExternalLink size={15} />Voir le site public</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem danger onSelect={logout}><LogOut size={15} />Se déconnecter</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </aside>
                {menuOpen && <button className="fixed inset-0 z-30 bg-black/50 lg:hidden" aria-label="Fermer le menu" onClick={() => setMenuOpen(false)} />}

                {/* le contenu suit la largeur du menu (réduit, ou élargi au survol) avec la même durée d'animation : rien n'est caché derrière lui */}
                <div className={`${compact ? 'lg:pl-[4.5rem]' : 'lg:pl-60'} transition-[padding] duration-200`}>
                    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-(--st-line) bg-(--st-page)/90 px-4 backdrop-blur-md sm:px-6">
                        <button onClick={() => setMenuOpen(true)} className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-gray-800 lg:hidden" aria-label="Ouvrir le menu"><Menu size={20} /></button>
                        <div className="min-w-0">
                            <h1 className="truncate text-base font-bold leading-tight sm:text-lg">{title}</h1>
                            {subtitle && <p className="hidden truncate text-xs text-slate-500 dark:text-gray-400 sm:block">{subtitle}</p>}
                        </div>
                        <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
                            {peut('PATIENTS_RECHERCHER') && <PatientSearch className="relative hidden w-44 md:block 2xl:w-60" />}
                            <Tooltip label="Voir le site public"><Link to="/" aria-label="Voir le site public" className={`${boutonEntete} hidden 2xl:inline-flex`}><ExternalLink size={16} /></Link></Tooltip>
                            <Tooltip label={libelleStyle}>
                                <button onClick={basculerStyle} aria-label={libelleStyle} aria-pressed={style !== 'console'} className={`${boutonEntete} hidden sm:inline-flex`}><Squircle size={16} /></button>
                            </Tooltip>
                            <Tooltip label={theme === 'dark' ? 'Thème clair' : 'Thème sombre'}>
                                <button onClick={toggleTheme} aria-label="Changer de thème" className={`${boutonEntete} hidden sm:inline-flex`}>{theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}</button>
                            </Tooltip>
                            <MessagerieBouton />
                            <NotificationBell onOpenRdv={notification => navigate(notification?.lien || (notification?.rendezVousId ? (role === 'SUPER_ADMIN' ? `${home}?rdv=${notification.rendezVousId}` : `/espace/mes-patients?rdv=${notification.rendezVousId}`) : home))} />
                            {actions}
                        </div>
                    </header>
                    {/* Téléphone et petite tablette : la recherche de patient (et le scanner QR), le site public, le style et le thème ne tiennent pas dans l'en-tête,
                        ils passent dans cette barre sous l'en-tête. Sur grand écran, ils sont dans l'en-tête. */}
                    <div className="flex items-center gap-2 px-4 pt-3 sm:px-6 md:hidden">
                        {peut('PATIENTS_RECHERCHER') && <PatientSearch className="relative min-w-0 flex-1" />}
                        <Link to="/" aria-label="Voir le site public" title="Voir le site public" className={`${boutonEntete} ml-auto inline-flex shrink-0`}><ExternalLink size={16} /></Link>
                        <button onClick={basculerStyle} aria-label={libelleStyle} title={libelleStyle} aria-pressed={style !== 'console'} className={`${boutonEntete} inline-flex shrink-0 sm:hidden`}><Squircle size={16} /></button>
                        <button onClick={toggleTheme} aria-label="Changer de thème" title={theme === 'dark' ? 'Thème clair' : 'Thème sombre'} className={`${boutonEntete} inline-flex shrink-0 sm:hidden`}>{theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}</button>
                    </div>
                    <main className="mx-auto max-w-[1500px] space-y-4 p-4 sm:p-6">
                        {typeof children === 'function' ? children(profile) : children}
                    </main>
                </div>
                <ProfilDialog open={profilOpen} onOpenChange={setProfilOpen} avatar={avatar} profile={profile} nom={nomAffiche} role={getRoleLabel(role)} onParametres={() => { setProfilOpen(false); setParametresOpen(true); }} />
                <ParametresDialog open={parametresOpen} onOpenChange={setParametresOpen} avatar={avatar} profile={profile} nom={nomAffiche} role={getRoleLabel(role)} uploading={uploading} onChoisirPhoto={() => fileInput.current?.click()} onProfil={setProfile}
                    style={style} choisirStyle={choisirStyle} menuFixe={!reduit} basculerMenu={basculerMenu} inactivite={inactivite} onInactivite={setInactivite} />
                <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} items={pages} />
                <NiveauDefilement decalageGauche />
                <Toaster />
            </div>
        </TooltipProvider>
    );
}
