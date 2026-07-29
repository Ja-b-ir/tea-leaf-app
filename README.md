# Tea Leaf Disease Detection — Demo Web App

Client + admin panel demo for the "Tea Leaf Disease Detection Using Deep
Learning" final year project. Serves predictions from a fine-tuned
EfficientNetV2B0 model with a smart, threshold-based prediction layer that
flags ambiguous cases (Red Spider / Thrips / Helopeltis) instead of forcing
a single wrong answer.

Frontend is built with **Next.js** (App Router) — no Vite involved.

## 1. Add your trained model

Copy your `best_phase2.keras` file into:

    backend/model/best_phase2.keras

## 2. Run the backend (FastAPI)

    cd backend
    python -m venv venv
    source venv/bin/activate        # Windows: venv\Scripts\activate
    pip install -r requirements.txt
    uvicorn main:app --reload --port 8000

This creates `tealeaf.db` (SQLite) on first run, seeds:
- an admin account — username `admin`, password `admin123` (change this!)
- default descriptions for all 6 disease classes

API docs: http://localhost:8000/docs

## 3. Run the frontend (Next.js)

    cd frontend
    npm install
    npm run dev

Open http://localhost:3000 — `next.config.mjs` rewrites `/api/*` and
`/uploads/*` to the backend on port 8000, so the frontend just calls
relative paths with no CORS setup needed.

For production: `npm run build && npm start` (or deploy to Vercel/any
Node host — set the `BACKEND_URL` env var if the backend isn't on
localhost:8000).

## 4. Using it

- **Client site** (`/`) — drop or choose a tea leaf photo, get an instant
  diagnosis. Ambiguous predictions show both possible diseases.
- **About page** (`/about`) — model accuracy, per-class metrics, and an
  editable disease reference.
- **Admin panel** (`/admin`) — log in at `/admin/login`, then:
  - **Dashboard** — totals, per-class breakdown, recent predictions
  - **Prediction History** — every prediction made through the client, with
    the uploaded photo, filterable by class, deletable
  - **Disease Classes** — edit the description/symptoms/suggested action
    shown on the client's About page

## Project layout

    tea-leaf-app/
    ├── backend/               FastAPI + SQLite + the trained model
    │   ├── main.py            routes
    │   ├── model.py           model loading + smart_predict() logic
    │   ├── database.py        SQLAlchemy models, seed data
    │   ├── auth.py             admin JWT auth
    │   └── model/             put best_phase2.keras here
    └── frontend/               Next.js App Router
        ├── app/
        │   ├── page.jsx                 client home (upload + diagnose)
        │   ├── about/page.jsx           model stats + disease reference
        │   └── admin/
        │       ├── login/page.jsx       admin login (public)
        │       └── (site)/              protected admin pages
        │           ├── layout.jsx       auth check + sidebar
        │           ├── page.jsx         dashboard
        │           ├── history/page.jsx
        │           └── classes/page.jsx
        ├── components/        Navbar, PredictionResult, AdminSidebar
        └── lib/auth.js         JWT storage helper

## Notes for the defense

- The prediction endpoint (`POST /api/predict`) runs the exact same
  `smart_predict()` Delta-Gap Threshold logic from the training notebook —
  copied into `backend/model.py` so the demo matches the reported results.
- Model stats shown on `/about` (85.41% test accuracy, per-class F1, etc.)
  are hard-coded in `backend/main.py` from the final training run — update
  `MODEL_STATS` there if you retrain.
- SQLite is used for simplicity; swap `DATABASE_URL` in `backend/database.py`
  for Postgres if needed later.
- This project has no dependency on any particular computer — see the
  "moving between computers" notes below.

## Deploying to the cloud for free (no PC required to stay on)

Running `uvicorn` and `next dev` on your own machine only works while those
terminals are open. To make the app reachable from anywhere at any time,
deploy the two halves to separate free services:

**Backend → Hugging Face Spaces** (free "CPU Basic" tier: 2 vCPUs, 16GB RAM —
enough for TensorFlow; Render/Railway's free tiers only give ~512MB and will
likely crash loading the model)

1. Create a free account at huggingface.co, then create a **New Space**.
2. Choose **Docker** as the Space SDK, and set visibility to Public.
3. Upload the contents of this project's `backend/` folder into the Space's
   repo (via the web UI, or `git clone` the Space and copy files in + push).
4. Rename `README_HUGGINGFACE.md` to `README.md` inside the Space (it holds
   the required Space config).
5. Also upload your `best_phase2.keras` into the Space's `model/` folder
   (drag-and-drop works for files under a few hundred MB; for larger files
   use the "Files" tab's Git LFS support).
6. The Space will build the Dockerfile automatically. Once it's live, your
   backend is reachable at `https://<your-username>-<space-name>.hf.space`.

**Frontend → Vercel** (built by the makers of Next.js, free tier is generous)

1. Push this project to a GitHub repo (see below).
2. Go to vercel.com, "Add New Project", import that repo.
3. Set the **Root Directory** to `frontend`.
4. Add an environment variable: `NEXT_PUBLIC_API_URL` = your Hugging Face
   Space URL from above (no trailing slash).
5. Deploy. Vercel gives you a URL like `https://your-app.vercel.app`.

That's it — the site now runs entirely in the cloud, reachable from any
device, with nothing running on your PC.

**Free-tier caveats worth knowing:**
- The SQLite database (`tealeaf.db`) and `uploads/` folder on Hugging Face
  Spaces are not guaranteed to persist forever on the free tier — a Space
  rebuild can reset them. Fine for a demo; for anything longer-term, move to
  a managed Postgres (e.g. Neon or Supabase both have free tiers) later.
- The very first prediction after the Space has been idle may be slow
  (the container has to start up and load the model into memory).

## Moving between computers

This is a normal Python + Node project on disk — nothing ties it to one
machine. To work on it anywhere:
1. Install Python 3.10+ and Node.js on the new machine.
2. Bring the project folder (ideally via a GitHub repo — `git clone` beats
   re-zipping every time).
3. Re-run `pip install -r requirements.txt` and `npm install` there.
4. Copy `best_phase2.keras` into `backend/model/` (it's not in git/zip —
   keep it on Drive/USB/Git LFS).
5. `tealeaf.db` and `backend/uploads/` hold your prediction history/admin
   login — carry those files along if you want that data to follow you,
   otherwise they're recreated fresh on first run.
