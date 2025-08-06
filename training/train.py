import json
import random
from datetime import date

# User data
dob = date(2004, 1, 13)
age = date.today().year - dob.year - ((date.today().month, date.today().day) < (dob.month, dob.day))

# Core intents
intents = [
    # Greetings
    {
        "intent": "greeting",
        "user_phrases": ["hi", "hello", "hey", "yo", "hiya", "hey there", "good morning", "good evening", "what's up?", "sup"],
        "response": "👋 Hey there! How can I help you today? 😊"
    },

    # Affirmation
    {
        "intent": "affirmation",
        "user_phrases": ["okay", "ok", "oki", "okie", "k", "sure", "alright", "fine", "sounds good", "yep"],
        "response": "👍 Got it! Let's move forward 🚀"
    },

    # Age
    {
        "intent": "my_age",
        "user_phrases": ["how old are you?", "your age?", "what's your age?", "can you tell me your age?", "age pls"],
        "response": f"🎂 I'm {age} years old (born on 13 Jan 2004)!"
    },

    # Birthday
    {
        "intent": "birthday",
        "user_phrases": ["when is your birthday?", "your birthdate?", "birthday pls"],
        "response": "🎉 My birthday is on **13th January 2004** 🎂"
    },

    # University
    {
        "intent": "university",
        "user_phrases": ["which university are you in?", "tell me about your university", "what uni?", "where do you study", "college name?"],
        "response": "🎓 I study at **SZABIST University Islamabad (H-8)**. I'm in my 4th semester with a CGPA of 3.8 and have received 2 scholarships 📚"
    },

    # Skills
    {
        "intent": "skills",
        "user_phrases": ["what are your skills?", "your learnings?", "skills list", "tech stack?", "what tech you use?", "what do you know?"],
        "response": "💡 I'm skilled in **TypeScript, Next.js, NestJS, Docker, AWS**, and currently learning **Golang for cloud systems** 🚀"
    },

    # Lifestyle
    {
        "intent": "lifestyle",
        "user_phrases": ["do you smoke?", "do you drink?", "smoking?", "drinking?", "bad habits?"],
        "response": "🙅‍♂️ Nope! I don’t smoke or drink. I focus on staying healthy and productive 💪."
    },

    # Projects Overview
    {
        "intent": "projects_all",
        "user_phrases": ["tell me all your projects", "what have you built?", "show me your work", "projects list"],
        "response": "🚀 I've built projects like my **portfolio (microservices + Docker)**, **Authentication System**, **Binanify**, **DBMS (Aughr)**, **Console E-commerce**, and clones of **Instagram & Facebook**! 😊"
    },

    # Project: Authentication
    {
        "intent": "project_authentication",
        "user_phrases": ["authentication system details", "login project?", "auth system?", "secure login project"],
        "response": "🔐 I'm building a **secure auth system** using **Golang + Next.js** with JWT login, RBAC, and protected API routes!"
    },

    # Project: Binanify
    {
        "intent": "project_binanify",
        "user_phrases": ["binanify project", "crypto tracker", "binance api project", "real-time crypto app"],
        "response": "📈 **Binanify** is a real-time crypto tracking app using **Binance WebSockets** for live price updates, built with **Next.js & Node.js** 🚀"
    },

    # Project: DBMS (Aughr)
    {
        "intent": "project_dbms",
        "user_phrases": ["dbms project?", "augur project", "c++ dbms", "database management system project"],
        "response": "🗄️ **Aughr** is a console-based DBMS in **C++** supporting CRUD operations efficiently in CLI 💻"
    },

    # Project: Console E-commerce
    {
        "intent": "project_ecommerce",
        "user_phrases": ["ecommerce project", "console shopping app", "store project", "terminal ecommerce"],
        "response": "🛒 My **console-based e-commerce** store (OOP project) lets users browse products, add to cart, and purchase—all in terminal!"
    },

    # Project: Instagram Clone
    {
        "intent": "project_instagram",
        "user_phrases": ["instagram clone", "tailwind instagram", "social media clone"],
        "response": "📷 I built an **Instagram home page clone** using Tailwind CSS (for laptops), replicating the UI precisely 🎨"
    },

    # Project: Facebook Clone
    {
        "intent": "project_facebook",
        "user_phrases": ["facebook clone", "tailwind facebook", "static fb clone"],
        "response": "📘 I built a **static Facebook homepage clone** with Tailwind CSS to practice layout structuring 🚀"
    },

    # Chatbot Project
    {
        "intent": "project_chatbot",
        "user_phrases": ["chatbot project", "portfolio chatbot", "ai bot", "bot on your site"],
        "response": "🤖 My portfolio chatbot has fuzzy matching + admin panel and I'm planning to integrate it with OpenAI API soon!"
    },

    # Accounts/Links
    {
        "intent": "accounts",
        "user_phrases": ["github link", "linkedin?", "leetcode?", "instagram account", "social profiles"],
        "response": "🌐 Here are my profiles:\n🔗 GitHub: https://github.com/abdul-ghaffar01\n💼 LinkedIn: https://www.linkedin.com/in/abdul-ghaffar01/\n💻 LeetCode: https://leetcode.com/u/abdulghaffar01/\n📸 Instagram: https://www.instagram.com/i_abdul_ghaffar/"
    },

    # Small Talk
    {
        "intent": "small_talk",
        "user_phrases": ["how are you?", "how's it going?", "what's up?", "how do you do?", "you good?"],
        "response": "😄 I'm doing great, thanks for asking! What about you?"
    },

    # Default fallback
    {
        "intent": "default",
        "user_phrases": ["default"],
        "response": "🤷 Hmm, I'm not sure about that. Could you rephrase?"
    }
]

def paraphrase(phrase):
    variants = [
        phrase,
        phrase.lower(),
        phrase.capitalize(),
        phrase.replace("?", "??"),
        phrase.replace("?", ""),
        phrase.replace("you", "u"),
        phrase.replace("your", "ur")
    ]
    return list(set(variants))

data = []

for intent in intents:
    base_phrases = intent["user_phrases"]
    expanded_phrases = []
    for p in base_phrases:
        expanded_phrases.extend(paraphrase(p))

    for _ in range(9000 // len(intents)):  
        obj = {
            "intent": intent["intent"],
            "user_phrases": random.sample(expanded_phrases, min(len(expanded_phrases), max(3, len(expanded_phrases)//2))),
            "response": intent["response"]
        }
        data.append(obj)

while len(data) < 100000:
    random_intent = random.choice(intents)
    phrases = paraphrase(random.choice(random_intent["user_phrases"]))
    obj = {
        "intent": random_intent["intent"],
        "user_phrases": random.sample(phrases, min(len(phrases), 3)),
        "response": random_intent["response"]
    }
    data.append(obj)

with open("fuzzy_data.json", "w") as f:
    json.dump(data, f, indent=2)

print("✅ fuzzy_data.json generated!")
