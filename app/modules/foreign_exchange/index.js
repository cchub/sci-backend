"use strict";
require("dotenv").config();
const request = require("request");
// const cc = require("currency-codes");
const fs = require("fs");
const { resolve } = require("path");
const logger = require("../../../bootstrap/logger");
const Data = require("../storage/Official exchange rate(2019).json");
const _ = require("lodash");
const Currency = require("./currencies");
const script = resolve(
  resolve(__dirname, "..", "storage/online_foreign_exchange.json")
);
const { destructured } = require("../../helpers/fileData");
const cc = require("country-code-lookup");
/**
 * @description Call the foreign exchange api
 * @description Call the currency library
 * @description Access the updated json sci file
 * @description Write on it by adding a column called foreign_exchange
 * @description Loop through the foreign exchange api, look for the currency code for each country in the json file and update the foreign_exchange column
 * @description Push the updated file to the google drive folder
 */

const Foreign = async () => {
  console.log("Starting.....");
  try {
    var headers = {
      "User-Agent": "CURRENCY RATES API Client/0.0.1",
      "Content-Type": "application/x-www-form-urlencoded",
    };

    var options = {
      url: "http://api.currencylayer.com/live?access_key=ad4edb02f0b692daa2d1102141c3cd04",
      method: "GET",
      headers: headers,
    };

    return request(options, async function (error, response, body) {
      if (!error && response.statusCode == 200) {
        var exchanges = JSON.parse(body);
        var currencies = exchanges.quotes;

        // // get updated file
        // const jsoned = JSON.parse(JSON.stringify(require(script)));

        // let newArr = [];

        // for (let js of jsoned) {
        //   if (js.foreign_exchange) {
        //     delete js.foreign_exchange;
        //   }

        //   const currencyExport = currency(js.exporting_country);
        //   const currencyImport = currency(js.importing_country);

        //   js.Yesterday_Exporting_exchange_rate =
        //     js.exporting_exchange_rate !== ""
        //       ? js.exporting_exchange_rate
        //       : currencyExport;
        //   js.Yesterday_Importing_exchange_rate =
        //     js.importing_exchange_rate !== ""
        //       ? js.importing_exchange_rate
        //       : currencyImport;

        //   js.exporting_exchange_rate = currencies[`USD${currencyExport}`]
        //     ? parseFloat(currencies[`USD${currencyExport}`]).toFixed(2) +
        //       " " +
        //       currencyExport
        //     : parseFloat(exchange(js.Exporting_country)).toFixed(2) +
        //       " " +
        //       currencyExport;
        //   js.importing_exchange_rate = currencies[`USD${currencyImport}`]
        //     ? parseFloat(currencies[`USD${currencyImport}`]).toFixed(2) +
        //       " " +
        //       currencyImport
        //     : parseFloat(exchange(js.Importing_country)).toFixed(2) +
        //       " " +
        //       currencyImport;

        //   newArr.push(js);
        // }

        // store it back to file
        fs.writeFileSync(script, JSON.stringify(currencies));
        // await FileUpdate();
        process.stdout.write(
          `\x1b[39m\x1b[32mSuccessfully updated foreign exchange, exiting....\n`
        );
      }
    });
  } catch (e) {
    logger.error("Foreign exchange fetch failed", e);
  }
};

function exchange(country) {
  if (country) {
    const rate = Data.find(
      (val) => val.country.toLowerCase() === destructured(country).toLowerCase()
    );
    return rate ? rate.exchange_rate : "";
  }
}

function currency(country) {
  if (country) {
    const found = Currency.find(
      (val) => val.country.toLowerCase() === destructured(country).toLowerCase()
    );
    if (found) {
      return found.currency;
    }
  }
}

module.exports = Foreign;
