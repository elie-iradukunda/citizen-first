import { Link } from 'react-router-dom';

function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white text-slate-600">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-6 text-sm md:flex-row md:items-center md:justify-between lg:px-8">
        <div>
          <p className="text-lg font-black uppercase tracking-[0.08em] text-slate-900">SACCFP</p>
          <p className="mt-1 text-slate-500">QR service scan, citizen account, evidence reporting, and RIB follow-up.</p>
        </div>
        <div className="flex flex-wrap gap-4 font-semibold text-slate-600">
          <Link to="/register/citizen" className="hover:text-brand-600">Create Account</Link>
          <Link to="/login?redirect=%2Fdashboard%2Fcitizen%2Fscan-services" className="hover:text-brand-600">Login</Link>
          <a href="mailto:support@saccfp.rw" className="hover:text-brand-600">support@saccfp.rw</a>
          <span className="text-brand-600">997</span>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
