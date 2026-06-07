FROM node:20-slim
WORKDIR /app

# Copy root package files
COPY package.json package-lock.json ./

# Install dependencies (from root)
RUN npm install

# Copy everything
COPY . .

# Expose the port Hono is listening on
EXPOSE 3000

# Start the worker using tsx with the correct .tsx extension
CMD ["npx", "tsx", "packages/pdf-worker/src/index.tsx"]
