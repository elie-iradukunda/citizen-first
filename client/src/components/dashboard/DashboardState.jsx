function DashboardState({ title, description, action }) {
  return (
    <div className="rounded-[1.8rem] border border-ink/10 bg-white p-10 text-center shadow-soft">
      <p className="font-display text-3xl font-black text-ink">{title}</p>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate">{description}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}

export default DashboardState;
