import { Link } from 'react-router-dom';
import { ChevronDown, ChevronRight, HelpCircle } from 'lucide-react';
import { useLang } from '../i18n/LangContext';

/**
 * Questions fréquentes des patients. Les réponses reprennent les règles réelles du site (annulation jusqu'à 2 heures avant,
 * un rendez-vous par nom ou numéro sur 7 jours, retrouver son rendez-vous avec la clé de suivi…) : à mettre à jour si elles changent.
 */
const GROUPES = [
    {
        titre: 'Prendre rendez-vous',
        questions: [
            { q: 'Comment prendre rendez-vous ?', r: 'Ouvrez « Prendre rendez-vous » et choisissez : l’assistant vous pose les questions une à une, ou vous remplissez vous-même le formulaire (service, motif, date et heure). Dans les deux cas, vous pouvez passer de l’un à l’autre sans perdre vos réponses.' },
            { q: 'Faut-il créer un compte ?', r: 'Non. Il suffit d’indiquer votre nom, votre âge et votre numéro de téléphone. Pas d’inscription, pas de mot de passe.' },
            { q: 'Que signifie « En cours » sur mon rendez-vous ?', r: 'Votre demande est enregistrée, mais le cabinet ne l’a pas encore confirmée. Vous êtes prévenu par message dès qu’elle l’est.' },
            { q: 'Puis-je prendre plusieurs rendez-vous ?', r: 'Un même nom ou un même numéro de téléphone ne peut avoir qu’une réservation sur 7 jours. Si vous essayez d’en faire une seconde, le site vous indique le rendez-vous existant et la date à partir de laquelle vous pourrez en reprendre un, ou dès que le premier est annulé.' },
            { q: 'L’assistant peut-il me donner un avis médical ?', r: 'Non. L’assistant vous aide à remplir le formulaire et à choisir le bon service. Il n’établit aucun diagnostic et ne donne aucun conseil médical.' },
        ],
    },
    {
        titre: 'Mon rendez-vous',
        questions: [
            { q: 'Comment retrouver mon rendez-vous ?', r: 'Dans « Mes rendez-vous », saisissez votre clé de suivi (par exemple CF-7K3M-9QX2) ou scannez le code qui figure sur votre reçu. La clé s’affiche à la fin de la réservation.' },
            { q: 'J’ai perdu ma clé de suivi, que faire ?', r: 'Contactez le cabinet par téléphone : l’équipe pourra retrouver votre rendez-vous.' },
            { q: 'Comment annuler mon rendez-vous ?', r: 'Retrouvez-le dans « Mes rendez-vous » et choisissez « Annuler ». L’annulation est possible jusqu’à 2 heures avant l’heure prévue ; passé ce délai, appelez le cabinet.' },
            { q: 'Où télécharger mon reçu ?', r: 'Sur la page de confirmation après la réservation, ou plus tard dans « Mes rendez-vous », avec le bouton « Télécharger » : au choix en document PDF ou en image.' },
        ],
    },
    {
        titre: 'Le cabinet',
        questions: [
            { q: 'Que faire en cas d’urgence ?', r: 'N’attendez pas un rendez-vous : appelez le cabinet (urgences 24h/24) ou rendez-vous directement sur place. C’est le cas pour des saignements, des douleurs intenses, une perte des eaux ou un bébé qui bouge moins.' },
            { q: 'Quels sont les horaires et l’adresse ?', r: 'Les horaires et l’adresse du cabinet, à Andongona - Antsohihy, sont en bas de chaque page. Un clic sur l’adresse ouvre la carte, un clic sur un numéro lance l’appel.' },
            { q: 'Le site existe-t-il en malgache ?', r: 'Oui. Le choix de la langue (français ou malgache) se trouve dans la barre du haut.' },
            { q: 'Comment mes données sont-elles protégées ?', r: 'Seul le personnel du cabinet y a accès, selon son rôle, et elles ne sont ni vendues ni utilisées pour de la publicité. Le détail est dans la politique de confidentialité.' },
        ],
    },
];

export default function Faq() {
    const { t } = useLang();
    return (
        <div className="px-4 pb-20 pt-10 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-4xl">
                <nav aria-label={t("Fil d’Ariane")} className="mb-6 flex items-center gap-1.5 text-sm text-slate-500 dark:text-gray-400">
                    <Link to="/" className="hover:underline">{t("Accueil")}</Link><ChevronRight size={14} aria-hidden="true" /><span className="font-medium text-slate-800 dark:text-gray-100">{t("Questions fréquentes")}</span>
                </nav>

                <header className="relative mb-10 overflow-hidden rounded-[2rem] px-7 py-10 text-white sm:px-12 sm:py-14 md:rounded-[2.5rem]" style={{ background: 'var(--mt-main-fort)' }}>
                    <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10" />
                    <span className="relative mb-5 flex h-12 w-12 items-center justify-center rounded-full border-2 border-white/80"><HelpCircle className="h-5 w-5" aria-hidden="true" /></span>
                    <h1 className="relative mb-3 text-3xl font-extrabold md:text-5xl">{t("Questions fréquentes")}</h1>
                    <p className="relative max-w-2xl text-base leading-relaxed text-white/90 md:text-lg">{t("Les réponses aux questions les plus posées sur la prise de rendez-vous et le cabinet.")}</p>
                </header>

                <div className="space-y-10">
                    {GROUPES.map(groupe => (
                        <section key={groupe.titre} aria-labelledby={`faq-${groupe.titre}`}>
                            <h2 id={`faq-${groupe.titre}`} className="mb-4 text-xs font-extrabold uppercase tracking-[0.2em] text-teal-700 dark:text-teal-300">{t(groupe.titre)}</h2>
                            <div className="divide-y divide-slate-200 overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200 dark:divide-gray-700 dark:bg-gray-800 dark:ring-gray-700">
                                {groupe.questions.map(({ q, r }) => (
                                    <details key={q} className="group">
                                        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-bold text-slate-800 transition hover:bg-teal-50/50 sm:px-6 dark:text-white dark:hover:bg-gray-700/50 [&::-webkit-details-marker]:hidden">
                                            {t(q)}
                                            <ChevronDown className="h-5 w-5 shrink-0 text-teal-700 transition-transform duration-200 group-open:rotate-180 dark:text-teal-300" aria-hidden="true" />
                                        </summary>
                                        <p className="px-5 pb-5 text-[15px] leading-relaxed text-slate-600 sm:px-6 dark:text-gray-300">{t(r)}</p>
                                    </details>
                                ))}
                            </div>
                        </section>
                    ))}
                </div>

                <div className="mt-10 flex flex-col items-start justify-between gap-4 rounded-2xl bg-slate-100 p-6 text-sm text-slate-700 sm:flex-row sm:items-center dark:bg-gray-800/70 dark:text-gray-300">
                    <p>{t("Vous ne trouvez pas votre réponse ? Appelez le cabinet ou prenez rendez-vous.")}</p>
                    <Link to="/prendre-rdv" className="mt-btn shrink-0">{t("Prendre rendez-vous")}</Link>
                </div>
                <p className="mt-4 text-sm text-slate-600 dark:text-gray-400">{t("Voir aussi")} <Link to="/confidentialite" className="font-semibold text-teal-700 underline dark:text-teal-300">{t("Politique de confidentialité")}</Link>.</p>
            </div>
        </div>
    );
}
