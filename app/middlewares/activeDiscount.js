"use strict";
/** @desc Check that user is admin. */
const { FORBIDDEN, NOT_FOUND } = require("http-status-codes");
const { Discount } = require("../models/Discount");

module.exports = async (req, res, next) => {
  const code = req.body.discountCode
    ? req.body.discountCode
    : req.params.discountCode
    ? req.params.discountCode
    : undefined;
  if (code) {
    const discount = await Discount.findOne({ code });
    if (!discount) {
      return res
        .status(NOT_FOUND)
        .json({ status: NOT_FOUND, message: "Discount not found" });
    }
    if (!discount.active) {
      return res.status(FORBIDDEN).json({
        status: FORBIDDEN,
        message: "Discount not activated",
      });
    }
  }

  return next();
};
