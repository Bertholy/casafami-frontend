import { Link } from 'react-router-dom';
import {
    Users,
    Clock,
    ShieldCheck,
    Heart,
    Baby,
    Stethoscope,
    Pill,
    MapPin,
    Phone,
    Calendar,
    
} from 'lucide-react';

function Accueil() {
    return (
        <div className="overflow-hidden bg-white dark:bg-gray-900 transition-colors">

            {/* ========== SECTION HERO ========== */}
            <section className="relative min-h-[600px] flex items-center">
                <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: "url('/cabinet_1.jpg')" }}
                ></div>

                <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent"></div>

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
                    <div className="max-w-2xl animate-fade-in-up">
                        <span className="inline-block bg-teal-500/20 backdrop-blur-sm text-teal-100 border border-teal-400/30 px-4 py-2 rounded-full text-sm font-semibold mb-6">
                            ✨ Bienvenue au Cabinet d'Accouchement casafami
                        </span>
                        <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight drop-shadow-lg">
                            Votre santé,
                            <span className="block text-teal-300">notre priorité</span>
                        </h1>
                        <p className="text-xl text-gray-100 mb-8 leading-relaxed drop-shadow">
                            Le cabinet casafami vous accueille dans un cadre serein et moderne
                            pour vous offrir des soins de qualité, avec une équipe professionnelle
                            et à l'écoute.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Link
                                to="/prendre-rdv"
                                className="bg-teal-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-teal-700 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 inline-flex items-center justify-center gap-2"
                            >
                                <Calendar className="w-5 h-5" />
                                Prendre rendez-vous
                            </Link>
                            <Link
                                to="/services"
                                className="bg-white/10 backdrop-blur-sm text-white border-2 border-white/50 px-8 py-4 rounded-xl font-bold hover:bg-white/20 transition-all inline-flex items-center justify-center gap-2"
                            >
                                Découvrir nos services
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* ========== SECTION 4 FEATURES ========== */}
            <section className="py-16 bg-gradient-to-b from-teal-50 to-white dark:from-gray-800 dark:to-gray-900 transition-colors">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {[
                            { Icon: Users, title: 'Équipe qualifiée', desc: 'Des professionnels de santé à votre écoute' },
                            { Icon: Clock, title: 'Prise de RDV facile', desc: 'En ligne ou sur place, 24h/24' },
                            { Icon: ShieldCheck, title: 'Soins de qualité', desc: 'Pour toute la famille' },
                            { Icon: Heart, title: 'Un cadre moderne', desc: 'Confort et sérénité' },
                        ].map((item, i) => {
                            const IconComponent = item.Icon;
                            return (
                                <div
                                    key={i}
                                    className="text-center p-6 rounded-2xl hover:bg-white dark:hover:bg-gray-800 hover:shadow-lg transition-all group"
                                >
                                    <div className="w-16 h-16 mx-auto mb-4 bg-teal-100 dark:bg-teal-900/40 group-hover:bg-teal-600 rounded-full flex items-center justify-center transition-all group-hover:scale-110">
                                        <IconComponent className="w-8 h-8 text-teal-600 dark:text-teal-400 group-hover:text-white transition-colors" />
                                    </div>
                                    <h3 className="font-bold text-gray-800 dark:text-white mb-2">{item.title}</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">{item.desc}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ========== SECTION SERVICES ========== */}
            <section className="py-20 bg-white dark:bg-gray-900 transition-colors">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <span className="text-teal-600 dark:text-teal-400 font-bold text-sm uppercase tracking-wider">
                            — NOS SERVICES —
                        </span>
                        <h2 className="text-4xl font-bold text-gray-800 dark:text-white mt-3 mb-4">
                            Des soins adaptés à tous
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 text-lg max-w-2xl mx-auto">
                            Le cabinet casafami vous propose une prise en charge complète
                            et personnalisée pour toute la famille.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { Icon: Baby, title: 'Suivi de grossesse', desc: 'Un accompagnement tout au long de votre maternité.' },
                            { Icon: Heart, title: 'Accouchement', desc: 'Un environnement sécurisé pour donner la vie.' },
                            { Icon: Stethoscope, title: 'Échographie', desc: 'Suivi médical de votre bébé par imagerie.' },
                            { Icon: Pill, title: 'Planning familial', desc: 'Conseils et accompagnement personnalisés.' },
                        ].map((service, i) => {
                            const IconComponent = service.Icon;
                            return (
                                <div
                                    key={i}
                                    className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-6 hover:shadow-xl transition-all hover:-translate-y-1 group"
                                >
                                    <div className="w-14 h-14 bg-teal-50 dark:bg-teal-900/40 group-hover:bg-teal-600 rounded-xl flex items-center justify-center mb-4 transition-all">
                                        <IconComponent className="w-7 h-7 text-teal-600 dark:text-teal-400 group-hover:text-white transition-colors" />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">
                                        {service.title}
                                    </h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                                        {service.desc}
                                    </p>
                                </div>
                            );
                        })}
                    </div>

                    <div className="text-center mt-12">
                        <Link
                            to="/services"
                            className="inline-block bg-teal-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-teal-700 transition-all shadow-md hover:shadow-lg"
                        >
                            Voir tous les services →
                        </Link>
                    </div>
                </div>
            </section>

            {/* ========== SECTION NOTRE CABINET ========== */}
            <section className="py-20 bg-gray-50 dark:bg-gray-800 transition-colors">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <div className="relative">
                            <img
                                src="/cabinet_2.jpg"
                                alt="Cabinet casafami"
                                className="rounded-2xl shadow-2xl w-full"
                            />
                            <div className="absolute -bottom-6 -right-6 bg-teal-600 text-white px-6 py-4 rounded-2xl shadow-xl">
                                <p className="text-3xl font-bold">10+</p>
                                <p className="text-sm">Années d'expérience</p>
                            </div>
                        </div>

                        <div>
                            <span className="text-teal-600 dark:text-teal-400 font-bold text-sm uppercase tracking-wider">
                                — NOTRE CABINET —
                            </span>
                            <h2 className="text-4xl font-bold text-gray-800 dark:text-white mt-3 mb-6">
                                Un espace moderne et accueillant
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400 mb-4 leading-relaxed text-lg">
                                Situé à <strong className="text-gray-800 dark:text-white">Andongona - Antsohihy</strong>, le cabinet
                                <strong className="text-gray-800 dark:text-white"> casafami</strong> a été pensé pour votre confort
                                et celui de votre famille.
                            </p>
                            <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed text-lg">
                                Nos locaux sont équipés d'un matériel moderne pour vous
                                garantir des soins de qualité dans un environnement apaisant.
                            </p>

                            <div className="space-y-3">
                                {[
                                    'Équipement médical moderne',
                                    "Salle d'accouchement sécurisée",
                                    'Accueil chaleureux',
                                    'Équipe expérimentée',
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <span className="w-6 h-6 bg-teal-600 text-white rounded-full flex items-center justify-center text-xs flex-shrink-0">
                                            ✓
                                        </span>
                                        <span className="text-gray-700 dark:text-gray-300">{item}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ========== SECTION HORAIRES + CONTACT ========== */}
            <section className="py-20 bg-white dark:bg-gray-900 transition-colors">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <span className="text-teal-600 dark:text-teal-400 font-bold text-sm uppercase tracking-wider">
                            — INFORMATIONS —
                        </span>
                        <h2 className="text-4xl font-bold text-gray-800 dark:text-white mt-3">
                            Horaires & Contact
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Horaires */}
                        <div className="bg-teal-50 dark:bg-gray-800 rounded-2xl p-8 border-l-4 border-teal-600 dark:border-teal-400 transition-colors">
                            <Clock className="w-12 h-12 text-teal-600 dark:text-teal-400 mb-4" />
                            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Horaires</h3>
                            <div className="space-y-2 text-gray-700 dark:text-gray-300">
                                <p><strong>Lun - Ven :</strong> 8h - 17h</p>
                                <p className="text-sm text-teal-700 dark:text-teal-400">Matin : 8h - 11h</p>
                                <p className="text-sm text-teal-700 dark:text-teal-400">Après-midi : 14h - 17h</p>
                                <p className="text-sm text-gray-500 dark:text-gray-500 mt-3">Urgences 24h/24</p>
                            </div>
                        </div>

                        {/* Adresse */}
                        <div className="bg-teal-50 dark:bg-gray-800 rounded-2xl p-8 border-l-4 border-teal-600 dark:border-teal-400 transition-colors">
                            <MapPin className="w-12 h-12 text-teal-600 dark:text-teal-400 mb-4" />
                            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Adresse</h3>
                            <div className="space-y-2 text-gray-700 dark:text-gray-300">
                                <p><strong>casafami</strong></p>
                                <p>Chez Rasazy VERO</p>
                                <p>Andongona - ANTSOHIHY</p>
                                <p className="text-sm text-teal-700 dark:text-teal-400 mt-3">Madagascar</p>
                            </div>
                        </div>

                        {/* Téléphone */}
                        <div className="bg-teal-50 dark:bg-gray-800 rounded-2xl p-8 border-l-4 border-teal-600 dark:border-teal-400 transition-colors">
                            <Phone className="w-12 h-12 text-teal-600 dark:text-teal-400 mb-4" />
                            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Téléphone</h3>
                            <div className="space-y-2 text-gray-700 dark:text-gray-300">
                                <p className="font-semibold">034 06 759 28</p>
                                <p className="font-semibold">032 43 035 07</p>
                                <p className="text-sm text-gray-500 dark:text-gray-500 mt-3">Appel & SMS</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ========== SECTION APPEL À L'ACTION ========== */}
            <section className="py-20 bg-gradient-to-r from-teal-600 to-teal-800 dark:from-teal-700 dark:to-teal-900 text-white transition-colors">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <h2 className="text-4xl font-bold mb-6">
                        Prêt à prendre soin de votre santé ?
                    </h2>
                    <p className="text-xl mb-10 text-teal-50">
                        Réservez votre créneau en moins de 2 minutes
                    </p>
                    <Link
                        to="/prendre-rdv"
                        className="inline-flex items-center gap-2 bg-white text-teal-700 px-12 py-5 rounded-xl font-bold text-lg hover:bg-teal-50 transition-all shadow-2xl hover:-translate-y-1"
                    >
                        <Calendar className="w-6 h-6" />
                        Prendre rendez-vous maintenant
                    </Link>
                    <p className="mt-6 text-teal-100 text-sm">
                        ✓ Sans inscription · ✓ Confirmation par SMS · ✓ Annulation facile
                    </p>
                </div>
            </section>

        </div>
    );
}

export default Accueil;