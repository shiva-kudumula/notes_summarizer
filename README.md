# NotesGenie

NotesGenie is a source-first AI study app: add a source, ask questions about it, test yourself, and generate notes only when you want them.

## What works

- JWT sign-up and login
- Source library and per-user access control
- PDF, DOCX, TXT, and image OCR ingestion
- Source-grounded Ask
- On-demand quiz generation, timer, scoring, saved attempts, and history
- Conceptual assessment with saved score plus strengths and revision topics
- Optional Basic, Detailed, and Cheat Sheet notes with download

Adding a source only extracts and stores readable text. Gemini is called only for Ask, Quiz, Assessment, or Generate Notes.

## Run locally

Create `backend/.env` (do not commit it):

```env
MONGO_URI=your_mongodb_connection_string
GEMINI_API_KEY=your_gemini_api_key
JWT_SECRET=a_long_random_secret
# Optional: deployed frontend origin for CORS
FRONTEND_URL=https://your-frontend.example
```

Then run the backend:

```powershell
cd backend
npm install
npm start
```

For the frontend, optionally set `frontend/.env` for a deployed API. It defaults to `http://localhost:5000` in development.

```env
VITE_API_URL=https://your-api.example
```

```powershell
cd frontend
npm install
npm run dev
```

## Product flow

`Add Source → Ask → Quiz / Assessment / Notes`

Unsupported media, diagrams, audio, and video are intentionally not presented as features. This keeps the MVP focused on the reliable document and image workflow.
