import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import stringSimilarity from 'string-similarity';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load the fuzzy data
const chatbotData = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../training/train.json'), 'utf-8')
);

export function getChatbotResponse(userMessage = '') {
    const input = userMessage.trim().toLowerCase();

    if (!input) {
        return "🤔 I didn't catch that. Can you rephrase?";
    }

    // Flatten all phrases from every intent
    const allPhrases = chatbotData.flatMap(entry => entry.user_phrases.map(p => ({ phrase: p, intent: entry.intent })));

    // Extract just the phrases for similarity matching
    const phrasesOnly = allPhrases.map(p => p.phrase);

    // Find best fuzzy match
    const bestMatch = stringSimilarity.findBestMatch(input, phrasesOnly).bestMatch;

    if (bestMatch.rating > 0.5) {
        // Get the intent linked to this phrase
        const matched = allPhrases.find(p => p.phrase === bestMatch.target);
        if (matched) {
            const matchedEntry = chatbotData.find(entry => entry.intent === matched.intent);
            if (matchedEntry) {
                return matchedEntry.response;
            }
        }
    }

    // Default fallback response
    return "🤷 I'm not sure how to respond to that. Could you clarify?";
}
