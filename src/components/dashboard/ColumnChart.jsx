/**
 * Histogramme générique (une série). items : [{ key, label, sublabel?, value, tooltip: [lignes], highlight? }].
 * Le détail apparaît au survol et au focus clavier ; un résumé textuel est fourni aux lecteurs d'écran.
 */
export default function ColumnChart({ items, ariaLabel, height = 'h-56' }) {
    const max = Math.max(4, ...items.map(item => item.value));
    const top = Math.ceil(max / 4) * 4;
    const ticks = [1, 0.75, 0.5, 0.25, 0].map(ratio => Math.round(top * ratio));
    const dense = items.length > 8;

    return (
        <figure className="m-0">
            <div role="img" aria-label={`${ariaLabel}. ${items.map(item => `${item.label} : ${item.value}`).join(', ')}`} className={`relative ${height}`}>
                {ticks.map((tick, index) => (
                    <div key={`${tick}-${index}`} className="absolute inset-x-0 flex items-center gap-2" style={{ top: `${index * 25}%` }}>
                        <span className="w-6 -translate-y-1/2 text-right text-[10px] tabular-nums text-slate-400">{tick}</span>
                        <span className="h-px flex-1 bg-slate-200/70 dark:bg-gray-800" />
                    </div>
                ))}
                <div className={`absolute inset-0 flex items-stretch pl-9 ${dense ? 'gap-1' : 'gap-2 sm:gap-4'}`}>
                    {items.map(item => {
                        const barHeight = item.value ? Math.max(4, (item.value / top) * 100) : 0;
                        return (
                            <div key={item.key} tabIndex={0} className="group relative flex flex-1 items-end justify-center outline-none">
                                <div className="pointer-events-none absolute left-1/2 z-10 hidden w-max max-w-48 -translate-x-1/2 rounded-lg bg-slate-900 px-3 py-2 text-xs text-white shadow-lg group-hover:block group-focus:block" style={{ bottom: `calc(${barHeight}% + 6px)` }}>
                                    {item.tooltip.map((line, i) => <div key={i} className={i === 0 ? 'font-semibold' : 'text-slate-300'}>{line}</div>)}
                                </div>
                                <div className={`w-full ${dense ? 'max-w-7' : 'max-w-11'} rounded-t-md transition-all group-hover:opacity-90 group-focus:ring-2 group-focus:ring-teal-400 ${item.highlight ? 'bg-teal-800 dark:bg-teal-300' : 'bg-teal-500 dark:bg-teal-700'}`} style={{ height: `${barHeight}%` }} />
                            </div>
                        );
                    })}
                </div>
            </div>
            <div className={`flex pl-9 pt-2 ${dense ? 'gap-1' : 'gap-2 sm:gap-4'}`}>
                {items.map(item => (
                    <div key={item.key} className={`flex-1 text-center text-xs ${item.highlight ? 'font-bold text-teal-700 dark:text-teal-300' : 'text-slate-500 dark:text-gray-400'}`}>
                        <div>{item.label}</div>
                        {item.sublabel && <div className="tabular-nums">{item.sublabel}</div>}
                    </div>
                ))}
            </div>
        </figure>
    );
}
