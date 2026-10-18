import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axiosClient, { assetUrl } from '../api/axiosClient';
import Editable from '../components/site/Editable';
import Movable from '../components/site/Movable';
import Carrousel from '../components/site/Carrousel';
import {
    Clock,
    Calendar,
    Loader2,
    AlertCircle,
} from 'lucide-react';
import { useLang } from '../i18n/LangContext';

function Services() {
    const { t } = useLang();
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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

    // État de chargement
    if (loading) {
        return (
            <div className="min-h-[500px] flex items-center justify-center bg-white dark:bg-gray-900">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-teal-600 animate-spin mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">{t("Chargement des services...")}</p>
                </div>
            </div>
        );
    }

    // État d'erreur
    if (error) {
        return (
            <div className="min-h-[500px] flex items-center justify-center bg-white dark:bg-gray-900 px-4">
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
            <section className="px-4 pb-6 pt-14 text-center sm:px-6 lg:px-8">
                <div className="mx-auto max-w-3xl">
                    <Editable id="services.hero.badge" as="span" className="mb-5 inline-block rounded-full bg-white px-4 py-2 text-xs font-extrabold uppercase tracking-[0.14em] text-teal-700 shadow-[0_0_0_1px_#dce9f0] dark:bg-gray-800 dark:text-teal-300 dark:shadow-none">Nos prestations</Editable>
                    <Editable id="services.hero.titre" as="h1" accent={-1} className="mb-4 text-4xl font-extrabold leading-tight md:text-6xl [&_em]:text-teal-600 [&_em]:not-italic">Nos services médicaux</Editable>
                    <Editable id="services.hero.texte" as="p" className="mx-auto max-w-2xl text-lg text-slate-600 dark:text-gray-300 md:text-xl">Des soins de qualité adaptés à vos besoins, assurés par une équipe expérimentée</Editable>
                </div>
            </section>

            {/* ========== LISTE DES SERVICES ========== */}
            <section className="py-14">
                <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">

                    {services.length === 0 ? (
                        <div className="py-12 text-center">
                            <p className="text-lg text-gray-500 dark:text-gray-400">{t("Aucun service disponible pour le moment.")}</p>
                        </div>
                    ) : (
                        <Carrousel label={t("Nos services")}>
                            {services.map(service => {
                                const imageSrc = service.imageUrl ? assetUrl(service.imageUrl) : getImageForService(service.nom);
                                return (
                                    <article key={service.id} className="group mt-carte h-full p-3">
                                        <div className="mt-cadre">
                                            <div className="aspect-[4/3] overflow-hidden rounded-[1.4rem]">
                                                <img loading="lazy" decoding="async" src={imageSrc} alt={service.nom}
                                                    onError={event => { event.currentTarget.onerror = null; event.currentTarget.src = '/general.jpg'; }}
                                                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                            </div>
                                        </div>
                                        <div className="px-3 pb-4 pt-5">
                                            <h3 className="text-lg font-extrabold text-slate-800 dark:text-white">{t(service.nom)}</h3>
                                            <p className="mt-3 text-sm leading-relaxed text-slate-500 dark:text-gray-400">
                                                {service.description ? t(service.description) : t("Description à venir.")}
                                            </p>
                                            <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1.5 text-xs font-bold text-teal-700 dark:bg-gray-700 dark:text-teal-300">
                                                <Clock className="h-3.5 w-3.5" />
                                                <span>{service.duree ? t("Durée : {duree}", { duree: service.duree }) : t("Sur rendez-vous")}</span>
                                            </p>
                                        </div>
                                    </article>
                                );
                            })}
                        </Carrousel>
                    )}

                    {/* CTA */}
                    <div className="mt-16 text-center">
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
