import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axiosClient, { assetUrl } from '../api/axiosClient';
import Editable from '../components/site/Editable';
import Movable from '../components/site/Movable';
import {
    Clock,
    Calendar,
    Loader2,
    AlertCircle,
} from 'lucide-react';

function Services() {
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
                    <p className="text-gray-600 dark:text-gray-400">Chargement des services...</p>
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
                        Erreur
                    </h3>
                    <p className="text-red-600 dark:text-red-300 mb-4">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="bg-red-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-red-700 transition"
                    >
                        Réessayer
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-900 transition-colors">

            {/* ========== HERO ========== */}
            <section className="bg-gradient-to-br from-teal-600 to-teal-800 dark:from-teal-700 dark:to-teal-900 text-white py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <Editable id="services.hero.badge" as="span" className="inline-block bg-white/20 backdrop-blur-sm text-white border border-white/30 px-4 py-2 rounded-full text-sm font-semibold mb-6">Nos prestations</Editable>
                    <Editable id="services.hero.titre" as="h1" className="text-4xl md:text-5xl font-bold mb-4">Nos services médicaux</Editable>
                    <Editable id="services.hero.texte" as="p" className="text-xl text-teal-100 max-w-2xl mx-auto">Des soins de qualité adaptés à vos besoins, assurés par une équipe expérimentée</Editable>
                </div>
            </section>

            {/* ========== LISTE DES SERVICES ========== */}
            <section className="py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                    {services.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-gray-500 dark:text-gray-400 text-lg">
                                Aucun service disponible pour le moment.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {services.map((service) => {
                                const imageSrc = service.imageUrl ? assetUrl(service.imageUrl) : getImageForService(service.nom);

                                return (
                                    <div
                                        key={service.id}
                                        className="group bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl overflow-hidden hover:shadow-2xl transition-all hover:-translate-y-2"
                                    >
                                        {/* Image */}
                                        <div className="relative h-40 overflow-hidden">
                                            <img
                                                src={imageSrc}
                                                alt={service.nom}
                                                onError={event => { event.currentTarget.onerror = null; event.currentTarget.src = '/general.jpg'; }}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                            />
                                        </div>

                                        {/* Contenu */}
                                        <div className="p-5">
                                            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">
                                                {service.nom}
                                            </h3>

                                            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-3">
                                            {service.description || 'Description à venir.'}
                                            </p>

                                            <div className="flex items-center gap-2 text-xs text-teal-600 dark:text-teal-400 font-semibold">
                                                <Clock className="w-3 h-3" />
                                                <span>{service.duree ? `Durée : ${service.duree}` : 'Sur rendez-vous'}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* CTA */}
                    <div className="text-center mt-16">
                        <Movable
                            id="services.btn-rdv"
                            as={Link}
                            to="/prendre-rdv"
                            className="inline-flex items-center gap-2 bg-teal-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-teal-700 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1"
                        >
                            <Calendar className="w-5 h-5" />
                            <Editable id="services.btn-rdv.label">Prendre rendez-vous</Editable>
                        </Movable>
                    </div>
                </div>
            </section>
        </div>
    );
}

export default Services;
