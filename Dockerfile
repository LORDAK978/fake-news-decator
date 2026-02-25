FROM node:18-alpine

WORKDIR /app

# copy package files first (for caching)
COPY package*.json ./

# install dependencies  ✅ IMPORTANT
RUN npm install

# copy remaining project
COPY . .

ENV PORT=8080

EXPOSE 8080

CMD ["node", "server.js"]
