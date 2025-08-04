# Use Node.js LTS (adjust version if needed)
FROM node:18-alpine

# Set working directory
WORKDIR /chatbot-backend

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --production

# Copy all files (including server.js and other folders)
COPY . .

# Expose port 
EXPOSE 3009

# Start server
CMD ["node", "server.js"]

