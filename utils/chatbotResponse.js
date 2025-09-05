import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import stringSimilarity from "string-similarity";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load JSON and pick the train array
const rawData = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../training/train.json"), "utf-8")
);

const chatbotData = Array.isArray(rawData) ? rawData : rawData.train || [];

// Build phrase → intent lookup
const allPhrases = chatbotData.reduce((acc, entry) => {
  if (entry.user_phrases && Array.isArray(entry.user_phrases)) {
    entry.user_phrases.forEach((p) => {
      acc.push({ phrase: p.toLowerCase(), intent: entry.intent });
    });
  }
  return acc;
}, []);

const phrasesOnly = allPhrases.map((p) => p.phrase);

// Pick a random response
function getRandomResponse(entry) {
  if (Array.isArray(entry.responses) && entry.responses.length > 0) {
    return entry.responses[Math.floor(Math.random() * entry.responses.length)];
  }
  if (typeof entry.response === "string") {
    return entry.response;
  }
  return "🤷 I'm not sure how to respond to that. Could you clarify?";
}

// Main fuzzy matching function
export function getChatbotResponse(userMessage = "") {
  const input = userMessage.trim().toLowerCase();
  if (!input) {
    return "🤔 I didn't catch that. Can you rephrase?";
  }

  const match = stringSimilarity.findBestMatch(input, phrasesOnly).bestMatch;

  if (match.rating > 0.5) {
    const matched = allPhrases.find((p) => p.phrase === match.target);
    if (matched) {
      const entry = chatbotData.find((e) => e.intent === matched.intent);
      if (entry) {
        return getRandomResponse(entry);
      }
    }
  }

  return "🤷 I'm not sure how to respond to that. Could you clarify?";
}
