function SectionCard({ title, subtitle, children, headerAction }) {
  return (
    <section className="rounded-[1.8rem] border border-ink/10 bg-white p-6 shadow-soft lg:p-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-black text-ink">{title}</h2>
          {subtitle ? <p className="mt-2 text-sm leading-6 text-slate">{subtitle}</p> : null}
        </div>
        {headerAction ? <div>{headerAction}</div> : null}
      </div>
      <div className="mt-6">{children}</div>
    </section>
  );
}

export default SectionCard;
