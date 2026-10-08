import { useState } from "react";
import { NavLink } from "react-router-dom";
import { Menu, X, Radar } from "lucide-react";

const LINKS = [
  { to: "/overview", label: "Overview" },
  { to: "/explorer", label: "Customer Explorer" },
  { to: "/risk", label: "Risk Analysis" },
  { to: "/retention", label: "Retention Actions" },
  { to: "/model-intelligence", label: "Model Intelligence" },
  { to: "/about", label: "About" },
];

export default function Nav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-espresso/10 bg-parchment-light/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <NavLink to="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
          <Radar className="h-6 w-6 text-terracotta" strokeWidth={1.75} aria-hidden />
          <span className="font-display text-xl font-medium tracking-tight text-espresso">
            OrbitHold
          </span>
        </NavLink>

        <nav className="hidden items-center gap-6 lg:flex" aria-label="Primary">
          {LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `text-sm font-medium tracking-wide transition-colors ${
                  isActive ? "text-terracotta" : "text-espresso/70 hover:text-espresso"
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden lg:block">
          <NavLink to="/explorer" className="btn-primary">
            Analyze Customer
          </NavLink>
        </div>

        <button
          type="button"
          className="inline-flex items-center justify-center rounded-md p-2 text-espresso lg:hidden"
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <nav
          className="border-t border-espresso/10 bg-parchment-light px-4 py-3 lg:hidden"
          aria-label="Mobile"
        >
          <ul className="flex flex-col gap-1">
            {LINKS.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `block rounded-md px-3 py-2 text-sm font-medium ${
                      isActive ? "bg-terracotta/10 text-terracotta" : "text-espresso/80"
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              </li>
            ))}
            <li className="pt-2">
              <NavLink to="/explorer" onClick={() => setOpen(false)} className="btn-primary w-full">
                Analyze Customer
              </NavLink>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
