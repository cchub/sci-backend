"use strict";

const express = require("express");
const router = new express.Router();

// Trade routes
router.use("/", require("./trade"));
router.use("/", require("./interconnected"));
router.use("/", require("./pdf"));
router.use("/", require("./transaction"));

exports = module.exports = router;
