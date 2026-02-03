"use strict";

const express = require("express");
const TradeController = require("../../controllers/user/trade");

const router = new express.Router();

/**
 * @swagger
 * /api/trade:
 *   get:
 *     summary: Get trade data for a focus country
 *     tags: [Trade]
 *     parameters:
 *       - in: query
 *         name: focus_country
 *         schema:
 *           type: string
 *         description: Name of the focus country
 *       - in: query
 *         name: code
 *         schema:
 *           type: string
 *         description: Country code (ISO2)
 *     responses:
 *       200:
 *         description: Trade data retrieved successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: Trade not found
 */
router.get("/trade", TradeController.getTrade());

/**
 * @swagger
 * /api/trade/commodities:
 *   get:
 *     summary: Get commodities between two countries
 *     tags: [Trade]
 *     parameters:
 *       - in: query
 *         name: export_code
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: import_code
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: sort_by
 *         schema:
 *           type: string
 *           enum: [commodity, export_value]
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [ascending, descending, asc, desc]
 *       - in: query
 *         name: min
 *         schema:
 *           type: number
 *       - in: query
 *         name: max
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Commodities list
 *       400:
 *         description: Bad request
 */
router.get("/trade/commodities", TradeController.getCommodities());

/**
 * @swagger
 * /api/trade/search:
 *   get:
 *     summary: Search commodities between two countries
 *     tags: [Trade]
 *     parameters:
 *       - in: query
 *         name: export_code
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: import_code
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Search results
 *       400:
 *         description: Bad request
 */
router.get("/trade/search", TradeController.search());

/**
 * @swagger
 * /api/trade/view:
 *   get:
 *     summary: Get trade data between two specific countries
 *     tags: [Trade]
 *     parameters:
 *       - in: query
 *         name: export_code
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: import_code
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Trade data between countries
 *       400:
 *         description: Bad request
 *       404:
 *         description: Not found
 */
router.get("/trade/view", TradeController.betweenCountries());

/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: Get commodity categories between two countries
 *     tags: [Trade]
 *     parameters:
 *       - in: query
 *         name: export_code
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: import_code
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Categories list
 *       400:
 *         description: Bad request
 */
router.get("/categories", TradeController.categories());

/**
 * @swagger
 * /api/country/index:
 *   get:
 *     summary: Get country index data
 *     tags: [Country]
 *     parameters:
 *       - in: query
 *         name: region
 *         schema:
 *           type: string
 *       - in: query
 *         name: sort_by
 *         schema:
 *           type: string
 *           enum: [country, region, country_index]
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [ascending, descending, asc, desc]
 *       - in: query
 *         name: max
 *         schema:
 *           type: number
 *       - in: query
 *         name: min
 *         schema:
 *           type: number
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Country index data
 *       400:
 *         description: Bad request
 */
router.get("/country/index", TradeController.countryIndex());

/**
 * @swagger
 * /api/country/commodities:
 *   get:
 *     summary: Get commodities for a specific country
 *     tags: [Country]
 *     parameters:
 *       - in: query
 *         name: export_code
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Country commodities
 *       400:
 *         description: Bad request
 */
router.get("/country/commodities", TradeController.countryCommodity());

/**
 * @swagger
 * /api/trade/byCommodity:
 *   get:
 *     summary: Get trade data by specific commodity
 *     tags: [Trade]
 *     parameters:
 *       - in: query
 *         name: export_code
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: commodity
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Trade data by commodity
 *       400:
 *         description: Bad request
 */
router.get("/trade/byCommodity", TradeController.byCommodity());

/**
 * @swagger
 * /api/trade/byCommodity/view:
 *   get:
 *     summary: Get detailed commodity view with POPI data
 *     tags: [Trade]
 *     parameters:
 *       - in: query
 *         name: export_code
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: import_code
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: commodity
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: ranker
 *         schema:
 *           type: string
 *           enum: [trade_value, popi]
 *     responses:
 *       200:
 *         description: Detailed commodity data
 *       400:
 *         description: Bad request
 */
router.get("/trade/byCommodity/view", TradeController.byPopi());

/**
 * @swagger
 * /api/trade/byCommodity/view/other/commodities:
 *   get:
 *     summary: Get other potential commodities
 *     tags: [Trade]
 *     parameters:
 *       - in: query
 *         name: export_code
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: import_code
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: commodity
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Other potential commodities
 *       400:
 *         description: Bad request
 */
router.get(
  "/trade/byCommodity/view/other/commodities",
  TradeController.otherPotentials()
);

exports = module.exports = router;
