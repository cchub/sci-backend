const data = require("../modules/storage/comprehensive_dataset_wide.json");
const _ = require("lodash");
const country2code = require("country-code-lookup");
const { Country } = require("./countryCode");
const { destructured } = require("./fileData");

function Popi(exporter, importer, com, ranker) {
  let finder = data.find(
    (val) =>
      destructured(val.exporting_country) === exporter &&
      destructured(val.importing_country) === importer
  );
  const commodity = singleCommodity(finder, com, ranker);
  finder.Exporting_country = destructured(finder.exporting_country);
  finder.Importing_country = destructured(finder.importing_country);
  finder.Importing_region = finder.importing_region;
  finder.Exporting_region = finder.exporting_region;
  finder.commodity_tradeValue = commodity;
  finder.iso2_export =
    country2code.byIso(finder.exporting_country_iso).iso2 ||
    Country(finder.exporting_country);
  finder.iso2_import =
    country2code.byIso(finder.importing_country_iso).iso2 ||
    Country(finder.importing_country);
  finder.Opportunity_Index = parseFloat(
    parseFloat(finder.opportunity_Index).toFixed(2)
  );
  finder.ranked_SCI = ordinal_suffix_of(finder.ranked_sci);
  finder.RECs = finder.recs.replace(/;/g, ", ");
  finder.Exporting_RECs = finder.exporting_recs.replace(/;/g, ", ");
  finder.Importing_RECs = finder.importing_recs.replace(/;/g, ", ");
  finder.comREC = finder.comrec;

  const results = _.pick(finder, [
    "Exporting_country",
    "Importing_country",
    "Importing_region",
    "Exporting_region",
    "year",
    "comcol",
    "comlang_off",
    "comREC",
    "RECs",
    "Exporting_RECs",
    "Importing_RECs",
    "trade_value",
    "scaled_sci",
    "Opportunity_Index",
    "iso2_export",
    "iso2_import",
    "ranked_SCI",
    "dist",
    "contig",
    "commodity_tradeValue",
  ]);

  return results;
}

function singleCommodity(between, commodity, ranker) {
  const comms = between.commodities.split(";");
  const export_value = between.export_value
    ? between.export_value.split(";")
    : [];
  const commodityCode = between.commodity_code
    ? between.commodities_code.split(";")
    : [];
  const commodity_index = between.commodity_index
    ? between.commodity_index.split(";")
    : [];
  const top_importers = between.top_importers.split(";");
  const top_exporters = between.top_exporters.split(";");
  const exporters_opi = between.exporters_opi.split(";");
  const importers_opi = between.importers_opi.split(";");
  const imported_value = between.imported_value.split(";");
  const exported_value = between.exported_value.split(";");
  const demand = between.demand.split(";");
  const supply = between.supply.split(";");

  const SupplyOverDemand = between.supplyoverdemand.split(";");
  const tradeOverDemand = between.tradeoverdemand.split(";");

  const index = comms.indexOf(
    comms.find((val) => val.toLowerCase() === commodity.toLowerCase())
  );

  let payload = {};
  payload.commodity = comms[index];
  payload.commodity_code = commodityCode[index];
  payload.export_value = parseFloat(export_value[index])
    ? parseFloat(parseFloat(export_value[index]).toFixed(2))
    : 0;
  payload.commodity_index = parseFloat(commodity_index[index])
    ? parseFloat(parseFloat(commodity_index[index]).toFixed(2))
    : 0;
  payload.top_exporters = top_exporters[index].split("/");
  payload.top_importers = top_importers[index].split("/");
  payload.exporters_opi = exporters_opi[index].split("/");
  payload.importers_opi = importers_opi[index].split("/");
  payload.imported_value = imported_value[index].split("/");
  payload.exported_value = exported_value[index].split("/");
  payload.demand = parseFloat(parseFloat(demand[index]).toFixed(2));
  payload.supply = parseFloat(parseFloat(supply[index]).toFixed(2));
  payload.supplyOverDemand = lessThanPoint01(SupplyOverDemand[index]);
  payload.tradeOverDemand = lessThanPoint01(tradeOverDemand[index]);
  payload.top_exporters = exporters(payload, payload.top_exporters.length)
    .sort(function (a, b) {
      if (ranker === "trade_value") {
        return b.commodity_value - a.commodity_value;
      }
      if (ranker === "popi") {
        return b.opi - a.opi;
      } else {
        return b.commodity_value - a.commodity_value;
      }
    })
    .filter((val) => val.country !== "NA");
  payload.top_importers = importers(payload, payload.top_importers.length)
    .sort(function (a, b) {
      if (ranker === "trade_value") {
        return b.commodity_value - a.commodity_value;
      }
      if (ranker === "popi") {
        return b.opi - a.opi;
      } else {
        return b.commodity_value - a.commodity_value;
      }
    })
    .filter((val) => val.country !== "NA");

  delete payload.exporters_opi;
  delete payload.importers_opi;
  delete payload.imported_value;
  delete payload.exported_value;

  return payload;
}

function lessThanPoint01(num) {
  if (isNaN(parseFloat(num))) {
    return null;
  }
  const twoDecimalPlaces = parseFloat(parseFloat(num).toFixed(2));

  if (twoDecimalPlaces >= 0.01) {
    return twoDecimalPlaces;
  } else {
    return "< 0.01";
  }
}

function exporters(payload, length) {
  let exporters = [];

  for (let x = 0; x < length; x++) {
    let top_exporters = {
      country: destructured(payload.top_exporters[x]),
      country_code:
        destructured(payload.top_exporters[x]) === "NA"
          ? null
          : Country(destructured(payload.top_exporters[x])),
      opi: parseFloat(parseFloat(payload.exporters_opi[x]).toFixed(2)),
      commodity_value: parseFloat(
        parseFloat(payload.exported_value[x]).toFixed(2)
      ),
    };

    exporters.push(top_exporters);
  }
  return exporters;
}
function importers(payload, length) {
  let importers = [];

  for (let x = 0; x < length; x++) {
    let top_importers = {
      country: destructured(payload.top_importers[x]),
      country_code:
        destructured(payload.top_importers[x]) === "NA"
          ? null
          : Country(destructured(payload.top_importers[x])),
      opi: parseFloat(parseFloat(payload.importers_opi[x]).toFixed(2)),
      commodity_value: parseFloat(
        parseFloat(payload.imported_value[x]).toFixed(2)
      ),
    };

    importers.push(top_importers);
  }
  return importers;
}

function division(x, y) {
  return parseFloat(parseFloat(x / y).toFixed(2));
}

function ordinal_suffix_of(i) {
  if (!isNaN(i)) {
    var j = i % 10,
      k = i % 100;
    if (j == 1 && k != 11) {
      return i + "st";
    }
    if (j == 2 && k != 12) {
      return i + "nd";
    }
    if (j == 3 && k != 13) {
      return i + "rd";
    }
    return i + "th";
  } else {
    return i;
  }
}

const db_popi = (between, commodity) => {
  return singleCommodity(between, commodity, undefined);
};

module.exports = Popi;
exports.db_popi = db_popi;
