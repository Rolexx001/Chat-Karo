
FROM node:22-bookworm-slim

WORKDIR /app

# Copy dependency configs
COPY package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy application code
COPY . .

EXPOSE 5000

CMD ["npm", "start"]
