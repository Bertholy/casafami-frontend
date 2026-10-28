import { useRef, useState } from 'react';
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
    Sparkles,
    CircleChevronLeft,
    CircleChevronRight,
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    RotateCw,
} from 'lucide-react';
import Editable from '../components/site/Editable';
import Movable from '../components/site/Movable';
import CarteTournante from '../components/CarteTournante';
import { photoDuService } from '../constants/photosServices';
import { LienAdresse, LienTelephone } from '../components/site/LiensContact';
import { useSiteContent } from '../context/SiteContentContext';
import { summarizeHours, traduireJours, usePlanning } from '../utils/horaires';
import { useLang } from '../i18n/LangContext';

// Chaque texte et chaque bouton porte un identifiant « accueil.* » : le super administrateur peut les modifier / déplacer
// depuis le mode édition du site (voir components/site).
const ATOUTS = [
    { Icon: Users, title: 'Équipe qualifiée', desc: 'Des professionnels de santé à votre écoute' },
    { Icon: Clock, title: 'Prise de rendez-vous facile', desc: 'En ligne ou sur place, 24h/24' },
    { Icon: ShieldCheck, title: 'Soins de qualité', desc: 'Pour toute la famille' },
    { Icon: Heart, title: 'Un cadre moderne', desc: 'Confort et sérénité' },
];
const SERVICES = [
    { Icon: Baby, title: 'Suivi de grossesse', desc: 'Un accompagnement tout au long de votre maternité.' },
    { Icon: Heart, title: 'Accouchement', desc: 'Un environnement sécurisé pour donner la vie.' },
    { Icon: Stethoscope, title: 'Échographie', desc: 'Suivi médical de votre bébé par imagerie.' },
    { Icon: Pill, title: 'Planning familial', desc: 'Conseils et accompagnement personnalisés.' },
];
const POINTS_FORTS = ['Équipement médical moderne', "Salle d'accouchement sécurisée", 'Accueil chaleureux', 'Équipe expérimentée'];
const GALERIE = ['/cabinet_1.jpg', '/cabinet_2.jpg', '/service-grossesse.jpg', '/service-vaccination.jpg', '/service-clinique-mobile.jpg'];

// Diaporama de l'image d'accueil : une image toutes les 6 secondes (la barre de progression de l'image affichée donne le rythme).
const DIAPOS = ['/cabinet_1.jpg', '/cabinet_2.jpg', '/accueil-famille.jpg'];
// cadrage des photos où les visages sont en haut (sinon la photo est coupée au milieu)
const POSITION_DIAPOS = { '/accueil-famille.jpg': 'center 18%' };
const DUREE_DIAPO = 6000;
const deuxChiffres = n => String(n).padStart(2, '0');
const mouvementReduit = () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

const etiquette ='mb-3 block text-xs font-extrabold uppercase tracking-[0.22em] text-teal-600 dark:text-teal-300';

