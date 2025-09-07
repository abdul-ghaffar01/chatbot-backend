import jwt from 'jsonwebtoken';

const payload = {};  // empty payload

const token = jwt.sign(payload, process.env.JWT_SECRET_FOR_BOT_TO_HIT_RESPONSE_URL);

console.log("Generated Token:", token);
