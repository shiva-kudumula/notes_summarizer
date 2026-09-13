# NotesGenie

### Full-Stack AI-Powered Study Assistant

NotesGenie is a full-stack AI study application that helps students learn from their own study materials.

Users can upload a source, ask questions about it, practise with an AI-generated quiz, complete a written assessment, and review their learning activity.

The application follows a source-first workflow:

```text
Add Source → Ask → Quiz / Assessment → History
```

---

## Live Demo

https://notes-summarizer-puce.vercel.app

---

## GitHub Repository

https://github.com/shiva-kudumula/notes_summarizer

---

# Features

## 🔐 Authentication

NotesGenie provides user authentication using:

- Sign Up
- Login
- JWT authentication
- Password hashing with bcrypt
- Protected routes
- User-specific source access

Each user can access only their own sources and learning activity.

---

## 📚 Source Management

Users can upload study material and save it as a source.

Supported source types:

- PDF
- DOCX
- TXT
- PNG
- JPG / JPEG
- WEBP

The application extracts readable text from the uploaded file and stores it for later use.

Supported extraction methods:

```text
PDF   → pdf-parse
DOCX  → mammoth
TXT   → Node.js File System
Image → Tesseract.js OCR
```

A source is processed when it is uploaded, but Gemini is not automatically called for AI generation.

---

## 🔎 Source Library

The dashboard provides a source library where users can:

- View their sources
- Search sources
- Open a source
- Delete a source
- View source type
- View source creation date

Deleting a source also removes its related saved quiz attempts and activity records.

---

## 💬 Ask Questions

Users can ask questions about the selected source.

The backend sends the selected source content and the user's question to Gemini.

The AI is instructed to answer using only the source content.

Example:

```text
Source:
Operating Systems Notes

Question:
What is a process?

Answer:
A process is a program in execution...
```

If the source does not contain enough information to answer the question, the application instructs the AI to say so instead of relying on unrelated information.

---

## 🧠 AI Quiz

Users can generate a quiz from their selected source.

The quiz contains:

- 5 questions
- 4 options for each question
- Correct answer
- Topic for each question
- 120-second timer
- Automatic scoring
- Correct/wrong answer indication
- Saved quiz attempt

### Quiz Flow

```text
Select Source
      ↓
Click Quiz
      ↓
Gemini Generates Questions
      ↓
Answer Questions
      ↓
Submit / Timer Ends
      ↓
Calculate Score
      ↓
Save Attempt
      ↓
View History
```

The backend validates the AI-generated question structure before returning it to the frontend.

---

## ✍️ Written Assessment

The Assessment feature checks conceptual understanding through written answers.

Instead of selecting an option, users answer questions in their own words.

The system generates exactly 5 conceptual assessment questions.

### Assessment Flow

```text
Select Source
      ↓
Click Assessment
      ↓
Generate 5 Questions
      ↓
Write Answers
      ↓
Submit Assessment
      ↓
Gemini Evaluates Answers
      ↓
Score + Feedback
      ↓
Save Result
```

The assessment provides:

- Score
- Feedback
- Strengths
- Revision focus

Users must answer all five questions before submitting the assessment.

---

## 📊 Activity History

Each source has an activity history.

The history can contain:

- Questions asked
- AI answers
- Quiz attempts
- Quiz scores
- Assessment scores
- Activity timestamps

Users can open the History section from the source workspace.

---

## 📈 Dashboard Statistics

The dashboard displays learning statistics such as:

```text
Sources
Attempts
Best Score
```

This gives the user a quick overview of their study activity.

---

# Complete User Flow

```text
                 ┌───────────────────┐
                 │       Sign Up     │
                 │      / Login      │
                 └─────────┬─────────┘
                           │
                           ▼
                 ┌───────────────────┐
                 │     Dashboard     │
                 │                   │
                 │   My Sources      │
                 │   Statistics      │
                 │   Search          │
                 └─────────┬─────────┘
                           │
                    ┌──────┴──────┐
                    │             │
                    ▼             ▼
              Add Source      Open Source
                    │             │
                    ▼             ▼
              Extract Text   Source Workspace
                                  │
                    ┌─────────────┼─────────────┐
                    │             │             │
                    ▼             ▼             ▼
                   Ask           Quiz       Assessment
                    │             │             │
                    ▼             ▼             ▼
                 Gemini        Gemini        Gemini
                    │             │             │
                    ▼             ▼             ▼
                 Answer         Score       Evaluation
                                  │             │
                                  └──────┬──────┘
                                         ▼
                                  Activity History
```

---

# Architecture

