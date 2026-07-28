/**
 * @description Workers
 */
"use strict";
const Runner = require("./commands/Runner");

// Connect to DB, then run seed once on startup
require('../bootstrap/db')().then(() => {
    require('./commands/seed')();
});

const interval = setInterval(() => {
    const runner = new Runner();
    runner.command(require.resolve("./commands/daily_foreign_exchange")).everyhour().handle();
}, 1000);

interval.unref();
