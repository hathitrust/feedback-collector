FROM node:18.16.0

COPY . /app
WORKDIR /app

RUN npm install
CMD npm start
