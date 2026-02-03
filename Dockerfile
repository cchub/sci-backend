ARG NODE_VERSION=12.13
FROM node:${NODE_VERSION}-alpine As base_node

RUN apk add --update \
    python \
    python-dev \
    py-pip \
    build-base

RUN set -ex \
    && apk add --no-cache --virtual .build-deps ca-certificates openssl \
    && wget -qO- "https://bitbucket.org/ariya/phantomjs/downloads/phantomjs-2.5.0-beta-linux-ubuntu-xenial-x86_64.tar.gz" | tar xz -C / \
    && apk del .build-deps

# Or whatever Node version/image you want
WORKDIR /usr/src/app

COPY ./package*.json ./

ARG NODE_ENV=production
RUN if [ ${NODE_ENV} = "production" ]; then \
    npm i --silent --unsafe-perm --only production; \
    else \
    npm i --unsafe-perm; \
    fi;

# RUN npm install phantomjs-prebuilt

# RUN npm install phantomjs

ARG PORT=3333

EXPOSE ${PORT}

CMD npm start
