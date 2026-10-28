import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
    Activity, BarChart3, Baby, Bolt, House, ShieldCheck, ClipboardCheck, DatabaseBackup, CalendarDays, CalendarPlus, Camera, CalendarClock, ChevronUp, CircleChevronDown, ExternalLink, FileSignature, KeyRound, Loader2, LogOut, Menu, Moon,
    Pencil, ScrollText, Squircle, UsersRound, Stethoscope, Sun, Trash2, UserCog, UserRound, Users, X, HeartPulse,
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
import ChampMotDePasse from './ChampMotDePasse';
import CommandPalette from './CommandPalette';
import NiveauDefilement from './NiveauDefilement';
import Toaster from './ui/toaster';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Tooltip, TooltipProvider } from './ui/tooltip';
import { toast } from '../lib/toast';

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
    const { style, suivant, basculerStyle } = useStylePersonnel();
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
    const [passwordOpen, setPasswordOpen] = useState(false);
    // Par défaut le menu se réduit tout seul à ses icônes (un peu plus grandes) et s'élargit avec les noms dès que la souris est dessus.
    // Le bouton du bas permet de le garder ouvert en permanence ; ce choix est gardé sur cet appareil (« menu-ouvert-fixe »).
    const [reduit, setReduit] = useState(() => { try { return localStorage.getItem('menu-ouvert-fixe') !== '1'; } catch { return true; } });
    // Sections du menu repliables (petite flèche à droite du titre) : celles qui sont fermées sont gardées sur cet appareil.
    // flèche cerclée pleine (section repliée, menu réduit) ; contour seul quand c'est ouvert
    const plein = '[&_circle]:fill-current [&_path]:stroke-(--st-side)';
    const [fermees, setFermees] = useState(() => {
        try { const liste = JSON.parse(localStorage.getItem('menu-sections-fermees') || '[]'); return Array.isArray(liste) ? liste : []; } catch { return []; }
    });
    const basculerSection = titre => setFermees(liste => {
        const suivante = liste.includes(titre) ? liste.filter(autre => autre !== titre) : [...liste, titre];
        try { localStorage.setItem('menu-sections-fermees', JSON.stringify(suivante)); } catch { /* stockage indisponible : le choix n'est pas gardé */ }
        return suivante;
    });
    // Menu réduit : il s'élargit tant que la souris (ou le clavier) est dessus, et redevient une barre d'icônes quand elle s'en va.
    // Il reste élargi tant que le menu du compte est ouvert (ce menu s'affiche hors de la barre).
    const [survol, setSurvol] = useState(false);
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
                { to: home, label: ['MEDECIN', 'SAGE_FEMME', 'INFIRMIERE'].includes(role) && !peut('RDV_ATTRIBUER') && !peut('RDV_CONFIRMER') ? 'Mon espace' : 'Tableau de bord', icon: House, end: true, badge: 'rdv' },
                ...(['MEDECIN', 'SAGE_FEMME', 'INFIRMIERE'].includes(role) ? si('RDV_VOIR', { to: '/espace/mes-patients', label: 'Mes patients', icon: ClipboardCheck, badge: 'aAccepter' }) : []),
                ...si('RDV_CREER', { to: home, state: { create: true }, label: 'Nouveau rendez-vous', icon: CalendarPlus, key: 'new' }),
                ...si('RDV_VOIR', { to: '/calendrier', label: 'Calendrier', icon: CalendarDays, badge: 'calendrier' }),
                ...si('RDV_CORBEILLE', { to: '/corbeille', label: 'Corbeille', icon: Trash2, badge: 'corbeille' }),
            ],
        },
        {
            heading: 'Patients',
            items: [
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
                ...si('MALADIES_LIRE', { to: '/medecin/maladies', label: 'Maladies et traitements', icon: Activity }),
                ...si('STATS_VOIR', { to: '/statistiques', label: 'Statistiques', icon: BarChart3 }),
            ],
        },
        {
            heading: 'Administration',
            items: [
                ...si('COMPTES_GERER', { to: '/admin/utilisateurs', label: 'Comptes et accès', icon: UserCog }),
                ...si('PERMISSIONS_GERER', { to: '/admin/permissions', label: 'Rôles et permissions', icon: ShieldCheck }),
                ...si('OCCUPATION_VOIR', { to: '/admin/occupation', label: 'Occupation du personnel', icon: UsersRound }),
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
    const sectionsMenu = sections.map(section => ({ ...section, items: section.items.filter(item => item.key !== 'new') })).filter(section => section.items.length > 0);

    // Menu compact : la hauteur des lignes s'adapte à la hauteur de l'écran pour que tout tienne sans défiler.
    const linkClass = ({ isActive }, id) => `${encoche && (vise ? vise === id : isActive) ? 'encoche-vise ' : ''}group relative z-10 flex items-center gap-2.5 rounded-md px-2.5 transition-transform duration-150 ${compact ? 'origin-center lg:justify-center lg:px-0 hover:scale-110' : 'origin-left hover:scale-[1.04]'} py-[clamp(3px,0.75vh,8px)] text-[13px] leading-tight transition ${
        isActive ? 'bg-(--mt-main)/15 font-bold text-(--st-side-strong) before:absolute before:inset-y-1.5 before:left-0 before:w-[3px] before:rounded-full before:bg-(--mt-main)' : 'font-medium text-(--st-side-fg) hover:bg-(--st-side-hover) hover:text-(--st-side-strong)'} focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-(--mt-main)`;

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

                    {nouveau && (
                        <div className="shrink-0 px-2.5 pt-3">
                            <Tooltip label={compact ? nouveau.label : undefined} side="right">
                                <NavLink to={nouveau.to} state={nouveau.state} aria-label={compact ? nouveau.label : undefined} onClick={() => setMenuOpen(false)}
                                    className={`flex items-center justify-center gap-2 rounded-lg bg-(--mt-bouton) px-3 py-2 text-[13px] font-bold text-(--mt-sur-bouton) transition hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--mt-main) ${compact ? 'lg:px-0' : ''}`}>
                                    <nouveau.icon size={16} className={`shrink-0 ${compact ? 'lg:h-5 lg:w-5' : ''}`} /><span className={compact ? 'lg:hidden' : ''}>{nouveau.label}</span>
                                </NavLink>
                            </Tooltip>
                        </div>
                    )}
                    <nav ref={nav} onMouseLeave={() => setVise(null)} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setVise(null); }} onScroll={encoche ? placerOnglet : undefined}
                        className="flex min-h-0 flex-1 flex-col justify-evenly overflow-y-auto px-2.5 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="Navigation principale">
                        {encoche && <span ref={onglet} className="encoche-onglet" aria-hidden="true" />}
                        {sectionsMenu.map(section => (
                            <div key={section.heading} className="border-t border-(--st-side-line) pt-1 first:border-t-0 first:pt-0">
                                {/* titre de la section : un clic replie ou déplie ses pages (inactif quand le menu est réduit aux icônes ou que l'écran est trop bas pour afficher les titres) */}
                                <button type="button" onClick={() => basculerSection(section.heading)} aria-expanded={!fermees.includes(section.heading)}
                                    className={`flex w-full items-center justify-between rounded-md px-2.5 pb-0.5 pt-0.5 text-[11px] font-semibold uppercase tracking-widest text-(--st-side-muted) transition hover:text-(--st-side-strong) [@media(max-height:700px)]:hidden ${compact ? 'lg:hidden' : ''}`}>
                                    {section.heading}
                                    <span className="flex items-center gap-1.5">
                                        {fermees.includes(section.heading) && (() => {
                                            const caches = section.items.reduce((total, item) => total + (item.badge ? nombre(item.badge) : 0), 0);
                                            return caches > 0 ? <span aria-label={`${caches} nouveauté${caches > 1 ? 's' : ''} dans cette section`} className="rounded-full bg-sky-500 px-1.5 py-0.5 text-[10px] font-bold leading-none tabular-nums text-white">{caches > 99 ? '99+' : caches}</span> : null;
                                        })()}
                                        <CircleChevronDown size={16} aria-hidden="true" className={`transition-transform duration-200 ${fermees.includes(section.heading) ? plein : 'rotate-180'}`} />
                                    </span>
                                </button>
                                <div className={`${fermees.includes(section.heading) ? 'hidden [@media(max-height:700px)]:block' : ''} ${compact && fermees.includes(section.heading) ? 'lg:block' : ''}`}>
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
                                                <Icon size={16} className={`shrink-0 ${compact ? 'lg:h-[22px] lg:w-[22px]' : ''} transition group-aria-[current=page]:text-(--mt-main-fort) group-hover:scale-110 dark:group-aria-[current=page]:text-(--mt-main)`} /><span className={compact ? 'lg:hidden' : ''}>{item.label}</span>
                                                {n > 0 && <span aria-label={`${n} nouveau${n > 1 ? 'x' : ''}`} className={`${compact ? 'lg:absolute lg:right-1 lg:top-0 lg:min-w-4 lg:px-1 lg:text-[9px]' : ''} ml-auto inline-flex min-w-[1.5rem] items-center justify-center rounded-full bg-sky-500 px-1.5 py-0.5 text-[11px] font-bold leading-none tabular-nums text-white`}>{n > 99 ? '99+' : n}</span>}
                                            </NavLink>
                                            </Tooltip>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
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
                                    <DropdownMenuItem onSelect={() => fileInput.current?.click()}><Camera size={15} />Changer ma photo</DropdownMenuItem>
                                    <DropdownMenuItem onSelect={() => setPasswordOpen(true)}><KeyRound size={15} />Changer mon mot de passe</DropdownMenuItem>
                                    <DropdownMenuItem onSelect={toggleTheme}>{theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}{theme === 'dark' ? 'Thème clair' : 'Thème sombre'}</DropdownMenuItem>
                                    <DropdownMenuItem onSelect={basculerStyle}><Squircle size={15} />{suivant === 'console' ? 'Style console' : `Style ${suivant}`}</DropdownMenuItem>
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
                    <main className="mx-auto max-w-[1500px] space-y-4 p-4 sm:p-6">
                        {typeof children === 'function' ? children(profile) : children}
                    </main>
                </div>
                {passwordOpen && <PasswordDialog onClose={() => setPasswordOpen(false)} />}
                <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} items={pages} />
                <NiveauDefilement decalageGauche />
                <Toaster />
            </div>
        </TooltipProvider>
    );
}

