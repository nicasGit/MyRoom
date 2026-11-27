FROM node:24-alpine AS build
WORKDIR /app
COPY package*.json ./
COPY client/package.json client/package.json
COPY server/package.json server/package.json
RUN npm ci
COPY client client
COPY server server
RUN npm run build && npm prune --omit=dev

FROM node:24-alpine
RUN apk add --no-cache nginx jq
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/server/package.json ./server/package.json
COPY --from=build /app/server/dist ./server/dist
COPY --from=build /app/client/dist /var/www/myroom
COPY haos-addon/nginx.conf /etc/nginx/http.d/default.conf
COPY haos-addon/run.sh /app/run.sh
RUN chmod +x /app/run.sh
EXPOSE 8080
CMD ["/bin/sh", "/app/run.sh"]
