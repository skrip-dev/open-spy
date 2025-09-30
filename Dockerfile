FROM node:24

WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps

ADD . ./

RUN npx prisma generate
RUN npm run build

CMD ["npm", "start"]

