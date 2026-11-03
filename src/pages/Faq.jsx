import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, ChevronRight, HelpCircle } from 'lucide-react';
import { useLang } from '../i18n/LangContext';
import { GROUPES } from '../constants/faq';


export default function Faq() {
    const { t } = useLang();
    const { hash } = useLocation();
    // un lien venant de la recherche du site (#faq-q-…) ouvre directement la question visée
    useEffect(() => {
        const question = hash ? document.getElementById(decodeURIComponent(hash.slice(1))) : null;
        if (question?.tagName === 'DETAILS') { question.open = true; question.querySelector('summary')?.focus({ preventScroll: true }); }
    }, [hash]);
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
                    {GROUPES.map((groupe, g) => (
                        <section key={groupe.titre} aria-labelledby={`faq-${groupe.titre}`}>
                            <h2 id={`faq-${groupe.titre}`} className="mb-4 text-xs font-extrabold uppercase tracking-[0.2em] text-teal-700 dark:text-teal-300">{t(groupe.titre)}</h2>
                            <div className="divide-y divide-slate-200 overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200 dark:divide-gray-700 dark:bg-gray-800 dark:ring-gray-700">
                                {groupe.questions.map(({ q, r }, i) => (
                                    <details key={q} id={`faq-q-${g}-${i}`} className="group scroll-mt-28">
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
