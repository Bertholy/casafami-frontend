import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

function ScrollToTop() {
    const { pathname } = useLocation();

    useEffect(() => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'  // Défilement fluide
        });
    }, [pathname]);

    return null;  // Ce composant n'affiche rien
}

export default ScrollToTop;