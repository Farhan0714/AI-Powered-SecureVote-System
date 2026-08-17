# SecureVote — MERN Blockchain Voting Platform with AI

A full MERN-stack (MongoDB, Express, React, Node.js) rewrite of the original Flask/MySQL "SecureVote" blockchain voting system, upgraded with:

- 🤖 **AI Chatbot** ("VoteBot", a self-trained Naive Bayes intent classifier — see §6c) — helps visitors ask about elections/results and guides them through account creation, registration and voting. No external API, no per-message cost.
- 📊 **Historical election data** — past vote counts, vote share %, seats won, by year/state/party.
- 📜 **Party manifestos** — key promises and focus sectors per party.
- 📈 **AI Growth Evaluation** — Google Gemini (still used for this one feature only) analyzes stored sector indicators (Health, Education, GDP, Employment, Infrastructure) and writes a neutral, evidence-based growth narrative.
- 🔗 **Simple educational blockchain** — SHA-256 proof-of-work chain that anonymously records vote transactions, viewable in a Blockchain Explorer page.
- 🔐 Email OTP verification for signup, voter registration, forgot-password and vote-casting (same flows as the original app).
- 🛡️ JWT auth (httpOnly cookie), bcrypt password hashing, role-based access (user/admin).

Everything below can be built and hosted **entirely on free tiers**: MongoDB Atlas (free 512MB cluster), Render (free web service) or Railway free tier for the backend, Vercel/Netlify (free) for the frontend, Gmail SMTP (free) for OTP emails, and Google AI Studio (free Gemini API key).

---

## 1. Project Structure

```
secure-vote-mern/
├── backend/                  # Node.js + Express + MongoDB API
│   ├── config/db.js          # Mongoose connection
│   ├── models/                # Mongoose schemas (User, Registration, ApprovedUser,
│   │                           Candidate, Vote, Block, VotingPhase, Otp,
│   │                           ElectionHistory, Manifesto, SectorData)
│   ├── middleware/auth.js     # JWT auth + admin-only guard
│   ├── utils/                 # blockchain.js, gemini.js (growth-analysis only), faceMatch.js, email.js, otp.js, token.js
│   ├── ml/                    # intents.js, chatbotEngine.js — the self-trained chatbot classifier
│   ├── routes/                # auth, registration, admin, vote, blockchain, chatbot, election
│   ├── seed/seedData.js       # Sample candidates, election history, manifestos, sector data
│   ├── server.js              # App entrypoint
│   └── package.json
├── frontend/                  # React 18 + Vite SPA
│   └── src/
│       ├── api/axios.js
│       ├── context/AuthContext.jsx
│       ├── components/        # Navbar, Footer, Alert, Chatbot, ProtectedRoute
│       ├── pages/              # Home, Login, Signup, ForgotPassword, Dashboard,
│       │                       Register, Submitted, Vote, ElectionData,
│       │                       GrowthAnalysis, Blockchain, admin/*
│       └── styles/index.css
└── README.md                  # (this file)
```

## 2. Technology Stack (all free)

| Layer | Technology | Free tier used |
|---|---|---|
| Frontend | React 18 + Vite + React Router + Recharts | Vercel / Netlify free hosting |
| Backend | Node.js + Express | Render / Railway free web service |
| Database | MongoDB (Mongoose) | MongoDB Atlas free M0 cluster |
| Auth | JWT + bcryptjs | — |
| Email/OTP | Nodemailer + Gmail SMTP | Gmail free App Password |
| AI Chatbot | Custom-trained Naive Bayes classifier (`natural` npm package) | Free, self-hosted, no API key |
| AI Growth Analysis | Google Gemini API (`gemini-flash-latest`) | Google AI Studio free tier |
| Blockchain | Custom SHA-256 proof-of-work chain (Node `crypto`) | Self-hosted, no external cost |
| Charts | Recharts | — |

---

## 3. Prerequisites

