"use strict";

const express = require("express");
const PdfController = require("../../controllers/user/pdf");

const router = new express.Router();

router.post("/pdf", PdfController.createPdf());

exports = module.exports = router;
