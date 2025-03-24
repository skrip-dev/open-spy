FROM node:22
WORKDIR /app

COPY package*.json ./
RUN npm install

ADD . ./

RUN npx prisma generate
RUN npm run build

CMD ["npm", "run", "test:ci"]

