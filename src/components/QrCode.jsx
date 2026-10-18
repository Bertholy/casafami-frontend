import { useEffect, useState } from 'react';
import { qrDataUrl } from '../utils/suivi';

export default function QrCode({ value, size = 160, label = 'QR code', className = '' }) {
    const [image, setImage] = useState({ value: '', src: '' });

    useEffect(() => {
        let annule = false;
        qrDataUrl(value, size * 2)
            .then(src => { if (!annule) setImage({ value, src }); })
            .catch(() => { if (!annule) setImage({ value, src: '' }); });
        return () => { annule = true; };
    }, [value, size]);

    if (image.value !== value || !image.src) return <div style={{ width: size, height: size }} className={`rounded-lg bg-slate-100 dark:bg-gray-700 ${className}`} aria-hidden="true" />;
    return <img src={image.src} width={size} height={size} alt={label} className={`rounded-lg bg-white p-1 ${className}`} />;
}
