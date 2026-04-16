function StatCard({ label, value, note, onClick, isActive = false }) {
  const className = `rounded-[1.6rem] border p-5 shadow-soft transition ${
    isActive
      ? 'border-tide bg-white ring-2 ring-tide/10'
      : 'border-ink/10 bg-white'
  } ${onClick ? 'cursor-pointer hover:-translate-y-0.5 hover:border-tide/30 hover:shadow-lg' : ''}`;

  const content = (
    <>
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate">{label}</p>
      <p className="mt-3 font-display text-4xl font-black text-ink">{value}</p>
      <p className="mt-3 text-sm leading-6 text-slate">{note}</p>
      {onClick ? (
        <p className="mt-4 text-xs font-bold uppercase tracking-[0.14em] text-tide">Open details</p>
      ) : null}
    </>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={`${className} text-left`}>
        {content}
      </button>
    );
  }

  return <article className={className}>{content}</article>;
}

export default StatCard;
