FROM node:23-alpine AS development-dependencies-env
WORKDIR /app
COPY package.json package-lock.json /app/
COPY apps/frontend/package.json /app/apps/frontend/package.json
COPY apps/backend/package.json /app/apps/backend/package.json
RUN npm ci

FROM node:23-alpine AS production-dependencies-env
WORKDIR /app
COPY package.json package-lock.json /app/
COPY apps/frontend/package.json /app/apps/frontend/package.json
COPY apps/backend/package.json /app/apps/backend/package.json
RUN npm ci --omit=dev

FROM node:23-alpine AS build-env
COPY . /app/
COPY --from=development-dependencies-env /app/node_modules /app/node_modules
WORKDIR /app
RUN npm run build

FROM nginx:stable-alpine AS production-frontend
COPY apps/frontend/nginx.conf /etc/nginx/nginx.conf
COPY --from=build-env /app/apps/frontend/build/client /usr/share/nginx/html
EXPOSE 80
ENTRYPOINT ["nginx", "-g", "daemon off;"] 

FROM node:23-alpine AS production-backend
WORKDIR /app
COPY package.json package-lock.json /app/
COPY apps/frontend/package.json /app/apps/frontend/package.json
COPY apps/backend/package.json /app/apps/backend/package.json
COPY --from=production-dependencies-env /app/node_modules /app/node_modules
RUN npm prune --workspace apps/backend
COPY --from=build-env /app/apps/backend/dist /app/dist
RUN chown node:node ./
USER node
ENV NODE_ENV production
EXPOSE 3001
ENTRYPOINT ["node", "dist/index.js"]
