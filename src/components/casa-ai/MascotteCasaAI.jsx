/**
 * Robot CASA'AI (robot-casafami-salue.svg) : le petit robot bleu et blanc de casafami. Il salue de la main, balance la tête, cligne des yeux,
 * fait un clin d'œil de temps en temps et sourit grand ; son ampoule s'allume et s'éteint. Les animations sont dans index.css (.casaai-r-*) ;
 * avec « fixe », le robot ne bouge pas (en-tête du panneau de discussion).
 */
export default function MascotteCasaAI({ className = '', fixe = false }) {
    return (
        <svg viewBox="0 0 200 200" className={`${className} ${fixe ? 'casaai-r-fixe' : ''}`} aria-hidden="true" focusable="false">
            <g className="casaai-r-corps">
                <g className="casaai-r-tete">
                    <line x1="100" y1="30" x2="100" y2="16" stroke="#1F5FBF" strokeWidth="5" strokeLinecap="round" />
                    <circle className="casaai-r-ampoule" cx="100" cy="13" r="7" fill="#4FA8F0" />
                    <path d="M62 56 L100 28 L138 56" fill="none" stroke="#1F5FBF" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
                    <rect x="64" y="50" width="72" height="56" rx="20" fill="#FFFFFF" stroke="#1F5FBF" strokeWidth="5" />
                    {/* joues */}
                    <circle cx="75" cy="88" r="6.500" fill="#FF8A80" opacity=".55" />
                    <circle cx="125" cy="88" r="6.500" fill="#FF8A80" opacity=".55" />
                    {/* œil gauche */}
                    <g className="casaai-r-oeil">
                        <ellipse cx="86" cy="76" rx="8" ry="8" fill="#1F5FBF" />
                        <circle cx="88.500" cy="73" r="2.600" fill="#FFFFFF" />
                    </g>
                    {/* œil droit : se ferme pour le clin d'œil, remplacé par un petit arc joyeux */}
                    <g className="casaai-r-oeil casaai-r-oeil-droit">
                        <ellipse cx="114" cy="76" rx="8" ry="8" fill="#1F5FBF" />
                        <circle cx="116.500" cy="73" r="2.600" fill="#FFFFFF" />
                    </g>
                    <path className="casaai-r-clin" d="M105.500 77 Q114 68 122.500 77" fill="none" stroke="#1F5FBF" strokeWidth="4.500" strokeLinecap="round" />
                    {/* grand sourire */}
                    <path d="M88 90 Q100 106 112 90 Z" fill="#1F5FBF" stroke="#1F5FBF" strokeWidth="2.500" strokeLinejoin="round" />
                    <path d="M93 96.500 Q100 103 107 96.500 Q100 93.500 93 96.500 Z" fill="#4FA8F0" />
                </g>
                <rect x="68" y="112" width="64" height="52" rx="16" fill="#FFFFFF" stroke="#1F5FBF" strokeWidth="5" />
                <path d="M88 146 V132 L100 122 L112 132 V146 Z" fill="#1F5FBF" />
                <g className="casaai-r-bras">
                    <path d="M68 124 Q48 122 42 102" fill="none" stroke="#1F5FBF" strokeWidth="9" strokeLinecap="round" />
                    <circle cx="40" cy="96" r="8" fill="#4FA8F0" />
                </g>
                <path d="M132 124 Q148 136 148 152" fill="none" stroke="#1F5FBF" strokeWidth="9" strokeLinecap="round" />
                <rect x="78" y="166" width="14" height="18" rx="6" fill="#1F5FBF" />
                <rect x="108" y="166" width="14" height="18" rx="6" fill="#1F5FBF" />
            </g>
            {/* étincelle de joie, qui scintille au moment du clin d'œil */}
            <path className="casaai-r-etincelle" d="M156 52l2.600 7.400 7.400 2.600-7.400 2.600-2.600 7.400-2.600-7.400-7.400-2.600 7.400-2.600z" fill="#4FA8F0" />
        </svg>
    );
}