- Node.js 18+ and npm
- A free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) account
- A Gmail account with an **App Password** (Google Account → Security → 2-Step Verification → App Passwords)
- A free [Google Gemini API key](https://aistudio.google.com/app/apikey)

---

## 4. Local Setup — Backend

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env` with:
- `MONGO_URI` — your MongoDB Atlas connection string (create a free cluster, add a database user, allow access from `0.0.0.0/0` for development, then copy the SRV connection string).
- `JWT_SECRET` — any long random string (e.g. generate with `openssl rand -hex 32`).
- `SMTP_EMAIL` / `SMTP_PASSWORD` — your Gmail address and 16-character App Password.
- `GEMINI_API_KEY` — your Google AI Studio key.
- `CLIENT_URL` — `http://localhost:5173` for local dev.

Seed the database with sample candidates, an admin account, election history, manifestos and sector-growth data:

```bash
npm run seed
```

This creates an admin login: **username `admin` / password `Admin@123`** — change this in production. It also creates two verifier accounts (**`verifier1`** / **`verifier2`**, password `Verifier@123` for both) used for the 2-of-3 multi-signature block finalization described in §6d — change these too before any real deployment.

Start the API:

```bash
npm run dev      # nodemon, auto-restart
# or
npm start
```

The API runs on `http://localhost:5000` (health check: `GET /api/health`).

---

## 5. Local Setup — Frontend

```bash
cd frontend
npm install
cp .env.example .env    # sets VITE_API_URL=http://localhost:5000/api
npm run dev
```

Open `http://localhost:5173`. Sign up, verify the OTP printed both to the Gmail inbox and to the backend console, submit a voter registration, then log in as `admin` to approve it, set the voting phase, and cast a vote as the approved user.

---

## 6. How the Core Flows Work

1. **Sign Up** → `/api/auth/signup/request-otp` emails a 6-digit OTP → `/api/auth/signup/verify` creates the account and logs the user in (JWT cookie).
2. **Voter Registration** → user fills personal details, uploads an ID proof, and **captures their face live via webcam** (see §6a below) → OTP-verified submission → status `pending`.
3. **Admin Review** → Admin Dashboard lists pending registrations → Admin approves/rejects. Approval:
   - Generates a **6-character alphanumeric unique code** (e.g. `A3F9K2`) and creates an `ApprovedUser` record carrying it plus the registration's face descriptor.
   - Emails the code to the voter and shows it on their Dashboard.
   - Logs an anonymized `voter_approved` event to the blockchain's pending transaction pool (no personal identifiers on-chain).
4. **Voting Phase** → Admin toggles `isActive` and sets a daily `startTime`/`endTime` window. Turning voting **OFF** is what signals the election phase has ended (required before results can be published — see §6b).
5. **Vote Casting** → see §6a below (unique code + face verification, no OTP).
6. **Mining** → `POST /api/admin/blockchain/mine` batches pending anonymized vote-hashes into a new proof-of-work block, chained to the previous block's hash.
7. **AI Chatbot** → see §6c below - a self-trained classifier, not an external LLM.
8. **AI Growth Evaluation** → `/api/election/growth-analysis` feeds stored `SectorData` (Health/Education/GDP/Employment/Infrastructure indicators, year-wise) to Gemini with strict instructions to stay factual, neutral and data-grounded, returning a structured markdown evaluation rendered on the "AI Growth Insights" page.

### 6a. Face-Recognition Vote Verification

- **At registration**, the browser uses [`face-api.js`](https://github.com/justadudewhohacks/face-api.js) (running entirely client-side via TensorFlow.js) to detect the user's face from their webcam and extract a **128-number face descriptor**, stored alongside the captured photo. Model weights are fetched at runtime from a free public CDN (`cdn.jsdelivr.net`) — no paid API, no server-side ML.
- **At voting time**, the user selects a candidate, then must: (1) enter their unique 6-character code, and (2) complete a fresh live face capture. The browser extracts a new descriptor from that live capture and sends it to the server.
- The **server** (never the client) makes the final match decision: it computes the Euclidean distance between the stored registration descriptor and the live vote-time descriptor (`backend/utils/faceMatch.js`, threshold `0.6`, the standard face-api.js recognition threshold). A vote is only accepted if the code matches *and* the face matches.
- The live face image captured at vote time is stored (`Vote.faceCaptureAtVote`) for audit purposes.
- **Known limitation:** this is descriptor-matching, not liveness detection — a high-quality photo held up to the camera could technically pass. This is an accepted tradeoff for a free, dependency-light student project; a production system would add liveness checks (blink detection, depth sensing, etc.).

### 6c. Custom-Trained AI Chatbot (No External API)

VoteBot no longer calls an external LLM. Instead it uses a **Naive Bayes intent classifier**, trained entirely from scratch on a small hand-labeled dataset shipped with the project:

- **Training data**: `backend/ml/intents.js` — ~16 intents (greeting, how-to-signup, how-to-register, unique-code questions, face-verification help, voting steps, candidates, manifestos, election history, growth-analysis pointer, results, blockchain, password help, etc.), each with 8–10 example phrasings.
- **Training**: `backend/ml/chatbotEngine.js` builds a `natural.BayesClassifier` and trains it once, in-memory, when the server starts (takes well under a second — no GPU, no external service). This is a genuine, from-scratch-trained ML model, not a wrapper around someone else's pretrained weights.
- **Confidence scoring**: raw Naive Bayes scores are softmax-normalized into a 0–1 confidence; below a threshold (`0.35`), the bot returns a "not sure, try rephrasing" fallback instead of guessing.
- **Grounded responses**: once an intent is classified, a dedicated handler builds the reply — several pull **live data from MongoDB** (e.g. the logged-in user's own registration status, the current candidate list, a requested party's manifesto, recent election history, whether results are published), so answers stay accurate and personalized without needing a large language model to "know" anything.
- **Improving it**: add more example patterns to `backend/ml/intents.js` (or new intents entirely) and restart the server — no retraining pipeline, redeployment steps, or paid compute required. This also makes a good "future scope" or "model evaluation" section for your project report (e.g. you could hold out some patterns as a test set and report classification accuracy).
- **Tradeoff vs. an LLM**: it can't have an open-ended conversation or answer things outside its trained intents/response templates — by design, it stays scoped to the platform and election data, matching the neutrality/scope requirements this project already needed.

The AI Growth Evaluation feature (§6, step 8) still uses Google Gemini, since it needs to generate free-form narrative text from arbitrary numeric data — a good candidate to also swap out if you want to remove the Gemini dependency entirely (ask if you'd like that ported to a template-based or from-scratch approach too).



Per the project's transparency requirement, **vote counts and blockchain contents are never exposed to the admin**, only an integrity check:

- `GET /api/admin/blockchain/verify` returns only `{ valid: true/false, totalBlocks }` — never the chain's transactions.
- There is **no** admin endpoint that returns live vote tallies. The only way results become visible to anyone is:
  1. Admin turns voting **OFF** (ends the phase).
  2. Admin calls `POST /api/admin/results/publish` — this computes the tally **and immediately writes it to a locked snapshot** (`ElectionResult` collection) without ever returning the counts in the API response the admin receives.
  3. Voters then see the published results on their own `/results` page (`GET /api/election/results`), which reads *only* from that published snapshot.

> ⚠️ **Data disclaimer**: the seeded election-history and sector-growth figures are illustrative sample data for demonstration purposes only. For a real submission, replace `backend/seed/seedData.js` with verified figures from the Election Commission of India (eci.gov.in), MOSPI, or state government open-data portals.

---

### 6d. Multi-Signature Block Finalization (2-of-3 quorum)

Addressing the "single point of trust" weakness common to centrally-operated systems (a root cause behind both the Moscow and Voatz failures referenced in this project's motivation), no single account can unilaterally add a block to the chain:

- Three **signer-eligible accounts** exist: `admin`, `verifier1`, `verifier2` (roles `admin`/`verifier`), each with an independent RSA-2048 keypair. The private key is generated server-side once, shown to that account exactly one time, and **never stored** — only the public key persists (`backend/routes/verifiers.js`).
- Votes are queued anonymously as before. Any signer can **propose** a block from the queue (`POST /api/verifiers/blocks/propose`), which computes the proof-of-work hash but does **not** yet add it to the trusted chain — it becomes a `PendingBlock` awaiting signatures.
- Each of the other signers reviews the proposal (only its hash/index/timestamp is shown — never the underlying vote data) and **signs it client-side**, in their own browser, using the Web Crypto API (`frontend/src/utils/crypto.js`) — their private key never leaves their machine, only the resulting signature is sent to the server.
- Once **2 of 3** valid signatures are collected, the server (`backend/utils/blockchain.js: addSignature`) finalizes the block into the real chain.
- Try it: log in as `admin`, `verifier1`, and `verifier2` (in different browser sessions/incognito windows) and walk through Generate Key → Propose Block → Sign (from two different accounts) on the **Block Signing** page.

### 6e. Public Audit Trail

Addressing Voatz's "closed-source, not independently inspectable" criticism: `/audit-trail` is visible to **every** logged-in account (voter, admin, or verifier) and shows:
- **Finalized block metadata** (index, hash, prev-hash, timestamp) — never transaction contents.
- **An append-only administrative action log** (`AuditLog` collection) recording every approval/rejection, voting-phase change, block proposal/signing, and results publication, with who did it and when — but never vote counts or candidate-identifying data.

### 6f. Basic Liveness Detection

To partially address the "static photo held up to the camera" weakness documented in Voatz's facial-recognition component, `FaceCapture.jsx` now requires the user to **visibly turn their head** before the capture button unlocks — tracked via horizontal displacement of the nose-tip landmark across a rolling ~5-second window (`face-api.js` 68-point landmarks, no extra dependency). Both registration and vote-casting reject submissions where this liveness attestation wasn't completed.

**Honest limitation**: this is a *client-attested* check — a sufficiently motivated attacker could still spoof it (e.g., with a pre-recorded video). It raises the bar against the simplest attack (a static printed photo) without claiming to solve liveness detection the way a dedicated, hardware-backed (e.g., depth-camera) system would. This tradeoff is documented explicitly so it can be discussed honestly in a viva rather than presented as a solved problem.



### 7.1 Database — MongoDB Atlas
1. Create a free M0 cluster at https://cloud.mongodb.com.
2. Database Access → add a user with a strong password.
3. Network Access → allow `0.0.0.0/0` (or Render's static IPs if you upgrade later).
4. Copy the SRV connection string into `MONGO_URI`.

### 7.2 Backend — Render
1. Push this repo to GitHub.
2. On https://render.com → **New → Web Service** → connect the repo, root directory `backend`.
3. Build command: `npm install`  ·  Start command: `npm start`.
4. Add all variables from `.env.example` under **Environment**.
5. Set `CLIENT_URL` to your Vercel frontend URL once you have it (step 7.3).
6. Deploy. Render's free instance may spin down after inactivity — the first request after idle can take ~30s.
7. After first deploy, run the seed script once via Render's **Shell** tab: `npm run seed`.

### 7.3 Frontend — Vercel
1. On https://vercel.com → **New Project** → import the repo, root directory `frontend`.
2. Framework preset: Vite. Build command `npm run build`, output directory `dist`.
3. Add environment variable `VITE_API_URL` = `https://<your-render-service>.onrender.com/api`.
4. Deploy. Then go back to Render and set `CLIENT_URL` to this Vercel URL, and redeploy the backend so CORS/cookies work.

### 7.4 Alternative free stack
Netlify (frontend) + Railway (backend, free trial credits) + MongoDB Atlas work identically — only the build/deploy UI differs.

### 7.5 Camera access requires HTTPS
Browsers only allow webcam access (`getUserMedia`, used for face capture) on **HTTPS** or `localhost` — never plain HTTP. Vercel/Netlify serve over HTTPS automatically, so this only matters if you self-host the frontend somewhere without TLS.

### 7.6 Gemini API & Gmail in production
- Gemini free tier has per-minute/per-day rate limits — fine for a college demo; if you exceed them, the chatbot/growth-analysis routes will return an error message the UI already handles gracefully.
- Gmail SMTP may require "Less secure app" workaround disabled — always use an **App Password**, never your real password, and be aware Gmail free sending has daily limits (~500/day), which is more than enough for a project demo.

### 7.7 GCP Cloud Run (single service — frontend + backend)
This repo ships a ready-made multi-stage `Dockerfile` that builds the React frontend **and** serves it from the same Express process that hosts the API. That means one Cloud Run service, one public URL, same-origin cookies/CORS — no Vercel/Render split needed.

1. **Prerequisite:** Cloud Run requires **billing to be enabled** on the GCP project (even to use the free tier — a payment method must be on file; you are never charged until you exceed free limits). Enable it at
   `https://console.developers.google.com/billing/enable?project=<PROJECT_ID>`.
2. Authenticate and set your project:
   ```bash
   gcloud auth login
   gcloud config set project <PROJECT_ID>
   ```
3. Create an env-vars file from your `backend/.env` (secrets stay out of the repo thanks to `.gcloudignore`):
   ```bash
   python3 - <<'EOF'
   env = {}
   for line in open('backend/.env'):
       line = line.strip()
       if not line or line.startswith('#') or '=' not in line: continue
       k, v = line.split('=', 1)
       env[k.strip()] = v.strip().strip('"').strip("'")
   env['PORT'] = '8080'
   env['NODE_ENV'] = 'production'
   with open('/tmp/envs.yaml', 'w') as f:
       for k, v in env.items():
           if v: f.write(f"{k}: '{v}'\n")
   EOF
   ```
4. Deploy (Cloud Build compiles the image; free tier = 120 build-min/day):
   ```bash
   gcloud run deploy securevote --source . --region us-central1 \
     --allow-unauthenticated --memory 512Mi --cpu 1 \
     --project <PROJECT_ID> --env-vars-file /tmp/envs.yaml --quiet
   ```
5. Point `CLIENT_URL` at the generated `*.run.app` URL and redeploy once so CORS allows cross-origin dev usage:
   ```bash
   gcloud run services update securevote --region us-central1 \
     --update-env-vars CLIENT_URL=$(gcloud run services describe securevote --region us-central1 --format='value(status.url)')
   ```
6. Seed the database once (`npm run seed` locally against the same `MONGO_URI`), then verify:
   ```bash
   curl https://<your-service>.run.app/api/health   # { status: 'ok' }
   open https://<your-service>.run.app/             # the redesigned SPA
   ```

**Costs:** Cloud Run's free tier covers 2M requests/month; Cloud Build 120 build-min/day; the image lives in Artifact Registry (~a few cents/GB-month). A student demo stays comfortably inside free limits.

---

## 8. Environment Variables Reference

**backend/.env**
```
MONGO_URI=...
JWT_SECRET=...
JWT_EXPIRES_IN=7d
PORT=5000
CLIENT_URL=http://localhost:5173
NODE_ENV=development
SMTP_EMAIL=...
SMTP_PASSWORD=...
GEMINI_API_KEY=...
```

**frontend/.env**
```
VITE_API_URL=http://localhost:5000/api
```

---

## 9. API Overview

| Method | Route | Purpose |
|---|---|---|
| POST | `/api/auth/signup/request-otp` , `/verify` | Sign up with email OTP |
| POST | `/api/auth/login`, `/logout` | Session auth |
| GET | `/api/auth/me` | Current user |
| POST | `/api/auth/forgot-password/*` | Password reset flow |
| POST | `/api/registration/request-otp`, `/submit` | Voter registration |
| GET | `/api/registration/mine` | My registration status |
| GET/POST | `/api/admin/registrations*` | Admin review queue |
| GET | `/api/admin/results` | Live vote counts |
| GET/PUT | `/api/admin/voting-phase` | Voting window control |
| GET | `/api/vote/candidates`, `/status` | Voting info |
| POST | `/api/vote/request-otp`, `/cast` | Cast a vote |
| GET | `/api/blockchain/chain`, `/stats` | Blockchain explorer |
| POST | `/api/blockchain/mine`, `/reset` | Admin blockchain ops |
| POST | `/api/chatbot/ask`, `/ask-public` | AI chatbot |
| GET | `/api/election/history`, `/manifestos`, `/sector-data` | Election data |
| POST | `/api/election/growth-analysis` | AI growth evaluation |

---

## 10. Known Limitations / Future Scope

- Blockchain is an **educational simulation** (single-node, in-app chain), not a distributed ledger — a strong discussion point for a "future scope" section in your report (e.g. migrating to Hyperledger Fabric or a public testnet).
- Uploaded ID/photo files are stored as binary in MongoDB for simplicity; production systems would use encrypted object storage (e.g. S3-compatible, still free-tier options exist like Cloudflare R2).
- Sample election/sector data is illustrative — replace with verified government data before any real submission or public claims.
- Gemini free tier has rate limits; consider caching frequent chatbot answers for a production deployment.

