import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import ChartTooltip from './ChartTooltip';

const AXE = { fill: 'var(--sc-muted-foreground)', fontSize: 11 };

/**
 * Histogramme générique (Recharts, une série). items : [{ key, label, sublabel?, value, tooltip: [lignes], highlight?, color? }].
 * Le détail apparaît au survol ; un résumé textuel est fourni aux lecteurs d'écran.
 */
export default function ColumnChart({ items, ariaLabel, height = 'h-56' }) {
    const dense = items.length > 8;
    const donnees = items.map(item => ({ ...item, nom: item.sublabel ? `${item.label} ${item.sublabel}` : item.label }));
    const max = Math.max(4, ...items.map(item => item.value));

    return (
        <figure className="m-0">
            <div role="img" aria-label={`${ariaLabel}. ${items.map(item => `${item.label} : ${item.value}`).join(', ')}`} className={height}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={donnees} margin={{ top: 8, right: 8, bottom: 0, left: -18 }} barCategoryGap={dense ? '18%' : '28%'}>
                        <CartesianGrid vertical={false} stroke="var(--sc-border)" strokeDasharray="3 3" />
                        <XAxis dataKey="nom" tick={AXE} tickLine={false} axisLine={false} interval={0} />
                        <YAxis tick={AXE} tickLine={false} axisLine={false} allowDecimals={false} domain={[0, Math.ceil(max / 4) * 4]} tickCount={5} />
                        <Tooltip cursor={{ fill: 'var(--sc-accent)', opacity: 0.6 }} content={({ active, payload }) => {
                            const item = active && payload?.[0]?.payload;
                            return item ? <ChartTooltip titre={item.tooltip?.[0] || item.nom} lignes={item.tooltip?.slice(1)} /> : null;
                        }} />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={dense ? 28 : 44}>
                            {donnees.map(item => <Cell key={item.key} fill={item.color || (item.highlight ? 'var(--mt-main-clair)' : 'var(--mt-main)')} />)}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </figure>
    );
}
