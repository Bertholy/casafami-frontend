import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { STATUS, formatDateFr } from '../../constants/app';
import ChartTooltip from './ChartTooltip';

const AXE = { fill: 'var(--sc-muted-foreground)', fontSize: 11 };

/**
 * Courbe des rendez-vous de la semaine (Recharts, hors annulés). Série unique : pas de légende, le titre de la carte nomme la mesure.
 * Le détail par statut apparaît au survol.
 */
export default function WeekChart({ days }) {
    const donnees = days.map(day => ({ ...day, nom: `${formatDateFr(day.iso, { weekday: 'short' }).replace('.', '')} ${new Date(`${day.iso}T12:00:00`).getDate()}` }));
    const max = Math.max(4, ...days.map(day => day.total));
    const resume = days.map(day => `${formatDateFr(day.iso)} : ${day.total}`).join(', ');

    return (
        <figure className="m-0">
            <div role="img" aria-label={`Rendez-vous de la semaine. ${resume}`} className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={donnees} margin={{ top: 8, right: 12, bottom: 0, left: -18 }}>
                        <defs>
                            <linearGradient id="semaine-degrade" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="var(--mt-main)" stopOpacity={0.45} />
                                <stop offset="100%" stopColor="var(--mt-main)" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid vertical={false} stroke="var(--sc-border)" strokeDasharray="3 3" />
                        <XAxis dataKey="nom" tick={AXE} tickLine={false} axisLine={false} interval={0} padding={{ left: 12, right: 12 }} />
                        <YAxis tick={AXE} tickLine={false} axisLine={false} allowDecimals={false} domain={[0, Math.ceil(max / 4) * 4]} tickCount={5} />
                        <Tooltip cursor={{ stroke: 'var(--mt-main)', strokeOpacity: 0.4 }} content={({ active, payload }) => {
                            const jour = active && payload?.[0]?.payload;
                            if (!jour) return null;
                            const lignes = [`${jour.total} rendez-vous`, ...['EN_ATTENTE', 'CONFIRME', 'TERMINE'].filter(key => jour.byStatus[key]).map(key => `${jour.byStatus[key]} ${STATUS[key].label.toLowerCase()}`)];
                            return <ChartTooltip titre={formatDateFr(jour.iso, { weekday: 'long', day: 'numeric', month: 'long' })} lignes={lignes} />;
                        }} />
                        <Area type="monotone" dataKey="total" stroke="var(--mt-main)" strokeWidth={2.5} fill="url(#semaine-degrade)"
                            dot={{ r: 3, fill: 'var(--mt-main)', strokeWidth: 0 }} activeDot={{ r: 5, strokeWidth: 0 }} />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </figure>
    );
}
