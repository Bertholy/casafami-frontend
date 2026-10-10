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
import Editable from '../components/site/Editable';
import Movable from '../components/site/Movable';
import { summarizeHours, usePlanning } from '../utils/horaires';

// Chaque texte et chaque bouton porte un identifiant « accueil.* » : le super administrateur peut les modifier / déplacer
// depuis le mode édition du site (voir components/site).
const ATOUTS = [
    { Icon: Users, title: 'Équipe qualifiée', desc: 'Des professionnels de santé à votre écoute' },
    { Icon: Clock, title: 'Prise de RDV facile', desc: 'En ligne ou sur place, 24h/24' },
    { Icon: ShieldCheck, title: 'Soins de qualité', desc: 'Pour toute la famille' },
    { Icon: Heart, title: 'Un cadre moderne', desc: 'Confort et sérénité' },
];
const SERVICES = [
    { Icon: Baby, title: 'Suivi de grossesse', image: '/suivi-grossesse.png', desc: 'Un accompagnement tout au long de votre maternité.' },
    { Icon: Heart, title: 'Accouchement', image: '/accouchement.png', desc: 'Un environnement sécurisé pour donner la vie.' },
    { Icon: Stethoscope, title: 'Échographie', image: '/echo.png', desc: 'Suivi médical de votre bébé par imagerie.' },
    { Icon: Pill, title: 'Planning familial', image: '/planning-familial.png', desc: 'Conseils et accompagnement personnalisés.' },
];
const POINTS_FORTS = ['Équipement médical moderne', "Salle d'accouchement sécurisée", 'Accueil chaleureux', 'Équipe expérimentée'];

