import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import stringSimilarity from 'string-similarity';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load the training data
const chatbotData = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../training/train.json'), 'utf-8')
);

// Preprocess: flatten user phrases and keep intent references
const allPhrases = chatbotData.flatMap(entry => {
  return (entry.user_phrases || []).map(p => ({
    phrase: p.toLowerCase(),
    intent: entry.intent
  }));
});
const phrasesOnly = allPhrases.map(p => p.phrase);

// Helper: pick a random response variant or fallback
function getRandomResponse(entry) {
  if (Array.isArray(entry.responses) && entry.responses.length > 0) {
    return entry.responses[Math.floor(Math.random() * entry.responses.length)];
  }
  if (typeof entry.response === 'string') {
    return entry.response;
  }
  return null;
}

// Main fuzzy matching function
export function getChatbotResponse(userMessage = '') {
  const input = userMessage.trim().toLowerCase();
  if (!input) {
    return "🤔 I didn't catch that. Can you rephrase?";
  }

  const match = stringSimilarity.findBestMatch(input, phrasesOnly).bestMatch;
  if (match.rating > 0.5) {
    const matched = allPhrases.find(p => p.phrase === match.target);
    if (matched) {
      const entry = chatbotData.find(e => e.intent === matched.intent);
      if (entry) {
        const reply = getRandomResponse(entry);
        if (reply) return reply;
      }
    }
  }

  return "🤷 I'm not sure how to respond to that. Could you clarify?";
}
