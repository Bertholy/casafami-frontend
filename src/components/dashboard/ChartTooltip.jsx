/** Info-bulle commune des graphiques : un titre, puis des lignes de détail. Couleurs via les jetons du thème (clair et sombre). */
export default function ChartTooltip({ titre, lignes = [] }) {
    return (
        <div className="max-w-52 rounded-lg border border-border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md">
            <div className="font-semibold">{titre}</div>
            {lignes.map((ligne, index) => <div key={index} className="mt-0.5 text-muted-foreground">{ligne}</div>)}
        </div>
    );
}
