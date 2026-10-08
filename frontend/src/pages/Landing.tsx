import { motion } from "framer-motion";
import { NavLink } from "react-router-dom";
import { ArrowRight, Search, MessageSquareQuote, ListOrdered, ShieldCheck, Gauge } from "lucide-react";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

const WORKFLOW = [
  {
    icon: Search,
    title: "Predict",
    body: "A logistic regression model trained on real customer records scores every account's likelihood of churning.",
  },
  {
    icon: MessageSquareQuote,
    title: "Explain",
    body: "Every score comes with the exact factors driving it — contract type, tenure, pricing, support coverage — in plain language.",
  },
  {
    icon: ListOrdered,
    title: "Prioritize",
    body: "Customers are ranked and grouped by urgency, so retention teams know who to contact first.",
  },
  {
    icon: ShieldCheck,
    title: "Retain",
    body: "A recommendation engine turns each risk profile into a concrete, customer-specific retention action.",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

export default function Landing() {
  return (
    <div className="flex min-h-screen flex-col">
      <Nav />
      <main className="flex-1">
        {/* Hero */}
        <section className="mx-auto max-w-7xl px-4 pb-20 pt-16 sm:px-6 sm:pt-24">
          <motion.div
            initial="hidden"
            animate="show"
            variants={fadeUp}
            className="mx-auto max-w-3xl text-center"
          >
            <span className="label-tag mx-auto mb-6 w-fit rounded-full border border-espresso/15 px-3 py-1 text-espresso/60">
              <Gauge className="h-3.5 w-3.5" /> AI-Powered Churn Intelligence
            </span>
            <h1 className="font-display text-5xl leading-[1.05] text-espresso sm:text-6xl">
              Predict. Explain.
              <br />
              Prioritize. Retain.
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg text-espresso/70">
              An AI-powered customer churn intelligence platform that turns customer risk into
              actionable retention decisions.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <NavLink to="/overview" className="btn-primary">
                Explore Risk Intelligence <ArrowRight className="h-4 w-4" />
              </NavLink>
              <NavLink to="/explorer" className="btn-secondary">
                Analyze a Customer
              </NavLink>
            </div>
          </motion.div>
        </section>

        {/* Problem */}
        <section className="border-y border-espresso/10 bg-parchment-light">
          <div className="mx-auto max-w-5xl px-4 py-16 text-center sm:px-6">
            <h2 className="font-display text-3xl text-espresso">
              Most churn is invisible until it's too late.
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-espresso/65">
              By the time a customer cancels, the warning signs — a downgraded plan, a lapsed
              add-on, a switch to month-to-month — were already there. OrbitHold surfaces those
              signals early enough to act on them.
            </p>
          </div>
        </section>

        {/* Workflow */}
        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <h2 className="text-center font-display text-3xl text-espresso">How OrbitHold works</h2>
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {WORKFLOW.map((step, i) => (
              <motion.div
                key={step.title}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-60px" }}
                variants={fadeUp}
                transition={{ delay: i * 0.08 }}
                className="paper-card p-6"
              >
                <step.icon className="h-6 w-6 text-terracotta" strokeWidth={1.75} aria-hidden />
                <h3 className="mt-4 font-display text-xl text-espresso">{step.title}</h3>
                <p className="mt-2 text-sm text-espresso/65">{step.body}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-espresso/10 bg-espresso">
          <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
            <h2 className="font-display text-3xl text-parchment-light">
              See your customer base through a retention lens.
            </h2>
            <p className="mt-3 text-parchment-light/70">
              A demo dataset is loaded automatically — no upload required to explore.
            </p>
            <div className="mt-8">
              <NavLink to="/overview" className="btn-primary">
                Open the Dashboard <ArrowRight className="h-4 w-4" />
              </NavLink>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
