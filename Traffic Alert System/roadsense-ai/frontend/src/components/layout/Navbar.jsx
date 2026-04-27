import { Link, NavLink } from "react-router-dom";
import { Menu } from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";

const linkClass = ({ isActive }) =>
  `rounded-lg px-3 py-2 text-sm font-medium transition ${isActive ? "bg-bg-card text-txt-primary" : "text-txt-secondary hover:text-txt-primary"}`;

export default function Navbar({ onMenuClick }) {
  const { isAuthenticated, logout, user } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg-primary/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 lg:px-8">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="inline-flex rounded-lg border border-border p-2 text-txt-secondary lg:hidden"
            onClick={onMenuClick}
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Link to="/" className="flex items-center gap-3">
            <img
              src="/SafeRoute.png"
              alt=""
              className="h-9 w-9 rounded-xl border border-border object-cover shadow-lg"
            />
            <span className="flex flex-col leading-tight">
              <span className="font-display text-lg font-semibold tracking-tight text-txt-primary">
                Roadsense<span className="text-accent-primary"> AI</span>
              </span>
              <span className="text-[11px] text-txt-secondary">
                SafeRoute mobile
              </span>
            </span>
          </Link>
        </div>

        <nav className="hidden items-center gap-1 md:flex">
          <NavLink to="/" className={linkClass} end>
            Home
          </NavLink>
          {isAuthenticated && (
            <>
              <NavLink to="/dashboard" className={linkClass}>
                Dashboard
              </NavLink>
              <NavLink to="/map" className={linkClass}>
                Map predict
              </NavLink>
              <NavLink to="/route" className={linkClass}>
                Route
              </NavLink>
              <NavLink to="/history" className={linkClass}>
                History
              </NavLink>
              <NavLink to="/settings" className={linkClass}>
                Settings
              </NavLink>
            </>
          )}
        </nav>

        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <>
              <span className="hidden text-sm text-txt-secondary sm:inline">
                {user?.full_name}
              </span>
              <button
                type="button"
                onClick={logout}
                className="rounded-lg border border-border px-3 py-2 text-sm text-txt-secondary transition hover:border-accent-primary hover:text-txt-primary"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-lg px-3 py-2 text-sm font-medium text-txt-secondary hover:text-txt-primary"
              >
                Sign in
              </Link>
              <Link
                to="/signup"
                className="rounded-lg bg-accent-primary px-3 py-2 text-sm font-semibold text-white shadow-lg hover:bg-blue-500"
              >
                Get started
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
