# NotesGenie

NotesGenie is a source-first AI study app: add a source, ask questions about it, then test and assess your understanding.

## What works

- JWT sign-up and login
- Source library and per-user access control
- PDF, DOCX, TXT, and image OCR ingestion
- Source-grounded Ask
- On-demand quiz generation, timer, scoring, saved attempts, and history
- Conceptual assessment with saved score plus strengths and revision topics

Adding a source only extracts and stores readable text. Gemini is called only for Ask, Quiz, or Assessment.

## Run locally

Create `backend/.env` (do not commit it):

```env
MONGO_URI=your_mongodb_connection_string
GEMINI_API_KEY=your_gemini_api_key
JWT_SECRET=a_long_random_secret
# Required on Render when NODE_ENV=production
FRONTEND_URL=https://your-frontend.vercel.app
```

Then run the backend:

```powershell
cd backend
npm install
npm start
```

Copy `frontend/.env.example` to `frontend/.env` and set the backend URL. `VITE_API_URL` is required; no production fallback URL is embedded in the client.

```env
VITE_API_URL=https://your-api.example
```

```powershell
cd frontend
npm install
npm run dev
```

## Product flow

`Add Source → Ask → Quiz / Assessment`

Unsupported media, diagrams, audio, and video are intentionally not presented as features. This keeps the MVP focused on the reliable document and image workflow.
