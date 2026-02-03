/**
 * @description Workers
 */
"use strict";
// Dependencies...
const Runner = require("./commands/Runner");
// const cron = require("node-cron");


require("./commands/reports")();

const interval = setInterval(() => {
    require('../bootstrap/db')()
    const runner = new Runner();

    runner.command(require.resolve("./commands/reports")).everyhour().handle();
    runner
        .command(require.resolve("./commands/report_sheet"))
        .everyMinute()
        .handle();
}, 1000);

interval.unref();

