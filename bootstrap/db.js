"use strict";
/** @desc Database bootstrapping. */
/** @type {Object} config */
const config = require("config");
/** @type {Object} logger */
const logger = require("./logger");
/** @type {Object} mongoose */
const mongoose = require("mongoose");

/**
 * @type {Function}
 * @desc Setup database connection
 */
exports = module.exports = async () => {
  // eslint-disable-line no-global-assign
  const { connection: conn, config: dbConfig } = config.get("db");

  // if (process.env.NODE_ENV === "development") {
  //   if (conn.url) {
  //     return mongoose
  //       .connect(conn.url, dbConfig)
  //       .then(() =>
  //         logger.log({
  //           level: "info",
  //           message: `DB Connected on port: ${conn.port}...`,
  //         })
  //       )
  //       .catch((e) => console.log(e));
  //   }
  // }

  let auth = "";

  if (~[true, "true", 1, "1"].indexOf(conn.auth)) {
    auth = `${encodeURIComponent(conn.user)}:${encodeURIComponent(conn.pass)}@`;
  }

  const mongouri = `mongodb://${auth}${conn.host}:${conn.port}/${conn.name}`;

  mongoose
    .connect(mongouri, dbConfig)
    .then(() =>
      logger.log({
        level: "info",
        message: `DB Connected on port: ${conn.port}...`,
      }),
    )
    .catch((e) => console.log(e.message));
};
