const express = require("express");
const InterconnectController = require("../../controllers/user/interconnect");
const router = new express.Router();

/**
 * @swagger
 * /api/trade/interconnected/countries:
 *   get:
 *     summary: Get interconnected countries data
 *     tags: [Interconnected]
 *     responses:
 *       200:
 *         description: Interconnected countries data
 *       400:
 *         description: Bad request
 */
router.get(
  "/trade/interconnected/countries",
  InterconnectController.interconnected_countries()
);

module.exports = router;
