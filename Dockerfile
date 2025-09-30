FROM node:24

WORKDIR /app

COPY package*.json ./
RUN npm install

ADD . ./

RUN npx prisma generate
RUN npm run build

CMD ["npm", "start"]

