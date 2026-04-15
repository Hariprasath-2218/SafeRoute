import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  MapPin,
  Route,
  History,
  Bot,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import { useState } from "react";

const items = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/map", label: "Map prediction", icon: MapPin },
  { to: "/route", label: "Route risk", icon: Route },
  { to: "/history", label: "History", icon: History },
  { to: "/ai", label: "AI", icon: Bot },
  { to: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar({ mobileOpen, onClose }) {
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const overlay = mobileOpen ? (
    <button
      type="button"
      className="fixed inset-0 z-[880] bg-black/60 lg:hidden"
      aria-label="Close menu"
      onClick={onClose}
    />
  ) : null;

  const widthClass = collapsed ? "lg:w-20" : "lg:w-72";

  return (
    <>
      {overlay}
      <aside
        className={`fixed inset-y-0 left-0 z-[900] flex ${widthClass} w-72 flex-col border-r border-border bg-bg-secondary transition-transform lg:static lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          {!collapsed && (
            <span className="font-display text-sm font-semibold text-txt-primary">
              Workspace
            </span>
          )}
          <button
            type="button"
            className="ml-auto hidden rounded-lg border border-border p-1 text-txt-secondary lg:inline-flex"
            onClick={() => setCollapsed((c) => !c)}
            title="Toggle sidebar"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {items.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? "bg-bg-card text-txt-primary shadow-glass"
                    : "text-txt-secondary hover:bg-bg-card/60 hover:text-txt-primary"
                }`
              }
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-border p-4">
          {!collapsed ? (
            <div className="rounded-xl bg-bg-card/80 p-3">
              <p className="truncate text-sm font-medium text-txt-primary">
                {user?.full_name || "User"}
              </p>
              <p className="truncate text-xs text-txt-secondary">
                {user?.email}
              </p>
            </div>
          ) : (
            <div className="flex justify-center text-xs font-mono text-accent-primary">
              {(user?.full_name || "U").slice(0, 1)}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
