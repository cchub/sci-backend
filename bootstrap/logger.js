/**
 * Log handler.
 */
'use strict';
/** @type {Object} config */
const config = require('config');
/** @type {{ createLogger: function, transports: object, format: object }} */
const { createLogger, transports, format } = require('winston');
require('winston-daily-rotate-file');

/** @type {{ combine: function, timestamp: function, logstash: function }} */
const { combine, timestamp, logstash } = format;

/**
 * @type {Object}
 * @desc Daily Rotate File transport
 */
const transport = (name) =>
    new transports.DailyRotateFile({
        filename: `app-${name}-%DATE%.log`,
        dirname: 'logs',
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: '30d',
        auditFile: `logs/${config.get('app.app_name')}.json`,
        format: combine(timestamp(), logstash()), //combine(json(), timestamp(), myFormat),
        level: 'silly',
    });

/**
 * @desc Logger.
 * @type {Object}
 */
const logger = createLogger({
    level: 'silly',
    transports: [transport('log')],
    exceptionHandlers: [transport('exception')],
});

if (process.env.NODE_ENV !== 'production') {
    // Log to console when in development mode.
    logger.exceptions.handle(new transports.Console({}));
}

exports = module.exports = logger; // eslint-disable-line no-global-assign
