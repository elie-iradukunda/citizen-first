function StatCard({ label, value, note }) {
  return (
    <article className="rounded-[1.6rem] border border-ink/10 bg-white p-5 shadow-soft">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate">{label}</p>
      <p className="mt-3 font-display text-4xl font-black text-ink">{value}</p>
      <p className="mt-3 text-sm leading-6 text-slate">{note}</p>
    </article>
  );
}

export default StatCard;
