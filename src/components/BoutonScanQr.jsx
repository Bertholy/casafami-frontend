import { useState } from 'react';
import { ScanLine } from 'lucide-react';
import QrScanner from './QrScanner';

/** Bouton « Scanner un QR code » + fenêtre du lecteur. `onCle` reçoit la clé de suivi lue. Sans `children`, seule l'icône est affichée. */
export default function BoutonScanQr({ onCle, className = '', children, label = 'Scanner un QR code' }) {
    const [ouvert, setOuvert] = useState(false);
    return (
        <>
            <button type="button" onClick={() => setOuvert(true)} aria-label={children ? undefined : label} title={label} className={className}>
                <ScanLine size={children ? 16 : 17} aria-hidden="true" />{children}
            </button>
            {ouvert && <QrScanner open={ouvert} onOpenChange={setOuvert} onCle={onCle} />}
        </>
    );
}
