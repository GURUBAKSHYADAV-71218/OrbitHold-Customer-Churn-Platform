# OrbitHold

**Predict. Explain. Prioritize. Retain.**

An AI-powered customer churn intelligence & retention platform. Built as a
single Vercel-deployable repo: a React/TypeScript frontend, TypeScript
serverless API functions, and a Python training pipeline that produces a
portable model artifact the API scores against — no Python process runs in
production.

> **Status:** All product surfaces from the spec are implemented and
> real — trained on actual data, no fabricated metrics, no mock buttons.
> See **Status** below for what's been verified in this sandbox (no
> outbound network access here) versus what to verify with `npm install`
> when you pick the repo up.

---

## Architecture

```
orbithold/
├── frontend/            Vite + React + TypeScript + Tailwind + Framer Motion
│   └── src/
│       ├── pages/        Route-level pages (Landing, Overview, …)
│       ├── components/   Nav, Footer, shared UI
│       ├── layouts/       AppLayout (Nav + Footer + <Outlet/>)
│       ├── lib/api.ts     Typed fetch client for /api
│       └── styles/        Tailwind + design-system tokens
├── api/                  Vercel serverless functions (Node/TypeScript)
│   ├── predict.ts         POST — single customer risk profile
│   ├── batch.ts            POST — CSV batch scoring (in-memory only)
│   ├── model-info.ts      GET  — real training-time metrics
│   ├── demo.ts             GET  — scored built-in demo dataset
│   └── _lib/
│       ├── model.ts        Inference, explainability, recommendation engine
│       ├── csv.ts           Dependency-free CSV parser
│       ├── validate.ts      Allowed-value validation for categorical fields
│       └── types.ts         Shared CustomerInput / prediction types
├── ml/
│   ├── data/               Telco-Customer-Churn.csv, demo-customers.json
│   ├── training/train.py   Reproducible training script
│   └── models/              model.json, metrics.json (generated artifacts)
├── vercel.json
└── vite.config.ts          root: "frontend", outDir: "../dist"
```

### How production inference works (the key architectural decision)

Vercel serverless functions are ephemeral, and shipping a full Python +
scikit-learn runtime into a Node-hosted serverless function is fragile and
slow to cold-start. Instead:

1. `ml/training/train.py` trains a scikit-learn `LogisticRegression`
   classifier and exports **`ml/models/model.json`** — feature order,
   `StandardScaler` mean/std, coefficients, intercept, and the categorical
   vocabulary used for one-hot encoding.
2. **`api/_lib/model.ts`** re-implements that exact linear scoring
   (`sigmoid(intercept + Σ coefficient·feature)`) in TypeScript, reading
   `model.json` as a bundled, statically-imported JSON file.
3. The result: no Python process, no pickle file, no cold-start model
   load — just arithmetic over a JSON file that Vercel bundles with the
   function at build time.

This also makes explainability exact rather than approximate: for a linear
model, `coefficient × feature value` **is** each feature's contribution to
the log-odds — mathematically what SHAP reduces to for linear models. The
UI labels this "Model Contribution," not "SHAP," since no sampling or
approximation is involved.

### Dataset

