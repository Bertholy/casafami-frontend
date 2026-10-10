import { CalendarCheck, Check } from 'lucide-react';
import { STATUS, hhmm } from '../../constants/app';

const CABINET_TIMEZONE = 'Indian/Antananarivo';
const nowHHMM = () => new Date().toLocaleTimeString('fr-FR', { timeZone: CABINET_TIMEZONE, hour: '2-digit', minute: '2-digit' });

/** Frise chronologique des rendez-vous du jour ; le prochain rendez-vous à venir est mis en avant. */
export default function AgendaToday({ items, peutConfirmer, onConfirm, onOpen }) {
    const now = nowHHMM();
    const nextId = items.find(rdv => hhmm(rdv.heureRdv) >= now && (rdv.statut === 'EN_ATTENTE' || rdv.statut === 'CONFIRME'))?.id;

    if (!items.length) {
        return (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-center text-sm text-slate-500 dark:text-gray-400">
                <CalendarCheck size={26} className="text-slate-300" />
                Aucun rendez-vous aujourd’hui.
            </div>
        );
    }

    return (
        <ol className="relative space-y-1 before:absolute before:bottom-3 before:left-[3.35rem] before:top-3 before:w-px before:bg-slate-200 dark:before:bg-gray-800">
            {items.map(rdv => {
                const status = STATUS[rdv.statut] || STATUS.EN_ATTENTE;
                const isNext = rdv.id === nextId;
                return (
                    <li key={rdv.id} className={`relative flex items-center gap-3 rounded-xl p-2 transition ${isNext ? 'bg-teal-50 ring-1 ring-teal-200 dark:bg-teal-500/10 dark:ring-teal-500/30' : 'hover:bg-slate-50 dark:hover:bg-gray-800/60'}`}>
                        <span className="w-10 shrink-0 text-right text-sm font-semibold tabular-nums text-slate-700 dark:text-gray-200">{hhmm(rdv.heureRdv)}</span>
                        <span className={`relative z-10 h-3 w-3 shrink-0 rounded-full ring-4 ring-white dark:ring-gray-900 ${status.dot}`} aria-hidden="true" />
                        <button type="button" onClick={() => onOpen(rdv)} className="min-w-0 flex-1 text-left">
                            <span className="block truncate text-sm font-medium">{rdv.nomClient}</span>
                            <span className="block truncate text-xs text-slate-500 dark:text-gray-400">
                                {status.label}{rdv.praticienNom ? ` · avec ${rdv.praticienNom}` : ' · à attribuer'}{rdv.serviceNom ? ` · ${rdv.serviceNom}` : ''}{isNext ? ' · Prochain' : ''}
                            </span>
                        </button>
                        {peutConfirmer(rdv) && (
                            <button type="button" onClick={() => onConfirm(rdv)} title="Confirmer" aria-label={`Confirmer le rendez-vous de ${rdv.nomClient}`}
                                className="rounded-lg p-2 text-emerald-700 transition hover:bg-emerald-100 dark:text-emerald-300 dark:hover:bg-emerald-500/15"><Check size={16} /></button>
                        )}
                    </li>
                );
            })}
        </ol>
    );
}
