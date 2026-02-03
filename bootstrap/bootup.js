"use strict";

// config
const config = require("config");

const useragent = require("express-useragent");

const path = require("path");

const express = require("express");

// cors
const cors = require("cors");

// morgan
const morgan = require("morgan");

// bodyParser
const bodyParser = require("body-parser");

// helmet
const helmet = require("helmet");
// Start up database.
require("./db")();

// Initialize Logger
require("./logger");

// Error handler.
require("express-async-errors");

// IP address token
morgan.token("remote-ip", (req) => req["ip-addr"]);

exports = module.exports = (app) => {
  // use helmet
  // app.use(helmet());

  app.use((req, _res, next) => {
    if (req.headers["x-forwarded-for"]) {
      req["ip-addr"] = req.headers["x-forwarded-for"];
    } else if (req.headers["x-real-ip"]) {
      req["ip-addr"] = req.headers["x-real-ip"];
    } else {
      req["ip-addr"] = req.ip;
    }

    return next();
  });

  // For client's user agent parsing
  app.use(useragent.express());

  // Morgan plugin
  app.use(
    morgan(
      ':remote-ip - :remote-user \x1b[0m\x1b[2m[:date[clf]]\x1b[0m ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent'
    )
  );

  // views
  app.set("view engine", "ejs");
  app.use("/", express.static(path.join(__dirname, "public")));

  // Swagger docs - must be before content-type middleware
  const swaggerUi = require("swagger-ui-express");
  const swaggerSpec = require("../swagger");
  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: "SCI Analysis API Documentation"
  }));

  // Cors
  app.use("*", cors(config.get("cors")));

  // Set the default content type.
  app.use((req, res, next) => {
    res.set({
      "Content-Type": "application/json",
      "X-Author": "'Kelly Gasasira <kelly@cchub.rw>",
    });

    next();
  });

  // Parsing to json.
  app.use(bodyParser.json({ limit: "20mb" }));

  // For file uploads.
  app.use(bodyParser.urlencoded({ limit: "20mb", extended: true }));

  // For pdf/zip files
  app.use(
    bodyParser.raw({
      type: "application/octet-stream",
      limit: "10mb",
    })
  );

  // Install routes.
  require("./routes")(app);
};
