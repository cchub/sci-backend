"use strict";

const express = require("express");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("../../../swagger");

const router = new express.Router();

router.use("/", swaggerUi.serve);
router.get("/", swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: "SCI Analysis API Documentation"
}));

module.exports = router;
