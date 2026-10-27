import { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, ImageUp, Loader2, ScanLine, X } from 'lucide-react';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from './ui/dialog';
import { extraireCle } from '../utils/suivi';

let moduleJsQr;
/** Lit un QR code dans une image (pixels) : l'API du navigateur quand elle existe, sinon la bibliothèque jsQR (chargée à la demande). */
async function lireQr(source, detecteur) {
    if (detecteur) {
        try { const codes = await detecteur.detect(source); if (codes[0]?.rawValue) return codes[0].rawValue; } catch { /* image pas encore prête */ }
        return null;
    }
    const largeur = source.videoWidth || source.naturalWidth || source.width;
    const hauteur = source.videoHeight || source.naturalHeight || source.height;
    if (!largeur || !hauteur) return null;
    const echelle = Math.min(1, 900 / Math.max(largeur, hauteur));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(largeur * echelle); canvas.height = Math.round(hauteur * echelle);
    const contexte = canvas.getContext('2d', { willReadFrequently: true });
    contexte.drawImage(source, 0, 0, canvas.width, canvas.height);
    const { data } = contexte.getImageData(0, 0, canvas.width, canvas.height);
    moduleJsQr ??= import('jsqr');
    const { default: jsQR } = await moduleJsQr;
    return jsQR(data, canvas.width, canvas.height)?.data || null;
}

/**
 * Lecteur de QR code (clé de suivi d'un rendez-vous) : caméra en direct, ou photo du QR code si la caméra n'est pas disponible.
 * `onCle(cle)` reçoit la clé (« CF-7K3M-9QX2 ») ; la fenêtre se ferme toute seule.
 * La caméra exige une page en HTTPS (ou localhost) : sinon on propose la photo.
 */
export default function QrScanner({ open, onOpenChange, onCle }) {
    const video = useRef(null);
    const fichier = useRef(null);
    const [etat, setEtat] = useState('demarrage');   // demarrage | scan | erreur
    const [message, setMessage] = useState('');            // état de la caméra
    const [retourPhoto, setRetourPhoto] = useState('');    // résultat de la photo envoyée : prioritaire sur l'état de la caméra

    const accepter = useCallback(texte => {
        const cle = extraireCle(texte);
        if (!cle) return false;
        onOpenChange(false);
        onCle(cle);
        return true;
    }, [onCle, onOpenChange]);

    useEffect(() => {
        if (!open) return undefined;
        let arret = false;
        let flux = null;
        let minuteur = 0;
        const demarrer = async () => {
            setEtat('demarrage'); setMessage(''); setRetourPhoto('');
            if (!navigator.mediaDevices?.getUserMedia) {
                setEtat('erreur'); setMessage('La caméra n’est pas disponible ici (la page doit être ouverte en HTTPS). Vous pouvez envoyer une photo du QR code.');
                return;
            }
            try {
                flux = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
            } catch (erreur) {
                setEtat('erreur');
                setMessage(erreur?.name === 'NotAllowedError' ? 'L’accès à la caméra est refusé. Autorisez-le dans le navigateur, ou envoyez une photo du QR code.' : 'Aucune caméra utilisable. Vous pouvez envoyer une photo du QR code.');
                return;
            }
            if (arret) { flux.getTracks().forEach(piste => piste.stop()); return; }
            const lecteur = video.current;
            lecteur.srcObject = flux;
            await lecteur.play().catch(() => {});
            setEtat('scan');
            const detecteur = 'BarcodeDetector' in window ? new window.BarcodeDetector({ formats: ['qr_code'] }) : null;
            let dernierRefus = '';
            const boucle = async () => {
                if (arret) return;
                const texte = await lireQr(lecteur, detecteur);
                if (arret) return;
                if (texte) {
                    if (accepter(texte)) return;
                    if (texte !== dernierRefus) { dernierRefus = texte; setMessage('Ce QR code n’est pas une clé de suivi du cabinet.'); setRetourPhoto(''); }
                }
                minuteur = window.setTimeout(boucle, 150);
            };
            boucle();
        };
        demarrer();
        return () => {
            arret = true;
            window.clearTimeout(minuteur);
            flux?.getTracks().forEach(piste => piste.stop());
        };
    }, [open, accepter]);

    const surPhoto = async event => {
        const photo = event.target.files?.[0];
        event.target.value = '';
        if (!photo) return;
        setRetourPhoto('Lecture de la photo…');
        const url = URL.createObjectURL(photo);
        try {
            const image = new Image();
            await new Promise((resolve, reject) => { image.onload = resolve; image.onerror = reject; image.src = url; });
            const detecteur = 'BarcodeDetector' in window ? new window.BarcodeDetector({ formats: ['qr_code'] }) : null;
            const texte = (await lireQr(image, detecteur)) || (detecteur ? await lireQr(image, null) : null);
            if (!texte) setRetourPhoto('Aucun QR code lisible sur cette photo. Rapprochez-vous et évitez les reflets.');
            else if (!accepter(texte)) setRetourPhoto('Ce QR code n’est pas une clé de suivi du cabinet.');
        } catch { setRetourPhoto('Cette image n’a pas pu être lue.'); }
        finally { URL.revokeObjectURL(url); }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent aria-describedby="scan-desc" className="top-[6vh] max-w-md">
                <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
                    <DialogTitle className="flex items-center gap-2 text-base font-semibold"><ScanLine size={18} aria-hidden="true" />Scanner un QR code</DialogTitle>
                    <DialogClose aria-label="Fermer" className="rounded-md p-1 text-muted-foreground transition hover:bg-secondary hover:text-foreground"><X size={18} /></DialogClose>
                </div>
                <DialogDescription id="scan-desc" className="sr-only">Placez le QR code du rendez-vous devant la caméra.</DialogDescription>

                <div className="space-y-3 p-4">
                    <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-black">
                        <video ref={video} muted playsInline className={`h-full w-full object-cover ${etat === 'scan' ? '' : 'invisible'}`} />
                        {etat === 'scan' && (
                            <div className="pointer-events-none absolute inset-[14%] rounded-xl border-2 border-white/90 shadow-[0_0_0_999px_rgba(0,0,0,.45)]" aria-hidden="true">
                                <span className="absolute inset-x-2 top-1/2 h-0.5 animate-pulse bg-(--mt-main,#03cce6)" />
                            </div>
                        )}
                        {etat === 'demarrage' && <div className="absolute inset-0 flex items-center justify-center gap-2 text-sm text-white"><Loader2 size={18} className="animate-spin" />Ouverture de la caméra…</div>}
                        {etat === 'erreur' && <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-center text-sm text-white"><Camera size={28} aria-hidden="true" /></div>}
                    </div>
                    <p role="status" className={`min-h-5 text-center text-sm ${(retourPhoto && !retourPhoto.startsWith('Lecture')) || message.includes('n’est pas') || (etat === 'erreur' && !retourPhoto) ? 'text-rose-500' : 'text-muted-foreground'}`}>
                        {retourPhoto || message || (etat === 'scan' ? 'Placez le QR code dans le cadre.' : '')}
                    </p>
                    <input ref={fichier} type="file" accept="image/*" className="hidden" onChange={surPhoto} />
                    <button type="button" onClick={() => fichier.current?.click()} className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-secondary px-3 py-2.5 text-sm font-semibold text-secondary-foreground transition hover:bg-accent">
                        <ImageUp size={16} aria-hidden="true" />Envoyer une photo du QR code
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
