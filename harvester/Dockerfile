FROM node:24-alpine

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev

COPY . .

ENV WLA_HARVESTER_PORT=47823
EXPOSE 47823

CMD ["node", "server.js"]
