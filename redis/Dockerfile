ARG REDIS_VERSION=5.0.8

FROM redis:${REDIS_VERSION}-alpine

RUN mkdir -p /usr/local/etc/redis

COPY redis.conf /usr/local/etc/redis/redis.conf

VOLUME /data

EXPOSE 6379
