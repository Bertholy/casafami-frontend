import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
    Activity, BarChart3, Baby, ShieldCheck, ClipboardCheck, DatabaseBackup, CalendarDays, CalendarPlus, Camera, CalendarClock, ExternalLink, FileSignature, KeyRound, LayoutDashboard, Loader2, LogOut, Menu, Moon, Palette,
    Pencil, ScrollText, UsersRound, Stethoscope, Sun, Trash2, UserCog, UserRound, Users, X, HeartPulse,
} from 'lucide-react';
import axiosClient, { assetUrl } from '../api/axiosClient';
import PatientSearch from './PatientSearch';
import NotificationBell from './NotificationBell';
import MessagerieBouton from './MessagerieBouton';
import useNouveautes, { sectionDePage } from '../hooks/useNouveautes';
import { useTheme } from '../context/ThemeContext';
import { APP_NAME, getRoleLabel } from '../constants/app';
import { convertirPhoto } from '../utils/image';
import { apiErrorMessage, clearSession, getEmail, getRole, homeForRole, majPermissions, peut } from '../utils/auth';
import ChampMotDePasse from './ChampMotDePasse';

/**
 * Coquille commune de tous les espaces du personnel : barre latérale, en-tête, recherche patient,
 * thème clair/sombre et photo de profil. Les enfants peuvent être une fonction recevant le profil chargé.
 */
