# Use Node.js 20 Alpine for a lightweight base image
FROM node:20-alpine

# Set working directory inside the container
WORKDIR /app

# Copy package files first to leverage Docker cache for dependencies
COPY package*.json ./

# Install production dependencies only (using ci for deterministic installs)
# If you need devDependencies (e.g. for build scripts), remove --only=production
# Install dependencies using npm install to handle potential lockfile mismatches
RUN npm install --only=production

# Copy the rest of the application code
COPY . .

# Expose the port the app runs on (matches env.js default usually 5000)
EXPOSE 5000

# Use a non-root user for security
USER node

# Start the application
CMD ["npm", "start"]
