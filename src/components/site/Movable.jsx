import { createElement, useEffect, useState } from 'react';
import { Move } from 'lucide-react';
import { useSiteContent } from '../../context/SiteContentContext';

const DESKTOP = '(min-width: 768px)';
const STEP = 10;

function useDesktop() {
    const [desktop, setDesktop] = useState(() => (typeof window === 'undefined' ? true : window.matchMedia(DESKTOP).matches));
    useEffect(() => {
        const query = window.matchMedia(DESKTOP);
        const onChange = event => setDesktop(event.matches);
        query.addEventListener('change', onChange);
        return () => query.removeEventListener('change', onChange);
    }, []);
    return desktop;
}

/**
 * Élément (bouton, lien, bloc) que le super administrateur peut placer où il veut.
 * `as` est la balise ou le composant à rendre (ex. as={Link} to="/prendre-rdv") : l'élément reçoit un décalage
 * en pixels par rapport à sa place d'origine. Le décalage n'est appliqué que sur grand écran (≥ 768 px), pour ne jamais
 * casser la présentation sur téléphone. En mode édition, une poignée ✥ apparaît : la faire glisser (ou la piloter avec les
 * flèches du clavier, Maj pour 1 px) ; un double-clic remet l'élément à sa place d'origine.
 */
export default function Movable({ id, as = 'div', className, style, children, ...rest }) {
    const { content, editMode, save } = useSiteContent();
    const desktop = useDesktop();
    const saved = content[id] || {};
    // Pendant un glissement : position de départ du pointeur, décalage de départ et décalage courant.
    const [drag, setDrag] = useState(null);

    const x = drag ? drag.x : saved.offsetX || 0;
    const y = drag ? drag.y : saved.offsetY || 0;
    const moved = (x !== 0 || y !== 0) && desktop;

    const baseStyle = {
        ...style,
        position: style?.position || 'relative',
        ...(moved ? { transform: `translate(${x}px, ${y}px)`, zIndex: 30 } : {}),
    };

    /** Ramène le décalage souhaité dans les limites de la page, pour ne jamais « perdre » un bouton hors de l'écran. */
    const clamp = (element, nx, ny) => {
        const rect = element.getBoundingClientRect();
        const left = rect.left - x;
        const right = rect.right - x;
        const top = rect.top + window.scrollY - y;
        const bottom = rect.bottom + window.scrollY - y;
        return [
            Math.round(Math.min(Math.max(nx, -left), document.documentElement.clientWidth - right)),
            Math.round(Math.min(Math.max(ny, -top), document.documentElement.scrollHeight - bottom)),
        ];
    };

    const start = event => {
        event.preventDefault(); event.stopPropagation();
        event.currentTarget.setPointerCapture(event.pointerId);
        setDrag({ startX: event.clientX, startY: event.clientY, baseX: x, baseY: y, x, y, element: event.currentTarget.parentElement });
    };
    const move = event => {
        const { clientX, clientY } = event;
        setDrag(current => {
            if (!current) return current;
            const [nx, ny] = clamp(current.element, current.baseX + clientX - current.startX, current.baseY + clientY - current.startY);
            return { ...current, x: nx, y: ny };
        });
    };
    const end = () => {
        if (!drag) return;
        const final = drag;
        setDrag(null);
        if (final.x !== (saved.offsetX || 0) || final.y !== (saved.offsetY || 0)) save(id, { offsetX: final.x, offsetY: final.y });
    };
    const keyboard = event => {
        const delta = event.shiftKey ? 1 : STEP;
        const moves = { ArrowLeft: [-delta, 0], ArrowRight: [delta, 0], ArrowUp: [0, -delta], ArrowDown: [0, delta] };
        if (!moves[event.key]) return;
        event.preventDefault(); event.stopPropagation();
        const [nx, ny] = clamp(event.currentTarget.parentElement, x + moves[event.key][0], y + moves[event.key][1]);
        save(id, { offsetX: nx, offsetY: ny });
    };

    const handle = editMode && desktop ? createElement('span', {
        key: 'handle',
        role: 'button',
        tabIndex: 0,
        title: 'Glisser pour déplacer · flèches du clavier · double-clic pour remettre à sa place',
        'aria-label': 'Déplacer cet élément',
        className: 'absolute -left-3 -top-3 z-40 flex h-7 w-7 cursor-grab touch-none items-center justify-center rounded-full bg-amber-400 text-slate-900 shadow-lg ring-2 ring-white active:cursor-grabbing',
        onPointerDown: start,
        onPointerMove: move,
        onPointerUp: end,
        onPointerCancel: end,
        onKeyDown: keyboard,
        onClick: event => { event.preventDefault(); event.stopPropagation(); },
        onDoubleClick: event => { event.preventDefault(); event.stopPropagation(); save(id, { offsetX: 0, offsetY: 0 }); },
    }, createElement(Move, { size: 14 })) : null;

    // Un lien (<a>) n'est pas éditable de façon fiable : en mode édition on le remplace par un <span> identique visuellement,
    // ce qui permet aussi de modifier le texte du bouton sans suivre le lien.
    const linkLike = editMode && typeof as !== 'string';
    const { to: _to, ...restWithoutTo } = rest; // eslint-disable-line no-unused-vars

    return createElement(linkLike ? 'span' : as, {
        ...(linkLike ? restWithoutTo : rest),
        className: `${className || ''}${editMode && desktop ? ' outline-dashed outline-2 outline-offset-4 outline-amber-400' : ''}`,
        style: baseStyle,
        // en mode édition, un clic ne doit pas suivre le lien : on modifie, on ne navigue pas
        onClick: editMode ? event => { event.preventDefault(); } : rest.onClick,
    }, handle, children);
}
