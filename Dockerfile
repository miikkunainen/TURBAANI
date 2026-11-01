FROM node:24-alpine
WORKDIR /app
COPY package.json server.cjs storage.cjs build.cjs ./
COPY public ./public
RUN node build.cjs && mkdir -p /app/data && chown -R node:node /app
USER node
ENV NODE_ENV=production PORT=8080 DATA_FILE=/app/data/purjehdus.sqlite
EXPOSE 8080
VOLUME ["/app/data"]
CMD ["node", "server.cjs"]
