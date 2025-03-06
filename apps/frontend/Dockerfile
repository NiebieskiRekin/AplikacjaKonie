FROM node:20-alpine AS development-dependencies-env
WORKDIR /app
COPY package.json package-lock.json /app/
RUN npm ci

FROM node:20-alpine AS build-env
COPY . /app/
COPY --from=development-dependencies-env /app/node_modules /app/node_modules
WORKDIR /app
RUN npm run build

FROM nginx:stable-alpine AS production
COPY nginx.conf /etc/nginx/nginx.conf
COPY --from=build-env /app/build /usr/share/nginx/html
EXPOSE 80
ENTRYPOINT ["nginx", "-g", "daemon off;"] 
