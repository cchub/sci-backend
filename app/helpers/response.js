"use strict";

const { Payload } = require("./fileData");
// const { CSO } = require("./commodityFinder");
const fs = require("fs");
const { resolve } = require("path");
const logger = require("../../bootstrap/logger");

// const script3 = resolve(resolve(__dirname, "..", "modules/storage/cso.js"));

const createJson = async () => {
  const script = resolve(
    resolve(__dirname, "..", "modules/storage/response.json")
  );
  const script1 = resolve(
    resolve(__dirname, "..", "modules/storage/response.js")
  );
  console.log("Adding json and js files......");
  let data = await Payload();
  // let data2 = CSO();
  try {
    if (data) {
      fs.writeFileSync(
        script1,
        "module.exports = " + JSON.stringify(data) + ";"
      );
      // fs.writeFileSync(
      //   script3,
      //   "module.exports = " + JSON.stringify(data2) + ";"
      // );
      fs.writeFileSync(script, JSON.stringify(data));
      logger.info(`Response json file updated`);
      process.stdout.write(
        `\x1b[39m\x1b[32m[info]: Response json file updated\n`
      );
    }
  } catch (e) {
    logger.error(e);
    return e.message;
  }
};

// writeIndex();
module.exports = createJson;