```text
                     ┌─────────────────────┐
                     │        User         │
                     └──────────┬──────────┘
                                │
                                ▼
                     ┌─────────────────────┐
                     │ React + Vite       │
                     │ Frontend           │
                     └──────────┬──────────┘
                                │
                                │ HTTP API
                                ▼
                     ┌─────────────────────┐
                     │ Node.js + Express  │
                     │ Backend            │
                     └──────┬──────┬──────┘
                            │      │
                ┌───────────┘      └────────────┐
                ▼                               ▼
       ┌─────────────────┐             ┌─────────────────┐
       │ MongoDB Atlas   │             │   Gemini API    │
       │                 │             │                 │
       │ Users           │             │ Ask             │
       │ Sources         │             │ Quiz            │
       │ Quiz Attempts   │             │ Assessment      │
       │ Activity        │             │ Evaluation      │
       └─────────────────┘             └─────────────────┘

                         File Processing
                               │
              ┌────────────────┼────────────────┐
              ▼                ▼                ▼
          PDF Parse        DOCX Parse       Image OCR
        pdf-parse          mammoth          Tesseract.js
```

---

# Tech Stack

## Frontend

- React
- Vite
- JavaScript
- CSS

## Backend

- Node.js
- Express.js
- JavaScript
- JWT
- bcryptjs
- Multer

## Database

- MongoDB
- MongoDB Atlas
- Mongoose

## AI

- Google Gemini API
- `@google/genai`

## Document Processing

- `pdf-parse`
- `mammoth`
- Node.js File System

## OCR

- Tesseract.js

## Deployment

- Vercel
- Render
- MongoDB Atlas

## Development Tools

- VS Code
- Git
- GitHub
- MongoDB Compass
- MongoDB Atlas

---

# Authentication

NotesGenie uses JWT-based authentication.

## Sign Up

The user provides:

- Email
- Password

The backend:

1. Validates the input.
2. Checks whether the email already exists.
3. Hashes the password using bcrypt.
4. Creates the user in MongoDB.

Passwords are not stored as plain text.

---

## Login

During login:

```text
User Credentials
       ↓
Backend
       ↓
Find User
       ↓
Compare Password
       ↓
Generate JWT
       ↓
Return Token
```

The JWT expires after 7 days.

The frontend stores the token and uses it for protected API requests.

---

## Protected Resources

The backend checks the authenticated user before allowing access to sources and activity.

Source queries use both:

```text
Source ID
+
Authenticated User ID
```

This prevents one user from accessing another user's source.

---

# Source Processing

The backend uses different processing methods depending on the uploaded file.

## PDF

```text
PDF File
   ↓
pdf-parse
   ↓
Extracted Text
   ↓
MongoDB
```

## DOCX

```text
DOCX File
   ↓
mammoth
   ↓
Extracted Text
   ↓
MongoDB
```

## TXT

```text
TXT File
   ↓
Node.js File System
   ↓
Text
   ↓
MongoDB
```

## Image

```text
Image
   ↓
Tesseract.js
   ↓
OCR Text
   ↓
MongoDB
```

If an image does not contain enough readable text, the backend returns:

```text
No readable text was found in this image.
```

The application also rejects sources that do not contain enough readable text.

---

# AI Integration

Gemini is used for the AI-powered learning features.

## Ask

```text
Source + Question
        ↓
      Gemini
        ↓
Source-Grounded Answer
```

## Quiz

```text
Source
  ↓
Gemini
  ↓
5 MCQ Questions
  ↓
Frontend Quiz
```

## Assessment

```text
Source
  ↓
Gemini
  ↓
5 Conceptual Questions
  ↓
User Written Answers
  ↓
Gemini Evaluation
  ↓
Score + Feedback
```

The backend also validates the structure of AI-generated quiz and assessment responses before sending them to the frontend.

---

# API Structure

The application uses REST-style API endpoints.

## Authentication

```text
POST /auth/signup
POST /auth/login
GET  /auth/me
```

## Sources

```text
POST   /sources
GET    /sources
GET    /sources/:id
DELETE /sources/:id
```

## Source AI Actions

```text
POST /sources/:id/ask
POST /sources/:id/quiz
POST /sources/:id/assessment
```

## Assessment

```text
POST /sources/:id/assessment/submit
```

## Quiz

```text
POST /quiz/submit
GET  /quiz/history/:sourceId
```

## Activity

```text
GET /sources/:id/activity
```

## Dashboard

```text
GET /dashboard/stats
```

---

# Project Structure

