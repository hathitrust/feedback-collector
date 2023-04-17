LABEL org.opencontainers.image.source https://github.com/hathitrust/feedback-collector

FROM node:18.16.0

COPY . /app
WORKDIR /app

RUN npm install
CMD npm start
