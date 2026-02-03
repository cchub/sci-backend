// "use strict";

// const fs = require("fs");
// const { resolve } = require("path");
// const { destructured } = require("./fileData");
// const _ = require("lodash");

// const script = resolve(
//   resolve(
//     __dirname,
//     "..",
//     "modules/storage/All Commodities, SCI & OppIndex.json"
//   )
// );

// const CSO = () => {
//   // const data = fs.readFileSync(script);
//   const jsoned = require(script);

//   const organiser = organise(jsoned);
//   return organiser;
//   //   return correctImporters(organiser, commodity, importers);
// };

// function organise(data) {
//   let finished = [];
//   for (let dt of data) {
//     dt.Commodities_exports = dt.Commodities_exports.split(";");
//     dt.Commodities_imports = dt.Commodities_imports.split(";");
//     finished.push(dt);
//   }
//   return finished;
// }

// exports.correctImporters = (data, commodity, importers) => {
//   let correct = [];
//   for (let importer of importers) {
//     const found = data.find(
//       (val) =>
//         destructured(val.Importing_country) === importer &&
//         val.Commodities_imports.find((x) => x === commodity)
//     );

//     if (found) {
//       correct.push(importer);
//     }
//   }
//   return correct;
// };

// exports.comms = (focus) => {
//   let data = CSO();
//   let commodities = [];
//   for (let dt of data) {
//     if (destructured(dt.Exporting_country) === focus) {
//       commodities = [...dt.Commodities_exports];
//     }
//   }
//   const results = [...new Set(commodities)];
//   return results;
// };

// exports.CSO = CSO;