```text
notes_summarizer/
│
├── backend/
│   ├── models/
│   │   ├── User.cjs
│   │   ├── Source.cjs
│   │   ├── QuizAttempt.cjs
│   │   └── Activity.cjs
│   │
│   ├── services/
│   │   └── gemini.cjs
│   │
│   ├── auth.cjs
│   ├── db.cjs
│   ├── server.cjs
│   ├── package.json
│   └── package-lock.json
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── Dashboard.jsx
│   │   ├── FileUpload.jsx
│   │   ├── QuizModal.jsx
│   │   ├── AssessmentModal.jsx
│   │   ├── Login.jsx
│   │   ├── api.js
│   │   ├── App.css
│   │   ├── Dashboard.css
│   │   ├── FileUpload.css
│   │   ├── QuizModal.css
│   │   └── ...
│   │
│   ├── package.json
│   └── package-lock.json
│
└── README.md
```

---

# Local Setup

## 1. Clone the Repository

```bash
git clone https://github.com/shiva-kudumula/notes_summarizer.git
cd notes_summarizer
```

---

# 2. Backend Setup

Open the backend folder:

```powershell
cd backend
```

Install dependencies:

```powershell
npm install
```

Create:

```text
backend/.env
```

Add:

```env
MONGO_URI=your_mongodb_connection_string
GEMINI_API_KEY=your_gemini_api_key
JWT_SECRET=your_long_random_secret
FRONTEND_URL=http://localhost:5173
```

Start the backend:

```powershell
npm start
```

The backend uses:

```text
http://localhost:5000
```

when a production/server-provided `PORT` is not available.

---

# 3. Frontend Setup

Open another terminal.

Go to the frontend:

```powershell
cd frontend
```

Install dependencies:

```powershell
npm install
```

Create:

```text
frontend/.env
```

Add:

```env
VITE_API_URL=http://localhost:5000
```

Start the frontend:

```powershell
npm run dev
```

The Vite development server normally runs on:

```text
http://localhost:5173
```

---

# Environment Variables

## Backend

```env
MONGO_URI=your_mongodb_connection_string
GEMINI_API_KEY=your_gemini_api_key
JWT_SECRET=your_secret
FRONTEND_URL=your_frontend_url
```

In production, `FRONTEND_URL` is required.

## Frontend

```env
VITE_API_URL=your_backend_url
```

The frontend uses `VITE_API_URL` for backend communication instead of embedding a production backend URL directly in the source code.

Never commit real API keys, database credentials, or secrets to GitHub.

---

# Production Deployment

The project uses a separate deployment for the frontend and backend.

```text
                    GitHub
                      │
             ┌────────┴────────┐
             │                 │
             ▼                 ▼
          Vercel             Render
             │                 │
             ▼                 ▼
        React Frontend    Node + Express
                               │
                       ┌───────┴────────┐
                       │                │
                       ▼                ▼
                 MongoDB Atlas      Gemini API
```

---

# Backend Deployment

The backend is deployed as a Render Web Service.

### Root Directory

```text
backend
```

### Build Command

```text
npm install
```

### Start Command

```text
npm start
```

### Required Environment Variables

```text
NODE_ENV=production
MONGO_URI=your_mongodb_connection_string
GEMINI_API_KEY=your_gemini_api_key
JWT_SECRET=your_secret
FRONTEND_URL=https://your-frontend.vercel.app
```

Render provides the production `PORT`.

After deployment, Render provides a backend URL such as:

```text
https://your-backend-service.onrender.com
```

---

# Frontend Deployment

The frontend is deployed on Vercel.

### Root Directory

```text
frontend
```

### Build Command

```text
npm run build
```

### Output Directory

```text
dist
```

### Environment Variable

```text
VITE_API_URL=https://your-backend-service.onrender.com
```

The production frontend then communicates with the Render backend.

---

# Production Architecture

```text
User
 │
 ▼
Vercel
 │
 │ VITE_API_URL
 ▼
Render
 │
 ├──────────────► MongoDB Atlas
 │
 └──────────────► Gemini API
```

This separates the frontend hosting, backend hosting, database, and AI service.

---

# Git Workflow

The project uses GitHub for version control.

Typical workflow:

```powershell
git status
git add .
git commit -m "Update NotesGenie"
git push origin main
```

The repository uses:

```text
main
```

as the primary branch.

After pushing changes:

```text
Local Project
     ↓
   Git
     ↓
  GitHub
     ↓
Vercel / Render
     ↓
Production
```

---

# Error Handling

The backend validates important operations before processing them.

Examples include:

- Invalid authentication
- Invalid source ID
- Missing uploaded file
- Unsupported file type
- Insufficient readable text
- Invalid AI-generated quiz
- Invalid AI-generated assessment
- Missing assessment answers
- Invalid quiz submission
- Gemini API errors

AI errors are converted into public API error responses instead of exposing internal implementation details.

---

# File Upload Limits

Uploaded files are handled using Multer.

