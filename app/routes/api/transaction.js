"use strict";
const express = require("express");
const { ValidateTransaction } = require("../../models/Transactions");
const { ValidateFreePlan } = require("../../models/FreePlan");
const TransactionController = require("../../controllers/user/transaction");
const ValidDiscount = require("../../middlewares/activeDiscount");
const Admins = require("../../middlewares/authorized");

const router = new express.Router();

router.post(
  "/report/flutterwave/verification",
  ValidDiscount,
  ValidateTransaction,
  TransactionController.post(),
);

router.post(
  "/reports/free/plan",
  ValidateFreePlan,
  TransactionController.freePlan(),
);

router.get(
  "/report/discount/:discountCode",
  Admins,
  ValidDiscount,
  TransactionController.discountCode(),
);

router.get("/report/discounts", Admins, TransactionController.discountCodes());

/**
 * @swagger
 * /api/reports/info:
 *   get:
 *     summary: Get all reports information
 *     tags: [Reports]
 *     responses:
 *       200:
 *         description: Reports information
 */
router.get("/reports/info", TransactionController.reports());

/**
 * @swagger
 * /api/reports/info/{country}:
 *   get:
 *     summary: Get report information for specific country
 *     tags: [Reports]
 *     parameters:
 *       - in: path
 *         name: country
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Country report information
 *       404:
 *         description: Not found
 */
router.get("/reports/info/:country", TransactionController.report());

router.put(
  "/report/discount/:discountCode/enable",
  Admins,
  TransactionController.enableDiscount(),
);

router.put(
  "/report/discount/:discountCode/disable",
  Admins,
  TransactionController.disableDiscount(),
);

exports = module.exports = router;
