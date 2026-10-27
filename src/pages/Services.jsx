import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axiosClient, { assetUrl } from '../api/axiosClient';
import Editable from '../components/site/Editable';
import Movable from '../components/site/Movable';
import { SkeletonCards } from '../components/ui/skeleton';
import { detailsDuService } from '../constants/detailsServices';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from '../components/ui/dialog';
import { AlertCircle, Calendar, Check, Clock, HeartPulse, Info, LayoutGrid, List, Plus, X } from 'lucide-react';
import { useLang } from '../i18n/LangContext';

const CLE_VUE = 'services-vue';

/** Mode d'affichage mémorisé sur cet appareil : « liste » (par défaut) ou « grille ». */
const vueEnregistree = () => {
    try { return localStorage.getItem(CLE_VUE) === 'grille' ? 'grille' : 'liste'; }
    catch { return 'liste'; }
};

// Association service -> image
const getImageForService = (nom) => {
    const nomLower = nom.toLowerCase();
    if (nomLower.includes('consultation')) return '/general.jpg';
    if (nomLower.includes('soin')) return '/infi.png';
    if (nomLower.includes('vaccin')) return '/vaccination.jpg';
    if (nomLower.includes('analyse')) return '/sang.jpg';
    if (nomLower.includes('grossesse')) return '/suivi-grossesse.png';
    if (nomLower.includes('accouchement')) return '/accouchement.png';
    if (nomLower.includes('échographie') || nomLower.includes('echographie')) return '/echo.png';
    if (nomLower.includes('planning')) return '/planning-familial.png';
    return '/general.jpg';
};

