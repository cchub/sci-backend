// "use strict";
// const Trades = require("../storage/response");
// const Trades2 = require("../storage/response.json");
// const {
//   destructured,
//   limitData,
//   categs,
//   connected,
// } = require("../../helpers/fileData");
// const { Category } = require("../../helpers/categorization");
// // const { comms } = require("../../helpers/commodityFinder");
// const { Grouping } = require("../../helpers/categorization");
// const _ = require("lodash");
// const Popi = require("../../helpers/popi");
// const Online_Foreign_Exchange = require("../../modules/foreign_exchange/index");
// const FixedForeignData = require("../storage/Official exchange rate(2019).json");
// const Currency = require("../foreign_exchange/currencies");

// class Trade {
//   constructor({ exporter, importer }) {
//     this.exporter = exporter;
//     this.importer = importer;
//     this.Trades = Trades;
//     this.Trades2 = Trades2;
//   }
//   all() {
//     return this.Trades;
//   }
//   all2() {
//     return this.Trades2;
//   }
//   get() {
//     this.payloadError();
//     const payload = this.Trades.find(
//       (val) => val.origin.toLowerCase() === this.exporter.toLowerCase()
//     );
//     return payload;
//   }
//   get2() {
//     this.payloadError();
//     const payload = this.Trades2.find(
//       (val) => val.origin.toLowerCase() === this.exporter.toLowerCase()
//     );
//     return payload;
//   }

//   limiter() {
//     return limitData(this.get());
//   }

//   between() {
//     this.betweenError();
//     const between = this.get().data.find(
//       (val) =>
//         destructured(val.Importing_country).toLowerCase() ===
//         this.importer.toLowerCase()
//     );
//     return between;
//   }
//   between2() {
//     this.betweenError();
//     const between = this.get2().data.find(
//       (val) =>
//         destructured(val.Importing_country).toLowerCase() ===
//         this.importer.toLowerCase()
//     );
//     return between;
//   }

//   interconnected() {
//     const data = this.between();
//     const connection = connected(
//       this.all(),
//       this.exporter,
//       data.interconnected_countries
//     );
//     return connection;
//   }

//   removeFields() {
//     const datas = this.between();
//     const fields = Object.keys(datas);
//     const allowed = fields.filter(
//       (val) =>
//         !~["commodity_tradeValue", "interconnected_countries"].indexOf(val)
//     );
//     let result = this.pickProperties(datas, allowed);
//     // add foreign exchange
//     const currencyExport = this.currency(result.Exporting_country);
//     const currencyImport = this.currency(result.Importing_country);

//     result.Yesterday_Exporting_exchange_rate = result.Exporting_exchange_rate;

//     result.Yesterday_Importing_exchange_rate = result.Importing_exchange_rate;

//     result.Exporting_exchange_rate = Online_Foreign_Exchange[
//       `USD${currencyExport}`
//     ]
//       ? parseFloat(Online_Foreign_Exchange[`USD${currencyExport}`]).toFixed(2) +
//         " " +
//         currencyExport
//       : parseFloat(this.exchange(result.Exporting_country)).toFixed(2) +
//         " " +
//         currencyExport;
//     result.Importing_exchange_rate = Online_Foreign_Exchange[
//       `USD${currencyImport}`
//     ]
//       ? parseFloat(Online_Foreign_Exchange[`USD${currencyImport}`]).toFixed(2) +
//         " " +
//         currencyImport
//       : parseFloat(this.exchange(result.Importing_country)).toFixed(2) +
//         " " +
//         currencyImport;

//     return result;
//   }

//   foreign_exchange(country) {
//     country = this.destructured(country);
//   }

//   exchange(country) {
//     if (country) {
//       const rate = FixedForeignData.find(
//         (val) => val.country.toLowerCase() === country.toLowerCase()
//       );
//       return rate ? rate.exchange_rate : "";
//     }
//   }

//   currency(country) {
//     if (country) {
//       const found = Currency.find(
//         (val) => val.country.toLowerCase() === country.toLowerCase()
//       );
//       if (found) {
//         return found.currency;
//       }
//     }
//   }

//   commodities() {
//     const commodities = this.between2().commodity_tradeValue;

//     return commodities;
//   }

//   popi(com, ranker) {
//     return Popi(this.exporter, this.importer, com, ranker);
//   }

//   categorised() {
//     const categorized = categs(this.between2());
//     return categorized.commodity_tradeValue;
//   }

//   commodityCategs() {
//     return Grouping(this.categorised());
//   }

//   // countryCommodity() {
//   //   const allCommodities = comms(this.exporter);
//   //   let finale = [];
//   //   for (let commodity of allCommodities) {
//   //     let obj = {};
//   //     obj.commodity = commodity;
//   //     // obj.category = Category(commodity);
//   //     finale.push(obj);
//   //   }
//   //   return finale;
//   // }

//   payloadError() {
//     if (
//       !this.Trades.find((val) => val.origin === this.exporter) ||
//       !this.Trades2.find((val) => val.origin === this.exporter)
//     ) {
//       throw new Error("Country not found or not an African Country");
//     }
//   }

//   betweenError() {
//     if (
//       !this.get().data.find(
//         (val) =>
//           destructured(val.Importing_country).toLowerCase() !==
//           this.importer.toLowerCase()
//       ) ||
//       !this.get2().data.find(
//         (val) =>
//           destructured(val.Importing_country).toLowerCase() !==
//           this.importer.toLowerCase()
//       ) ||
//       !this.importer
//     ) {
//       throw new Error("Trade between these two countries has not been stored.");
//     }
//   }

//   pickProperties(datas, fields) {
//     // const payload = _.map(datas, _.partialRight(_.pick, fields));
//     const payload = _.pick(datas, fields);
//     return payload;
//   }

//   rankCommodityIndex(payload, commodity) {
//     for (let pd of payload) {
//       const filtered = pd.commodity_tradeValue.filter(
//         (val) => val.commodity.toLowerCase() === commodity.toLowerCase()
//       );
//       pd.commodity_index_rank = filtered[0];
//     }
//     const sorted = _.orderBy(
//       payload,
//       ["commodity_index_rank.commodity_index"],
//       ["desc"]
//     );
//     return sorted;
//   }
// }

// module.exports = Trade;
