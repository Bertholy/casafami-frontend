// Petit son de transition (deux notes douces, moins d'une demi-seconde) joué quand on passe à l'assistant.
// Il est synthétisé : aucun fichier audio. À appeler pendant un clic ; si le navigateur n'a pas de son, il ne fait rien.
let contexte = null;

export function sonTransition() {
    try {
        const ContexteAudio = window.AudioContext || window.webkitAudioContext;
        if (!ContexteAudio) return;
        contexte = contexte || new ContexteAudio();
        if (contexte.state === 'suspended') contexte.resume();
        const debut = contexte.currentTime;
        // mi puis la, volume bas
        [[659.25, 0], [880, 0.11]].forEach(([frequence, decalage]) => {
            const oscillateur = contexte.createOscillator();
            const volume = contexte.createGain();
            oscillateur.type = 'sine';
            oscillateur.frequency.value = frequence;
            volume.gain.setValueAtTime(0.0001, debut + decalage);
            volume.gain.exponentialRampToValueAtTime(0.12, debut + decalage + 0.02);
            volume.gain.exponentialRampToValueAtTime(0.0001, debut + decalage + 0.28);
            oscillateur.connect(volume).connect(contexte.destination);
            oscillateur.start(debut + decalage);
            oscillateur.stop(debut + decalage + 0.3);
        });
    } catch {
        // son indisponible : la transition reste silencieuse
    }
}

// Son d'une nouvelle notification (deux notes montantes, un peu plus présentes que celui de la transition). Même principe : synthétisé, sans fichier audio.
export function sonNotification() {
    try {
        const ContexteAudio = window.AudioContext || window.webkitAudioContext;
        if (!ContexteAudio) return;
        contexte = contexte || new ContexteAudio();
        if (contexte.state === 'suspended') contexte.resume();
        const debut = contexte.currentTime;
        [[880, 0], [1174.66, 0.14]].forEach(([frequence, decalage]) => {
            const oscillateur = contexte.createOscillator();
            const volume = contexte.createGain();
            oscillateur.type = 'sine';
            oscillateur.frequency.value = frequence;
            volume.gain.setValueAtTime(0.0001, debut + decalage);
            volume.gain.exponentialRampToValueAtTime(0.2, debut + decalage + 0.02);
            volume.gain.exponentialRampToValueAtTime(0.0001, debut + decalage + 0.4);
            oscillateur.connect(volume).connect(contexte.destination);
            oscillateur.start(debut + decalage);
            oscillateur.stop(debut + decalage + 0.42);
        });
    } catch {
        // son indisponible : la notification reste silencieuse
    }
}
