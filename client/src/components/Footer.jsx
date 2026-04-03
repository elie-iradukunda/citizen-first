import { Link } from 'react-router-dom';

function Footer() {
  return (
    <footer className="mt-12 bg-ink text-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-6 py-12 lg:grid-cols-[1.25fr_1fr_1fr] lg:px-8">
        <div>
          <p className="font-display text-2xl font-black uppercase tracking-[0.06em]">Citizen First</p>
          <p className="mt-4 max-w-md text-sm leading-7 text-white/80">
            Public-centered digital platform for service guidance, anti-corruption reporting, and transparent case tracking across local institutions.
          </p>
          <p className="mt-4 text-sm font-semibold text-gold">Emergency 112 • Anti-Corruption 997</p>
        </div>

        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-gold">Public Pages</p>
          <div className="mt-4 grid gap-2 text-sm text-white/85">
            <Link to="/">Home</Link>
            <Link to="/governance-structure">Governance Structure</Link>
            <Link to="/services">Services</Link>
            <Link to="/emergency">Emergency</Link>
            <Link to="/assistant">AI Assistant</Link>
          </div>
        </div>

        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-gold">Citizen Tools</p>
          <div className="mt-4 grid gap-2 text-sm text-white/85">
            <Link to="/register/citizen">Citizen Registration</Link>
            <Link to="/register/invite">Institution Invite</Link>
            <Link to="/register/institution">Institution Registration</Link>
            <Link to="/report">Submit Complaint</Link>
            <Link to="/track">Track Complaint</Link>
            <Link to="/dashboards">Dashboards</Link>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-white/60">
        Citizen First Platform • Built for transparent and accountable service delivery
      </div>
    </footer>
  );
}

export default Footer;
