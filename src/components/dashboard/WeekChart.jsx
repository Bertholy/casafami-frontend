import { STATUS, formatDateFr } from '../../constants/app';

/**
 * Histogramme des rendez-vous de la semaine (hors annulés).
 * Série unique : pas de légende, le titre de la carte nomme la mesure. Le détail par statut apparaît au survol / focus.
 */
export default function WeekChart({ days }) {
    const max = Math.max(4, ...days.map(day => day.total));
    const top = Math.ceil(max / 4) * 4;
    const ticks = [1, 0.75, 0.5, 0.25, 0].map(ratio => Math.round(top * ratio));
    const summary = days.map(day => `${formatDateFr(day.iso)} : ${day.total}`).join(', ');

    return (
        <figure className="m-0">
            <div role="img" aria-label={`Rendez-vous de la semaine. ${summary}`} className="relative h-56">
                {ticks.map((tick, index) => (
                    <div key={`${tick}-${index}`} className="absolute inset-x-0 flex items-center gap-2" style={{ top: `${index * 25}%` }}>
                        <span className="w-6 -translate-y-1/2 text-right text-[10px] tabular-nums text-slate-400">{tick}</span>
                        <span className="h-px flex-1 bg-slate-200/70 dark:bg-gray-800" />
                    </div>
                ))}
                <div className="absolute inset-0 flex items-stretch gap-2 pl-9 sm:gap-4">
                    {days.map(day => {
                        const height = day.total ? Math.max(4, (day.total / top) * 100) : 0;
                        return (
                            <div key={day.iso} tabIndex={0} className="group relative flex flex-1 items-end justify-center outline-none">
                                <div className="pointer-events-none absolute left-1/2 z-10 hidden w-max max-w-48 -translate-x-1/2 rounded-lg bg-slate-900 px-3 py-2 text-xs text-white shadow-lg group-hover:block group-focus:block"
                                    style={{ bottom: `calc(${height}% + 6px)` }}>
                                    <div className="font-semibold">{formatDateFr(day.iso, { weekday: 'long', day: 'numeric', month: 'long' })}</div>
                                    <div className="mt-0.5">{day.total} rendez-vous</div>
                                    {['EN_ATTENTE', 'CONFIRME', 'TERMINE'].filter(key => day.byStatus[key]).map(key => (
                                        <div key={key} className="text-slate-300">{day.byStatus[key]} {STATUS[key].label.toLowerCase()}</div>
                                    ))}
                                </div>
                                <div className={`w-full max-w-11 rounded-t-md transition-all group-hover:opacity-90 group-focus:ring-2 group-focus:ring-teal-400 ${day.isToday ? 'bg-teal-800 dark:bg-teal-300' : 'bg-teal-500 dark:bg-teal-700'}`}
                                    style={{ height: `${height}%` }} />
                            </div>
                        );
                    })}
                </div>
            </div>
            <div className="flex gap-2 pl-9 pt-2 sm:gap-4">
                {days.map(day => (
                    <div key={day.iso} className={`flex-1 text-center text-xs ${day.isToday ? 'font-bold text-teal-700 dark:text-teal-300' : 'text-slate-500 dark:text-gray-400'}`}>
                        <div>{formatDateFr(day.iso, { weekday: 'short' }).replace('.', '')}</div>
                        <div className="tabular-nums">{new Date(`${day.iso}T12:00:00`).getDate()}</div>
                    </div>
                ))}
            </div>
        </figure>
    );
}
