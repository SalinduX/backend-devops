FROM node:26-alpine

WORKDIR /app

# 1) dependencies මුලින් (cache වෙන්න)
COPY package*.json ./
RUN npm ci --omit=dev

# 2) ඉන්පස්සේ source code
COPY src ./src

EXPOSE 3000

CMD ["node", "src/server.js"]