FROM mongo:latest

CMD [ "mongod", "--auth" ]

VOLUME /data/db /data/configdb /var/log/mongodb

ARG PORT=27017

EXPOSE ${PORT}
