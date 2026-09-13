const express = require("express");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");
const { createWorker } = require("tesseract.js");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const connectDB = require("./db.cjs");
const auth = require("./auth.cjs");
const { generateText, toPublicError } = require("./services/gemini.cjs");
const User = require("./models/User.cjs");
const Source = require("./models/Source.cjs");
const QuizAttempt = require("./models/QuizAttempt.cjs");
const Activity = require("./models/Activity.cjs");

dotenv.config();
const requiredEnvironment = ["MONGO_URI", "GEMINI_API_KEY", "JWT_SECRET"];
if (process.env.NODE_ENV === "production") requiredEnvironment.push("FRONTEND_URL");
const missingEnvironment = requiredEnvironment.filter((name) => !process.env[name]);
if (missingEnvironment.length) {
  console.error(`Missing required environment variables: ${missingEnvironment.join(", ")}`);
  process.exit(1);
}
const app = express();
const PORT = process.env.PORT || 5000;
const SOURCE_TEXT_LIMIT = 12000;
const imageExtensions = new Set([".png", ".jpg", ".jpeg", ".webp"]);
app.use(cors({ origin: ["http://localhost:5173", process.env.FRONTEND_URL].filter(Boolean), methods: ["GET", "POST", "DELETE", "OPTIONS"], allowedHeaders: ["Content-Type", "Authorization"] }));
app.use(express.json());
connectDB();

