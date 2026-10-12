import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import axiosClient from '../api/axiosClient';
import { peut } from '../utils/auth';
import { formatPhone } from '../utils/phone';

// Le personnel soignant ouvre le dossier du patient ; la secrétaire voit ses rendez-vous.

export default function PatientSearch({ className = 'relative z-30 mx-4 my-3 w-64' }) {
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const term = query.trim();
    const active = term.length >= 2;

    useEffect(() => {
        if (!active) return undefined;
        let cancelled = false;
        const timer = setTimeout(() => {
            axiosClient.get('/patients/recherche', { params: { q: term } })
                .then(({ data }) => { if (!cancelled) setResults(data); })
                .catch(() => { if (!cancelled) setResults([]); });
        }, 300);
        return () => { cancelled = true; clearTimeout(timer); };
    }, [term, active]);

    const open = patient => {
        navigate(peut('DOSSIERS_LIRE')
            ? `/patients/dossier?telephone=${encodeURIComponent(patient.telephone)}`
            : `/mes-rdv?q=${encodeURIComponent(patient.telephone)}`);
        setQuery('');
    };

    return (
        <div className={className}>
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Rechercher un patient"
                aria-label="Rechercher un patient par nom ou téléphone"
                className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 dark:border-gray-700 dark:bg-gray-900"
            />
            {active && (
                <div className="absolute right-0 top-full z-50 mt-1 max-h-96 w-[min(36rem,calc(100vw-2rem))] overflow-auto rounded-xl border border-slate-200 bg-white p-1 shadow-xl dark:border-gray-700 dark:bg-gray-900">
                    {results.length ? results.map((patient, index) => (
                        <button key={`${patient.telephone}-${index}`} onClick={() => open(patient)} className="flex w-full items-center justify-between gap-4 rounded-lg px-4 py-2.5 text-left hover:bg-teal-50 dark:hover:bg-gray-800">
                            <span className="min-w-0 truncate text-sm font-medium">{patient.nom}</span>
                            <span className="shrink-0 text-sm tabular-nums text-slate-500 dark:text-gray-400">{formatPhone(patient.telephone)}</span>
                        </button>
                    )) : <p className="px-3 py-2 text-sm text-slate-500">Aucun patient trouvé</p>}
                </div>
            )}
        </div>
    );
}