function Accueil() {
    const planning = usePlanning();
    const horaires = summarizeHours(planning?.horaires);

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
                        <Editable id="accueil.hero.badge" as="span" className="inline-block bg-teal-500/20 backdrop-blur-sm text-teal-100 border border-teal-400/30 px-4 py-2 rounded-full text-sm font-semibold mb-6">
                            ✨ Bienvenue au Cabinet d'Accouchement casafami
                        </Editable>
                        <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight drop-shadow-lg">
                            <Editable id="accueil.hero.titre1">Votre santé,</Editable>
                            <Editable id="accueil.hero.titre2" as="span" className="block text-teal-300">notre priorité</Editable>
                        </h1>
                        <Editable id="accueil.hero.texte" as="p" className="text-xl text-gray-100 mb-8 leading-relaxed drop-shadow">
                            Le cabinet casafami vous accueille dans un cadre serein et moderne pour vous offrir des soins de qualité, avec une équipe professionnelle et à l'écoute.
                        </Editable>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Movable
                                id="accueil.hero.btn-rdv"
                                as={Link}
                                to="/prendre-rdv"
                                className="bg-teal-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-teal-700 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 inline-flex items-center justify-center gap-2"
                            >
                                <Calendar className="w-5 h-5" />
                                <Editable id="accueil.hero.btn-rdv.label">Prendre rendez-vous</Editable>
                            </Movable>
                            <Movable
                                id="accueil.hero.btn-services"
                                as={Link}
                                to="/services"
                                className="bg-white/10 backdrop-blur-sm text-white border-2 border-white/50 px-8 py-4 rounded-xl font-bold hover:bg-white/20 transition-all inline-flex items-center justify-center gap-2"
                            >
                                <Editable id="accueil.hero.btn-services.label">Découvrir nos services</Editable>
                            </Movable>
                        </div>
                    </div>
                </div>
            </section>

            {/* ========== SECTION 4 FEATURES ========== */}
            <section className="py-16 bg-gradient-to-b from-teal-50 to-white dark:from-gray-800 dark:to-gray-900 transition-colors">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {ATOUTS.map((item, i) => {
                            const IconComponent = item.Icon;
                            return (
                                <div
                                    key={i}
                                    className="text-center p-6 rounded-2xl hover:bg-white dark:hover:bg-gray-800 hover:shadow-lg transition-all group"
                                >
                                    <div className="w-16 h-16 mx-auto mb-4 bg-teal-100 dark:bg-teal-900/40 group-hover:bg-teal-600 rounded-full flex items-center justify-center transition-all group-hover:scale-110">
                                        <IconComponent className="w-8 h-8 text-teal-600 dark:text-teal-400 group-hover:text-white transition-colors" />
                                    </div>
                                    <Editable id={`accueil.atout${i + 1}.titre`} as="h3" className="font-bold text-gray-800 dark:text-white mb-2">{item.title}</Editable>
                                    <Editable id={`accueil.atout${i + 1}.desc`} as="p" className="text-sm text-gray-600 dark:text-gray-400">{item.desc}</Editable>
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
                        <Editable id="accueil.services.etiquette" as="span" className="text-teal-600 dark:text-teal-400 font-bold text-sm uppercase tracking-wider">
                            — NOS SERVICES —
                        </Editable>
                        <Editable id="accueil.services.titre" as="h2" className="text-4xl font-bold text-gray-800 dark:text-white mt-3 mb-4">
                            Des soins adaptés à tous
                        </Editable>
                        <Editable id="accueil.services.texte" as="p" className="text-gray-600 dark:text-gray-400 text-lg max-w-2xl mx-auto">
                            Le cabinet casafami vous propose une prise en charge complète et personnalisée pour toute la famille.
                        </Editable>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {SERVICES.map((service, i) => {
                            const IconComponent = service.Icon;
                            return (
                                <div
                                    key={i}
                                    className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl overflow-hidden hover:shadow-2xl transition-all hover:-translate-y-2 group"
                                >
                                    <div className="relative h-40 overflow-hidden"><img src={service.image} alt={service.title} onError={event => { event.currentTarget.onerror = null; event.currentTarget.src = '/general.jpg'; }} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" /></div>
                                    <div className="p-5"><div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 text-teal-600 dark:bg-teal-900/40"><IconComponent className="h-5 w-5" /></div>
                                        <Editable id={`accueil.service${i + 1}.titre`} as="h3" className="text-lg font-bold text-gray-800 dark:text-white mb-2">{service.title}</Editable>
                                        <Editable id={`accueil.service${i + 1}.desc`} as="p" className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{service.desc}</Editable>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="text-center mt-12">
                        <Movable
                            id="accueil.services.btn"
                            as={Link}
                            to="/services"
                            className="inline-block bg-teal-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-teal-700 transition-all shadow-md hover:shadow-lg"
                        >
                            <Editable id="accueil.services.btn.label">Voir tous les services →</Editable>
                        </Movable>
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
                                <Editable id="accueil.cabinet.chiffre" as="p" className="text-3xl font-bold">10+</Editable>
                                <Editable id="accueil.cabinet.chiffre.legende" as="p" className="text-sm">Années d'expérience</Editable>
                            </div>
                        </div>

                        <div>
                            <Editable id="accueil.cabinet.etiquette" as="span" className="text-teal-600 dark:text-teal-400 font-bold text-sm uppercase tracking-wider">
                                — NOTRE CABINET —
                            </Editable>
                            <Editable id="accueil.cabinet.titre" as="h2" className="text-4xl font-bold text-gray-800 dark:text-white mt-3 mb-6">
                                Un espace moderne et accueillant
                            </Editable>
                            <Editable id="accueil.cabinet.texte1" as="p" className="text-gray-600 dark:text-gray-400 mb-4 leading-relaxed text-lg">
                                Situé à Andongona - Antsohihy, le cabinet casafami a été pensé pour votre confort et celui de votre famille.
                            </Editable>
                            <Editable id="accueil.cabinet.texte2" as="p" className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed text-lg">
                                Nos locaux sont équipés d'un matériel moderne pour vous garantir des soins de qualité dans un environnement apaisant.
                            </Editable>

                            <div className="space-y-3">
                                {POINTS_FORTS.map((item, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <span className="w-6 h-6 bg-teal-600 text-white rounded-full flex items-center justify-center text-xs shrink-0">
                                            ✓
                                        </span>
                                        <Editable id={`accueil.cabinet.point${i + 1}`} className="text-gray-700 dark:text-gray-300">{item}</Editable>
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
                        <Editable id="accueil.infos.etiquette" as="span" className="text-teal-600 dark:text-teal-400 font-bold text-sm uppercase tracking-wider">
                            — INFORMATIONS —
                        </Editable>
                        <Editable id="accueil.infos.titre" as="h2" className="text-4xl font-bold text-gray-800 dark:text-white mt-3">
                            Horaires & Contact
                        </Editable>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Horaires : issus du planning configuré par le super administrateur */}
                        <div className="bg-teal-50 dark:bg-gray-800 rounded-2xl p-8 border-l-4 border-teal-600 dark:border-teal-400 transition-colors">
                            <Clock className="w-12 h-12 text-teal-600 dark:text-teal-400 mb-4" />
                            <Editable id="accueil.horaires.titre" as="h3" className="text-xl font-bold text-gray-800 dark:text-white mb-4">Horaires</Editable>
                            <div className="space-y-2 text-gray-700 dark:text-gray-300">
                                {horaires.length === 0 && <p className="text-sm text-gray-500">Horaires disponibles bientôt.</p>}
                                {horaires.map(h => (
                                    <div key={h.label} className="space-y-1">
                                        <p><strong>{h.label} :</strong> {h.global}</p>
                                        {h.matin && h.apresMidi && <p className="text-sm text-teal-700 dark:text-teal-400">Matin : {h.matin}</p>}
                                        {h.matin && h.apresMidi && <p className="text-sm text-teal-700 dark:text-teal-400">Après-midi : {h.apresMidi}</p>}
                                    </div>
                                ))}
                                <Editable id="accueil.horaires.urgences" as="p" className="text-sm text-gray-500 dark:text-gray-400 mt-3">Urgences 24h/24</Editable>
                            </div>
                        </div>

                        {/* Adresse */}
                        <div className="bg-teal-50 dark:bg-gray-800 rounded-2xl p-8 border-l-4 border-teal-600 dark:border-teal-400 transition-colors">
                            <MapPin className="w-12 h-12 text-teal-600 dark:text-teal-400 mb-4" />
                            <Editable id="accueil.adresse.titre" as="h3" className="text-xl font-bold text-gray-800 dark:text-white mb-4">Adresse</Editable>
                            <div className="space-y-2 text-gray-700 dark:text-gray-300">
                                <Editable id="accueil.adresse.nom" as="p" className="font-bold">casafami</Editable>
                                <Editable id="accueil.adresse.ligne1" as="p">Chez Rasazy VERO</Editable>
                                <Editable id="accueil.adresse.ligne2" as="p">Andongona - ANTSOHIHY</Editable>
                                <Editable id="accueil.adresse.pays" as="p" className="text-sm text-teal-700 dark:text-teal-400 mt-3">Madagascar</Editable>
                            </div>
                        </div>

                        {/* Téléphone */}
                        <div className="bg-teal-50 dark:bg-gray-800 rounded-2xl p-8 border-l-4 border-teal-600 dark:border-teal-400 transition-colors">
                            <Phone className="w-12 h-12 text-teal-600 dark:text-teal-400 mb-4" />
                            <Editable id="accueil.tel.titre" as="h3" className="text-xl font-bold text-gray-800 dark:text-white mb-4">Téléphone</Editable>
                            <div className="space-y-2 text-gray-700 dark:text-gray-300">
                                <Editable id="accueil.tel.numero1" as="p" className="font-semibold">034 06 759 28</Editable>
                                <Editable id="accueil.tel.numero2" as="p" className="font-semibold">032 43 035 07</Editable>
                                <Editable id="accueil.tel.note" as="p" className="text-sm text-gray-500 dark:text-gray-400 mt-3">Appel & SMS</Editable>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ========== SECTION APPEL À L'ACTION ========== */}
            <section className="py-20 bg-gradient-to-r from-teal-600 to-teal-800 dark:from-teal-700 dark:to-teal-900 text-white transition-colors">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <Editable id="accueil.cta.titre" as="h2" className="text-4xl font-bold mb-6">
                        Prêt à prendre soin de votre santé ?
                    </Editable>
                    <Editable id="accueil.cta.texte" as="p" className="text-xl mb-10 text-teal-50">
                        Réservez votre créneau en moins de 2 minutes
                    </Editable>
                    <Movable
                        id="accueil.cta.btn"
                        as={Link}
                        to="/prendre-rdv"
                        className="inline-flex items-center gap-2 bg-white text-teal-700 px-12 py-5 rounded-xl font-bold text-lg hover:bg-teal-50 transition-all shadow-2xl hover:-translate-y-1"
                    >
                        <Calendar className="w-6 h-6" />
                        <Editable id="accueil.cta.btn.label">Prendre rendez-vous maintenant</Editable>
                    </Movable>
                    <Editable id="accueil.cta.note" as="p" className="mt-6 text-teal-100 text-sm">
                        ✓ Sans inscription · ✓ Confirmation par SMS · ✓ Annulation facile
                    </Editable>
                </div>
            </section>

        </div>
    );
}

export default Accueil;
