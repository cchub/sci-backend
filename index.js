/**
 * Main server file.
 */
// Base directory.
global.appRoot = __dirname;

// Load environment variables based on current environment
const env = process.env.NODE_ENV;
const path = require("path");
const worker = require("./worker/index");
const helmet = require("helmet");

let dotenv = require("dotenv");
let result = dotenv.config({
  path: `./.env${typeof env === "string" ? `.${env.trim()}` : ""}`,
});

if (result.error) {
  process.stdout.write(
    `\x1b[39m\x1b[33m[WARN] No .env.${env.trim()} file found...\x1b[39m\n`
  );
  process.stdout.write(
    "\x1b[39m\x1b[33m[WARN] Defaulting to the \x1b[1m.env\x1b[0m \x1b[33mfile...\x1b[39m\n"
  );

  result = dotenv.config();
  if (result.error) {
    process.stdout.write(
      "\x1b[39m\x1b[31m[ERROR] Could not load .env file.\nExiting...\x1b[39m\n"
    );
    process.exit(1);
  }
}

// Dependencies...
const express = require("express");
const zip = require("express-zip");
const boot = require(`${appRoot}/bootstrap/bootup`);
const logger = require(`${appRoot}/bootstrap/logger`);

const app = express();
const port = process.env.PORT || 8282;

// Boot up application.
boot(app);

// // cron job
// worker();

require("./worker/commands/discount")()
  .then(() => console.log("Discounts updated"))
  .catch((e) => console.log(e));

// Handling unhandledRejection
process.on("unhandledRejection", (e) => {
  console.log(e);
});

/**
 * @description Handles the server listener handler.
 */
const listenerHandler = async function () {
  const address = this.address();
  const location = ~["::", "localhost", "127.0.0.1"].indexOf(address.address)
    ? "127.0.0.1"
    : address.address;

  logger.info(`App started on ${address.port}`);
  process.stdout.write(
    `\x1b[39m\x1b[32mApp running on\x1b[39m http://${location}:${address.port}\n`
  );

  // Redis
  // await require("./app/modules/redis");
};

// Run server (or export for testing)
if (require.main === module) {
  app.listen(port || 0, listenerHandler);
  // worker
  worker;
  // background.start(worker())
} else {
  module.exports = app;
}
