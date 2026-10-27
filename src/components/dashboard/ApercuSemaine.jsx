import { useId, useMemo, useState } from 'react';

/**
 * Aperçu de la semaine du tableau de bord (nouveau design « marine ») : trois chiffres avec leur courbe, la répartition par service
 * en anneau, trois jauges et un radar des jours. Tout vient des rendez-vous déjà chargés par le tableau de bord : aucune requête en plus,
 * et rien de cliquable qui change les données (les indicateurs et filtres restent ceux de la page). Dessin en SVG, sans bibliothèque.
 * Pas de gros cadres : les blocs sont séparés par de simples traits.
 */

const COULEURS = { rose: '#ff5c8a', orange: '#ffa14a', jaune: '#ffd24a', vert: '#3be3a3', cyan: '#35d0ff', violet: '#9b5cff', bleu: '#4d6bff' };
const COULEURS_SERVICES = [COULEURS.rose, COULEURS.violet, COULEURS.cyan, COULEURS.vert, COULEURS.jaune, COULEURS.orange, COULEURS.bleu];
const JOURS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const titre = 'mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-gray-400';

/** Courbe lissée avec un dégradé dessous et un point sur la dernière valeur. */
function Courbe({ data, couleur, label }) {
    const id = useId();
    const W = 300, H = 84;
    const max = Math.max(1, ...data) * 1.2;
    const points = data.map((valeur, i) => [i * (W / Math.max(1, data.length - 1)), H - 8 - (valeur / max) * (H - 22)]);
    let d = `M${points[0][0]} ${points[0][1]}`;
    for (let i = 1; i < points.length; i++) {
        const [x0, y0] = points[i - 1], [x1, y1] = points[i], milieu = (x0 + x1) / 2;
        d += ` C${milieu} ${y0} ${milieu} ${y1} ${x1} ${y1}`;
    }
    const dernier = points[points.length - 1];
    return (
        <div className="relative mt-3">
            <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label={label} className="block h-20 w-full">
                <defs>
                    <linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={couleur} stopOpacity=".4" /><stop offset="1" stopColor={couleur} stopOpacity="0" /></linearGradient>
                </defs>
                <path d={`${d} L${W} ${H} L0 ${H} Z`} fill={`url(#${id})`} />
                <path d={d} fill="none" stroke={couleur} strokeWidth="2.5" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
            </svg>
            <span aria-hidden="true" className="absolute right-0 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-white ring-2" style={{ top: `${(dernier[1] / H) * 100}%`, '--tw-ring-color': couleur }} />
        </div>
    );
}

/** Anneau « par service » : survoler un segment ou une ligne de la légende le met en avant. */
function AnneauServices({ parts, total }) {
    const [actif, setActif] = useState(null);
    const R = 76, C = 2 * Math.PI * R;
    // où commence chaque segment : la somme des segments qui le précèdent
    const decalages = parts.map((_, i) => parts.slice(0, i).reduce((somme, part) => somme + (total ? part.value / total : 0) * C, 0));
    return (
        <div className="grid items-center gap-5 sm:grid-cols-[minmax(0,10rem)_1fr] lg:grid-cols-1 xl:grid-cols-[minmax(0,10rem)_1fr]">
            <div className="relative mx-auto aspect-square w-full max-w-40">
                <svg viewBox="0 0 200 200" role="img" aria-label="Rendez-vous par service" className="h-full w-full -rotate-90">
                    <circle cx="100" cy="100" r={R} fill="none" strokeWidth="26" className="stroke-slate-200/70 dark:stroke-white/8" />
                    {parts.map((part, i) => {
                        const fraction = total ? part.value / total : 0;
                        const longueur = Math.max(0, fraction * C - 4);
                        const segment = (
                            <circle key={part.label} cx="100" cy="100" r={R} fill="none" stroke={part.couleur} strokeDasharray={`${longueur} ${C - longueur}`} strokeDashoffset={-decalages[i]}
                                strokeWidth={actif === i ? 32 : 26} opacity={actif === null || actif === i ? 1 : 0.4} className="cursor-pointer transition-all"
                                onMouseEnter={() => setActif(i)} onMouseLeave={() => setActif(null)}><title>{`${part.label} : ${part.value}`}</title></circle>
                        );
                        return segment;
                    })}
                </svg>
                <div className="pointer-events-none absolute inset-0 grid place-content-center text-center">
                    <b className="text-2xl font-extrabold leading-none tabular-nums">{actif === null ? total : parts[actif].value}</b>
                    <span className="mt-1 max-w-[6rem] truncate text-[11px] text-slate-500 dark:text-gray-400">{actif === null ? 'rendez-vous' : parts[actif].label}</span>
                </div>
            </div>
            <ul className="space-y-1">
                {parts.map((part, i) => (
                    <li key={part.label} onMouseEnter={() => setActif(i)} onMouseLeave={() => setActif(null)}
                        className={`flex items-center gap-2.5 rounded-lg px-2 py-1 text-sm transition ${actif === i ? 'bg-slate-100 dark:bg-white/8' : ''}`}>
                        <i aria-hidden="true" className="h-2.5 w-2.5 shrink-0 rounded-[3px]" style={{ background: part.couleur }} />
                        <span className="min-w-0 flex-1 truncate text-slate-700 dark:text-gray-200">{part.label}</span>
                        <b className="tabular-nums">{total ? Math.round((part.value / total) * 100) : 0} %</b>
                    </li>
                ))}
            </ul>
        </div>
    );
}

