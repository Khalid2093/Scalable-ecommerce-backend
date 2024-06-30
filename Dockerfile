# Use the official Node.js image as the base image
FROM node:14

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code to the working directory
COPY . .

# Build the TypeScript code
RUN npm run build

# Expose the port on which the server will run
EXPOSE 3000

# Set environment variables
ENV MONGO_HOST=localhost
ENV MONGO_PORT=27017

# Start the server
CMD ["node", "dist/index.js"]