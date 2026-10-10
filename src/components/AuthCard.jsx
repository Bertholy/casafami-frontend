import { Link } from 'react-router-dom';
import { ArrowLeft, Stethoscope } from 'lucide-react';
import { APP_NAME } from '../constants/app';

export const authInput = 'w-full pl-11 pr-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:border-teal-500 focus:outline-none transition';
export const authButton = 'w-full bg-gradient-to-r from-teal-600 to-teal-700 text-white py-4 rounded-xl font-bold hover:from-teal-700 hover:to-teal-800 transition shadow-lg disabled:opacity-50 flex items-center justify-center gap-2';

/** Carte centrée des pages de connexion du personnel (mot de passe oublié, nouveau mot de passe). */
export default function AuthCard({ titre, sousTitre, children }) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-white to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12 px-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-teal-500 to-teal-700 rounded-2xl mb-4 shadow-xl">
                        <Stethoscope className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">{titre}</h1>
                    {sousTitre && <p className="text-gray-600 dark:text-gray-400 text-sm">{sousTitre}</p>}
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 border border-gray-100 dark:border-gray-700">{children}</div>
                <div className="mt-4 text-center">
                    <Link to="/medecin/login" className="inline-flex items-center gap-2 text-sm text-teal-700 hover:underline dark:text-teal-300"><ArrowLeft className="w-4 h-4" />Retour à la connexion {APP_NAME}</Link>
                </div>
            </div>
        </div>
    );
}
