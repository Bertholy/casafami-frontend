import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, Check, ExternalLink, GitBranch, Globe, MessageCircle } from 'lucide-react';
import { CONTACT_PORTFOLIO } from '../constants/portfolio';

/**
 * Portfolio de VONJIARIMANANA Alpha Bertholy, concepteur du site : on y arrive en cliquant sur son nom dans le pied de page.
 * Page autonome (ni barre de navigation ni pied de page du cabinet), toujours sombre avec un seul orange ; textes en français.
 * Les chiffres affichés sont ceux du projet CASAFAMI (rôles de comptes, langues), pas des chiffres d'effet.
 * Les styles propres à la page (« pf-… ») sont à la fin de index.css.
 */

const NAVIGATION = [
    { href: '#accueil', libelle: 'Accueil' },
    { href: '#apropos', libelle: 'À propos' },
    { href: '#competences', libelle: 'Compétences' },
    { href: '#projet', libelle: 'Projet' },
    { href: '#contact', libelle: 'Contact' },
];

const CHIFFRES = [
    { valeur: '1', libelle: 'projet complet', detail: 'de A à Z' },
    { valeur: '5', libelle: 'rôles de comptes', detail: 'gérés' },
    { valeur: '2', libelle: 'langues', detail: 'français et malgache' },
];

const COMPETENCES = [
    { surtitre: 'Interface', titre: 'Front-end', texte: 'Des pages rapides et claires sur téléphone comme sur ordinateur : React, Vite, Tailwind CSS.' },
    { surtitre: 'Serveur', titre: 'Back-end', texte: 'Une API solide qui applique les règles du métier : Java 17 et Spring Boot.' },
    { surtitre: 'Données', titre: 'Base', texte: 'Une base PostgreSQL bien structurée, avec sauvegarde et restauration.' },
    { surtitre: 'Sécurité', titre: 'Accès', texte: 'Connexion par jeton (JWT) et droits différents selon le rôle de chaque compte.' },
];

const FONCTIONS = [
    'Réservation avec un assistant qui pose les questions, ou avec un formulaire',
    'Clé de suivi et code à scanner pour retrouver, annuler ou télécharger son reçu',
    'Français et malgache, mode sombre, textes modifiables par l’administrateur',
    'Espaces du personnel, dossier patient, suivi de maternité, messagerie interne',
];

const TECHNOLOGIES = ['React 19', 'Vite', 'Tailwind 4', 'Spring Boot 4', 'Java 17', 'PostgreSQL', 'JWT', 'PDFBox'];
const DEFILEMENT = ['React', 'Spring Boot', 'PostgreSQL', 'Java 17', 'Tailwind', 'JWT', 'Vite'];

const lienWhatsapp = numero => `https://wa.me/${numero.international}`;

// lucide-react n'a plus les logos de marques : le « f » de Facebook est dessiné ici.
const IconeFacebook = ({ className }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}><path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12z" /></svg>
);

const bouton = 'inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-extrabold uppercase tracking-wide transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-400';
const orange = 'bg-orange-500 text-[#0a0a0b] hover:-translate-y-0.5 hover:bg-orange-400';
const contour = 'border-2 border-white/30 text-white hover:border-orange-500 hover:text-orange-400';
const surtitre = 'mb-4 text-xs font-extrabold uppercase tracking-[0.3em] text-orange-500';

