FROM node:20-alpine AS development-dependencies-env
COPY . /app
WORKDIR /app
RUN npm ci

FROM node:20-alpine AS build-env
COPY . /app/
COPY --from=development-dependencies-env /app/node_modules /app/node_modules
WORKDIR /app
RUN npm run build

FROM nginx:stable-alpine AS production
COPY ./package.json package-lock.json /app/
COPY ../../infra/Ansible/nginx-frontend/ /etc/nginx/
# COPY --from=production-dependencies-env /app/node_modules /app/node_modules
COPY --from=build-env /app/build /usr/share/nginx/html
WORKDIR /app
CMD ["npm", "run", "start"]

EXPOSE 80
ENTRYPOINT ["nginx", "-g", "daemon off;"] 
