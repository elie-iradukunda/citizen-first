const statusClassMap = {
  resolved: 'bg-pine/15 text-pine',
  escalated: 'bg-clay/15 text-clay',
  in_review: 'bg-tide/15 text-tide',
  submitted: 'bg-gold/30 text-ink',
  high: 'bg-clay/15 text-clay',
  medium: 'bg-gold/30 text-ink',
  normal: 'bg-pine/15 text-pine',
};

function toTitleCase(value) {
  return value.replaceAll('_', ' ').replace(/\b\w/g, (character) => character.toUpperCase());
}

function StatusBadge({ value }) {
  const style = statusClassMap[value] ?? 'bg-slate/15 text-slate';

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] ${style}`}>
      {toTitleCase(value)}
    </span>
  );
}

export default StatusBadge;
