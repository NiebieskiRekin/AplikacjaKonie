FROM node:20-alpine AS development-dependencies-env
WORKDIR /app
COPY **/package.json package-lock.json /app/
RUN npm ci

FROM node:20-alpine AS production-dependencies-env
WORKDIR /app
COPY **/package.json package-lock.json /app/
RUN npm ci --omit=dev

FROM node:20-alpine AS build-env
COPY . /app/
COPY --from=development-dependencies-env /app/node_modules /app/node_modules
WORKDIR /app
RUN npm run build

FROM nginx:stable-alpine AS production-frontend
COPY apps/frontend/nginx.conf /etc/nginx/nginx.conf
COPY --from=build-env /app/apps/frontend/build /usr/share/nginx/html
EXPOSE 80
ENTRYPOINT ["nginx", "-g", "daemon off;"] 

FROM node:20-alpine AS production-backend
WORKDIR /app
COPY **/package.json package-lock.json /app/
COPY --from=production-dependencies-env /app/apps/backend/node_modules /app/node_modules
COPY --from=build-env /app/apps/backend/dist /app/dist
RUN chown node:node ./
USER node
ENV NODE_ENV production
EXPOSE 3001
ENTRYPOINT ["node", "dist/index.js"]
