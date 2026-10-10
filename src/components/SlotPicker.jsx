export default function SlotPicker({ slots, selected, onSelect }) {
    if (!slots.length) return <p className="rounded-lg bg-amber-50 p-3 text-center text-sm text-amber-800">Aucun créneau disponible pour cette date (cabinet fermé ou tout est réservé). Choisissez une autre date.</p>;
    return <div role="group" aria-label={`${slots.length} créneau${slots.length > 1 ? 'x' : ''} disponible${slots.length > 1 ? 's' : ''}`} className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
        {slots.map(value => {
            const hour = String(value).slice(0, 5);
            return <button key={hour} type="button" aria-pressed={selected === hour} onClick={() => onSelect(hour)} className={`rounded-xl px-3 py-2.5 text-sm font-semibold transition ${selected === hour ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-700 hover:bg-teal-100 dark:bg-gray-800 dark:text-gray-200'}`}>{hour}</button>;
        })}
    </div>;
}
