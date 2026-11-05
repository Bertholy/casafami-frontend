/**
 * Voyant « nouveau patient » (rouge) ou « patient existant » (vert qui palpite), réservé au personnel. Il se lit sur les champs envoyés par le serveur
 * avec chaque rendez-vous : `nouveauClient` (premier passage du patient au cabinet), `passage` (rang de ce passage) et `passagesTotal`.
 * Sans ces champs (rendez-vous venu d'une liste qui ne les calcule pas), rien n'est affiché.
 */
export default function EtatClient({ rdv, className = '' }) {
    if (!rdv || rdv.nouveauClient == null) return null;
    const nouveau = rdv.nouveauClient;
    const texte = nouveau ? 'Nouveau patient' : `Patient existant · ${rdv.passage}e passage`;
    return (
        <span className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-semibold ${nouveau ? 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'} ${className}`}
            title={nouveau ? 'Premier passage de ce patient au cabinet' : `${rdv.passagesTotal} passage${rdv.passagesTotal > 1 ? 's' : ''} au total : déjà venu`}>
            <span className="relative flex h-2.5 w-2.5" aria-hidden="true">
                {!nouveau && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60 motion-reduce:animate-none" />}
                <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${nouveau ? 'bg-rose-500' : 'bg-emerald-500'}`} />
            </span>
            {texte}
        </span>
    );
}
