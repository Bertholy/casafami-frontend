import { useState } from 'react';
import { ChevronDown, FileDown, Image as ImageIcon, Loader2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { downloadReceiptImage, downloadReceiptPdf } from '../utils/receipt';
import { useLang } from '../i18n/LangContext';

/**
 * Un seul bouton « Télécharger » pour le reçu d'un rendez-vous : un petit menu propose le PDF ou l'image (même document dans les deux cas).
 * `onErreur(message)` reçoit le message à afficher quand le téléchargement échoue ; `onDebut()` efface l'erreur précédente.
 * Avec `icone`, seul le pictogramme est affiché (lignes de tableau du personnel). `className` règle l'apparence du bouton.
 */
export default function BoutonTelecharger({ rdv, onErreur, onDebut, icone = false, className = '' }) {
    const { t } = useLang();
    const [enCours, setEnCours] = useState(false);

    const lancer = async (telecharger, messageParDefaut) => {
        onDebut?.();
        setEnCours(true);
        try { await telecharger(rdv); }
        catch (erreur) {
            console.error('Téléchargement du reçu impossible', erreur);
            onErreur?.(erreur.message || messageParDefaut);
        } finally { setEnCours(false); }
    };

    const libelle = t("Télécharger");
    return (
        <DropdownMenu>
            <DropdownMenuTrigger disabled={enCours} title={icone ? libelle : undefined} aria-label={icone ? libelle : undefined} className={`inline-flex items-center justify-center gap-2 transition disabled:opacity-60 ${className}`}>
                {enCours ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
                {!icone && <>{libelle}<ChevronDown className="h-4 w-4" /></>}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-44">
                <DropdownMenuItem onSelect={() => lancer(downloadReceiptPdf, t("Le téléchargement du reçu a échoué."))}><FileDown className="h-4 w-4" />{t("Document PDF")}</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => lancer(downloadReceiptImage, t("Le téléchargement de l’image a échoué."))}><ImageIcon className="h-4 w-4" />{t("Image")}</DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
