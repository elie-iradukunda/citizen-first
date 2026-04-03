import { Outlet } from 'react-router-dom';
import Footer from '../Footer';
import Navbar from '../Navbar';

function PublicLayout() {
  return (
    <div className="min-h-screen bg-mist">
      <Navbar />
      <main>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export default PublicLayout;
