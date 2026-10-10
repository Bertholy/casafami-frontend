import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, Clock, Heart } from 'lucide-react';
import Editable from './site/Editable';
import { summarizeHours, traduireJours, usePlanning } from '../utils/horaires';
import { useLang } from '../i18n/LangContext';

function Footer() {
    const { t } = useLang();
    const planning = usePlanning();
    const horaires = summarizeHours(planning?.horaires);

    return (
        <footer className="bg-gray-900 dark:bg-gray-950 text-gray-300 transition-colors">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">

                    {/* ========== COLONNE 1 : LOGO + DESCRIPTION ========== */}
                    <div>
                        <img
                            src="/logo_casafami.png"
                            alt={t("casafami")}
                            className="h-20 w-auto mb-4 bg-white rounded-lg p-2"
                        />
                        <Editable id="footer.description" as="p" className="text-sm leading-relaxed mb-4 text-gray-400">
                            Cabinet d'Accouchement Sainte Famille. Votre santé et celle de votre famille, notre priorité.
                        </Editable>
                    </div>

                    {/* ========== COLONNE 2 : LIENS RAPIDES ========== */}
                    <div>
                        <Editable id="footer.liens.titre" as="h3" className="text-white font-bold text-lg mb-4">Liens rapides</Editable>
                        <ul className="space-y-2 text-sm">
                            <li><Link to="/" className="hover:text-teal-400 transition">{t("Accueil")}</Link></li>
                            <li><Link to="/services" className="hover:text-teal-400 transition">{t("Nos services")}</Link></li>
                            <li><Link to="/prendre-rdv" className="hover:text-teal-400 transition">{t("Prendre RDV")}</Link></li>
                            <li><Link to="/mes-rdv" className="hover:text-teal-400 transition">{t("Mes RDV")}</Link></li>
                        </ul>
                    </div>

                    {/* ========== COLONNE 3 : HORAIRES (issus du planning) ========== */}
                    <div>
                        <Editable id="footer.horaires.titre" as="h3" className="text-white font-bold text-lg mb-4">Horaires</Editable>
                        <ul className="space-y-3 text-sm">
                            {horaires.map(h => (
                                <li key={h.label} className="flex items-start gap-2">
                                    <Clock className="w-4 h-4 text-teal-400 shrink-0 mt-1" />
                                    <div>
                                        <p className="font-semibold text-white">{traduireJours(h.label, t)}</p>
                                        <p className="text-gray-400">{h.matin && h.apresMidi ? `${h.matin} · ${h.apresMidi}` : h.global}</p>
                                    </div>
                                </li>
                            ))}
                            <li className="flex items-start gap-2">
                                <Heart className="w-4 h-4 text-red-400 shrink-0 mt-1" />
                                <div>
                                    <Editable id="footer.urgences.titre" as="p" className="font-semibold text-white">Urgences</Editable>
                                    <Editable id="footer.urgences.texte" as="p" className="text-gray-400">24h/24 - 7j/7</Editable>
                                </div>
                            </li>
                        </ul>
                    </div>

                    {/* ========== COLONNE 4 : CONTACT ========== */}
                    <div>
                        <Editable id="footer.contact.titre" as="h3" className="text-white font-bold text-lg mb-4">Contact</Editable>
                        <ul className="space-y-3 text-sm">
                            <li className="flex items-start gap-2">
                                <MapPin className="w-4 h-4 text-teal-400 shrink-0 mt-1" />
                                <div>
                                    <Editable id="footer.adresse.ligne1" as="p" className="text-white">Chez Rasazy VERO</Editable>
                                    <Editable id="footer.adresse.ligne2" as="p" className="text-gray-400">Andongona - Antsohihy</Editable>
                                    <Editable id="footer.adresse.pays" as="p" className="text-gray-400">Madagascar</Editable>
                                </div>
                            </li>
                            <li className="flex items-start gap-2">
                                <Phone className="w-4 h-4 text-teal-400 shrink-0 mt-1" />
                                <div>
                                    <Editable id="footer.tel1" as="p" className="text-white">034 06 759 28</Editable>
                                    <Editable id="footer.tel2" as="p" className="text-white">032 43 035 07</Editable>
                                </div>
                            </li>
                            <li className="flex items-start gap-2">
                                <Mail className="w-4 h-4 text-teal-400 shrink-0 mt-1" />
                                <Editable id="footer.email" as="p" className="text-white">contact@casafami.mg</Editable>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* ========== LIGNE DE SÉPARATION + COPYRIGHT ========== */}
                <div className="border-t border-gray-800 mt-10 pt-6">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="text-sm text-gray-400">
                            © {new Date().getFullYear()} <strong className="text-white">casafami</strong> - {t("Cabinet d'Accouchement Sainte Famille. Tous droits réservés.")}
                            <br />
                            {t("Site conçu et réalisé par VONJIARIMANANA Alpha Bertholy")}
                        </p>
                        <Link
                            to="/medecin/login"
                            className="text-xs text-gray-500 hover:text-teal-400 transition whitespace-nowrap"
                        >
                            {t("🔐 Espace du personnel")}
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}

export default Footer;