/** Petite jauge ronde avec son pourcentage. */
function Jauge({ pct, couleur, valeur, label }) {
    const R = 28, C = 2 * Math.PI * R;
    return (
        <div className="flex min-w-0 items-center gap-3">
            <div className="relative h-16 w-16 shrink-0">
                <svg viewBox="0 0 66 66" role="img" aria-label={`${label} : ${pct} %`} className="h-full w-full -rotate-90">
                    <circle cx="33" cy="33" r={R} fill="none" strokeWidth="7" className="stroke-slate-200 dark:stroke-white/10" />
                    <circle cx="33" cy="33" r={R} fill="none" stroke={couleur} strokeWidth="7" strokeLinecap="round" strokeDasharray={`${(C * pct) / 100} ${C}`} />
                </svg>
                <b className="absolute inset-0 grid place-items-center text-sm tabular-nums">{pct}%</b>
            </div>
            <div className="min-w-0">
                <b className="block text-lg leading-tight tabular-nums">{valeur}</b>
                <span className="block text-xs text-slate-500 dark:text-gray-400">{label}</span>
            </div>
        </div>
    );
}

/** Radar : le nombre de rendez-vous de chaque jour de la semaine, rapporté au jour le plus chargé. */
function Radar({ valeurs }) {
    const cx = 150, cy = 130, R = 92, max = Math.max(1, ...valeurs);
    const point = (i, r) => { const angle = -Math.PI / 2 + (i * 2 * Math.PI) / 7; return [cx + Math.cos(angle) * R * r, cy + Math.sin(angle) * R * r]; };
    const polygone = rapport => JOURS.map((_, i) => point(i, rapport(i)).join(',')).join(' ');
    return (
        <svg viewBox="0 0 300 260" role="img" aria-label="Rendez-vous par jour de la semaine" className="mx-auto block w-full max-w-72">
            {[0.25, 0.5, 0.75, 1].map(r => <polygon key={r} points={polygone(() => r)} fill="none" className="stroke-slate-200 dark:stroke-white/10" />)}
            {JOURS.map((jour, i) => {
                const [x, y] = point(i, 1), [tx, ty] = point(i, 1.2);
                return (
                    <g key={jour}>
                        <line x1={cx} y1={cy} x2={x} y2={y} className="stroke-slate-200 dark:stroke-white/8" />
                        <text x={tx} y={ty + 4} textAnchor="middle" fontSize="11" className="fill-slate-500 dark:fill-gray-400">{jour}</text>
                    </g>
                );
            })}
            <polygon points={polygone(i => valeurs[i] / max)} fill="rgba(255,92,138,.28)" stroke={COULEURS.rose} strokeWidth="2" strokeLinejoin="round" />
            {JOURS.map((jour, i) => { const [x, y] = point(i, valeurs[i] / max); return <circle key={jour} cx={x} cy={y} r="3.5" fill={COULEURS.rose}><title>{`${jour} : ${valeurs[i]}`}</title></circle>; })}
        </svg>
    );
}

