import { Link } from 'react-router-dom';

function Footer() {
  return (
    <footer className="mt-12 bg-ink text-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-6 py-12 lg:grid-cols-[1.25fr_1fr_1fr] lg:px-8">
        <div>
          <p className="font-display text-2xl font-black uppercase tracking-[0.06em]">RIB Case Study Platform</p>
          <p className="mt-4 max-w-md text-sm leading-7 text-white/80">
            QR-enabled anti-corruption and citizen feedback platform for RIB case intake, evidence
            support, escalation, and transparent tracking.
          </p>
          <p className="mt-4 text-sm font-semibold text-gold">Emergency 112 - Anti-Corruption 997</p>
        </div>

        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-gold">Public Pages</p>
          <div className="mt-4 grid gap-2 text-sm text-white/85">
            <Link to="/">Home</Link>
            <Link to="/governance-structure">RIB Workflow</Link>
            <Link to="/services">RIB Services</Link>
            <Link to="/emergency">Hotlines</Link>
            <Link to="/assistant">AI Assistant</Link>
          </div>
        </div>

        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-gold">Citizen Tools</p>
          <div className="mt-4 grid gap-2 text-sm text-white/85">
            <Link to="/register/citizen">Citizen Registration</Link>
            <Link to="/register/invite">RIB Invite</Link>
            <Link to="/register/institution">RIB Institution Registration</Link>
            <Link to="/report">Submit RIB Report</Link>
            <Link to="/track">Track RIB Case</Link>
            <Link to="/dashboards">Dashboards</Link>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-white/60">
        Citizen First Platform - Built for RIB anti-corruption reporting and accountable feedback
      </div>
    </footer>
  );
}

export default Footer;