The backend currently limits uploaded files to:

```text
25 MB
```

Supported image formats include:

```text
PNG
JPG
JPEG
WEBP
```

Supported document formats include:

```text
PDF
DOCX
TXT
```

---

# Key Engineering Challenges

## 1. Handling Multiple File Types

Different source formats require different extraction approaches.

The backend routes each file to the appropriate extraction method:

```text
PDF   → pdf-parse
DOCX  → mammoth
TXT   → File System
Image → Tesseract.js
```

This creates one common source workflow while supporting different file types.

---

## 2. Source-Grounded AI

AI responses should be based on the selected source.

The backend limits the source content passed into AI prompts and instructs Gemini to use only the provided source.

This is especially important for the Ask feature and generated learning questions.

---

## 3. Validating AI Output

AI output cannot always be assumed to have the exact expected structure.

The backend validates generated quiz questions and assessment questions before returning them to the frontend.

For quizzes, it validates:

- Question text
- Exactly four options
- Distinct options
- Correct answer
- Topic

For assessments, it validates:

- Exactly five questions
- Valid question text
- Topic information

---

## 4. Quiz Answer Handling

Gemini may return a correct answer as a letter such as:

```text
A
B
C
D
```

The backend converts the answer into the complete option text before the quiz is used by the frontend.

This allows the frontend to compare the selected option directly with the correct answer.

---

## 5. User Data Ownership

Source access is tied to the authenticated user.

The backend checks:

```text
Source ID
+
User ID
```

before allowing operations on a source.

This protects user-specific study material.

---

## 6. Written Assessment Evaluation

The assessment required a different flow from a normal MCQ quiz.

The user first receives conceptual questions and then provides written answers.

The backend sends the source and responses to Gemini for evaluation and validates the returned result before saving it.

---

# What I Learned

Building NotesGenie helped me understand how to build and deploy an AI-powered full-stack application.

## Frontend

- React component development
- State management
- API integration
- File upload handling
- Authentication flow
- Modal-based interactions
- Dashboard design
- Source workspace design

## Backend

- Node.js
- Express.js
- REST APIs
- JWT authentication
- Password hashing
- Protected routes
- File processing
- Error handling
- API validation

## Database

- MongoDB
- MongoDB Atlas
- Mongoose
- Data models
- User-specific data access
- Activity tracking

## AI

- Gemini API integration
- Prompt design
- Source-grounded AI
- Structured JSON responses
- Quiz generation
- Assessment generation
- Written answer evaluation
- AI response validation

## OCR and Document Processing

- PDF text extraction
- DOCX text extraction
- TXT processing
- OCR using Tesseract.js
- Handling files with insufficient readable text

## Deployment

- GitHub
- Vercel
- Render
- MongoDB Atlas
- Environment variables
- Production CORS
- Frontend-backend connection

---

# Current Project Flow

```text
Authentication
      ↓
Dashboard
      ↓
Add Source
      ↓
Extract & Store Text
      ↓
Open Source
      ↓
┌──────────┬──────────┬──────────────┐
│   Ask    │   Quiz   │  Assessment  │
└────┬─────┴────┬─────┴──────┬───────┘
     │          │            │
     ▼          ▼            ▼
  Gemini     Gemini       Gemini
     │          │            │
     ▼          ▼            ▼
  Answer      Score       Evaluation
                │            │
                └─────┬──────┘
                      ▼
                Activity History
```

---

# Project Status

NotesGenie is a deployed full-stack AI study application.

### Working Core Features

```text
✅ Sign Up
✅ Login
✅ JWT Authentication
✅ Protected Sources
✅ PDF Processing
✅ DOCX Processing
✅ TXT Processing
✅ Image OCR
✅ Source Library
✅ Source Search
✅ Source Deletion
✅ Source-Grounded Ask
✅ AI Quiz Generation
✅ 120-Second Quiz Timer
✅ Automatic Quiz Scoring
✅ Quiz Attempt Saving
✅ Written Assessment
✅ AI Assessment Evaluation
✅ Assessment Score
✅ Strengths
✅ Revision Focus
✅ Activity History
✅ Dashboard Statistics
✅ Production Deployment
```

---

# Live Project

### Frontend

https://notes-summarizer-puce.vercel.app

### Backend

https://notesgenie-backend-5kh9.onrender.com

### GitHub

https://github.com/shiva-kudumula/notes_summarizer

---

# Author

**Shiva Kumar Kudumula**

B.Tech Computer Science Engineering Student

Interested in:

- Full-Stack Development
- Artificial Intelligence
- Generative AI
- DSA
- Productivity Tools

---

# License

This project is created for learning, development, and portfolio purposes.