export default function ApercuSemaine({ week, weekRdvs, rdvs, stats }) {
    const donnees = useMemo(() => {
        const parJour = filtre => week.map(jour => weekRdvs.filter(rdv => rdv.dateRdv === jour.iso && filtre(rdv)).length);
        const hebdo = parJour(rdv => rdv.statut !== 'ANNULE');
        const enCours = parJour(rdv => rdv.statut === 'EN_ATTENTE');
        const annules = parJour(rdv => rdv.statut === 'ANNULE');
        const somme = tableau => tableau.reduce((total, n) => total + n, 0);

        // services : les six plus demandés, le reste regroupé ; les rendez-vous annulés ne comptent pas
        const compte = new Map();
        rdvs.filter(rdv => rdv.statut !== 'ANNULE').forEach(rdv => { const nom = rdv.serviceNom || 'Sans service'; compte.set(nom, (compte.get(nom) || 0) + 1); });
        const tries = [...compte.entries()].sort((a, b) => b[1] - a[1]);
        const principaux = tries.slice(0, 6), reste = tries.slice(6).reduce((total, [, n]) => total + n, 0);
        const parts = [...principaux, ...(reste ? [['Autres services', reste]] : [])].map(([label, value], i) => ({ label, value, couleur: COULEURS_SERVICES[i % COULEURS_SERVICES.length] }));

        const total = Math.max(0, stats.total || 0);
        const pct = n => (total ? Math.round((n / total) * 100) : 0);
        return { hebdo, enCours, annules, somme, parts, partsTotal: parts.reduce((t, p) => t + p.value, 0), total, pct };
    }, [week, weekRdvs, rdvs, stats]);

    const { hebdo, enCours, annules, somme, parts, partsTotal, total, pct } = donnees;
    const chiffres = [
        { titre: 'Rendez-vous cette semaine', valeur: somme(hebdo), unite: 'rdv', data: hebdo, couleur: COULEURS.rose, detail: 'Par jour, hors rendez-vous annulés' },
        { titre: 'En cours de confirmation', valeur: somme(enCours), unite: 'en cours', data: enCours, couleur: COULEURS.cyan, detail: 'À confirmer par le cabinet' },
        { titre: 'Annulés cette semaine', valeur: somme(annules), unite: 'annulés', data: annules, couleur: COULEURS.vert, detail: 'Libèrent leur créneau' },
    ];

    return (
        <section aria-label="Aperçu de la semaine" className="space-y-6">
            <div className="grid gap-6 border-t border-(--st-line) pt-5 sm:grid-cols-3 sm:gap-0 sm:divide-x sm:divide-(--st-line)">
                {chiffres.map(chiffre => (
                    <div key={chiffre.titre} className="min-w-0 sm:px-6 sm:first:pl-0 sm:last:pr-0">
                        <p className={titre}>{chiffre.titre}</p>
                        <div className="flex items-baseline gap-2"><span className="text-4xl font-extrabold leading-none tabular-nums">{chiffre.valeur}</span><span className="text-sm font-bold" style={{ color: chiffre.couleur }}>{chiffre.unite}</span></div>
                        <p className="mt-1 text-xs text-slate-500 dark:text-gray-400">{chiffre.detail}</p>
                        <Courbe data={chiffre.data} couleur={chiffre.couleur} label={`${chiffre.titre}, par jour`} />
                    </div>
                ))}
            </div>

            <div className="grid gap-8 border-t border-(--st-line) pt-5 lg:grid-cols-3 lg:gap-0 lg:divide-x lg:divide-(--st-line)">
                <div className="min-w-0 lg:pr-6">
                    <p className={titre}>Rendez-vous par service</p>
                    {parts.length ? <AnneauServices parts={parts} total={partsTotal} /> : <p className="py-6 text-sm text-slate-500 dark:text-gray-400">Aucun rendez-vous sur la période choisie.</p>}
                </div>
                <div className="min-w-0 lg:px-6">
                    <p className={titre}>Sur la période choisie</p>
                    <div className="grid gap-5 sm:grid-cols-3 lg:grid-cols-1">
                        <Jauge pct={pct(stats.confirmed + stats.done)} couleur={COULEURS.cyan} valeur={stats.confirmed + stats.done} label="confirmés ou terminés" />
                        <Jauge pct={pct(stats.done)} couleur={COULEURS.vert} valeur={stats.done} label="terminés" />
                        <Jauge pct={pct(stats.cancelled)} couleur={COULEURS.rose} valeur={stats.cancelled} label={`annulés sur ${total}`} />
                    </div>
                </div>
                <div className="min-w-0 lg:pl-6">
                    <p className={titre}>Charge par jour de la semaine</p>
                    <Radar valeurs={hebdo} />
                </div>
            </div>
        </section>
    );
}
