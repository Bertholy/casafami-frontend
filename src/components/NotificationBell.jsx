import { useCallback, useEffect, useRef, useState } from 'react';
import { BadgeCheck, Bell, BellRing, CalendarCheck, CalendarClock, CalendarOff, CalendarPlus, CalendarX, CheckCheck, KeyRound, ShieldAlert, Trash2, UserCheck, UserMinus } from 'lucide-react';
import axiosClient from '../api/axiosClient';

const REFRESH_MS = 30000;
const ICONES = {
    RDV_ATTRIBUE: { Icone: CalendarCheck, classe: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' },
    CONGE: { Icone: CalendarOff, classe: 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300' },
    RDV_NOUVEAU: { Icone: CalendarPlus, classe: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300' },
    RDV_MODIFIE: { Icone: CalendarClock, classe: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300' },
    RDV_CORBEILLE: { Icone: Trash2, classe: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300' },
    RDV_ACCEPTE: { Icone: UserCheck, classe: 'bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300' },
    RDV_CONFIRME: { Icone: BadgeCheck, classe: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300' },
    MOT_DE_PASSE: { Icone: KeyRound, classe: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300' },
    SAUVEGARDE_ECHEC: { Icone: ShieldAlert, classe: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300' },
    RDV_RETIRE: { Icone: UserMinus, classe: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300' },
    RDV_ANNULE: { Icone: CalendarX, classe: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300' },
    RDV_DEPLACE: { Icone: CalendarClock, classe: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300' },
};

function ilYa(iso) {
    const minutes = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
    if (minutes < 1) return 'à l’instant';
    if (minutes < 60) return `il y a ${minutes} min`;
    const heures = Math.round(minutes / 60);
    if (heures < 24) return `il y a ${heures} h`;
    return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

/**
 * Cloche de notifications en haut de l'écran : les rendez-vous que le super administrateur confie, retire ou
 * déplace, les annulations, et — pour le super administrateur — les rendez-vous acceptés par le personnel. Se met à jour toutes les 30 secondes et au retour sur l'onglet.
 */
export default function NotificationBell({ onOpenRdv }) {
    const [data, setData] = useState({ nonLues: 0, notifications: [] });
    const [ouvert, setOuvert] = useState(false);
    const conteneur = useRef(null);

    const charger = useCallback(() => {
        axiosClient.get('/notifications').then(({ data: d }) => setData(d)).catch(() => {});
    }, []);

    useEffect(() => {
        const premier = window.setTimeout(charger, 0);
        const intervalle = window.setInterval(charger, REFRESH_MS);
        const auFocus = () => { if (document.visibilityState === 'visible') charger(); };
        window.addEventListener('focus', charger);
        document.addEventListener('visibilitychange', auFocus);
        return () => { window.clearTimeout(premier); window.clearInterval(intervalle); window.removeEventListener('focus', charger); document.removeEventListener('visibilitychange', auFocus); };
    }, [charger]);

    useEffect(() => {
        if (!ouvert) return undefined;
        const fermer = event => { if (conteneur.current && !conteneur.current.contains(event.target)) setOuvert(false); };
        const echap = event => { if (event.key === 'Escape') setOuvert(false); };
        document.addEventListener('mousedown', fermer);
        document.addEventListener('keydown', echap);
        return () => { document.removeEventListener('mousedown', fermer); document.removeEventListener('keydown', echap); };
    }, [ouvert]);

    const lire = async notification => {
        if (!notification.lue) {
            setData(courant => ({ nonLues: Math.max(0, courant.nonLues - 1), notifications: courant.notifications.map(n => (n.id === notification.id ? { ...n, lue: true } : n)) }));
            axiosClient.put(`/notifications/${notification.id}/lue`).catch(charger);
        }
        setOuvert(false);
        if (onOpenRdv) onOpenRdv(notification);
    };
    const toutLire = async () => {
        setData(courant => ({ nonLues: 0, notifications: courant.notifications.map(n => ({ ...n, lue: true })) }));
        axiosClient.put('/notifications/lues').catch(charger);
    };

    const nb = data.nonLues;
    return (
        <div ref={conteneur} className="relative">
            <button onClick={() => { setOuvert(courant => !courant); charger(); }} aria-label={nb ? `${nb} notification${nb > 1 ? 's' : ''} non lue${nb > 1 ? 's' : ''}` : 'Notifications'} aria-expanded={ouvert} title="Notifications"
                className={`relative rounded-xl border p-2.5 transition hover:bg-slate-100 dark:hover:bg-gray-800 ${nb ? 'border-teal-300 text-teal-700 dark:border-teal-500/40 dark:text-teal-300' : 'border-slate-200 text-slate-600 dark:border-gray-700 dark:text-gray-300'}`}>
                {nb ? <BellRing size={17} /> : <Bell size={17} />}
                {nb > 0 && <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-[11px] font-bold text-white ring-2 ring-white dark:ring-gray-900">{nb > 9 ? '9+' : nb}</span>}
            </button>

            {ouvert && (
                <div role="dialog" aria-label="Notifications" className="absolute right-0 top-full z-50 mt-2 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900">
                    <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-gray-800">
                        <h2 className="text-sm font-semibold">Notifications{nb > 0 ? ` (${nb} non lue${nb > 1 ? 's' : ''})` : ''}</h2>
                        {nb > 0 && <button onClick={toutLire} className="inline-flex items-center gap-1 text-xs font-medium text-teal-700 hover:underline dark:text-teal-300"><CheckCheck size={14} />Tout marquer comme lu</button>}
                    </div>
                    <ul className="max-h-[26rem] divide-y divide-slate-100 overflow-y-auto dark:divide-gray-800">
                        {data.notifications.length === 0 && <li className="p-8 text-center text-sm text-slate-500 dark:text-gray-400">Aucune notification pour le moment.<br /><span className="text-xs">Vous serez prévenu(e) quand un rendez-vous vous est confié.</span></li>}
                        {data.notifications.map(n => {
                            const { Icone, classe } = ICONES[n.type] || ICONES.RDV_ATTRIBUE;
                            return (
                                <li key={n.id}>
                                    <button onClick={() => lire(n)} className={`flex w-full gap-3 px-4 py-3 text-left transition hover:bg-slate-50 dark:hover:bg-gray-800 ${n.lue ? '' : 'bg-teal-50/60 dark:bg-teal-500/5'}`}>
                                        <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${classe}`}><Icone size={16} /></span>
                                        <span className="min-w-0 flex-1">
                                            <span className="flex items-center justify-between gap-2"><span className={`truncate text-sm ${n.lue ? 'font-medium' : 'font-bold'}`}>{n.titre}</span><span className="shrink-0 text-[11px] text-slate-400">{ilYa(n.creeLe)}</span></span>
                                            <span className="mt-0.5 block text-xs text-slate-600 dark:text-gray-300">{n.message}</span>
                                            {n.creePar && <span className="mt-1 block text-[11px] text-slate-400">Par {n.creePar}</span>}
                                        </span>
                                        {!n.lue && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-teal-600" aria-hidden="true" />}
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            )}
        </div>
    );
}