function Accueil() {
    const { t } = useLang();
    const { content, editMode } = useSiteContent();
    const planning = usePlanning();
    const horaires = summarizeHours(planning?.horaires);
    const numeroAppel = (content['accueil.tel.numero1']?.texte ?? '034 06 759 28').replace(/[^\d+]/g, '');
    const [diapo, setDiapo] = useState(0);
    const [pauseDiapo, setPauseDiapo] = useState(false);
    const diaporamaAuto = !editMode && !mouvementReduit();   // pas de changement tout seul pendant la modification du site ni si l'appareil demande moins d'animations
    const allerA = i => setDiapo((i + DIAPOS.length) % DIAPOS.length);
    // raccourcis sous l'image d'accueil
    const raccourcis = [
        { Icon: Calendar, titre: t('Rendez-vous en ligne'), texte: t('Réservez en moins de 2 minutes'), lien: t('Prendre RDV'), to: '/prendre-rdv' },
        { Icon: Stethoscope, titre: t('Nos services'), texte: t('Grossesse, accouchement, échographie'), lien: t('Découvrir'), to: '/services' },
        { Icon: CalendarDays, titre: t('Mes rendez-vous'), texte: t('Retrouvez votre rendez-vous'), lien: t('Retrouver'), to: '/mes-rdv' },
        { Icon: Phone, titre: t('Urgences 24h/24'), texte: (content['accueil.tel.numero1']?.texte ?? '034 06 759 28'), lien: t('Appeler'), href: `tel:${numeroAppel}` },
    ];
    const galerie = useRef(null);
    // fait défiler la galerie d'environ une photo vers la gauche (-1) ou vers la droite (1)
    const defiler = sens => {
        const zone = galerie.current;
        if (zone) zone.scrollBy({ left: sens * Math.max(280, zone.clientWidth * 0.6), behavior: 'smooth' });
    };

    return (
        <div className="accueil-anime overflow-hidden transition-colors">

            {/* ========== SECTION HERO ========== */}
            {/* l'image passe sous la barre de navigation (transparente tant qu'on est en haut de page) : la barre a une marge basse de -78px, sa hauteur */}
            <section aria-roledescription="carousel" aria-label={t('Images du cabinet')} onMouseEnter={() => setPauseDiapo(true)} onMouseLeave={() => setPauseDiapo(false)}
                className="mt-hero relative flex overflow-hidden min-h-[640px] items-center justify-center pt-[78px] text-center md:min-h-screen">
                {DIAPOS.map((src, i) => (
                    <div key={src} aria-hidden="true" className={`absolute inset-0 bg-center transition-opacity duration-1000 ${i === diapo ? 'opacity-100' : 'opacity-0'}`} style={{ backgroundImage: `url('${src}')`, backgroundSize: 'cover', backgroundPosition: POSITION_DIAPOS[src] }} />
                ))}
                <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(3,44,74,.62) 0%, rgba(3,44,74,.34) 55%, rgba(3,44,74,.72) 100%)' }} />

                <div className="relative mx-auto w-full max-w-5xl px-4 pb-48 pt-24 sm:px-6 md:py-24">
                    <span className="mb-6 inline-flex items-center gap-2.5 border border-white/50 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.22em] text-white">
                        <Sparkles className="h-4 w-4 shrink-0 text-[#bfeaff]" aria-hidden="true" />
                        <Editable id="accueil.hero.badge" as="span">Bienvenue au Cabinet d'Accouchement casafami</Editable>
                    </span>
                    <h1 className="mb-6 text-4xl font-extrabold uppercase leading-[1.1] text-white drop-shadow-lg sm:text-5xl md:text-7xl lg:text-8xl">
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

                {/* compteur, barres de progression et flèches du diaporama */}
                <div className="absolute inset-x-0 bottom-28 z-10">
                    <div className="mx-auto flex max-w-7xl items-end justify-between gap-6 px-4 sm:px-6 lg:px-8">
                        <p className="text-white" aria-hidden="true"><span className="text-3xl font-extrabold">{deuxChiffres(diapo + 1)}</span><span className="ml-1.5 text-sm font-bold text-white/70">/ {deuxChiffres(DIAPOS.length)}</span></p>
                        <div className="hidden items-center gap-3 sm:flex" role="group" aria-label={t('Choisir une image')}>
                            {DIAPOS.map((src, i) => (
                                <button key={src} type="button" onClick={() => allerA(i)} aria-label={`${t('Image')} ${i + 1}`} aria-current={i === diapo ? 'true' : undefined} className="flex h-8 w-16 items-center">
                                    <span className="relative block h-[3px] w-full overflow-hidden bg-white/35">
                                        {i === diapo && (
                                            <span key={diapo} className="absolute inset-0 origin-left bg-white"
                                                style={diaporamaAuto ? { animation: `hero-barre ${DUREE_DIAPO}ms linear forwards`, animationPlayState: pauseDiapo ? 'paused' : 'running' } : undefined}
                                                onAnimationEnd={() => allerA(diapo + 1)} />
                                        )}
                                    </span>
                                </button>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <button type="button" onClick={() => allerA(diapo - 1)} aria-label={t('Image précédente')} className="flex h-12 w-12 items-center justify-center border border-white/70 text-white transition hover:bg-white hover:text-slate-800"><ChevronLeft className="h-5 w-5" aria-hidden="true" /></button>
                            <button type="button" onClick={() => allerA(diapo + 1)} aria-label={t('Image suivante')} className="flex h-12 w-12 items-center justify-center border border-white/70 text-white transition hover:bg-white hover:text-slate-800"><ChevronRight className="h-5 w-5" aria-hidden="true" /></button>
                        </div>
                    </div>
                </div>
            </section>

            {/* ========== RACCOURCIS (empiètent sur le bas de l'image) ========== */}
            <section aria-label={t('Accès rapides')} className="relative z-20 -mt-20">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                  <div className="grid grid-cols-1 shadow-2xl sm:grid-cols-2 lg:grid-cols-4">
                    {raccourcis.map(({ Icon, titre, texte, lien, to, href }) => {
                        const classe = 'group mt-ardoise flex flex-col gap-2 border-t border-white/10 p-6 text-left transition-colors hover:brightness-110 sm:border-l sm:border-t-0 sm:first:border-l-0';
                        const corps = (
                            <>
                                <Icon className="h-7 w-7 text-[#bfeaff]" aria-hidden="true" />
                                <span className="mt-2 text-sm font-extrabold uppercase tracking-wide text-white">{titre}</span>
                                <span className="text-sm text-white/70">{texte}</span>
                                <span className="mt-2 inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-[0.18em] text-[#bfeaff]">{lien}<ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" /></span>
                            </>
                        );
                        return to ? <Link key={titre} to={to} className={classe}>{corps}</Link> : <a key={titre} href={href} className={classe}>{corps}</a>;
                    })}
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
            <section className="py-20 transition-colors">
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
                        {/* chaque carte se retourne (survol, toucher ou clavier) : photo et titre devant, description derrière */}
                        {SERVICES.map((service, i) => (
                            <CarteTournante key={i} plate={editMode} label={t(service.title)} className="text-center"
                                avant={(
                                    <div className="relative aspect-[4/5] bg-slate-200">
                                        <img loading="lazy" decoding="async" src={photoDuService(service.title).src} style={{ objectPosition: photoDuService(service.title).position }} alt=""
                                            onError={event => { event.currentTarget.onerror = null; event.currentTarget.src = '/cabinet_1.jpg'; }}
                                            className="absolute inset-0 h-full w-full object-cover" />
                                        <div className="absolute inset-0 bg-linear-to-t from-black/75 via-black/10 to-transparent" aria-hidden="true" />
                                        <span className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-teal-700 shadow" aria-hidden="true"><RotateCw className="h-4 w-4" /></span>
                                        <Editable id={`accueil.service${i + 1}.titre`} as="h3" className="absolute inset-x-0 bottom-0 p-5 text-left text-lg font-bold uppercase tracking-wide text-white">{service.title}</Editable>
                                    </div>
                                )}
                                arriere={(
                                    <div className="flex h-full flex-col items-center justify-center gap-4 bg-teal-700 p-6 text-white">
                                        <service.Icon className="h-10 w-10 text-white/90" aria-hidden="true" />
                                        <Editable id={`accueil.service${i + 1}.desc`} as="p" className="text-base leading-relaxed text-white">{service.desc}</Editable>
                                        <Link to="/services" className="inline-flex items-center gap-1.5 border-b-2 border-white/60 pb-0.5 text-xs font-extrabold uppercase tracking-[0.18em] text-white transition hover:border-white">{t('Voir les services')}<ChevronRight className="h-4 w-4" aria-hidden="true" /></Link>
                                    </div>
                                )} />
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
                                    <LienAdresse>
                                        <Editable id="accueil.adresse.nom" as="p" className="font-bold">casafami</Editable>
                                        <Editable id="accueil.adresse.ligne1" as="p">Chez Rasazy VERO</Editable>
                                        <Editable id="accueil.adresse.ligne2" as="p">Andongona - ANTSOHIHY</Editable>
                                        <Editable id="accueil.adresse.pays" as="p" className="text-sm italic text-gray-500 dark:text-gray-400">Madagascar</Editable>
                                    </LienAdresse>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <span className="flex h-12 w-12 shrink-0 items-center justify-center bg-teal-600 text-white"><Phone className="h-5 w-5" /></span>
                                <div className="text-gray-700 dark:text-gray-300">
                                    <Editable id="accueil.tel.titre" as="h3" className="mb-2 text-sm font-extrabold uppercase tracking-[0.18em] text-teal-600 dark:text-teal-300">Téléphone</Editable>
                                    <LienTelephone id="accueil.tel.numero1" className="font-titre font-bold">034 06 759 28</LienTelephone>
                                    <LienTelephone id="accueil.tel.numero2" className="font-titre font-bold">032 43 035 07</LienTelephone>
                                    <Editable id="accueil.tel.note" as="p" className="text-sm italic text-gray-500 dark:text-gray-400">Appel & message</Editable>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-cadre self-start">
                        <img loading="lazy" decoding="async" src="/service-accouchement.jpg" alt="" className="aspect-[4/3] w-full object-cover" />
                    </div>
                </div>
            </section>

            {/* ========== GALERIE ========== */}
            <section className="pb-20 transition-colors">
                <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                    <div className="mb-10 flex items-end justify-between gap-6">
                        <h2 className="mt-titre mt-regle text-3xl md:text-4xl">{t("Le cabinet en images")}</h2>
                        <div className="flex gap-1 text-teal-600 dark:text-teal-300">
                            <button type="button" onClick={() => defiler(-1)} aria-label={t("Photo précédente")} className="rounded-full transition hover:opacity-70"><CircleChevronLeft className="h-10 w-10" /></button>
                            <button type="button" onClick={() => defiler(1)} aria-label={t("Photo suivante")} className="rounded-full transition hover:opacity-70"><CircleChevronRight className="h-10 w-10" /></button>
                        </div>
                    </div>
                    <div ref={galerie} className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:px-0">
                        {GALERIE.map(src => (
                            <img key={src} loading="lazy" decoding="async" src={src} alt="" onError={event => { event.currentTarget.style.display = 'none'; }} className="aspect-[3/2] w-[80%] shrink-0 snap-start object-cover sm:w-[45%] lg:w-[32%]" />
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
                        <Editable id="accueil.cta.note" as="p" className="mt-5 text-sm text-white/70">Sans inscription · Confirmation par message · Annulation facile</Editable>
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
