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
    Check,
    MessageSquare,
} from 'lucide-react';
import Editable from '../components/site/Editable';
import Movable from '../components/site/Movable';
import Carrousel from '../components/site/Carrousel';
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

const etiquette = 'mb-3 block text-xs font-extrabold uppercase tracking-[0.14em] text-teal-600 dark:text-teal-300';

function Accueil() {
    const { t } = useLang();
    const { content } = useSiteContent();
    const planning = usePlanning();
    const horaires = summarizeHours(planning?.horaires);
    const numeroAppel = (content['accueil.tel.numero1']?.texte ?? '034 06 759 28').replace(/[^\d+]/g, '');

    return (
        <div className="overflow-hidden transition-colors">

            {/* ========== SECTION HERO ========== */}
            <section className="mx-auto flex max-w-7xl flex-col items-center gap-12 px-4 pb-16 pt-10 sm:px-6 lg:flex-row lg:gap-16 lg:px-8 lg:pb-24 lg:pt-16">
                <div className="animate-fade-in-up min-w-0 flex-1 text-center lg:text-left">
                    <Editable id="accueil.hero.badge" as="span" className="mb-6 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-[0_0_0_1px_#dce9f0] dark:bg-gray-800 dark:text-gray-200 dark:shadow-none">
                        Bienvenue au Cabinet d'Accouchement casafami
                    </Editable>
                    <h1 className="mb-6 text-5xl font-extrabold leading-[1.04] sm:text-6xl">
                        <Editable id="accueil.hero.titre1">Votre santé,</Editable>
                        <Editable id="accueil.hero.titre2" as="span" className="block text-teal-600 dark:text-teal-300">notre priorité</Editable>
                    </h1>
                    <Editable id="accueil.hero.texte" as="p" className="mx-auto mb-9 max-w-xl text-lg leading-relaxed text-slate-600 dark:text-gray-300 lg:mx-0 lg:text-xl">
                        Le cabinet casafami vous accueille dans un cadre serein et moderne pour vous offrir des soins de qualité, avec une équipe professionnelle et à l'écoute.
                    </Editable>
                    <div className="flex flex-col items-center gap-4 sm:flex-row lg:justify-start sm:justify-center">
                        <Movable id="accueil.hero.btn-rdv" as={Link} to="/prendre-rdv" className="mt-btn">
                            <Calendar className="h-4 w-4" />
                            <Editable id="accueil.hero.btn-rdv.label">Prendre rendez-vous</Editable>
                        </Movable>
                        <Movable id="accueil.hero.btn-services" as={Link} to="/services" className="mt-btn-ligne">
                            <Editable id="accueil.hero.btn-services.label">Découvrir nos services</Editable>
                        </Movable>
                    </div>
                    <div className="mt-9 flex flex-wrap justify-center gap-x-7 gap-y-3 text-sm font-semibold text-slate-600 dark:text-gray-300 lg:justify-start">
                        <span className="flex items-center gap-2.5"><Clock className="h-5 w-5 text-teal-600 dark:text-teal-300" /><Editable id="accueil.hero.point1">Ouvert 7j/7</Editable></span>
                        <span className="flex items-center gap-2.5"><Heart className="h-5 w-5 text-[#e8704a]" /><Editable id="accueil.hero.point2">Urgences 24h/24</Editable></span>
                    </div>
                </div>

                <div className="relative w-full min-w-0 max-w-xl flex-1 lg:max-w-none">
                    <div className="aspect-[5/4.4] overflow-hidden rounded-[2.5rem] shadow-[0_30px_70px_rgba(15,80,120,.22)]">
                        <img src="/cabinet_1.jpg" alt={t("Cabinet casafami")} className="h-full w-full object-cover" />
                    </div>
                    <div className="absolute -bottom-5 left-4 flex items-center gap-3 rounded-3xl bg-white px-5 py-4 shadow-[0_18px_40px_rgba(15,80,120,.18)] dark:bg-gray-800 sm:-left-6">
                        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600"><Calendar className="h-5 w-5" /></span>
                        <div>
                            <Editable id="accueil.hero.flottant.titre" as="p" className="text-xs font-semibold text-slate-500 dark:text-gray-400">Réservation en ligne</Editable>
                            <Editable id="accueil.hero.flottant.texte" as="p" className="text-base font-extrabold text-slate-800 dark:text-white">Sans inscription</Editable>
                        </div>
                    </div>
                    <div className="absolute -top-3 right-2 flex items-center gap-2 rounded-2xl bg-[#fff4ea] px-4 py-3 text-sm font-bold text-[#8a4a2b] shadow-[0_14px_30px_rgba(180,90,50,.16)] sm:-right-3">
                        <MessageSquare className="h-4 w-4" /><Editable id="accueil.hero.sms">Confirmation par SMS</Editable>
                    </div>
                </div>
            </section>

            {/* ========== SECTION ATOUTS ========== */}
            <section className="py-6 transition-colors">
                <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                        {ATOUTS.map((item, i) => {
                            const IconComponent = item.Icon;
                            return (
                                <div key={i} className="mt-carte p-7 text-center">
                                    <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-600 dark:bg-gray-700 dark:text-teal-300"><IconComponent className="h-6 w-6" /></div>
                                    <Editable id={`accueil.atout${i + 1}.titre`} as="h3" className="mb-2 text-base font-extrabold text-slate-800 dark:text-white">{item.title}</Editable>
                                    <Editable id={`accueil.atout${i + 1}.desc`} as="p" className="text-sm text-slate-500 dark:text-gray-400">{item.desc}</Editable>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ========== SECTION SERVICES ========== */}
            <section className="py-20 transition-colors">
                <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                    <div className="mb-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                        <div className="max-w-2xl">
                            <Editable id="accueil.services.etiquette" as="span" className={etiquette}>NOS SERVICES</Editable>
                            <Editable id="accueil.services.titre" as="h2" accent={-1} className="mt-titre mt-regle text-3xl md:text-4xl">Des soins adaptés à tous</Editable>
                            <Editable id="accueil.services.texte" as="p" className="mt-4 text-lg text-slate-600 dark:text-gray-300">
                                Le cabinet casafami vous propose une prise en charge complète et personnalisée pour toute la famille.
                            </Editable>
                        </div>
                        <Movable id="accueil.services.btn" as={Link} to="/services" className="mt-btn-ligne shrink-0 self-start md:self-end">
                            <Editable id="accueil.services.btn.label">Voir tous les services →</Editable>
                        </Movable>
                    </div>

                    <Carrousel label={t("Nos services")}>
                        {SERVICES.map((service, i) => (
                            <article key={i} className="group mt-carte h-full p-3">
                                <div className="mt-cadre">
                                    <div className="aspect-[4/3] overflow-hidden rounded-[1.4rem]">
                                        <img loading="lazy" decoding="async" src={service.image} alt={t(service.title)}
                                            onError={event => { event.currentTarget.onerror = null; event.currentTarget.src = '/general.jpg'; }}
                                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                    </div>
                                </div>
                                <div className="px-3 pb-4 pt-5">
                                    <Editable id={`accueil.service${i + 1}.titre`} as="h3" className="text-lg font-extrabold text-slate-800 dark:text-white">{service.title}</Editable>
                                    <Editable id={`accueil.service${i + 1}.desc`} as="p" className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-gray-400">{service.desc}</Editable>
                                </div>
                            </article>
                        ))}
                    </Carrousel>
                </div>
            </section>

            {/* ========== SECTION NOTRE CABINET (image / texte) ========== */}
            <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
                <div className="mt-sable grid grid-cols-1 gap-0 overflow-hidden rounded-[2.5rem] lg:grid-cols-2">
                    <div className="relative min-h-[320px] lg:min-h-[520px]">
                        <img loading="lazy" decoding="async" src="/cabinet_2.jpg" alt={t("Cabinet casafami")} className="absolute inset-0 h-full w-full object-cover" />
                        <div className="absolute bottom-5 left-5 rounded-3xl bg-white px-6 py-4 text-slate-800 shadow-[0_18px_40px_rgba(15,80,120,.2)]">
                            <Editable id="accueil.cabinet.chiffre" as="p" className="text-4xl font-extrabold text-teal-600">10+</Editable>
                            <Editable id="accueil.cabinet.chiffre.legende" as="p" className="text-xs font-bold text-slate-500">Années d'expérience</Editable>
                        </div>
                    </div>
                    <div className="flex items-center px-6 py-14 sm:px-12 lg:px-14">
                        <div className="max-w-xl">
                            <Editable id="accueil.cabinet.etiquette" as="span" className={etiquette}>NOTRE CABINET</Editable>
                            <Editable id="accueil.cabinet.titre" as="h2" accent={-1} className="mt-titre mt-regle mb-6 text-3xl md:text-4xl">Un espace moderne et accueillant</Editable>
                            <Editable id="accueil.cabinet.texte1" as="p" className="mb-4 text-lg font-bold leading-relaxed text-slate-700 dark:text-gray-100">
                                Situé à Andongona - Antsohihy, le cabinet casafami a été pensé pour votre confort et celui de votre famille.
                            </Editable>
                            <Editable id="accueil.cabinet.texte2" as="p" className="mb-8 leading-relaxed text-slate-600 dark:text-gray-300">
                                Nos locaux sont équipés d'un matériel moderne pour vous garantir des soins de qualité dans un environnement apaisant.
                            </Editable>
                            <ul className="mb-9 grid gap-3 sm:grid-cols-2">
                                {POINTS_FORTS.map((item, i) => (
                                    <li key={i} className="flex items-center gap-2.5 text-slate-700 dark:text-gray-200">
                                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-600 text-white"><Check className="h-3.5 w-3.5" strokeWidth={3} /></span>
                                        <Editable id={`accueil.cabinet.point${i + 1}`} className="font-semibold">{item}</Editable>
                                    </li>
                                ))}
                            </ul>
                            <Link to="/prendre-rdv" className="mt-btn"><Calendar className="h-4 w-4" />{t("Prendre rendez-vous")}</Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* ========== SECTION HORAIRES + CONTACT ========== */}
            <section className="py-16 transition-colors">
                <div className="mx-auto grid max-w-6xl gap-6 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
                    <div className="mt-carte p-8 sm:p-10">
                        <Editable id="accueil.infos.etiquette" as="span" className={etiquette}>INFORMATIONS</Editable>
                        <Editable id="accueil.infos.titre" as="h2" accent={-1} className="mt-titre mt-regle mb-8 text-3xl">Horaires & Contact</Editable>

                        {/* Horaires : issus du planning configuré par le super administrateur */}
                        <Editable id="accueil.horaires.titre" as="h3" className="mb-5 flex items-center gap-2 text-sm font-extrabold uppercase tracking-[0.14em] text-teal-600 dark:text-teal-300">Horaires</Editable>
                        <div className="space-y-3 text-slate-700 dark:text-gray-300">
                            {horaires.length === 0 && <p className="text-sm text-gray-500">{t("Horaires disponibles bientôt.")}</p>}
                            {horaires.map(h => (
                                <div key={h.label} className="rounded-2xl bg-teal-50 px-5 py-4 dark:bg-gray-700/60">
                                    <div className="mt-ligne">
                                        <span className="font-bold">{traduireJours(h.label, t)}</span>
                                        <span className="mt-points" />
                                        <span className="font-titre font-extrabold text-teal-700 dark:text-teal-300">{h.global}</span>
                                    </div>
                                    {h.matin && h.apresMidi && (
                                        <p className="mt-1 text-sm text-slate-500 dark:text-gray-400">{t("Matin :")} {h.matin} · {t("Après-midi :")} {h.apresMidi}</p>
                                    )}
                                </div>
                            ))}
                            <Editable id="accueil.horaires.urgences" as="p" className="mt-sable rounded-2xl px-5 py-4 text-sm font-bold text-[#8a4a2b] dark:text-[#f0c9ae]">Urgences 24h/24</Editable>
                        </div>
                    </div>

                    <div className="mt-ardoise flex flex-col justify-between rounded-[2rem] p-8 sm:p-10">
                        <div className="space-y-8">
                            <div className="flex gap-4">
                                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-(--mt-main-clair)"><MapPin className="h-5 w-5" /></span>
                                <div className="text-white/90">
                                    <Editable id="accueil.adresse.titre" as="h3" className="mb-2 text-sm font-extrabold uppercase tracking-[0.14em] text-(--mt-main-clair)">Adresse</Editable>
                                    <Editable id="accueil.adresse.nom" as="p" className="font-bold text-white">casafami</Editable>
                                    <Editable id="accueil.adresse.ligne1" as="p">Chez Rasazy VERO</Editable>
                                    <Editable id="accueil.adresse.ligne2" as="p">Andongona - ANTSOHIHY</Editable>
                                    <Editable id="accueil.adresse.pays" as="p" className="text-sm text-white/60">Madagascar</Editable>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-(--mt-main-clair)"><Phone className="h-5 w-5" /></span>
                                <div className="text-white/90">
                                    <Editable id="accueil.tel.titre" as="h3" className="mb-2 text-sm font-extrabold uppercase tracking-[0.14em] text-(--mt-main-clair)">Téléphone</Editable>
                                    <Editable id="accueil.tel.numero1" as="p" className="font-titre text-xl font-extrabold text-white">034 06 759 28</Editable>
                                    <Editable id="accueil.tel.numero2" as="p" className="font-titre text-xl font-extrabold text-white">032 43 035 07</Editable>
                                    <Editable id="accueil.tel.note" as="p" className="text-sm text-white/60">Appel & SMS</Editable>
                                </div>
                            </div>
                        </div>
                        <div className="mt-10 overflow-hidden rounded-3xl">
                            <img loading="lazy" decoding="async" src="/general.jpg" alt="" className="aspect-[16/7] w-full object-cover" />
                        </div>
                    </div>
                </div>
            </section>

            {/* ========== GALERIE ========== */}
            <section className="pb-20 transition-colors">
                <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                    <h2 className="mt-titre mt-regle mb-10 text-3xl md:text-4xl">{t("Le cabinet en images")}</h2>
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                        {GALERIE.map(src => (
                            <img key={src} loading="lazy" decoding="async" src={src} alt="" className="aspect-[3/2] w-full rounded-3xl object-cover" />
                        ))}
                    </div>
                </div>
            </section>

            {/* ========== APPEL À L'ACTION ========== */}
            <section className="px-4 pb-4 transition-colors sm:px-6 lg:px-8">
                <div className="mt-ardoise mt-clair mx-auto max-w-6xl rounded-[2.5rem] px-8 py-14 sm:px-14">
                    <div className="grid items-center gap-10 lg:grid-cols-[1fr_auto]">
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
                </div>
            </section>

        </div>
    );
}

export default Accueil;
