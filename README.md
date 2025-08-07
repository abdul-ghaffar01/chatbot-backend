

# 🤖 AI Chatbot Backend – Abdul Ghaffar's Portfolio

This is the backend service for the AI chatbot used on [iabdulghaffar.com/chat](https://iabdulghaffar.com/chat). It enables communication between users and an intelligent agent, with support for training data, intent management, and dynamic responses.

---

## 🧠 Features

- RESTful API built with **Express.js**
- Stores training data (intents, examples, responses) in **MongoDB**
- Supports chatbot training panel (CRUD operations)
- WebSocket support for real-time message delivery.
- Integrates with **AI agents** for generating smart responses
- Secure and scalable setup, ready for deployment

---

## ⚙️ Tech Stack

- **Backend:** Node.js, Express.js
- **Database:** MongoDB (Mongoose)
- **AI Integration:** OpenAI GPT
- **Deployment:** VPS (Linux-based)

---

## 📦 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/abdul-ghaffar01/chatbot-backend.git
cd chatbot-backend
````

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

Create a `.env` file in the root directory:

```env
# MongoDb uri
MONGODB_URI=mongodb://localhost:27017/chatbot

# jwt secret
JWT_SECRET=jwt_secret

PORT=3009


# My chat account id
ADMIN_ACCOUNT_ID=admin_account_id
BOT_ACCOUNT_ID=bot_account_id

ADMIN_EMAIL=admin_email_to_verify_admin_login
ADMIN_PASSWORD=admin_password_for_admin_panel

# google authentication
GOOGLE_CLIENT_ID=goole_client_id_for_google_auth
GOOGLE_CLIENT_SECRET=google_secret
FRONTEND_URL=https://iabdulghaffar.com

CHATBOT_BACKEND_URL=chatbot.iabdulghaffar.com

# Jwt secret for chatbot
JWT_SECRET_BOT=jwt_secret_for_bot_api_key_creation
CHATBOT_API_TOKEN=api_token_to_hit_chatbot_api

ENV_MODE="prod"

```

### 4. Start the Server

```bash
npm run dev
```

Server will start at: [http://localhost:3009](http://localhost:3009)

---


## 📁 Folder Structure

```
chatbot-backend/
├── controllers/
├── models/
├── training/
├── helper/
├── middlewares/
├── .env
├── Dockerfile
├── server.js
```

---

## 🚀 Deployment

This backend is deployed on a private **VPS server** using:

* Docker for containerization
* Nginx as a reverse proxy
* SSL via Let's Encrypt


---

## 🙋‍♂️ Author

**Abdul Ghaffar Soomro**
🔗 [iabdulghaffar.com](https://iabdulghaffar.com)

---

## 📄 License

MIT License – free to use, modify, and deploy with attribution.

