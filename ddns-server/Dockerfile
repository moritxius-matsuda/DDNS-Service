FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Create logs directory
RUN mkdir -p logs

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --omit=dev

# Copy source code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S ddns -u 1001

# Change ownership
RUN chown -R ddns:nodejs /usr/src/app
USER ddns

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
CMD ["node", "server.js"]