import { useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Phone, Mail, Clock, Heart } from 'lucide-react';
import Editable from './site/Editable';
import { summarizeHours, traduireJours, usePlanning } from '../utils/horaires';
import { useLang } from '../i18n/LangContext';
import { hasSession } from '../utils/auth';

const titreColonne = 'mb-5 text-xs font-extrabold uppercase tracking-[0.14em] text-[#7fd0f0]';

/** Pied de page du site public : bandeau ardoise, liens soulignés, coordonnées et horaires du cabinet. */
function Footer() {
    const { t } = useLang();
    const navigate = useNavigate();
    const clics = useRef({ nombre: 0, dernier: 0 });
    const planning = usePlanning();
    const horaires = summarizeHours(planning?.horaires);

    // Accès discret du personnel : 5 clics rapprochés (moins de 2 s entre deux clics) sur le logo ouvrent la page de connexion.
    const clicLogo = () => {
        const maintenant = Date.now();
        const c = clics.current;
        c.nombre = maintenant - c.dernier < 2000 ? c.nombre + 1 : 1;
        c.dernier = maintenant;
        if (c.nombre >= 5) { c.nombre = 0; navigate('/medecin/login'); }
    };

    return (
        <footer className="mt-ardoise mt-16 rounded-t-[3rem] transition-colors">
            <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">

                {/* ========== LOGO + LIENS ========== */}
                <div className="flex flex-col items-start justify-between gap-8 border-b border-white/20 pb-10 lg:flex-row lg:items-center">
                    <div className="flex items-center gap-4">
                        <img src="/logo_casafami.png" alt={t("casafami")} onClick={clicLogo} draggable={false} className="h-16 w-16 select-none rounded-2xl bg-white object-contain p-1.5" />
                        <Editable id="footer.description" as="p" className="max-w-xs text-sm leading-relaxed text-white/75">
                            Cabinet d'Accouchement Sainte Famille. Votre santé et celle de votre famille, notre priorité.
                        </Editable>
                    </div>
                    <div>
                        <Editable id="footer.liens.titre" as="h3" className="sr-only">Liens rapides</Editable>
                        <ul className="flex flex-wrap gap-x-8 gap-y-3 text-sm font-bold text-white">
                            <li><Link to="/" className="text-white/90 transition hover:text-[#7fd0f0]">{t("Accueil")}</Link></li>
                            <li><Link to="/services" className="text-white/90 transition hover:text-[#7fd0f0]">{t("Nos services")}</Link></li>
                            <li><Link to="/prendre-rdv" className="text-white/90 transition hover:text-[#7fd0f0]">{t("Prendre RDV")}</Link></li>
                            <li><Link to="/mes-rdv" className="text-white/90 transition hover:text-[#7fd0f0]">{t("Mes RDV")}</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-10 pt-10 md:grid-cols-3">

                    {/* ========== HORAIRES (issus du planning) ========== */}
                    <div>
                        <Editable id="footer.horaires.titre" as="h3" className={titreColonne}>Horaires</Editable>
                        <ul className="space-y-3 text-sm">
                            {horaires.map(h => (
                                <li key={h.label} className="flex items-start gap-2.5">
                                    <Clock className="mt-1 h-4 w-4 shrink-0 text-[#bfeaff]" />
                                    <div>
                                        <p className="font-bold text-white">{traduireJours(h.label, t)}</p>
                                        <p className="text-white/70">{h.matin && h.apresMidi ? `${h.matin} · ${h.apresMidi}` : h.global}</p>
                                    </div>
                                </li>
                            ))}
                            <li className="flex items-start gap-2.5">
                                <Heart className="mt-1 h-4 w-4 shrink-0 text-red-300" />
                                <div>
                                    <Editable id="footer.urgences.titre" as="p" className="font-bold text-white">Urgences</Editable>
                                    <Editable id="footer.urgences.texte" as="p" className="text-white/70">24h/24 - 7j/7</Editable>
                                </div>
                            </li>
                        </ul>
                    </div>

                    {/* ========== CONTACT ========== */}
                    <div>
                        <Editable id="footer.contact.titre" as="h3" className={titreColonne}>Contact</Editable>
                        <ul className="space-y-4 text-sm">
                            <li className="flex items-start gap-2.5">
                                <MapPin className="mt-1 h-4 w-4 shrink-0 text-[#bfeaff]" />
                                <div>
                                    <Editable id="footer.adresse.ligne1" as="p" className="font-bold text-white">Chez Rasazy VERO</Editable>
                                    <Editable id="footer.adresse.ligne2" as="p" className="text-white/70">Andongona - Antsohihy</Editable>
                                    <Editable id="footer.adresse.pays" as="p" className="text-white/70">Madagascar</Editable>
                                </div>
                            </li>
                            <li className="flex items-start gap-2.5">
                                <Mail className="mt-1 h-4 w-4 shrink-0 text-[#bfeaff]" />
                                <Editable id="footer.email" as="p" className="font-bold text-white">contact@casafami.mg</Editable>
                            </li>
                        </ul>
                    </div>

                    {/* ========== TÉLÉPHONE ========== */}
                    <div>
                        <h3 className={titreColonne}>{t("Prendre rendez-vous")}</h3>
                        <div className="flex items-start gap-2.5">
                            <Phone className="mt-2 h-4 w-4 shrink-0 text-[#bfeaff]" />
                            <div className="font-titre text-xl font-extrabold leading-snug text-white">
                                <Editable id="footer.tel1" as="p" >034 06 759 28</Editable>
                                <Editable id="footer.tel2" as="p" >032 43 035 07</Editable>
                            </div>
                        </div>
                        <Link to="/prendre-rdv" className="mt-btn-blanc mt-6">{t("Prendre rendez-vous")}</Link>
                    </div>
                </div>

                {/* ========== COPYRIGHT ========== */}
                <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/20 pt-6 md:flex-row">
                    <p className="text-xs text-white/60">
                        © {new Date().getFullYear()} casafami - {t("Cabinet d'Accouchement Sainte Famille. Tous droits réservés.")}
                        <br />
                        <span>{t("Site conçu et réalisé par VONJIARIMANANA Alpha Bertholy")}</span>
                    </p>
                    {/* Le lien n'est montré qu'au personnel déjà connecté ; les autres accèdent à la connexion par son adresse (/medecin/login). */}
                    {hasSession() && (
                        <Link to="/medecin/login" className="whitespace-nowrap text-xs text-white/60 transition hover:text-white">
                            {t("🔐 Espace du personnel")}
                        </Link>
                    )}
                </div>
            </div>
        </footer>
    );
}

export default Footer;
