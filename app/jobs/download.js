const { fork } = require("child_process");
const cron = require("node-cron");
const { resolve } = require("path");

const script = resolve(resolve(__dirname, "..", "modules/drive.js"));

exports.downloading = cron.schedule(
  "0 03 * * *",
  async () => {
    const child = fork(script);
    child.on("message", async (data) => {
      console.log(data);
    });
  },
  {
    scheduled: true,
    timezone: "Africa/Harare",
  }
);