export default function AdminLayout({ title, subtitle, actions, children }) {
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const nombre = useNouveautes(sectionDePage(pathname));
    const { theme, toggleTheme } = useTheme();
    const role = getRole();
    const home = homeForRole(role);
    const [menuOpen, setMenuOpen] = useState(false);
    const [profile, setProfile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [photoError, setPhotoError] = useState('');
    const [photoInfo, setPhotoInfo] = useState('');
    const fileInput = useRef(null);
    const [passwordOpen, setPasswordOpen] = useState(false);

    useEffect(() => {
        let cancelled = false;
        axiosClient.get('/profile').then(({ data }) => {
            if (cancelled) return;
            setProfile(data);
            if (majPermissions(data.permissions)) window.location.reload(); // les droits ont changé depuis la dernière visite : la page s'adapte
        }).catch(() => {});
        return () => { cancelled = true; };
    }, []);

    const logout = () => { clearSession(); navigate('/medecin/login'); };

    const uploadPhoto = async event => {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (!file) return;
        setUploading(true); setPhotoError(''); setPhotoInfo('Conversion de la photo en JPEG…');
        try {
            const photo = await convertirPhoto(file);   // convention : JPEG, 1600 px au plus, avant tout envoi
            setPhotoInfo('Envoi de la photo…');
            const body = new FormData();
            body.append('photo', photo.fichier);
            const { data } = await axiosClient.put('/profile/photo', body, { headers: { 'Content-Type': 'multipart/form-data' } });
            setProfile(data);
            setPhotoInfo(`${photo.resume} Photo enregistrée.`);
        } catch (err) {
            setPhotoInfo('');
            setPhotoError(err.response ? apiErrorMessage(err, 'La photo n’a pas pu être enregistrée.') : err.message);
        } finally { setUploading(false); }
    };

    // Le menu ne montre que ce que la personne a le droit de faire (réglé dans « Rôles et permissions » ; le serveur vérifie de toute façon).
    const si = (code, item) => (peut(code) ? [item] : []);
    const sections = [
        {
            heading: 'Activité',
            items: [
                { to: home, label: ['MEDECIN', 'SAGE_FEMME', 'INFIRMIERE'].includes(role) && !peut('RDV_ATTRIBUER') && !peut('RDV_CONFIRMER') ? 'Mon espace' : 'Tableau de bord', icon: LayoutDashboard, end: true, badge: 'rdv' },
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
                ...si('SITE_MODIFIER', { to: '/admin/personnalisation', label: 'Couleurs du site', icon: Palette }),
                ...si('SITE_MODIFIER', { to: '/?edition=1', label: 'Modifier le site', icon: Pencil, key: 'edit-site' }),
            ],
        },
    ].filter(section => section.items.length > 0);

    const linkClass = ({ isActive }) => `group flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm transition ${
        isActive ? 'bg-(--mt-main) font-bold text-(--mt-sur-main) shadow-[0_10px_24px_rgba(3,204,230,.28)]' : 'font-medium text-slate-300 hover:bg-white/8 hover:text-white'} focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-teal-300`;

    return (
        <div className="theme-staff min-h-screen bg-[#f1f7fa] text-slate-800 dark:bg-gray-950 dark:text-gray-100">
            <aside className={`${menuOpen ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-40 flex w-72 flex-col bg-[#0e2a38] text-slate-200 transition-transform duration-200 lg:inset-y-3 lg:left-3 lg:translate-x-0 lg:rounded-[2rem] lg:shadow-[0_24px_60px_rgba(14,42,56,.35)]`}>
                <div className="flex h-20 items-center gap-3 px-6">
                    <img src="/logo_casafami.png" alt="" className="h-11 w-11 rounded-2xl bg-white object-contain p-1" />
                    <div>
                        <div className="font-bold tracking-wide text-white">{APP_NAME}</div>
                        <div className="flex items-center gap-1 text-xs text-teal-300"><HeartPulse size={12} />Gestion du cabinet</div>
                    </div>
                    <button onClick={() => setMenuOpen(false)} className="ml-auto rounded-lg p-1 hover:bg-white/10 lg:hidden" aria-label="Fermer le menu"><X size={19} /></button>
                </div>

                <nav className="flex-1 space-y-6 overflow-y-auto px-4 py-4" aria-label="Navigation principale">
                    {sections.map(section => (
                        <div key={section.heading}>
                            <div className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-widest text-slate-500">{section.heading}</div>
                            <div className="space-y-1">
                                {section.items.map(item => {
                                    const Icon = item.icon;
                                    const n = item.badge ? nombre(item.badge) : 0;
                                    return (
                                        <NavLink key={item.key || item.label} to={item.to} state={item.state} end={item.end}
                                            onClick={() => setMenuOpen(false)}
                                            className={item.key ? () => linkClass({ isActive: false }) : linkClass}>
                                            <Icon size={18} className="shrink-0" />{item.label}
                                            {n > 0 && <span aria-label={`${n} nouveau${n > 1 ? 'x' : ''}`} className="ml-auto inline-flex min-w-[1.5rem] items-center justify-center rounded-full bg-sky-500 px-1.5 py-0.5 text-[11px] font-bold leading-none tabular-nums text-white shadow-sm">{n > 99 ? '99+' : n}</span>}
                                        </NavLink>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                    <Link to="/" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-400 transition hover:bg-white/5 hover:text-white">
                        <ExternalLink size={18} />Voir le site public
                    </Link>
                </nav>

                <div className="m-3 rounded-3xl bg-white/[0.06] p-3">
                    <div className="flex items-center gap-3">
                        <input ref={fileInput} type="file" accept="image/*" className="hidden" onChange={uploadPhoto} />
                        <button type="button" onClick={() => fileInput.current?.click()} disabled={uploading}
                            title="Changer ma photo de profil (convertie automatiquement en JPEG)" aria-label="Changer ma photo de profil"
                            className="group relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-teal-500/20 text-teal-200 ring-2 ring-white/10 disabled:opacity-60">
                            {profile?.photoUrl ? <img src={assetUrl(profile.photoUrl)} alt="" className="h-full w-full object-cover" /> : <UserRound size={20} />}
                            <span className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition group-hover:opacity-100"><Camera size={15} /></span>
                        </button>
                        <div className="min-w-0 flex-1">
                            <div className="line-clamp-2 break-words text-sm font-semibold leading-tight text-white" title={profile?.nom || getEmail()}>{profile?.nom || getEmail()}</div>
                            {(profile?.nom || getEmail()) !== getRoleLabel(role) && <div className="mt-1 inline-block max-w-full truncate rounded-full bg-teal-500/15 px-2 py-0.5 text-[11px] font-medium text-teal-200">{getRoleLabel(role)}</div>}
                        </div>
                        <button onClick={() => setPasswordOpen(true)} title="Changer mon mot de passe" aria-label="Changer mon mot de passe" className="rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"><KeyRound size={18} /></button>
                        <button onClick={logout} title="Déconnexion" aria-label="Déconnexion" className="rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"><LogOut size={18} /></button>
                    </div>
                    {photoError && <p role="alert" className="mt-2 text-xs text-rose-300">{photoError}</p>}
                    {photoInfo && !photoError && <p role="status" className="mt-2 text-xs leading-snug text-emerald-200">{photoInfo}</p>}
                </div>
            </aside>
            {menuOpen && <button className="fixed inset-0 z-30 bg-black/50 lg:hidden" aria-label="Fermer le menu" onClick={() => setMenuOpen(false)} />}

            <div className="lg:pl-[19rem]">
                <header className="sticky top-0 z-20 flex h-20 items-center gap-3 bg-[#f1f7fa]/85 px-4 backdrop-blur-md dark:bg-gray-950/85 sm:px-8">
                    <button onClick={() => setMenuOpen(true)} className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-gray-800 lg:hidden" aria-label="Ouvrir le menu"><Menu size={20} /></button>
                    <div className="min-w-0">
                        <h1 className="truncate text-base font-bold leading-tight sm:text-xl">{title}</h1>
                        {subtitle && <p className="hidden truncate text-xs text-slate-500 dark:text-gray-400 sm:block">{subtitle}</p>}
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                        {peut('PATIENTS_RECHERCHER') && <PatientSearch className="relative hidden w-56 md:block xl:w-72" />}
                        <MessagerieBouton />
                        <NotificationBell onOpenRdv={notification => navigate(notification?.lien || (notification?.rendezVousId ? (role === 'SUPER_ADMIN' ? `${home}?rdv=${notification.rendezVousId}` : `/espace/mes-patients?rdv=${notification.rendezVousId}`) : home))} />
                        <button onClick={toggleTheme} aria-label="Changer de thème" title="Changer de thème"
                            className="rounded-xl border border-slate-200 p-2.5 text-slate-600 transition hover:bg-slate-100 dark:border-gray-700 dark:text-yellow-300 dark:hover:bg-gray-800">
                            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
                        </button>
                        {actions}
                    </div>
                </header>
                <main className="mx-auto max-w-[1500px] space-y-6 p-4 sm:p-8">
                    {typeof children === 'function' ? children(profile) : children}
                </main>
            </div>
            {passwordOpen && <PasswordDialog onClose={() => setPasswordOpen(false)} />}
        </div>
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
            setDone(true);
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
