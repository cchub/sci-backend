"use strict";

const { NOT_FOUND, getStatusText } = require("http-status-codes");
const errorHandler = require("../app/middlewares/error");

exports = module.exports = (app) => {
  // all endpoints
  app.use("/api", require("../app/routes/api"));

  /**
   * @desc Error handler.
   */
  app.use(errorHandler);

  // Unknown middleware operations.
  app.use("*", (_, res) =>
    res.status(NOT_FOUND).json({ message: getStatusText(NOT_FOUND) })
  );
};
