FROM node:18-alpine

WORKDIR /app

# Install system dependencies (like ffmpeg for voice assistant conversions)
RUN apk add --no-cache ffmpeg

# Copy dependency configs
COPY package*.json ./

# Install packages with legacy peer deps compatibility
RUN npm install --legacy-peer-deps

# Copy application code
COPY . .

# Expose port
EXPOSE 5000

# Start server (which also boots our BullMQ workers)
CMD ["npm", "start"]
