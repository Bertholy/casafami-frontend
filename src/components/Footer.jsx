import { Link } from 'react-router-dom';
import {
    MapPin,
    Phone,
    Mail,
    Clock,
    Share2,
    MessageCircle,
    Heart,
} from 'lucide-react';


function Footer() {
    return (
        <footer className="bg-gray-900 dark:bg-gray-950 text-gray-300 transition-colors">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">

                    {/* ========== COLONNE 1 : LOGO + DESCRIPTION ========== */}
                    <div>
                        <img
                            src="/logo_casafami.png"
                            alt="casafami"
                            className="h-20 w-auto mb-4 bg-white rounded-lg p-2"
                        />
                        <p className="text-sm leading-relaxed mb-4 text-gray-400">
                            Cabinet d'Accouchement SAinte Famille.
                            Votre santé et celle de votre famille, notre priorité.
                        </p>
                        {/* Réseaux sociaux */}
                        <div className="flex gap-3">
    <a
        href="#"
        className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-teal-600 transition"
        aria-label="Partager"
    >
        <Share2 className="w-5 h-5" />
    </a>
    <a
        href="#"
        className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-teal-600 transition"
        aria-label="Contacter"
    >
        <MessageCircle className="w-5 h-5" />
    </a>
</div>
                    </div>

                    {/* ========== COLONNE 2 : LIENS RAPIDES ========== */}
                    <div>
                        <h3 className="text-white font-bold text-lg mb-4">
                            Liens rapides
                        </h3>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <Link to="/" className="hover:text-teal-400 transition">
                                    Accueil
                                </Link>
                            </li>
                            <li>
                                <Link to="/services" className="hover:text-teal-400 transition">
                                    Nos services
                                </Link>
                            </li>
                           

                             
                            <li>
                                <Link to="/prendre-rdv" className="hover:text-teal-400 transition">
                                    Prendre RDV
                                </Link>
                            </li>
                            <li>
                                <Link to="/mes-rdv" className="hover:text-teal-400 transition">
                                    Mes RDV
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* ========== COLONNE 3 : HORAIRES ========== */}
                    <div>
                        <h3 className="text-white font-bold text-lg mb-4">
                            Horaires
                        </h3>
                        <ul className="space-y-3 text-sm">
                            <li className="flex items-start gap-2">
                                <Clock className="w-4 h-4 text-teal-400 flex-shrink-0 mt-1" />
                                <div>
                                    <p className="font-semibold text-white">Lundi - Vendredi</p>
                                    <p className="text-gray-400">08h00 - 17h00</p>
                                </div>
                            </li>
                            <li className="flex items-start gap-2">
                                <Clock className="w-4 h-4 text-teal-400 flex-shrink-0 mt-1" />
                                <div>
                                    <p className="font-semibold text-white">Samedi</p>
                                    <p className="text-gray-400">Sur rendez-vous</p>
                                </div>
                            </li>
                            <li className="flex items-start gap-2">
                                <Heart className="w-4 h-4 text-red-400 flex-shrink-0 mt-1" />
                                <div>
                                    <p className="font-semibold text-white">Urgences</p>
                                    <p className="text-gray-400">24h/24 - 7j/7</p>
                                </div>
                            </li>
                        </ul>
                    </div>

                    {/* ========== COLONNE 4 : CONTACT ========== */}
                    <div>
                        <h3 className="text-white font-bold text-lg mb-4">
                            Contact
                        </h3>
                        <ul className="space-y-3 text-sm">
                            <li className="flex items-start gap-2">
                                <MapPin className="w-4 h-4 text-teal-400 flex-shrink-0 mt-1" />
                                <div>
                                    <p className="text-white">Chez Rasazy VERO</p>
                                    <p className="text-gray-400">Andongona - Antsohihy</p>
                                    <p className="text-gray-400">Madagascar</p>
                                </div>
                            </li>
                            <li className="flex items-start gap-2">
                                <Phone className="w-4 h-4 text-teal-400 flex-shrink-0 mt-1" />
                                <div>
                                    <p className="text-white">034 06 759 28</p>
                                    <p className="text-white">032 43 035 07</p>
                                </div>
                            </li>
                            <li className="flex items-start gap-2">
                                <Mail className="w-4 h-4 text-teal-400 flex-shrink-0 mt-1" />
                                <p className="text-white">contact@casafami.mg</p>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* ========== LIGNE DE SÉPARATION + COPYRIGHT ========== */}
                <div className="border-t border-gray-800 mt-10 pt-6">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="text-sm text-gray-400">
                            © 2026 <strong className="text-white">casafami</strong> - Cabinet d'Accouchement SAinte Famille. Tous droits réservés.
                        </p>
                        <Link
                            to="/medecin/login"
                            className="text-xs text-gray-500 hover:text-teal-400 transition"
                        >
                            🔐 Espace médecin
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}

export default Footer;