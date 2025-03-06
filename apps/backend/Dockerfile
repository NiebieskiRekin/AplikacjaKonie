FROM node:20-alpine AS development-dependencies-env
WORKDIR /app
COPY package.json package-lock.json /app/
RUN npm ci

FROM node:20-alpine AS production-dependencies-env
COPY package.json package-lock.json /app/
WORKDIR /app
RUN npm ci --omit=dev

FROM node:20-alpine AS build-env
COPY . /app/
COPY --from=development-dependencies-env /app/node_modules /app/node_modules
WORKDIR /app
RUN npm run build

FROM node:20-alpine AS production
WORKDIR /app
COPY package.json package-lock.json /app/
COPY --from=production-dependencies-env /app/node_modules /app/node_modules
COPY --from=build-env /app/dist /app/dist
RUN chown node:node ./
USER node
ENV NODE_ENV production
EXPOSE 3001
CMD ["npm", "run", "start"]
