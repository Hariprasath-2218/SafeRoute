import { useState } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar.jsx";
import Sidebar from "./Sidebar.jsx";
import Footer from "./Footer.jsx";

/**
 * Authenticated application chrome: collapsible sidebar, top navbar, routed outlet.
 */
export default function AppShell() {
  const [mobileSidebar, setMobileSidebar] = useState(false);

  return (
    <div className="flex min-h-screen bg-bg-primary">
      <Sidebar mobileOpen={mobileSidebar} onClose={() => setMobileSidebar(false)} />
      <div className="flex min-h-screen flex-1 flex-col">
        <Navbar onMenuClick={() => setMobileSidebar(true)} />
        <main className="flex-1 overflow-auto p-4 lg:p-8">
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  );
}
