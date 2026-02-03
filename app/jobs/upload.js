const { fork } = require("child_process");
const cron = require("node-cron");
const { resolve } = require("path");

const script = resolve(resolve(__dirname, "..", "helpers/response.js"));
const script1 = resolve(
  resolve(__dirname, "..", "modules/foreign_exchange/index.js")
);

exports.uploading = cron.schedule(
  "0 04 * * *",
  async () => {
    const child = fork(script);
    child.on("exit", () => {
      console.log("\x1b[34m%s\x1b[0m", "[info]: Job completed");
    });
  },
  {
    scheduled: true,
    timezone: "Africa/Harare",
  }
);

exports.foreignExchange = cron.schedule(
  "0 03 * * *",
  async () => {
    const child = fork(script1);
    child.on("exit", () => {
      console.log("\x1b[34m%s\x1b[0m", "[info]: Foreign Exchange updated");
    });
  },
  {
    scheduled: true,
    timezone: "Africa/Harare",
  }
);
