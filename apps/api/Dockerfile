FROM node:24.13.0-alpine AS builder

WORKDIR /app
COPY . .
RUN npx turbo prune --scope=@example/api --docker

FROM node:24.13.0-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/out/json/ ./
RUN npm ci --omit=dev --ignore-scripts

COPY --from=builder /app/out/full/ ./

CMD ["npm", "run", "--workspace=@example/api", "start"]
