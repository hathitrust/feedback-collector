FROM node:18.16.0 AS development

LABEL org.opencontainers.image.source https://github.com/hathitrust/feedback-collector

WORKDIR /usr/src/app

RUN npm config set update-notifier false
CMD npm start

FROM development AS production
RUN npm install --production
COPY . /usr/src/app