/** Changement de son propre mot de passe (l'ancien est demandé). */
function PasswordDialog({ onClose }) {
    const [form, setForm] = useState({ ancienMotDePasse: '', nouveauMotDePasse: '', confirmation: '' });
    const [error, setError] = useState('');
    const [done, setDone] = useState(false);
    const [saving, setSaving] = useState(false);
    const field = 'mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 dark:border-gray-700 dark:bg-gray-950';

    const submit = async event => {
        event.preventDefault(); setError('');
        if (form.nouveauMotDePasse !== form.confirmation) { setError('La confirmation ne correspond pas au nouveau mot de passe.'); return; }
        setSaving(true);
        try {
            await axiosClient.put('/profile/password', { ancienMotDePasse: form.ancienMotDePasse, nouveauMotDePasse: form.nouveauMotDePasse });
            setDone(true); toast.success('Mot de passe modifié.');
        } catch (err) { setError(apiErrorMessage(err, 'Changement impossible.')); }
        finally { setSaving(false); }
    };

    return (
        <div className="fixed inset-0 z-70 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
            <form onSubmit={submit} role="dialog" aria-modal="true" aria-label="Changer mon mot de passe" className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6 text-slate-800 shadow-2xl dark:bg-gray-900 dark:text-gray-100">
                <div className="flex items-center justify-between"><h2 className="font-semibold">Changer mon mot de passe</h2><button type="button" onClick={onClose} aria-label="Fermer"><X size={18} /></button></div>
                {done ? (
                    <>
                        <p role="status" className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-200">Mot de passe modifié.</p>
                        <div className="flex justify-end"><button type="button" onClick={onClose} className="rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white">Fermer</button></div>
                    </>
                ) : (
                    <>
                        <label className="block text-sm font-medium">Mot de passe actuel<ChampMotDePasse required autoComplete="current-password" value={form.ancienMotDePasse} onChange={e => setForm({ ...form, ancienMotDePasse: e.target.value })} className={field} /></label>
                        <label className="block text-sm font-medium">Nouveau mot de passe (10 caractères minimum)<ChampMotDePasse required minLength={10} maxLength={72} autoComplete="new-password" value={form.nouveauMotDePasse} onChange={e => setForm({ ...form, nouveauMotDePasse: e.target.value })} className={field} /></label>
                        <label className="block text-sm font-medium">Confirmer le nouveau mot de passe<ChampMotDePasse required minLength={10} maxLength={72} autoComplete="new-password" value={form.confirmation} onChange={e => setForm({ ...form, confirmation: e.target.value })} className={field} /></label>
                        {error && <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">{error}</p>}
                        <div className="flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2 text-sm dark:border-gray-700">Annuler</button><button disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-50">{saving && <Loader2 size={15} className="animate-spin" />}Modifier</button></div>
                    </>
                )}
            </form>
        </div>
    );
}
