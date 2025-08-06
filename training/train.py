import json
import random
from datetime import date

# User data
dob = date(2004, 1, 13)
age = date.today().year - dob.year - ((date.today().month, date.today().day) < (dob.month, dob.day))

# Core intents
intents = [
    {
        "intent": "affirmation",
        "user_phrases": ["okay", "ok", "oki", "okie", "k", "sure", "alright", "fine", "sounds good", "yep"],
        "response": "👍 Got it! Let's move forward 🚀"
    },
    {
        "intent": "my_age",
        "user_phrases": ["how old are you?", "your age?", "what's your age?", "can you tell me your age?", "age pls"],
        "response": f"🎂 I'm {age} years old (born on 13 Jan 2004)!"
    },
    {
        "intent": "birthday",
        "user_phrases": ["when is your birthday?", "your birthdate?", "birthday pls"],
        "response": "🎉 My birthday is on **13th January 2004** 🎂"
    },
    {
        "intent": "university",
        "user_phrases": ["which university are you in?", "tell me about your university", "what uni?", "where do you study"],
        "response": "🎓 I study at **SZABIST University Islamabad (H-8)**. I'm in my 4th semester with a CGPA of 3.8 and have received 2 scholarships 📚"
    },
    {
        "intent": "lifestyle",
        "user_phrases": ["do you smoke?", "do you drink?", "smoking?", "drinking?"],
        "response": "🙅‍♂️ Nope! I don’t smoke or drink. I focus on staying healthy and productive 💪."
    },
    {
        "intent": "skills",
        "user_phrases": ["what are your skills?", "your learnings?", "skills list", "tech stack?", "what tech you use?"],
        "response": "💡 I'm skilled in TypeScript, Next.js, NestJS, Docker, AWS, and currently learning Golang for cloud-based systems 🚀"
    },
    {
        "intent": "projects_all",
        "user_phrases": ["tell me all your projects", "what have you built?", "show me your work", "projects list"],
        "response": "🚀 I've worked on projects like my **portfolio** (microservices + Docker), **Authentication System**, **Binanify**, **DBMS (Aughr)**, **Console E-commerce**, and clones of **Instagram** & **Facebook**! 😊"
    },
    {
        "intent": "project_authentication",
        "user_phrases": ["authentication system details", "login project?", "auth system?", "secure login project"],
        "response": "🔐 I'm building a secure auth system using **Golang + Next.js** with JWT login, RBAC, and protected API routes!"
    },
    {
        "intent": "project_dbms",
        "user_phrases": ["dbms project?", "augur project", "c++ dbms", "database management system project"],
        "response": "🗄️ Aughr is a **console-based DBMS** in C++ that supports CRUD operations efficiently with a structured CLI design 💻"
    },
    {
        "intent": "accounts",
        "user_phrases": ["github link", "linkedin?", "leetcode?", "instagram account"],
        "response": "🌐 Here are my accounts:\n🔗 GitHub: https://github.com/abdul-ghaffar01\n💼 LinkedIn: https://www.linkedin.com/in/abdul-ghaffar01/\n💻 LeetCode: https://leetcode.com/u/abdulghaffar01/\n📸 Instagram: https://www.instagram.com/i_abdul_ghaffar/"
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
