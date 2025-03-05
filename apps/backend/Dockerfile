FROM node:18.20-alpine3.21 AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY . .
RUN npm run build

FROM node:18.20-alpine3.21 AS production
WORKDIR /app
COPY package*.json .
RUN npm ci --only=production && npm cache clean --force
COPY --from=build /app/dist ./dist
RUN chown node:node ./
USER node
# ARG NODE_ENV=production
# ENV NODE_ENV $NODE_ENV
EXPOSE 3001
CMD ["node", "./dist/index.js"]
