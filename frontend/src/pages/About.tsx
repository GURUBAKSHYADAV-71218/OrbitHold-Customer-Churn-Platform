import { NavLink } from "react-router-dom";

export default function About() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <span className="label-tag text-terracotta">About</span>
      <h1 className="mt-2 font-display text-4xl text-espresso">About OrbitHold</h1>

      <div className="prose-sm mt-6 space-y-4 text-espresso/75">
        <p>
          OrbitHold is a customer churn intelligence platform: it scores each customer's
          likelihood of canceling, explains which factors drive that score, and recommends a
          specific retention action — turning a prediction into something a retention team can
          actually act on.
        </p>
        <p>
          The underlying model is a logistic regression trained on the public IBM Telco Customer
          Churn dataset. Training happens offline in Python; the trained coefficients are exported
          to a small JSON file that the production API re-implements in TypeScript, so no Python
          process needs to run after deployment — see the{" "}
          <NavLink to="/model-intelligence" className="text-terracotta hover:underline">
            Model Intelligence
          </NavLink>{" "}
          page for the real evaluation metrics.
        </p>
        <p>
          Explanations are exact, not approximated: for a linear model, each feature's contribution
          to a prediction is simply its coefficient multiplied by its (scaled) value — the same
          quantity SHAP reduces to for linear models, shown here directly.
        </p>
      </div>

      <p className="mt-10 border-t border-espresso/10 pt-6 text-sm italic text-espresso/50">
        Model predictions are probabilistic estimates and should support, not replace, business
        judgment.
      </p>
    </div>
  );
}
