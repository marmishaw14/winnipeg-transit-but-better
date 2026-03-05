
  # Build stage
  FROM node:20-alpine AS build
  WORKDIR /app
  
  COPY package*.json ./
  COPY tsconfig.json ./
  RUN npm ci
  
  COPY src ./src
  COPY public ./public
  
  # Compile backend TypeScript -> dist/ #
  RUN npm run build
  
  

  # Production stage
  FROM node:20-alpine AS runtime
  WORKDIR /app
  ENV NODE_ENV=production
  
  COPY package*.json ./
  RUN npm ci --omit=dev && npm cache clean --force
  
  # Copy compiled output only
  COPY --from=build /app/dist ./dist
  COPY --from=build /app/public ./public
  
  # Run as non-root
  RUN addgroup -S nodejs && adduser -S nodejs -G nodejs
  USER nodejs
  
  EXPOSE 3009
  
  HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
    CMD node -e "require('http').get('http://127.0.0.1:3009/health', r => process.exit(r.statusCode === 200 ? 0 : 1))"
  
  CMD ["node", "dist/server.js"]
  
