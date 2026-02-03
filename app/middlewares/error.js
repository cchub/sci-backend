/**
 * Error handler module.
 */
"use strict";
/**
 * @desc Dependencies...
 */
const _ = require("lodash"),
  logger = require("../../bootstrap/logger");

/**
 * @desc Errors handler middleware
 * @param {Error} error Error instance from app.
 * @param {express.Request} req express.Request
 * @param {express.Response} res express.Response
 * @param {express.next} next express.next
 * @returns {express.next} express.next
 */
module.exports = (error, req, res, next) => {
  const status4xx = _.inRange(error.status, 400, 499);

  if (!status4xx)
    logger.log({
      level: "error",
      message: error.stack ? error.stack : error.message,
    });

  let response = status4xx
    ? { message: error.message }
    : { message: "Oops! Something went wrong.😭" };

  if (["production"].indexOf(process.env.NODE_ENV) === -1)
    response.stack = error.message;

  res.status(status4xx ? error.status || 401 : 500).json(response);

  return next(req);
};