const uploadDirectory = path.join(__dirname, "uploads");
fs.mkdirSync(uploadDirectory, { recursive: true });
const upload = multer({
  storage: multer.diskStorage({
    destination: uploadDirectory,
    filename: (_req, file, callback) => callback(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`)
  }),
  limits: { fileSize: 25 * 1024 * 1024 }
});

const validId = (value) => /^[0-9a-fA-F]{24}$/.test(value || "");
const promptText = (source) => source.extractedText.slice(0, SOURCE_TEXT_LIMIT);
const findOwnedSource = (id, userId) => validId(id) ? Source.findOne({ _id: id, userId }) : null;

async function extractText(file) {
  const ext = path.extname(file.originalname).toLowerCase();
  if (file.mimetype === "application/pdf" || ext === ".pdf") return { type: "pdf", text: (await pdfParse(fs.readFileSync(file.path))).text };
  if (file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || ext === ".docx") return { type: "docx", text: (await mammoth.extractRawText({ path: file.path })).value };
  if (file.mimetype.startsWith("text/") || ext === ".txt") return { type: "text", text: fs.readFileSync(file.path, "utf8") };
  if (file.mimetype.startsWith("image/") || imageExtensions.has(ext)) {
    const worker = await createWorker("eng");
    try { return { type: "image", text: (await worker.recognize(file.path)).data.text }; }
    finally { await worker.terminate(); }
  }
  const error = new Error("This file type is not supported. Use PDF, DOCX, TXT, or an image.");
  error.status = 415;
  throw error;
}

function normalizeQuiz(raw) {
  let parsed;
  try { parsed = JSON.parse(raw); } catch {
    const match = raw.match(/\[[\s\S]*\]/);
    try { parsed = match ? JSON.parse(match[0]) : null; } catch { parsed = null; }
  }
  if (!Array.isArray(parsed) || !parsed.length) return null;
  const questions = parsed.map((item) => {
    if (!item || typeof item.question !== "string" || !Array.isArray(item.options) || item.options.length !== 4) return null;
    const options = item.options.map((option) => String(option).trim());
    if (options.some((option) => !option) || new Set(options).size !== 4) return null;
    let answer = String(item.answer ?? "").trim();
    if (/^[A-D]$/i.test(answer)) answer = options[answer.toUpperCase().charCodeAt(0) - 65];
    if (!options.includes(answer)) return null;
    return { question: item.question.trim(), options, answer, topic: String(item.topic || "General understanding").trim() };
  });
  return questions.every(Boolean) ? questions : null;
}

async function generateQuestions(source, kind) {
  const prompt = `Return ONLY a JSON array of 5 multiple-choice questions based exclusively on the source below. Each item must be {"question":"...","options":["...","...","...","..."],"answer":"the complete correct option text","topic":"short topic"}. Use exactly four distinct options. ${kind === "assessment" ? "Make the questions conceptual and reasoning-focused." : "Make the questions useful for self-testing."} Do not use knowledge absent from the source.\n\nSource:\n${promptText(source)}`;
  const questions = normalizeQuiz(await generateText(prompt, { responseMimeType: "application/json" }));
  if (!questions) {
    const error = new Error("The AI returned an invalid question set. Please try again.");
    error.status = 502;
    throw error;
  }
  return questions;
}

function normalizeAssessment(raw) {
  let parsed;
  try { parsed = JSON.parse(raw); } catch { return null; }
  if (!Array.isArray(parsed) || parsed.length !== 5) return null;
  const questions = parsed.map((item) => {
    if (!item || typeof item.question !== "string" || item.question.trim().length < 8) return null;
    return { question: item.question.trim(), topic: String(item.topic || "General understanding").trim() };
  });
  return questions.every(Boolean) ? questions : null;
}

async function generateAssessment(source) {
  const raw = await generateText(`Return ONLY a JSON array of exactly 5 short-answer assessment questions based exclusively on this source. Each item must be {"question":"...","topic":"short topic"}. Questions must test conceptual understanding and reasoning, not simple memorization.\n\nSource:\n${promptText(source)}`, { responseMimeType: "application/json" });
  const questions = normalizeAssessment(raw);
  if (!questions) { const error = new Error("The AI returned an invalid assessment. Please try again."); error.status = 502; throw error; }
  return questions;
}

function sendAiError(res, error) {
  const publicError = toPublicError(error);
  return res.status(publicError.status).json({ error: publicError.message });
}

app.get("/auth/me", auth, (req, res) => res.json({ ok: true, userId: req.user.id }));
app.post("/auth/signup", async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");
  if (!email || password.length < 6) return res.status(400).json({ error: "Use a valid email and a password of at least 6 characters." });
  if (await User.findOne({ email })) return res.status(400).json({ error: "An account with this email already exists." });
  await User.create({ email, password: await bcrypt.hash(password, 10) });
  res.status(201).json({ success: true });
});
app.post("/auth/login", async (req, res) => {
  const user = await User.findOne({ email: String(req.body.email || "").trim().toLowerCase() });
  if (!user || !(await bcrypt.compare(String(req.body.password || ""), user.password))) return res.status(401).json({ error: "Invalid email or password." });
  res.json({ token: jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" }) });
});

app.post("/sources", auth, upload.single("file"), async (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).json({ error: "Choose a file to add as a source." });
  try {
    const extracted = await extractText(file);
    const text = extracted.text.trim();
    if (text.length < 20) return res.status(400).json({ error: extracted.type === "image" ? "No readable text was found in this image." : "This source does not contain enough readable text." });
    const source = await Source.create({ userId: req.user.id, fileName: file.originalname, sourceType: extracted.type, extractedText: text });
    res.status(201).json({ source });
  } catch (error) { res.status(error.status || 500).json({ error: error.message || "Unable to process this source." }); }
  finally { if (fs.existsSync(file.path)) fs.unlinkSync(file.path); }
});
app.get("/sources", auth, async (req, res) => res.json(await Source.find({ userId: req.user.id }).select("fileName sourceType notes createdAt updatedAt").sort({ createdAt: -1 })));
app.get("/sources/:id", auth, async (req, res) => {
  const source = await findOwnedSource(req.params.id, req.user.id);
  if (!source) return res.status(validId(req.params.id) ? 404 : 400).json({ error: validId(req.params.id) ? "Source not found." : "Invalid source id." });
  res.json(source);
});
app.delete("/sources/:id", auth, async (req, res) => {
  const source = await findOwnedSource(req.params.id, req.user.id);
  if (!source) return res.status(404).json({ error: "Source not found." });
  await source.deleteOne();
  await QuizAttempt.deleteMany({ userId: req.user.id, noteId: source._id });
  await Activity.deleteMany({ userId: req.user.id, sourceId: source._id });
  res.json({ success: true });
});
app.post("/sources/:id/ask", auth, async (req, res) => {
  const question = String(req.body.question || "").trim();
  if (!question) return res.status(400).json({ error: "Enter a question first." });
  const source = await findOwnedSource(req.params.id, req.user.id);
  if (!source) return res.status(404).json({ error: "Source not found." });
  try {
    const answer = (await generateText(`Answer using only the source content below. If it lacks the answer, say that plainly. Keep the answer helpful and concise.\n\nSource:\n${promptText(source)}\n\nQuestion: ${question}`)) || "The source does not provide enough information to answer that.";
    await Activity.create({ userId: req.user.id, sourceId: source._id, type: "ask", question, answer });
    res.json({ answer });
  }
  catch (error) { sendAiError(res, error); }
});
app.post("/sources/:id/notes", auth, async (req, res) => {
  const source = await findOwnedSource(req.params.id, req.user.id);
  if (!source) return res.status(404).json({ error: "Source not found." });
  const style = ["basic", "detailed", "cheatsheet"].includes(req.body.style) ? req.body.style : "basic";
  try {
    source.notes = await generateText(`Create ${style} study notes from this source. Use headings, concise explanations, and useful bullet points. Do not add information absent from the source.\n\nSource:\n${promptText(source)}`);
    await source.save();
    res.json({ notes: source.notes });
  } catch (error) { sendAiError(res, error); }
});
app.post("/sources/:id/:kind", auth, async (req, res) => {
  if (!["quiz", "assessment"].includes(req.params.kind)) return res.status(404).json({ error: "Action not found." });
  const source = await findOwnedSource(req.params.id, req.user.id);
  if (!source) return res.status(404).json({ error: "Source not found." });
  try { res.json({ questions: req.params.kind === "assessment" ? await generateAssessment(source) : await generateQuestions(source, "quiz") }); }
  catch (error) { sendAiError(res, error); }
});
app.post("/sources/:id/assessment/submit", auth, async (req, res) => {
  const source = await findOwnedSource(req.params.id, req.user.id);
  const responses = req.body.responses;
  if (!source) return res.status(404).json({ error: "Source not found." });
  if (!Array.isArray(responses) || responses.length !== 5 || responses.some((item) => !item || typeof item.question !== "string" || typeof item.answer !== "string" || !item.answer.trim())) return res.status(400).json({ error: "Answer every assessment question before submitting." });
  try {
    const raw = await generateText(`Assess the student's written answers using only the source. Return ONLY JSON: {"score":number,"total":${responses.length},"strengths":["..."],"weakAreas":["..."],"feedback":"brief encouraging feedback"}. Score must be an integer from 0 to ${responses.length}.\n\nSource:\n${promptText(source)}\n\nResponses:\n${JSON.stringify(responses)}`, { responseMimeType: "application/json" });
    const result = JSON.parse(raw);
    if (!Number.isInteger(result.score) || result.score < 0 || result.score > responses.length || !Array.isArray(result.strengths) || !Array.isArray(result.weakAreas)) throw new Error("The AI returned an invalid assessment result.");
    await QuizAttempt.create({ userId: req.user.id, noteId: source._id, score: result.score, total: responses.length, answers: Object.fromEntries(responses.map((item, index) => [index, item.answer])), attemptType: "assessment" });
    await Activity.create({ userId: req.user.id, sourceId: source._id, type: "assessment", score: result.score, total: responses.length });
    res.json({ score: result.score, total: responses.length, strengths: result.strengths.slice(0, 4), weakAreas: result.weakAreas.slice(0, 4), feedback: String(result.feedback || "Review the suggested areas and try again.") });
  } catch (error) { sendAiError(res, error); }
});
app.post("/quiz/submit", auth, async (req, res) => {
  const { score, total, answers, noteId, attemptType = "quiz" } = req.body;
  if (!validId(noteId) || !["quiz", "assessment"].includes(attemptType) || !Number.isInteger(score) || !Number.isInteger(total) || score < 0 || total < 1 || score > total || !answers || typeof answers !== "object") return res.status(400).json({ error: "Invalid quiz attempt." });
  if (!(await findOwnedSource(noteId, req.user.id))) return res.status(404).json({ error: "Source not found." });
  await QuizAttempt.create({ userId: req.user.id, noteId, score, total, answers, attemptType });
  await Activity.create({ userId: req.user.id, sourceId: noteId, type: attemptType, score, total });
  res.status(201).json({ success: true });
});
app.get("/sources/:id/activity", auth, async (req, res) => {
  const source = await findOwnedSource(req.params.id, req.user.id);
  if (!source) return res.status(404).json({ error: "Source not found." });
  res.json(await Activity.find({ userId: req.user.id, sourceId: source._id }).sort({ createdAt: -1 }).limit(50));
});
app.get("/quiz/history/:sourceId", auth, async (req, res) => {
  const source = await findOwnedSource(req.params.sourceId, req.user.id);
  if (!source) return res.status(404).json({ error: "Source not found." });
  res.json(await QuizAttempt.find({ userId: req.user.id, noteId: source._id }).sort({ createdAt: -1 }));
});
app.get("/dashboard/stats", auth, async (req, res) => {
  const attempts = await QuizAttempt.find({ userId: req.user.id });
  res.json({ totalSources: await Source.countDocuments({ userId: req.user.id }), totalAttempts: attempts.length, bestScore: Math.max(0, ...attempts.map((attempt) => attempt.score || 0)) });
});
app.use((error, _req, res, _next) => res.status(error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE" ? 413 : 500).json({ error: error instanceof multer.MulterError ? "This file is too large. The maximum size is 25 MB." : "Unable to complete this request." }));
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
