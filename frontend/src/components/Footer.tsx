import { NavLink } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="border-t border-espresso/10 bg-parchment-light">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          <div>
            <div className="font-display text-lg text-espresso">OrbitHold</div>
            <p className="mt-2 max-w-xs text-sm text-espresso/60">
              Customer intelligence for retention teams.
            </p>
          </div>
          <div>
            <div className="label-tag text-espresso/50">Product</div>
            <ul className="mt-3 space-y-2 text-sm text-espresso/70">
              <li><NavLink to="/overview" className="hover:text-terracotta">Overview</NavLink></li>
              <li><NavLink to="/explorer" className="hover:text-terracotta">Customer Explorer</NavLink></li>
              <li><NavLink to="/retention" className="hover:text-terracotta">Retention Actions</NavLink></li>
            </ul>
          </div>
          <div>
            <div className="label-tag text-espresso/50">Intelligence</div>
            <ul className="mt-3 space-y-2 text-sm text-espresso/70">
              <li><NavLink to="/model-intelligence" className="hover:text-terracotta">Model Intelligence</NavLink></li>
              <li><NavLink to="/risk" className="hover:text-terracotta">Risk Analysis</NavLink></li>
              <li>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-terracotta"
                >
                  GitHub
                </a>
              </li>
            </ul>
          </div>
        </div>
        <p className="mt-10 border-t border-espresso/10 pt-6 text-xs text-espresso/50">
          Model predictions are probabilistic estimates and should support, not replace, business
          judgment.
        </p>
      </div>
    </footer>
  );
}