The real, public **IBM Telco Customer Churn** dataset (877 real customer
records pulled from IBM's public GitHub mirror, ~26% churn rate — in line
with the full dataset's known ~26.5%). No synthetic or fabricated rows.
To train on the full 7,043-row dataset instead, download it from
`ml/data/telco_customer_churn_raw_url.txt` and replace
`ml/data/Telco-Customer-Churn.csv`, then re-run `npm run train`.

### Current real model metrics (from `ml/models/metrics.json`)

Generated on the held-out 20% test split — nothing here is typed into the
UI by hand:

| Metric | Value |
|---|---|
| Accuracy | 79.6% |
| Precision | 56.0% |
| Recall | 93.3% |
| F1 | 70.0% |
| ROC-AUC | 88.6% |

(`class_weight="balanced"` favors recall — catching likely churners —
which is the right trade-off for a retention tool where a missed at-risk
customer is costlier than an unnecessary outreach.)

---

## Local development

Requires Node 20+ and (only for retraining) Python 3.10+.

```bash
npm install
npm run typecheck      # tsc for frontend + api + tests
npm run lint
npm test               # vitest
npm run build          # typecheck + vite build -> dist/
vercel dev             # frontend AND /api functions on one origin (needs `npm i -g vercel` + `vercel login`)
```

Use `vercel dev` for anything that touches data: `npm run dev` starts
only the Vite dev server, which does **not** serve `/api`, so every page
that loads data would show its error state. (There is deliberately no
proxy to a second local port — the frontend only calls relative `/api/...`
paths.)

## Environment variables

**None are required.** See `.env.example`. The frontend calls the API with
relative paths, and the model ships as bundled JSON, so there's no
external service, database, or secret to configure in Vercel.

## Production build

```bash
npm run build      # = npm run typecheck && vite build  -> /dist
npm run preview    # serves /dist only (no /api) — use `vercel dev` for the full stack
```

## Deploying to Vercel

Dashboard: **Add New -> Project -> import the Git repo**, then confirm:

| Setting | Value |
|---|---|
| Framework Preset | Vite |
| Root Directory | `.` (repo root) |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | `npm install` (default) |
| Node.js Version | 20.x or newer |
| Environment Variables | none |

Or via CLI: `vercel` (preview) then `vercel --prod`. These values are also
in `vercel.json`, which additionally sets:

- a rewrite sending every non-`/api` path to `/index.html`, so deep links
  and refreshes on `/explorer`, `/customer/:id`, etc. work;
- `includeFiles: ml/{models,data}/*.json` on the functions so the model
  artifacts are bundled even if static tracing misses them;
- `maxDuration: 10`.

`api/package.json` pins the functions to CommonJS because the root
`package.json` is `"type": "module"`, and Node's ESM loader would reject the
extensionless relative imports and bare `.json` imports the functions use.

### Platform limits the code is built around

- Request bodies are capped at 4.5 MB by Vercel -> the uploader allows 4 MB.
- Response bodies are capped at 4.5 MB; a scored customer serializes to
  ~1.8 KB, so `/api/batch` accepts at most **2,000 rows** per upload and
  returns a clear 400 above that.

## Retraining the model

```bash
pip install -r ml/requirements.txt
python ml/training/train.py        # or python3
```
Re-run after changing `ml/data/Telco-Customer-Churn.csv` (e.g. swapping in
the full 7,043-row dataset), then commit the regenerated
`ml/models/model.json` and `metrics.json` — they're what the API reads.

## Git / GitHub

```bash
git init
git add .
git commit -m "OrbitHold: initial churn intelligence platform"
git branch -M main
git remote add origin <your-repo-url>
git push -u origin main
```
`.gitignore` excludes `node_modules/`, `dist/`, `.env`, `.vercel/`, and
Python cache/venv directories.

---

## Status

Implemented and wired to real data: Overview, Customer Explorer (search,
filters, sort, CSV upload, CSV download, ad-hoc analysis form), customer
detail, Risk Analysis (7 live breakdowns), Retention Action Center, Model
Intelligence, About. A shared `DatasetContext` keeps every page in sync; a
failed upload shows an inline error and leaves the loaded dataset intact.

### Input validation

`/api/predict` and `/api/batch` both reject: missing columns/fields,
non-numeric or negative `tenure`/`MonthlyCharges`/`TotalCharges`,
`SeniorCitizen` other than 0/1, and any categorical value outside its
allowed list (exact, case-sensitive) — with a row-numbered message in batch
mode. A blank `TotalCharges` is accepted as 0 (the source dataset's
convention for brand-new customers). Invalid rows are skipped and reported;
if no row is valid the upload fails with a 400.

### What has and has not been verified

The environment this was built in had **no outbound network**
(`npm install` fails with a 403 from the registry), so:

| Check | Result |
|---|---|
| `npm install` | **Not run — blocked by environment** |
| `npm run build` / `vite build` | **Not run** (needs installed deps) |
| `npm test` (vitest) | **Not run** (vitest not installable) |
| `npm run lint` | **Not run** (eslint not installable); `.eslintrc.cjs` exists |
| `vercel build` / `vercel dev` / any deployment | **Not run — nothing has been deployed** |
| `tsc --noEmit`, API + tests | Ran: no errors other than "cannot find module" for uninstalled packages |
| `tsc --noEmit`, frontend | Ran: only errors caused by missing `@types/react` / `react/jsx-runtime`; no unused symbols or undefined names. Real type errors in JSX-heavy files could still be hidden behind that noise |
| API handlers (`predict`, `batch`, `demo`, `model-info`) | Ran for real under `ts-node` with mock req/res: valid input, invalid categorical/numeric/negative values, empty / whitespace / header-only / missing-column / mixed good+bad CSV, wrong HTTP method |
| TS inference vs Python | Same customer scored in both: 0.8435064472330744 vs 0.8435064472330747 |
| CSV export | Round-tripped through the project's own parser, including quoted commas |
| Test files | The real files in `tests/` (32 cases) were executed under `ts-node` against a minimal stand-in for `describe/it/expect`: 32 pass, 0 fail. The real `vitest` runner has never run them |

Not verified at all: rendering in a browser, responsive layout at
1440/1024/768/390 px, keyboard/screen-reader behavior, Recharts output.

**First things to do with network access:** `npm install`, `npm run
typecheck`, `npm run lint`, `npm test`, `npm run build`, `vercel dev`, then
a preview deploy and a click-through of every route (including a hard
refresh on `/customer/<id>`) and an upload of a valid and an invalid CSV.

### Known limitations

- Trained on 877 real rows of the IBM Telco dataset, not the full 7,043;
  metrics will shift when retrained on the full file.
- Test-set precision is 56% (recall 93%) — the model is tuned to catch
  churners and will flag many customers who would have stayed.
- Demo dataset is 18 customers sampled from the training data, so demo
  predictions are on rows the model was trained on (no held-out guarantee).
- The CommonJS pin in `api/package.json` is the intended fix for the
  ESM/CJS mismatch but has not been confirmed on a real Vercel build.
- Batch uploads are capped at 2,000 rows; the Explorer table renders the
  first 200 matches.

## Disclaimer

Model predictions are probabilistic estimates and should support, not
replace, business judgment.
