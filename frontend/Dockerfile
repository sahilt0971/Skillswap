FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all files
COPY . .

# Expose port
EXPOSE 3000

# Set environment variable for API URL
ENV REACT_APP_API_URL=http://localhost:5000

# Set environment for React to bind to all interfaces
ENV HOST=0.0.0.0

# Start the development server
CMD ["npm", "start"]