/** Détail d'un service : ce qu'il comprend, ce qu'il faut apporter, et quand ne pas attendre un rendez-vous. */
function DetailService({ detail, className = '' }) {
    const { t } = useLang();
    return (
                <div className={`grid gap-8 ${className}`}>
                    <div>
                        <p className="mb-5 max-w-xl leading-relaxed text-slate-600 dark:text-gray-300">{t(detail.resume)}</p>
                        <p className="mb-3 text-xs font-extrabold uppercase tracking-[0.18em] text-slate-500 dark:text-gray-400">{t("Ce que comprend ce service")}</p>
                        <ul className="grid gap-x-6 gap-y-2.5 text-sm text-slate-700 sm:grid-cols-2 dark:text-gray-200">
                            {detail.inclus.map(element => (
                                <li key={element} className="flex items-start gap-2.5">
                                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" aria-hidden="true" />{t(element)}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="space-y-4">
                        <div className="rounded-2xl bg-slate-100 p-5 dark:bg-gray-800">
                            <p className="mb-3 flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.18em] text-slate-500 dark:text-gray-400"><Info className="h-4 w-4" aria-hidden="true" />{t("Avant de venir")}</p>
                            <ul className="space-y-2.5 text-sm leading-relaxed text-slate-700 dark:text-gray-200">
                                {detail.avant.map(conseil => <li key={conseil} className="flex gap-2.5"><span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-600" />{t(conseil)}</li>)}
                            </ul>
                        </div>
                        {detail.urgence && (
                            <p className="flex gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm leading-relaxed text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-100">
                                <HeartPulse className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />{t(detail.urgence)}
                            </p>
                        )}
                    </div>
                </div>
    );
}

/** Un service en carte (mode grille) : un clic ouvre une fenêtre avec le détail. */
function ServiceCarte({ service, onOuvrir }) {
    const { t } = useLang();
    const detail = detailsDuService(service.nom);
    const imageSrc = service.imageUrl ? assetUrl(service.imageUrl) : getImageForService(service.nom);
    const corps = (
        <>
            <span className="block aspect-[4/3] overflow-hidden">
                <img loading="lazy" decoding="async" src={imageSrc} alt=""
                    onError={event => { event.currentTarget.onerror = null; event.currentTarget.src = '/general.jpg'; }}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
            </span>
            <span className="flex flex-1 flex-col p-5">
                <span className="font-titre block text-lg font-extrabold text-slate-800 dark:text-white">{t(service.nom)}</span>
                <span className="mt-2 block flex-1 text-sm leading-relaxed text-slate-500 dark:text-gray-400">{service.description ? t(service.description) : t("Description à venir.")}</span>
                <span className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-4 dark:border-gray-700">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-700 dark:text-teal-300"><Clock className="h-3.5 w-3.5" aria-hidden="true" />{service.duree ? t("Durée : {duree}", { duree: service.duree }) : t("Sur rendez-vous")}</span>
                    {detail && <span className="inline-flex items-center gap-1 text-xs font-extrabold uppercase tracking-wide text-teal-700 dark:text-teal-300">{t("Voir le détail")}<Plus className="h-4 w-4" aria-hidden="true" /></span>}
                </span>
            </span>
        </>
    );
    const classe = 'group flex h-full w-full flex-col overflow-hidden border border-slate-200 bg-white text-left transition duration-300 dark:border-gray-700 dark:bg-gray-900';
    return detail
        ? <button type="button" onClick={onOuvrir} aria-haspopup="dialog" className={`${classe} hover:-translate-y-1 hover:border-teal-600/60 hover:shadow-lg`}>{corps}</button>
        : <div className={classe}>{corps}</div>;
}

/** Fenêtre qui montre le détail d'un service choisi dans la grille. */
function FenetreService({ service, onFermer }) {
    const { t } = useLang();
    const detail = service ? detailsDuService(service.nom) : null;
    const imageSrc = service ? (service.imageUrl ? assetUrl(service.imageUrl) : getImageForService(service.nom)) : '';
    return (
        <Dialog open={Boolean(service && detail)} onOpenChange={ouvert => { if (!ouvert) onFermer(); }}>
            {service && detail && (
                <DialogContent aria-describedby="service-resume" className="top-[5vh] max-h-[90vh] max-w-2xl overflow-y-auto rounded-2xl bg-white text-slate-800 dark:bg-gray-900 dark:text-gray-100">
                    <div className="relative h-40 sm:h-48">
                        <img src={imageSrc} alt="" onError={event => { event.currentTarget.onerror = null; event.currentTarget.src = '/general.jpg'; }} className="h-full w-full object-cover" />
                        <div aria-hidden="true" className="absolute inset-0 bg-linear-to-t from-black/70 to-transparent" />
                        <DialogTitle className="font-titre absolute bottom-4 left-6 right-16 text-2xl font-extrabold text-white">{t(service.nom)}</DialogTitle>
                        <DialogClose aria-label={t("Fermer")} className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white transition hover:bg-black/60"><X className="h-5 w-5" /></DialogClose>
                    </div>
                    <div className="p-6">
                        <DialogDescription id="service-resume" className="sr-only">{t(detail.resume)}</DialogDescription>
                        <p className="mb-5 inline-flex items-center gap-1.5 text-xs font-bold text-teal-700 dark:text-teal-300"><Clock className="h-3.5 w-3.5" aria-hidden="true" />{service.duree ? t("Durée : {duree}", { duree: service.duree }) : t("Sur rendez-vous")}</p>
                        <DetailService detail={detail} className="sm:grid-cols-1" />
                    </div>
                </DialogContent>
            )}
        </Dialog>
    );
}

/**
 * Un service : une ligne avec sa photo, son nom, sa description et sa durée. Un clic la déplie et montre le détail
 * (ce que comprend le service, ce qu'il faut apporter). Un service sans détail connu reste une simple ligne.
 */
function ServiceLigne({ service, rang, ouvert, onBascule }) {
    const { t } = useLang();
    const detail = detailsDuService(service.nom);
    const imageSrc = service.imageUrl ? assetUrl(service.imageUrl) : getImageForService(service.nom);
    const numero = String(rang + 1).padStart(2, '0');

    const contenu = (
        <>
            <span aria-hidden="true" className="font-titre hidden w-12 shrink-0 text-4xl font-extrabold text-teal-600/25 sm:block">{numero}</span>
            <span className="block aspect-[4/3] w-28 shrink-0 overflow-hidden rounded-2xl sm:w-44">
                <img loading="lazy" decoding="async" src={imageSrc} alt=""
                    onError={event => { event.currentTarget.onerror = null; event.currentTarget.src = '/general.jpg'; }}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
            </span>
            <span className="block min-w-0 flex-1">
                <span className="font-titre block text-lg font-extrabold text-slate-800 sm:text-xl dark:text-white">{t(service.nom)}</span>
                <span className="mt-1.5 block text-sm leading-relaxed text-slate-500 dark:text-gray-400">{service.description ? t(service.description) : t("Description à venir.")}</span>
                <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-teal-700 dark:text-teal-300">
                    <Clock className="h-3.5 w-3.5" aria-hidden="true" />{service.duree ? t("Durée : {duree}", { duree: service.duree }) : t("Sur rendez-vous")}
                </span>
            </span>
            {detail && (
                <span className="flex shrink-0 items-center gap-3 self-center">
                    <span className="hidden text-xs font-extrabold uppercase tracking-wide text-teal-700 md:block dark:text-teal-300">{ouvert ? t("Réduire") : t("Voir le détail")}</span>
                    <span aria-hidden="true" className={`flex h-10 w-10 items-center justify-center rounded-full border-2 border-teal-600 text-teal-700 transition duration-300 dark:text-teal-300 ${ouvert ? 'rotate-45 bg-teal-600 text-white dark:text-white' : 'group-hover:bg-teal-50 dark:group-hover:bg-gray-700'}`}><Plus className="h-5 w-5" /></span>
                </span>
            )}
        </>
    );

    return (
        <li className="group border-b border-slate-200 last:border-b-0 dark:border-gray-700">
            <h3>
                {detail ? (
                    <button type="button" onClick={onBascule} aria-expanded={ouvert} aria-controls={`service-${service.id}`}
                        className="flex w-full items-stretch gap-4 px-2 py-5 text-left transition hover:bg-teal-50/40 sm:gap-6 sm:px-4 dark:hover:bg-gray-800/60">
                        {contenu}
                    </button>
                ) : (
                    <div className="flex items-stretch gap-4 px-2 py-5 sm:gap-6 sm:px-4">{contenu}</div>
                )}
            </h3>

            {detail && (
                <div id={`service-${service.id}`} role="region" aria-label={t(service.nom)} inert={!ouvert}
                    className={`grid transition-[grid-template-rows] duration-300 ease-out ${ouvert ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                    <div className="overflow-hidden">
                        <DetailService detail={detail} className="px-2 pb-8 pt-2 sm:px-4 lg:grid-cols-[1.2fr_1fr] lg:pl-[calc(3rem+1.5rem+1rem)]" />
                    </div>
                </div>
            )}
        </li>
    );
}

function Services() {
    const { t } = useLang();
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [vue, setVue] = useState(vueEnregistree);
    const [ouvert, setOuvert] = useState(null);   // liste : identifiant du service déplié (un seul à la fois)
    const [fenetre, setFenetre] = useState(null);  // grille : service dont la fenêtre de détail est ouverte

    useEffect(() => {
        axiosClient.get('/services')
            .then((response) => {
                setServices(response.data);
                setLoading(false);
            })
            .catch((err) => {
                console.error('Erreur:', err);
                setError('Impossible de charger les services');
                setLoading(false);
            });
    }, []);

    const choisirVue = (valeur) => {
        setVue(valeur);
        try { localStorage.setItem(CLE_VUE, valeur); } catch { /* stockage indisponible : le choix n'est pas mémorisé */ }
    };

    // État d'erreur
    if (error) {
        return (
            <div className="min-h-[500px] flex items-center justify-center px-4">
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-8 max-w-md text-center">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-red-700 dark:text-red-400 mb-2">
                        {t("Erreur")}
                    </h3>
                    <p className="text-red-600 dark:text-red-300 mb-4">{t(error)}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="bg-red-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-red-700 transition"
                    >
                        {t("Réessayer")}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="transition-colors">

            {/* ========== EN-TÊTE ========== */}
            <section className="px-4 pb-4 pt-14 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-6xl">
                    <div>
                        <Editable id="services.hero.badge" as="p" className="mb-4 text-xs font-extrabold uppercase tracking-[0.3em] text-teal-700 dark:text-teal-300">Nos prestations</Editable>
                        <Editable id="services.hero.titre" as="h1" accent={-1} className="mb-4 text-4xl font-extrabold leading-[1.05] md:text-6xl [&_em]:text-teal-600 [&_em]:not-italic">Nos services médicaux</Editable>
                        <Editable id="services.hero.texte" as="p" className="max-w-xl text-lg text-slate-600 dark:text-gray-300 md:text-xl">Des soins de qualité adaptés à vos besoins, assurés par une équipe expérimentée</Editable>
                    </div>
                </div>
            </section>

            {/* ========== LISTE DES SERVICES ========== */}
            <section className="py-10">
                <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-slate-600 dark:text-gray-300" aria-live="polite">
                            {!loading && services.length > 0 && `${services.length} ${services.length > 1 ? t("services") : t("service")} · ${t("Cliquez sur un service pour voir son détail.")}`}
                        </p>
                        <div role="group" aria-label={t("Mode d’affichage")} className="inline-flex border border-slate-300 bg-white dark:border-gray-600 dark:bg-gray-900">
                            {[['liste', List, t("Liste")], ['grille', LayoutGrid, t("Grille")]].map(([cle, Icone, libelle]) => (
                                <button key={cle} type="button" onClick={() => choisirVue(cle)} aria-pressed={vue === cle}
                                    className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-extrabold uppercase tracking-wide transition ${vue === cle ? 'bg-(--mt-main) text-white' : 'text-slate-600 hover:bg-slate-100 dark:text-gray-300 dark:hover:bg-gray-800'}`}>
                                    <Icone className="h-4 w-4" aria-hidden="true" />{libelle}
                                </button>
                            ))}
                        </div>
                    </div>

                    {loading ? (
                        <SkeletonCards count={6} liste={vue === 'liste'} />
                    ) : services.length === 0 ? (
                        <div className="py-12 text-center">
                            <p className="text-lg text-gray-500 dark:text-gray-400">{t("Aucun service disponible pour le moment.")}</p>
                        </div>
                    ) : vue === 'grille' ? (
                        <>
                            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                {services.map(service => (
                                    <li key={service.id}><ServiceCarte service={service} onOuvrir={() => setFenetre(service)} /></li>
                                ))}
                            </ul>
                            <FenetreService service={fenetre} onFermer={() => setFenetre(null)} />
                        </>
                    ) : (
                        <ul className="border-y border-slate-200 bg-white/60 dark:border-gray-700 dark:bg-gray-900/40">
                            {services.map((service, rang) => (
                                <ServiceLigne key={service.id} service={service} rang={rang} ouvert={ouvert === service.id}
                                    onBascule={() => setOuvert(courant => (courant === service.id ? null : service.id))} />
                            ))}
                        </ul>
                    )}

                    {/* CTA */}
                    <div className="mt-16 flex flex-col items-center gap-5 text-center">
                        <p className="max-w-md text-slate-600 dark:text-gray-300">{t("Vous ne savez pas quel service choisir ? L’assistant de rendez-vous vous oriente.")}</p>
                        <Movable id="services.btn-rdv" as={Link} to="/prendre-rdv" className="mt-btn">
                            <Calendar className="h-4 w-4" />
                            <Editable id="services.btn-rdv.label">Prendre rendez-vous</Editable>
                        </Movable>
                    </div>
                </div>
            </section>
        </div>
    );
}

export default Services;
