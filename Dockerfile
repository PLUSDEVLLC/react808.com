# Use a base Node image
FROM node:20-slim

# Install necessary utilities for health checks
RUN apt-get update && apt-get install -y wget curl

# Set environment variables for Sharp prebuilt binaries to avoid source builds
ENV SHARP_IGNORE_GLOBAL_LIBVIPS=true
ENV PORT=3000

# Set the working directory
WORKDIR /app

# Copy the package.json and pnpm-lock.yaml
COPY package.json pnpm-lock.yaml ./

# Install `pnpm` globally
RUN npm install -g pnpm

# Install dependencies using pnpm
RUN pnpm install --frozen-lockfile

# Copy the project files to the working directory
COPY . .

# Build the Astro project
RUN pnpm run build

# Expose the correct port
EXPOSE 3000

# Start the application using the preview command
CMD ["pnpm", "run", "preview"]
