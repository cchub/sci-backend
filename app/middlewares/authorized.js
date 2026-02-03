"use strict";
const config = require("config");
const { FORBIDDEN } = require("http-status-codes");

module.exports = async (req, res, next) => {
  if (req.query.token !== config.get("app.token")) {
    return res
      .status(FORBIDDEN)
      .json({ status: FORBIDDEN, message: "Invalid token." });
  }

  return next();
};
