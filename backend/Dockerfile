FROM node:20-alpine

# Install OpenSSL, PostgreSQL client (for psql), and other dependencies required by Prisma
RUN apk add --no-cache openssl libc6-compat postgresql-client || apk add --no-cache openssl libc6-compat

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npx prisma generate

EXPOSE 3000

CMD ["npm", "run", "dev"]

