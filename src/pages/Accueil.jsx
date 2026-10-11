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
    CheckSquare,
} from 'lucide-react';
import Editable from '../components/site/Editable';
import Movable from '../components/site/Movable';
import { useSiteContent } from '../context/SiteContentContext';
import { summarizeHours, traduireJours, usePlanning } from '../utils/horaires';
import { useLang } from '../i18n/LangContext';

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
const GALERIE = ['/cabinet_1.jpg', '/cabinet_2.jpg', '/general.jpg', '/vaccination.jpg', '/sang.jpg', '/infi.png'];

const etiquette = 'mb-3 block text-xs font-extrabold uppercase tracking-[0.22em] text-teal-600 dark:text-teal-300';

function Accueil() {
    const { t } = useLang();
    const { content } = useSiteContent();
    const planning = usePlanning();
    const horaires = summarizeHours(planning?.horaires);
    const numeroAppel = (content['accueil.tel.numero1']?.texte ?? '034 06 759 28').replace(/[^\d+]/g, '');

    return (
        <div className="overflow-hidden bg-white transition-colors dark:bg-gray-900">

            {/* ========== SECTION HERO ========== */}
            <section className="relative flex min-h-[600px] items-center justify-center text-center md:min-h-[calc(100vh-78px)]">
                <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/cabinet_1.jpg')" }} />
                <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(3,44,74,.62) 0%, rgba(3,44,74,.34) 55%, rgba(3,44,74,.72) 100%)' }} />

                <div className="relative mx-auto w-full max-w-5xl animate-fade-in-up px-4 py-24 sm:px-6">
                    <Editable id="accueil.hero.badge" as="span" className="mb-6 inline-block border border-white/50 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.22em] text-white">
                        ✨ Bienvenue au Cabinet d'Accouchement casafami
                    </Editable>
                    <h1 className="mb-6 text-4xl font-bold uppercase leading-[1.1] text-white drop-shadow-lg sm:text-5xl md:text-7xl">
                        <Editable id="accueil.hero.titre1">Votre santé,</Editable>
                        <Editable id="accueil.hero.titre2" as="span" className="block italic text-[#bfeaff]">notre priorité</Editable>
                    </h1>
                    <Editable id="accueil.hero.texte" as="p" className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-white/95 drop-shadow md:text-xl">
                        Le cabinet casafami vous accueille dans un cadre serein et moderne pour vous offrir des soins de qualité, avec une équipe professionnelle et à l'écoute.
                    </Editable>
                    <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                        <Movable id="accueil.hero.btn-rdv" as={Link} to="/prendre-rdv" className="mt-btn">
                            <Calendar className="h-4 w-4" />
                            <Editable id="accueil.hero.btn-rdv.label">Prendre rendez-vous</Editable>
                        </Movable>
                        <Movable id="accueil.hero.btn-services" as={Link} to="/services" className="mt-btn-blanc">
                            <Editable id="accueil.hero.btn-services.label">Découvrir nos services</Editable>
                        </Movable>
                    </div>
                </div>
            </section>

            {/* ========== SECTION 4 ATOUTS ========== */}
            <section className="mt-relief py-16 transition-colors">
                <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
                        {ATOUTS.map((item, i) => {
                            const IconComponent = item.Icon;
                            return (
                                <div key={i} className="text-center">
                                    <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center bg-teal-600 text-white"><IconComponent className="h-7 w-7" /></div>
                                    <Editable id={`accueil.atout${i + 1}.titre`} as="h3" className="mb-2 text-base font-bold uppercase tracking-wide text-gray-800 dark:text-white">{item.title}</Editable>
                                    <Editable id={`accueil.atout${i + 1}.desc`} as="p" className="text-sm italic text-gray-500 dark:text-gray-400">{item.desc}</Editable>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ========== SECTION SERVICES ========== */}
            <section className="bg-white py-20 transition-colors dark:bg-gray-900">
                <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                    <div className="mb-14 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                        <div className="max-w-2xl">
                            <Editable id="accueil.services.etiquette" as="span" className={etiquette}>— NOS SERVICES —</Editable>
                            <Editable id="accueil.services.titre" as="h2" accent={-1} className="mt-titre mt-regle text-3xl md:text-4xl">Des soins adaptés à tous</Editable>
                            <Editable id="accueil.services.texte" as="p" className="mt-4 text-lg text-gray-600 dark:text-gray-400">
                                Le cabinet casafami vous propose une prise en charge complète et personnalisée pour toute la famille.
                            </Editable>
                        </div>
                        <Movable id="accueil.services.btn" as={Link} to="/services" className="mt-btn-ligne shrink-0 self-start md:self-end">
                            <Editable id="accueil.services.btn.label">Voir tous les services →</Editable>
                        </Movable>
                    </div>

                    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
                        {SERVICES.map((service, i) => (
                            <article key={i} className="group text-center">
                                <div className="mt-cadre">
                                    <div className="aspect-[4/3] overflow-hidden">
                                        <img loading="lazy" decoding="async" src={service.image} alt={t(service.title)}
                                            onError={event => { event.currentTarget.onerror = null; event.currentTarget.src = '/general.jpg'; }}
                                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                    </div>
                                </div>
                                <Editable id={`accueil.service${i + 1}.titre`} as="h3" className="mt-6 text-lg font-bold uppercase tracking-wide text-gray-800 dark:text-white">{service.title}</Editable>
                                <Editable id={`accueil.service${i + 1}.desc`} as="p" className="mt-3 text-sm italic leading-relaxed text-gray-500 dark:text-gray-400">{service.desc}</Editable>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            {/* ========== SECTION NOTRE CABINET (image / texte) ========== */}
            <section className="mt-gris grid grid-cols-1 transition-colors lg:grid-cols-2">
                <div className="relative min-h-[320px] lg:min-h-[560px]">
                    <img loading="lazy" decoding="async" src="/cabinet_2.jpg" alt={t("Cabinet casafami")} className="absolute inset-0 h-full w-full object-cover" />
                    <div className="absolute bottom-0 right-0 bg-teal-600 px-7 py-5 text-white">
                        <Editable id="accueil.cabinet.chiffre" as="p" className="font-titre text-4xl font-extrabold">10+</Editable>
                        <Editable id="accueil.cabinet.chiffre.legende" as="p" className="text-xs font-bold uppercase tracking-widest">Années d'expérience</Editable>
                    </div>
                </div>
                <div className="flex items-center px-6 py-16 sm:px-12 lg:px-16">
                    <div className="max-w-xl">
                        <Editable id="accueil.cabinet.etiquette" as="span" className={etiquette}>— NOTRE CABINET —</Editable>
                        <Editable id="accueil.cabinet.titre" as="h2" accent={-1} className="mt-titre mt-regle mb-6 text-3xl md:text-4xl">Un espace moderne et accueillant</Editable>
                        <Editable id="accueil.cabinet.texte1" as="p" className="mb-4 text-lg font-bold leading-relaxed text-gray-700 dark:text-gray-200">
                            Situé à Andongona - Antsohihy, le cabinet casafami a été pensé pour votre confort et celui de votre famille.
                        </Editable>
                        <Editable id="accueil.cabinet.texte2" as="p" className="mb-8 leading-relaxed text-gray-600 dark:text-gray-400">
                            Nos locaux sont équipés d'un matériel moderne pour vous garantir des soins de qualité dans un environnement apaisant.
                        </Editable>
                        <ul className="mb-9 grid gap-3 sm:grid-cols-2">
                            {POINTS_FORTS.map((item, i) => (
                                <li key={i} className="flex items-center gap-2.5 italic text-teal-600 dark:text-teal-300">
                                    <CheckSquare className="h-5 w-5 shrink-0" />
                                    <Editable id={`accueil.cabinet.point${i + 1}`} className="font-semibold">{item}</Editable>
                                </li>
                            ))}
                        </ul>
                        <Link to="/prendre-rdv" className="mt-btn"><Calendar className="h-4 w-4" />{t("Prendre rendez-vous")}</Link>
                    </div>
                </div>
            </section>

            {/* ========== SECTION HORAIRES + CONTACT ========== */}
            <section className="mt-relief py-20 transition-colors">
                <div className="mx-auto grid max-w-6xl gap-14 px-4 sm:px-6 lg:grid-cols-2 lg:gap-20 lg:px-8">
                    <div>
                        <Editable id="accueil.infos.etiquette" as="span" className={etiquette}>— INFORMATIONS —</Editable>
                        <Editable id="accueil.infos.titre" as="h2" accent={-1} className="mt-titre mt-regle mb-8 text-3xl md:text-4xl">Horaires & Contact</Editable>

                        {/* Horaires : issus du planning configuré par le super administrateur */}
                        <Editable id="accueil.horaires.titre" as="h3" className="mb-5 flex items-center gap-2 text-sm font-extrabold uppercase tracking-[0.18em] text-teal-600 dark:text-teal-300">Horaires</Editable>
                        <div className="space-y-4 text-gray-700 dark:text-gray-300">
                            {horaires.length === 0 && <p className="text-sm text-gray-500">{t("Horaires disponibles bientôt.")}</p>}
                            {horaires.map(h => (
                                <div key={h.label}>
                                    <div className="mt-ligne">
                                        <span className="font-bold">{traduireJours(h.label, t)}</span>
                                        <span className="mt-points" />
                                        <span className="font-titre font-bold text-teal-600 dark:text-teal-300">{h.global}</span>
                                    </div>
                                    {h.matin && h.apresMidi && (
                                        <p className="mt-1 text-sm italic text-gray-500 dark:text-gray-400">{t("Matin :")} {h.matin} · {t("Après-midi :")} {h.apresMidi}</p>
                                    )}
                                </div>
                            ))}
                            <Editable id="accueil.horaires.urgences" as="p" className="pt-1 text-sm font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">Urgences 24h/24</Editable>
                        </div>

                        <div className="mt-10 grid gap-8 sm:grid-cols-2">
                            <div className="flex gap-4">
                                <span className="flex h-12 w-12 shrink-0 items-center justify-center bg-teal-600 text-white"><MapPin className="h-5 w-5" /></span>
                                <div className="text-gray-700 dark:text-gray-300">
                                    <Editable id="accueil.adresse.titre" as="h3" className="mb-2 text-sm font-extrabold uppercase tracking-[0.18em] text-teal-600 dark:text-teal-300">Adresse</Editable>
                                    <Editable id="accueil.adresse.nom" as="p" className="font-bold">casafami</Editable>
                                    <Editable id="accueil.adresse.ligne1" as="p">Chez Rasazy VERO</Editable>
                                    <Editable id="accueil.adresse.ligne2" as="p">Andongona - ANTSOHIHY</Editable>
                                    <Editable id="accueil.adresse.pays" as="p" className="text-sm italic text-gray-500 dark:text-gray-400">Madagascar</Editable>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <span className="flex h-12 w-12 shrink-0 items-center justify-center bg-teal-600 text-white"><Phone className="h-5 w-5" /></span>
                                <div className="text-gray-700 dark:text-gray-300">
                                    <Editable id="accueil.tel.titre" as="h3" className="mb-2 text-sm font-extrabold uppercase tracking-[0.18em] text-teal-600 dark:text-teal-300">Téléphone</Editable>
                                    <Editable id="accueil.tel.numero1" as="p" className="font-titre font-bold">034 06 759 28</Editable>
                                    <Editable id="accueil.tel.numero2" as="p" className="font-titre font-bold">032 43 035 07</Editable>
                                    <Editable id="accueil.tel.note" as="p" className="text-sm italic text-gray-500 dark:text-gray-400">Appel & SMS</Editable>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-cadre self-start">
                        <img loading="lazy" decoding="async" src="/general.jpg" alt="" className="aspect-[4/3] w-full object-cover" />
                    </div>
                </div>
            </section>

            {/* ========== GALERIE ========== */}
            <section className="bg-white pb-20 transition-colors dark:bg-gray-900">
                <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                    <h2 className="mt-titre mt-regle mb-10 text-3xl md:text-4xl">{t("Le cabinet en images")}</h2>
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                        {GALERIE.map(src => (
                            <img key={src} loading="lazy" decoding="async" src={src} alt="" className="aspect-[3/2] w-full object-cover" />
                        ))}
                    </div>
                </div>
            </section>

            {/* ========== APPEL À L'ACTION ========== */}
            <section className="mt-ardoise mt-clair py-20 transition-colors">
                <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_auto] lg:px-8">
                    <div>
                        <Editable id="accueil.cta.titre" as="h2" className="mt-titre mb-4 text-3xl md:text-4xl">Prêt à prendre soin de votre santé ?</Editable>
                        <Editable id="accueil.cta.texte" as="p" className="text-lg text-white/85">Réservez votre créneau en moins de 2 minutes</Editable>
                        <Editable id="accueil.cta.note" as="p" className="mt-5 text-sm text-white/70">✓ Sans inscription · ✓ Confirmation par SMS · ✓ Annulation facile</Editable>
                    </div>
                    <div className="flex flex-col gap-4 sm:flex-row">
                        <Movable id="accueil.cta.btn" as={Link} to="/prendre-rdv" className="mt-btn-blanc-plein">
                            <Calendar className="h-4 w-4" />
                            <Editable id="accueil.cta.btn.label">Prendre rendez-vous maintenant</Editable>
                        </Movable>
                        <a href={`tel:${numeroAppel}`} className="mt-btn-blanc"><Phone className="h-4 w-4" />{t("Appeler le cabinet")}</a>
                    </div>
                </div>
            </section>

        </div>
    );
}

export default Accueil;
