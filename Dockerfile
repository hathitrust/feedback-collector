FROM node:22-slim AS development

LABEL org.opencontainers.image.source https://github.com/hathitrust/feedback-collector


WORKDIR /usr/src/app
COPY package*.json .
RUN npm install

COPY . /usr/src/app

RUN npm config set update-notifier false
CMD npm start

FROM development AS production
COPY . /usr/src/app
RUN npm install --omit=dev
