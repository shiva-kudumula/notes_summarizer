const { GoogleGenAI } = require("@google/genai");

let client;

function getClient() {
  if (!process.env.GEMINI_API_KEY) {
    const error = new Error("AI service is not configured.");
    error.status = 503;
    throw error;
  }

  client ??= new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  return client;
}

function toPublicError(error) {
  const status = error?.status || error?.response?.status;
  if (status === 429 || /quota|rate limit|resource exhausted/i.test(error?.message || "")) {
    return { status: 429, message: "AI service limit reached. Please try again later." };
  }
  if (status === 503) return { status, message: error.message };
  return { status: 502, message: "AI service could not complete this request. Please try again." };
}

async function generateText(contents, config = {}) {
  const response = await getClient().models.generateContent({
    model: "gemini-2.5-flash",
    contents,
    config
  });
  return response.text?.trim() || "";
}

module.exports = { generateText, toPublicError };
