import { useCallback, useEffect, useState } from 'react';
import { SkeletonList } from '../ui/skeleton';
import { Link } from 'react-router-dom';
import { Activity, BellRing, CalendarCheck, Download, FolderOpen, LogIn, Palette, ScrollText, ShieldAlert, Stethoscope, Trash2, UserCog } from 'lucide-react';
import axiosClient from '../../api/axiosClient';
import { getRoleLabel } from '../../constants/app';
import { ACTIONS, GRAVES } from '../../constants/journal';

/** Icône d'une action du journal, d'après son code. */
function iconeDe(action) {
    if (action === 'CONNEXION_ECHEC') return ShieldAlert;
    if (action.startsWith('CONNEXION')) return LogIn;
    if (action.startsWith('RDV_')) return CalendarCheck;
    if (action.startsWith('CORBEILLE')) return Trash2;
    if (/^(COMPTE|ROLE|MOT_DE_PASSE)/.test(action)) return UserCog;
    if (action.startsWith('SERVICE')) return Stethoscope;
    if (/^(SITE|THEME)/.test(action)) return Palette;
    if (/^(DOSSIER|CONSULTATION)/.test(action)) return FolderOpen;
    if (/^(MALADIE|TRAITEMENT)/.test(action)) return Activity;
    if (action.startsWith('EXPORT')) return Download;
    if (action.startsWith('RAPPELS')) return BellRing;
    return ScrollText;
}

/** « il y a 5 min », « il y a 2 h », « il y a 3 jours »… */
function depuis(dateHeure) {
    const secondes = Math.max(0, (Date.now() - new Date(dateHeure).getTime()) / 1000);
    if (secondes < 60) return 'à l’instant';
    const minutes = Math.floor(secondes / 60);
    if (minutes < 60) return `il y a ${minutes} min`;
    const heures = Math.floor(minutes / 60);
    if (heures < 24) return `il y a ${heures} h`;
    const jours = Math.floor(heures / 24);
    return `il y a ${jours} jour${jours > 1 ? 's' : ''}`;
}

const quiEst = evenement => (evenement.acteurRole === 'PUBLIC' ? 'Visiteur du site' : evenement.acteurRole === 'SYSTEME' ? 'Système' : evenement.acteurEmail || getRoleLabel(evenement.acteurRole));

/**
 * Activité récente : les derniers événements du journal d'audit (qui a fait quoi, et quand), actualisés chaque minute.
 * Réservé aux personnes qui ont le droit « Voir le journal d'audit » : le parent ne l'affiche que dans ce cas.
 */
export default function ActivityLog({ limite = 7 }) {
    const [evenements, setEvenements] = useState(null);
    const [erreur, setErreur] = useState(false);

    const charger = useCallback(async () => {
        try {
            const { data } = await axiosClient.get('/admin/journal', { params: { page: 0, size: limite } });
            setEvenements(data.contenu || []); setErreur(false);
        } catch { setErreur(true); }
    }, [limite]);

    useEffect(() => {
        const premier = window.setTimeout(charger, 0);
        const minuteur = window.setInterval(charger, 60000);
        return () => { window.clearTimeout(premier); window.clearInterval(minuteur); };
    }, [charger]);

    return (
        <section aria-labelledby="activite-titre" className="rounded-xl border border-slate-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <div className="mb-3 flex items-center justify-between gap-2">
                <h2 id="activite-titre" className="flex items-center gap-2 font-semibold"><span className="h-2 w-2 rounded-full bg-(--mt-main)" aria-hidden="true" />Activité récente</h2>
                <Link to="/admin/journal" className="text-xs font-semibold text-teal-700 hover:underline dark:text-teal-300">Voir tout</Link>
            </div>
            {evenements === null && !erreur && <SkeletonList rows={4} className="p-0 py-2" />}
            {erreur && evenements === null && <p className="py-6 text-center text-sm text-slate-500 dark:text-gray-400">Le journal n’est pas disponible pour le moment.</p>}
            {evenements?.length === 0 && <p className="py-6 text-center text-sm text-slate-500 dark:text-gray-400">Aucune activité enregistrée.</p>}
            <ul className="divide-y divide-slate-100 dark:divide-gray-800">
                {evenements?.map(evenement => {
                    const Icone = iconeDe(evenement.action);
                    const grave = GRAVES.includes(evenement.action);
                    return (
                        <li key={evenement.id} className="flex items-start gap-3 py-2.5 first:pt-0 last:pb-0">
                            <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${grave ? 'bg-rose-500/15 text-rose-500' : 'bg-teal-500/15 text-teal-700 dark:text-teal-300'}`}><Icone size={15} aria-hidden="true" /></span>
                            <div className="min-w-0 flex-1">
                                <div className="truncate text-sm font-medium">{ACTIONS[evenement.action] || evenement.action}</div>
                                <div className="truncate text-xs text-slate-500 dark:text-gray-400" title={evenement.details || undefined}>{quiEst(evenement)}{evenement.details ? ` · ${evenement.details}` : ''}</div>
                                <div className="text-[11px] text-slate-400 dark:text-gray-500">{depuis(evenement.dateHeure)}</div>
                            </div>
                        </li>
                    );
                })}
            </ul>
        </section>
    );
}
