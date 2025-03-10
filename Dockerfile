FROM node:22-slim AS development-dependencies-env
WORKDIR /app
COPY package.json package-lock.json /app/
COPY apps/frontend/package.json /app/apps/frontend/package.json
COPY apps/backend/package.json /app/apps/backend/package.json
RUN npm ci

FROM node:22-slim AS production-dependencies-env
WORKDIR /app
COPY package.json package-lock.json /app/
COPY apps/frontend/package.json /app/apps/frontend/package.json
COPY apps/backend/package.json /app/apps/backend/package.json
RUN npm ci --omit=dev --workspace apps/backend

FROM node:22-slim AS build-env
COPY . /app/
COPY --from=development-dependencies-env /app/node_modules /app/node_modules
WORKDIR /app
RUN npm run build

FROM nginx:stable-alpine AS production-frontend
COPY apps/frontend/nginx.conf /etc/nginx/nginx.conf
COPY --from=build-env /app/apps/frontend/build/client /usr/share/nginx/html
EXPOSE 80
ENTRYPOINT ["nginx", "-g", "daemon off;"] 

FROM gcr.io/distroless/nodejs22 AS production-backend
WORKDIR /app
ENV NODE_ENV=production
EXPOSE 3001
COPY --from=production-dependencies-env /app/node_modules /app/node_modules
COPY --from=build-env /app/apps/backend/dist /app/dist
CMD ["dist/index.js"]
