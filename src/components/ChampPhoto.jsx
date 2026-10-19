import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { LIBELLE_CONVENTION, convertirPhoto } from '../utils/image';

/**
 * Champ « photo » du personnel. Dès qu'une photo est choisie, elle est convertie (JPEG, 1600 px au plus) et le résultat
 * s'affiche juste en dessous : vignette, format et dimensions avant / après, ou le message d'erreur.
 * Le fichier converti est remis au parent par onConvertie ; il reçoit null si la photo n'a pas pu être convertie, pour ne
 * jamais envoyer une ancienne photo à la place de celle qui vient d'être refusée. onEnCours permet au parent de bloquer
 * l'envoi pendant la conversion.
 */
export default function ChampPhoto({ id, onConvertie, onEnCours, disabled = false }) {
    const [etat, setEtat] = useState({ enCours: false, erreur: '', resume: '', apercu: '' });

    // l'adresse temporaire de la vignette est libérée dès qu'elle est remplacée ou que le champ disparaît
    useEffect(() => () => { if (etat.apercu) URL.revokeObjectURL(etat.apercu); }, [etat.apercu]);
    // un champ fermé (fenêtre refermée) ne doit jamais laisser le formulaire bloqué pendant une conversion
    useEffect(() => () => { onEnCours?.(false); }, [onEnCours]);

    const choisir = async event => {
        const fichier = event.target.files?.[0];
        event.target.value = '';
        if (!fichier) return;
        setEtat({ enCours: true, erreur: '', resume: '', apercu: '' });
        onEnCours?.(true);
        try {
            const photo = await convertirPhoto(fichier);
            setEtat({ enCours: false, erreur: '', resume: photo.resume, apercu: URL.createObjectURL(photo.fichier) });
            onEnCours?.(false);
            onConvertie?.(photo.fichier);
        } catch (err) {
            setEtat({ enCours: false, erreur: err.message, resume: '', apercu: '' });
            onEnCours?.(false);
            onConvertie?.(null);
        }
    };

    return (
        <div className="min-w-0 space-y-2">
            <input id={id} type="file" accept="image/*" disabled={disabled || etat.enCours} onChange={choisir}
                className="block w-full text-xs file:mr-3 file:rounded-lg file:border-0 file:bg-teal-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-teal-800 hover:file:bg-teal-100 disabled:opacity-60 dark:file:bg-teal-500/15 dark:file:text-teal-200" />
            <p className="text-xs text-slate-500 dark:text-gray-400">{LIBELLE_CONVENTION}</p>
            {etat.enCours && (
                <p role="status" className="flex items-center gap-2 text-xs text-slate-600 dark:text-gray-300">
                    <Loader2 size={14} className="animate-spin" aria-hidden="true" />Conversion de la photo en JPEG…
                </p>
            )}
            {etat.apercu && (
                <div className="flex items-center gap-3 rounded-xl bg-emerald-50 p-2 dark:bg-emerald-500/10">
                    <img src={etat.apercu} alt="Aperçu de la photo convertie" className="h-14 w-20 shrink-0 rounded-lg object-cover" />
                    <p role="status" className="flex min-w-0 items-start gap-2 text-xs text-emerald-800 dark:text-emerald-200">
                        <CheckCircle2 size={15} className="mt-px shrink-0" aria-hidden="true" />{etat.resume}
                    </p>
                </div>
            )}
            {etat.erreur && (
                <p role="alert" className="flex items-start gap-2 text-xs text-rose-700 dark:text-rose-300">
                    <AlertCircle size={15} className="mt-px shrink-0" aria-hidden="true" />{etat.erreur}
                </p>
            )}
        </div>
    );
}