function Reseau({ href, libelle, children }) {
    return (
        <a href={href} target="_blank" rel="noopener noreferrer" aria-label={libelle} title={libelle}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white/8 text-white/85 ring-1 ring-white/12 transition hover:bg-orange-500 hover:text-[#0a0a0b] hover:ring-orange-500">
            {children}
        </a>
    );
}

/** Silhouette provisoire, remplacée par la photo dès que le fichier existe. */
function Silhouette({ className }) {
    return (
        <svg viewBox="0 0 400 500" role="img" aria-label="Portrait provisoire" className={className}>
            <defs>
                <linearGradient id="pf-corps" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#34343a" /><stop offset="1" stopColor="#121214" /></linearGradient>
                <linearGradient id="pf-tete" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#3b3b42" /><stop offset="1" stopColor="#1a1a1e" /></linearGradient>
            </defs>
            <path d="M10 500 C10 400 70 335 150 318 L250 318 C330 335 390 400 390 500 Z" fill="url(#pf-corps)" />
            <path d="M165 290 L235 290 L245 335 C225 352 175 352 155 335 Z" fill="#26262b" />
            <ellipse cx="200" cy="175" rx="88" ry="108" fill="url(#pf-tete)" />
            <path d="M112 160 C108 80 160 52 205 52 C255 52 296 90 288 160 C270 112 236 100 200 100 C164 100 128 112 112 160 Z" fill="#17171a" />
            <text x="200" y="440" textAnchor="middle" fontFamily="Anton, Impact, sans-serif" fontSize="64" fill="#ff6a13" opacity=".92" letterSpacing="3">AB</text>
        </svg>
    );
}

/** Portrait entouré de cercles : un fin anneau, un anneau sombre, le disque orange, et la personne devant. */
function Portrait({ photo, detouree, onPhotoIntrouvable }) {
    const image = photo && (
        <img src={photo} alt="VONJIARIMANANA Alpha Bertholy" onError={onPhotoIntrouvable}
            className={detouree ? 'absolute inset-x-0 bottom-0 h-[96%] w-full object-contain object-bottom' : 'h-full w-full object-cover object-top'} />
    );
    return (
        <div className="relative mx-auto aspect-square w-full max-w-[30rem]">
            <div aria-hidden="true" className="absolute inset-0 rounded-full border border-orange-500/60" />
            <div aria-hidden="true" className="absolute inset-[9%] rounded-full bg-[#2b170d]" />
            <div className="absolute inset-[17%] overflow-hidden rounded-full bg-[radial-gradient(circle_at_35%_28%,#ff8a3d,#ff6a13_55%,#e24f00)]">
                {photo && !detouree ? image : null}
            </div>
            {/* la personne : devant le disque, jusqu'au bord de l'anneau sombre */}
            <div className="absolute inset-[9%] overflow-hidden rounded-full">
                {photo && detouree ? image : null}
                {!photo && <Silhouette className="absolute inset-x-[8%] bottom-0 h-[86%] w-[84%]" />}
            </div>

            {/* cartes de verre */}
            <div className="pf-flotte absolute left-[2%] top-[26%] z-10 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 shadow-2xl backdrop-blur-md">
                <b className="pf-titre block text-3xl">1</b><span className="text-xs text-white/75">projet complet</span>
            </div>
            <div className="pf-flotte absolute right-[0%] top-[12%] z-10 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 shadow-2xl backdrop-blur-md" style={{ animationDelay: '1.4s' }}>
                <b className="pf-titre block text-3xl">5</b><span className="text-xs text-white/75">rôles de comptes</span>
            </div>
            <div className="pf-flotte absolute bottom-[10%] right-[3%] z-10 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 shadow-2xl backdrop-blur-md" style={{ animationDelay: '2.6s' }}>
                <b className="pf-titre block text-3xl">2</b><span className="text-xs text-white/75">langues</span>
            </div>
        </div>
    );
}

export default function Portfolio() {
    const [facebookCharge, setFacebookCharge] = useState(false);   // la publication Facebook est affichée
    const [photoIntrouvable, setPhotoIntrouvable] = useState(false);   // le fichier de la photo n'existe pas encore : on garde la silhouette
    const photo = photoIntrouvable ? null : CONTACT_PORTFOLIO.photo;
    const photoApropos = photoIntrouvable ? null : (CONTACT_PORTFOLIO.photoApropos || CONTACT_PORTFOLIO.photo);

    // Polices du portfolio (titres en capitales épaisses) ; les liens de la barre font défiler la page en douceur.
    useEffect(() => {
        const lien = document.createElement('link');
        lien.rel = 'stylesheet';
        lien.href = 'https://fonts.googleapis.com/css2?family=Anton&family=Figtree:wght@400;600;700;800&display=swap';
        document.head.appendChild(lien);
        const racine = document.documentElement;
        const avant = racine.style.scrollBehavior;
        racine.style.scrollBehavior = 'smooth';
        return () => { lien.remove(); racine.style.scrollBehavior = avant; };
    }, []);

    return (
        <div className="pf-page relative min-h-screen overflow-x-clip bg-[#0a0a0b] text-[#f4f2ee] antialiased">

            {/* ========== BARRE DU HAUT ========== */}
            <nav aria-label="Navigation du portfolio" className="sticky top-0 z-40 border-b border-white/10 bg-[#0a0a0b]/85 backdrop-blur-md">
                <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
                    <a href="#accueil" className="flex items-center gap-3">
                        <span className="pf-titre flex h-10 w-10 items-center justify-center bg-orange-500 text-lg text-[#0a0a0b]">AB</span>
                        <span className="pf-titre hidden text-2xl tracking-wider sm:block">Alpha Bertholy</span>
                    </a>
                    <ul className="hidden items-center gap-8 text-[13px] font-bold uppercase tracking-[0.14em] text-white/60 md:flex">
                        {NAVIGATION.map(lien => <li key={lien.href}><a href={lien.href} className="transition hover:text-orange-400">{lien.libelle}</a></li>)}
                    </ul>
                    <div className="flex items-center gap-4">
                        <Link to="/" className="hidden text-sm font-semibold text-white/60 transition hover:text-white lg:block">Site du cabinet</Link>
                        <a href="#contact" className={`${bouton} ${orange} px-5 py-2.5`}>Me contacter</a>
                    </div>
                </div>
            </nav>

            <main>
                {/* ========== ACCUEIL ========== */}
                <section id="accueil" className="relative scroll-mt-20 overflow-hidden">
                    <div aria-hidden="true" className="pointer-events-none absolute left-[70%] top-1/2 h-[46rem] w-[46rem] max-w-[140vw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,106,19,.22),transparent_65%)]" />
                    <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 pb-20 pt-14 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:pb-24 lg:pt-20">
                        <div>
                            <p className="mb-4 text-sm text-white/60">VONJIARIMANANA Alpha Bertholy · Antsohihy, Madagascar</p>
                            <h1 className="pf-titre text-5xl sm:text-6xl lg:text-7xl">
                                Bonjour,
                                <span className="block text-orange-500">je suis Alpha</span>
                                <span className="block">Développeur web full stack</span>
                            </h1>
                            <p className="mt-6 max-w-lg text-lg leading-relaxed text-white/65">Je conçois et réalise des sites et des applications web complets, de l’interface que l’on voit jusqu’au serveur et à la base de données.</p>

                            <div className="mt-8 flex flex-wrap items-center gap-4">
                                <a href="#projet" className={`${bouton} ${orange}`}>Découvrir mon projet</a>
                                <a href="#contact" aria-label="Aller au contact" className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-orange-500 text-orange-500 transition hover:bg-orange-500 hover:text-[#0a0a0b]"><ArrowUpRight className="h-5 w-5" /></a>
                            </div>

                            <div className="mt-9 flex items-center gap-3">
                                <span className="mr-1 text-sm text-white/55">Suivez-moi</span>
                                <Reseau href={CONTACT_PORTFOLIO.facebook.lien} libelle="Facebook"><IconeFacebook className="h-4 w-4" /></Reseau>
                                <Reseau href={lienWhatsapp(CONTACT_PORTFOLIO.whatsapp[0])} libelle="WhatsApp"><MessageCircle className="h-4 w-4" /></Reseau>
                                <Reseau href={CONTACT_PORTFOLIO.github} libelle="GitHub"><GitBranch className="h-4 w-4" /></Reseau>
                            </div>
                        </div>

                        <Portrait photo={photo} detouree={CONTACT_PORTFOLIO.photoDetouree} onPhotoIntrouvable={() => setPhotoIntrouvable(true)} />
                    </div>

                    {/* bandeau de technologies */}
                    <div aria-label="Technologies" className="relative z-10 -mx-[2vw] -rotate-[1.2deg] overflow-hidden border-y-2 border-[#0a0a0b] bg-orange-500 text-[#0a0a0b]">
                        <div className="pf-piste flex w-max">
                            {[...DEFILEMENT, ...DEFILEMENT].map((nom, i) => <span key={i} className="pf-titre pf-etoile whitespace-nowrap py-3.5 text-2xl sm:text-3xl">{nom}</span>)}
                        </div>
                    </div>
                </section>

                {/* ========== À PROPOS ========== */}
                <section id="apropos" className="pf-damier scroll-mt-20 py-24">
                    <div className="mx-auto grid max-w-6xl items-center gap-14 px-5 sm:px-8 lg:grid-cols-[1.1fr_0.9fr]">
                        <div>
                            <p className={surtitre}>À propos</p>
                            <h2 className="pf-titre text-5xl sm:text-6xl lg:text-7xl">Je fais tout<br /><span className="text-orange-500">de A à Z</span></h2>
                            <p className="mb-8 mt-6 max-w-xl text-lg leading-relaxed text-white/70">Je réalise des applications web de bout en bout : l’interface, le serveur, la base de données, les sauvegardes et la mise en ligne. Tout est pensé ensemble, rien ne se perd entre les étapes.</p>
                            <ul className="space-y-4">
                                {CHIFFRES.map(chiffre => (
                                    <li key={chiffre.libelle} className="flex items-center gap-4 text-white/80">
                                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-orange-500 text-[#0a0a0b]"><Check className="h-5 w-5" strokeWidth={3} aria-hidden="true" /></span>
                                        <span><b className="pf-titre mr-2 text-3xl font-normal text-white">{chiffre.valeur}</b>{chiffre.libelle}, {chiffre.detail}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="relative mx-auto aspect-[4/5] w-full max-w-md overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#1c1c20]">
                            <span className="absolute left-4 top-4 z-10 rounded-full bg-orange-500 px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#0a0a0b]">Développeur web</span>
                            {photoApropos
                                ? <img src={photoApropos} alt="" onError={() => setPhotoIntrouvable(true)} className="h-full w-full object-cover object-top" />
                                : <Silhouette className="absolute inset-x-0 bottom-0 h-[92%] w-full" />}
                        </div>
                    </div>
                </section>

                {/* ========== COMPÉTENCES ========== */}
                <section id="competences" className="mx-auto max-w-6xl scroll-mt-20 px-5 pb-10 pt-24 sm:px-8">
                    <p className={surtitre}>Compétences</p>
                    <h2 className="pf-titre mb-12 text-5xl sm:text-6xl">Ce que je fais</h2>
                    <div className="grid border-t border-white/10 sm:grid-cols-2 lg:grid-cols-4">
                        {COMPETENCES.map((competence, i) => (
                            <article key={competence.titre} className={`border-b border-white/10 py-8 ${i > 0 ? 'lg:border-l lg:pl-6' : ''} ${i % 2 === 1 ? 'sm:border-l sm:pl-6 lg:pl-6' : 'sm:pr-6'} lg:pr-6`}>
                                <p className="text-[11px] font-extrabold uppercase tracking-[0.24em] text-orange-500">{competence.surtitre}</p>
                                <h3 className="pf-titre mb-3 mt-2 text-3xl">{competence.titre}</h3>
                                <p className="text-[15px] leading-relaxed text-white/60">{competence.texte}</p>
                            </article>
                        ))}
                    </div>
                </section>

                {/* ========== PROJET ========== */}
                <section id="projet" className="mx-auto max-w-6xl scroll-mt-20 px-5 pb-24 pt-16 sm:px-8">
                    <p className={surtitre}>Projet</p>
                    <h2 className="pf-titre pf-contour mb-10 text-[clamp(3.6rem,14vw,10.5rem)]">Casafami</h2>

                    <div className="grid gap-12 lg:grid-cols-2">
                        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#1c1c20]">
                            <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
                                <span className="h-2.5 w-2.5 rounded-full bg-red-400" /><span className="h-2.5 w-2.5 rounded-full bg-yellow-400" /><span className="h-2.5 w-2.5 rounded-full bg-green-400" />
                                <span className="ml-3 truncate rounded-md bg-white/8 px-3 py-1 text-xs text-white/50">casafami</span>
                            </div>
                            <img src="/cabinet_1.jpg" alt="Le cabinet CASAFAMI" loading="lazy" decoding="async" className="aspect-[4/3] w-full object-cover" />
                        </div>

                        <div>
                            <p className="text-lg leading-relaxed text-white/70">Le site du Cabinet d’Accouchement Sainte Famille, à Antsohihy : les patientes réservent en ligne, l’équipe gère ses rendez-vous, ses dossiers et le suivi des grossesses.</p>
                            <ul className="my-6 space-y-3 text-[15px] leading-relaxed text-white/80">
                                {FONCTIONS.map(fonction => (
                                    <li key={fonction} className="flex gap-3"><ArrowRight aria-hidden="true" className="mt-1 h-4 w-4 shrink-0 text-orange-500" />{fonction}</li>
                                ))}
                            </ul>
                            <ul className="mb-8 flex flex-wrap gap-2">
                                {TECHNOLOGIES.map(technologie => <li key={technologie} className="rounded-full border border-white/12 px-3.5 py-1.5 text-xs font-bold text-white/80">{technologie}</li>)}
                            </ul>
                            <div className="flex flex-wrap gap-3">
                                <Link to="/" className={`${bouton} ${orange}`}><Globe className="h-4 w-4" />Voir le site</Link>
                                <a href={CONTACT_PORTFOLIO.github} target="_blank" rel="noopener noreferrer" className={`${bouton} ${contour}`}><GitBranch className="h-4 w-4" />Code sur GitHub<ExternalLink className="h-3.5 w-3.5" /></a>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ========== CONTACT ========== */}
                <section id="contact" className="scroll-mt-20 bg-orange-500 py-24 text-[#0a0a0b]">
                    <div className="mx-auto max-w-6xl px-5 sm:px-8">
                        <p className="mb-4 text-xs font-extrabold uppercase tracking-[0.3em]">Contact</p>
                        <h2 className="pf-titre text-[clamp(3rem,11vw,8.5rem)]">Parlons-en</h2>
                        <p className="mb-10 mt-4 max-w-xl text-lg font-semibold">Un projet de site ou d’application ? Écrivez-moi sur WhatsApp, ou retrouvez-moi sur Facebook.</p>

                        <ul className="grid gap-4 sm:grid-cols-3">
                            {CONTACT_PORTFOLIO.whatsapp.map(numero => (
                                <li key={numero.international}>
                                    <a href={lienWhatsapp(numero)} target="_blank" rel="noopener noreferrer" className="flex h-full flex-col gap-1 rounded-2xl bg-[#0a0a0b] p-6 text-[#f4f2ee] transition hover:-translate-y-1">
                                        <span className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-orange-500">WhatsApp</span>
                                        <span className="pf-titre text-3xl tracking-wide">{numero.affiche}</span>
                                        <span className="mt-2 inline-flex items-center gap-1.5 text-sm font-bold text-white/70">Écrire<ArrowUpRight className="h-4 w-4" /></span>
                                    </a>
                                </li>
                            ))}
                            <li>
                                <a href={CONTACT_PORTFOLIO.facebook.lien} target="_blank" rel="noopener noreferrer" className="flex h-full flex-col gap-1 rounded-2xl bg-[#0a0a0b] p-6 text-[#f4f2ee] transition hover:-translate-y-1">
                                    <span className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.22em] text-orange-500"><IconeFacebook className="h-3.5 w-3.5" />Facebook</span>
                                    <span className="pf-titre text-3xl tracking-wide">{CONTACT_PORTFOLIO.facebook.nom}</span>
                                    <span className="mt-2 inline-flex items-center gap-1.5 text-sm font-bold text-white/70">Ouvrir<ArrowUpRight className="h-4 w-4" /></span>
                                </a>
                            </li>
                        </ul>

                        {/* publication Facebook, affichée par Facebook lui-même (elle charge des données de Facebook) */}
                        <div className="relative mx-auto mt-12 h-[563px] w-[500px] max-w-full">
                            <iframe
                                src={CONTACT_PORTFOLIO.facebook.integration}
                                title="Ma publication Facebook"
                                loading="lazy"
                                width="500"
                                height="563"
                                scrolling="no"
                                allowFullScreen
                                allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                                onLoad={() => setFacebookCharge(true)}
                                className={`absolute inset-0 h-full w-full max-w-full overflow-hidden rounded-2xl border-0 bg-white transition-opacity duration-500 ${facebookCharge ? 'opacity-100' : 'opacity-0'}`}
                            />
                        </div>
                    </div>
                </section>
            </main>

            <footer className="py-8 text-center text-sm text-white/45">
                © {new Date().getFullYear()} VONJIARIMANANA Alpha Bertholy · <Link to="/" className="underline underline-offset-4 transition hover:text-orange-400">Site du cabinet CASAFAMI</Link>
            </footer>
        </div>
    );
}
