# Build stage
FROM node:20-slim AS build

# Create app directory
WORKDIR /opt/app

# Copy package files
COPY package*.json ./

# Install dependencies with increased memory limit
ENV NODE_OPTIONS="--max-old-space-size=4096"
RUN npm ci

# Copy source files
COPY src ./src
COPY assets ./assets
COPY config ./config
COPY scripts ./scripts

# Build frontend
RUN npm run build

# Production stage
FROM node:20-slim AS production
ENV NODE_ENV=production

# Create app directory
WORKDIR /opt/app

# Copy package files and install production dependencies
COPY package*.json config.default.yml ./
RUN npm ci --only=production --legacy-peer-deps

# Copy built files from build stage
COPY --from=build /opt/app/dist ./dist
COPY scripts ./scripts

# Add AWS and DynamoDB environment variables
ENV AWS_REGION=us-east-1
ENV DYNAMODB_TABLE=Whiteboards
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Expose port
EXPOSE 8080

# Start command with AWS credentials check
CMD ["sh", "-c", "if [ ! -z \"$AWS_ACCESS_KEY_ID\" ] && [ ! -z \"$AWS_SECRET_ACCESS_KEY\" ]; then npm run start; else echo 'Error: AWS credentials not provided' && exit 1; fi"]