# Use official Node.js LTS image
FROM node:22-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy backend code
COPY . .

# Expose port (default: 4000)
EXPOSE 5000

# Start the backend
CMD ["npm", "start"]
