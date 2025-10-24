# syntax=docker/dockerfile:1
FROM node:24-slim AS build-env
WORKDIR /app
COPY --link package.json package-lock.json /app/
COPY --link apps/frontend/package.json /app/apps/frontend/package.json
COPY --link apps/backend/package.json /app/apps/backend/package.json
COPY --link packages/api-client/package.json /app/packages/api-client/package.json
RUN npm pkg delete scripts.prepare && npm ci --mount=type=cache,target=/root/.npm,id=npm-all-deps
COPY . .
RUN npm run build

FROM node:24-slim AS production-dependencies-env
WORKDIR /app
COPY --link package.json package-lock.json /app/
COPY --link apps/backend/package.json /app/apps/backend/package.json
RUN npm pkg delete scripts.prepare && npm ci --mount=type=cache,target=/root/.npm,id=npm-prod-deps --omit=dev --workspace apps/backend

FROM cgr.dev/chainguard/nginx:latest AS production-frontend
COPY --link apps/frontend/nginx.conf /etc/nginx/nginx.conf
COPY --from=build-env /app/apps/frontend/build/client /usr/share/nginx/html
EXPOSE 80
ENTRYPOINT ["nginx", "-g", "daemon off;"] 

FROM gcr.io/distroless/nodejs24:nonroot AS production-backend
WORKDIR /app
ENV NODE_ENV=production
EXPOSE 3001
COPY --from=production-dependencies-env /app/node_modules /app/node_modules
COPY --from=production-dependencies-env /app/apps/backend/node_modules /app/apps/backend/node_modules
COPY --from=build-env /app/apps/backend/dist /app/apps/backend/dist
CMD ["apps/backend/dist/index.js"]
