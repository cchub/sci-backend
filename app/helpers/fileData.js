"use strict";

const decodeUriComponent = require("decode-uri-component");
const fs = require("fs");
const _ = require("lodash");
const { resolve } = require("path");
const country2code = require("country-code-lookup");
const { Category } = require("./categorization");
const indexes = require("../modules/Index/all");
const { Trade } = require("../models/Trade");
const { Commodity } = require("../models/Commodity");
const { Country } = require("./countryCode");
const Online_Foreign_Exchange = require("../modules/storage/online_foreign_exchange.json");
const currencies = require("../modules/foreign_exchange/currencies");
const FixedForeignData = require("../modules/storage/Official exchange rate(2019).json");

const FileData = async () => {
  console.log("Getting file data......");
  const script = resolve(
    resolve(__dirname, "..", "modules/storage/comprehensive_dataset_wide.json")
  );
  const dt = fs.readFileSync(script);
  // const dt = JSON.stringify(script);
  let jsoned;
  try {
    jsoned = JSON.parse(dt);
  } catch (e) {
    throw new Error(`Failed to parse comprehensive_dataset_wide.json: ${e.message}`);
  }

  return jsoned;
};

const Payload = async () => {
  let jsoned = await FileData();
  if (Array.isArray(jsoned)) {
    try {
      const org = organiser(jsoned);
      const ordered = orderByOi(org);
      const final = filtered(ordered);
      return final;
    } catch (e) {
      console.log(e);
    }
  }
};

function organiser(data) {
  let newData = [];
  for (let val of data) {
    const export_value = val.export_value ? val.export_value.split(";") : [];
    const sum =
      export_value.length > 0
        ? export_value.reduce(function (a, b) {
            const x = parseInt(a) ? parseInt(a) : 0;
            const y = parseInt(b) ? parseInt(b) : 0;
            return x + y;
          })
        : 0;
    val.Exporting_country = destructured(val.exporting_country);
    val.Importing_country = destructured(val.importing_country);
    val.Exporting_GDP = val.exporting_gdp;
    val.Importing_GDP = val.importing_gdp;
    val.Exporting_GDP_per_Capita = val.exporting_gdp_per_capita;
    val.Importing_GDP_per_Capita = val.importing_gdp_per_capita;
    val.Exporting_RECs = val.exporting_recs;
    val.Importing_RECs = val.importing_recs;
    val.Exporting_region = val.exporting_region;
    val.Importing_region = val.importing_region;
    val.Exporting_exchange_rate = val.exporting_exchange_rate;
    val.Importing_exchange_rate = val.importing_exchange_rate;
    val.RECs = val.recs;
    val.comREC = val.comrec;
    val.Importing_Country_Index = countryIndex(val.importing_country);
    val.Opportunity_Index = val.opportunity_Index
      ? parseFloat((val.opportunity_Index * 100).toFixed(2))
      : 0;
    val.Country_Index = val.country_Index
      ? parseFloat((val.country_Index * 100).toFixed(2))
      : 0;
    val.Commodities_count = val.commodities_count;
    val.total_export_value = sum;
    val.top_commodity = commodity_tradeValue(val)[0];
    val.interconnected_countries = val.interconnected_countries
      ? val.interconnected_countries.split(";")
      : [];
    val.iso2_export = val.exporting_country_iso
      ? country2code.byIso(val.exporting_country_iso).iso2
      : null;
    val.iso2_import = val.importing_country_iso
      ? country2code.byIso(val.importing_country_iso).iso2
      : null;
    val.trade_value = val.trade_value ? val.trade_value : 0;
    val.scaled_sci = val.scaled_sci ? val.scaled_sci : 0;
    val.commodity_tradeValue = commodity_tradeValue(val);

    delete val.exporting_exchange_rate;
    delete val.importing_exchange_rate;
    delete val.exporting_country;
    delete val.importing_country;
    delete val.exporting_gdp;
    delete val.importing_gdp;
    delete val.exporting_gdp_per_capita;
    delete val.importing_gdp_per_capita;
    delete val.exporting_recs;
    delete val.importing_recs;
    delete val.exporting_region;
    delete val.importing_region;
    delete val.recs;
    delete val.comrec;
    delete val.importing_country_iso;
    delete val.exporting_country_iso;
    delete val.commodities;
    delete val.commodities_code;
    delete val.export_value;
    delete val.commodity_index;
    delete val.top_importers;
    delete val.top_exporters;
    delete val.exporters_opi;
    delete val.importers_opi;
    delete val.imported_value;
    delete val.exported_value;
    delete val.demand;
    delete val.supply;
    delete val.supplyoverdemand;
    delete val.tradeoverdemand;
    newData.push(val);
  }

  return newData;
}

async function commodity_tradeValue(val) {
  const commObj = [];
  const commodities = val.commodities
    ? val.commodities.split(";")
    : val.Commodities
    ? val.Commodities.split(";")
    : [];
  const export_value = val.export_value ? val.export_value.split(";") : [];
  const commodityCode = val.commodity_code ? val.commodity_code.split(";") : [];
  const commodity_index = val.commodity_index
    ? val.commodity_index.split(";")
    : [];

  for (let i = 0; i < commodities.length; i++) {
    let payload = {};
    payload.commodity = (
      await Commodity.findOne({ commodity: commodities[i] })
    )._id;
    payload.commodity_code = commodityCode[i];
    payload.export_value = parseFloat(export_value[i])
      ? parseFloat(export_value[i])
      : 0;
    payload.commodity_index = parseFloat(commodity_index[i])
      ? parseFloat(parseFloat(commodity_index[i]).toFixed(2))
      : 0;
    // payload.category = Category(commodities[i]);
    commObj.push(payload);
  }
  const dats = commObj.sort(function (a, b) {
    return b.export_value - a.export_value;
  });

  return dats;
}

function interconnect(data, focus, countries) {
  let connected = [];
  let set = data.find((val) => val.origin === focus);
  set = limitData(set);
  for (let ct of countries) {
    const found = _(set.data).find(
      (val) => destructured(val.Importing_country) === destructured(ct)
    );
    const obj = {
      Exporting_country: found.Exporting_country,
      Importing_country: found.Importing_country,
      iso2_export: found.iso2_export,
      iso2_import: found.iso2_import,
      Commodities_count: found.commodities_count,
      commodity_tradeValue: found.commodity_tradeValue,
      trade_value: found.trade_value,
      Opportunity_Index: found.opportunity_Index,
      scaled_sci: found.scaled_sci,
      total_export_value: found.total_export_value,
      year: found.year,
    };
    connected.push(obj);
  }
  connected = orderByOi(connected);
  return connected;
}

function orderByOi(data) {
  return data.sort(function (a, b) {
    return b.opportunity_Index - a.opportunity_Index;
  });
}

function countryIndex(country) {
  const found = indexes.find((val) => val.country === country);
  if (found) return found.country_index;
}

function destructured(country) {
  if (country === "C�te d�Ivoire") {
    return "Cote d'Ivoire";
  }

  if (country === "S�o Tom� & Pr�ncipe") {
    return "Sao Tome and Principe";
  } else {
    return country;
  }
}

function filtered(data) {
  const focus = function (d) {
    return d.Exporting_country;
  };

  const grouping = function (group, focus) {
    return {
      origin: focus,
      data: group,
    };
  };

  const results = _(data).groupBy(focus).map(grouping).value();
  const finale = results.filter((val) => val.origin !== "undefined");

  return finale;
}

function limitData(payload) {
  const newData = payload;
  for (let data of newData.data) {
    data.commodity_tradeValue = data.commodity_tradeValue.slice(0, 3);
  }
  return newData;
}

function categorize(data) {
  if (Array.isArray(data.commodity_tradeValue)) {
    for (let val of data.commodity_tradeValue) {
      if (val) {
        val.category = Category(val.commodity);
      }
    }
  }
  return data;
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

function currency(country) {
  if (country) {
    const found = currencies.find(
      (val) => val.country.toLowerCase() === country.toLowerCase()
    );
    if (found) {
      return found.currency;
    }
  }
}

function exchange(country) {
  if (country) {
    const rate = FixedForeignData.find(
      (val) => val.country.toLowerCase() === country.toLowerCase()
    );
    return rate ? rate.exchange_rate : "";
  }
}

const db_trade = async () => {
  console.log("Adding trades to database.....");
  let jsoned = await FileData();
  for (let val of jsoned) {
    const currencyExport = currency(val.Exporting_country);
    const currencyImport = currency(val.Importing_country);

    val.Yesterday_Exporting_exchange_rate = val.Exporting_exchange_rate;

    val.Yesterday_Importing_exchange_rate = val.Importing_exchange_rate;

    val.Exporting_exchange_rate = Online_Foreign_Exchange[
      `USD${currencyExport}`
    ]
      ? parseFloat(Online_Foreign_Exchange[`USD${currencyExport}`]).toFixed(2) +
        " " +
        currencyExport
      : parseFloat(exchange(val.Exporting_country)).toFixed(2) +
        " " +
        currencyExport;
    val.Importing_exchange_rate = Online_Foreign_Exchange[
      `USD${currencyImport}`
    ]
      ? parseFloat(Online_Foreign_Exchange[`USD${currencyImport}`]).toFixed(2) +
        " " +
        currencyImport
      : parseFloat(exchange(val.Importing_country)).toFixed(2) +
        " " +
        currencyImport;

    const export_value = val.export_value ? val.export_value.split(";") : [];
    const sum =
      export_value.length > 0
        ? export_value.reduce(function (a, b) {
            const x = parseInt(a) ? parseInt(a) : 0;
            const y = parseInt(b) ? parseInt(b) : 0;
            return x + y;
          })
        : 0;
    val.Exporting_country = destructured(val.exporting_country);
    val.Importing_country = destructured(val.importing_country);
    val.Exporting_GDP = val.exporting_gdp;
    val.Importing_GDP = val.importing_gdp;
    val.Exporting_GDP_per_Capita = val.exporting_gdp_per_capita;
    val.Importing_GDP_per_Capita = val.importing_gdp_per_capita;
    val.Exporting_RECs = val.exporting_recs;
    val.Importing_RECs = val.importing_recs;
    val.Exporting_region = val.exporting_region;
    val.Importing_region = val.importing_region;
    val.Exporting_exchange_rate = val.exporting_exchange_rate;
    val.Importing_exchange_rate = val.importing_exchange_rate;
    val.RECs = val.recs;
    val.comREC = val.comrec;
    val.Importing_Country_Index = countryIndex(val.importing_country);
    val.Opportunity_Index = val.opportunity_Index
      ? parseFloat((val.opportunity_Index * 100).toFixed(2))
      : 0;
    val.Country_Index = val.country_Index
      ? parseFloat((val.country_Index * 100).toFixed(2))
      : 0;
    val.Commodities_count = val.commodities_count;
    val.total_export_value = sum;
    val.interconnected_countries = val.interconnected_countries
      ? val.interconnected_countries.split(";")
      : [];
    val.iso2_export = val.exporting_country_iso
      ? country2code.byIso(val.exporting_country_iso).iso2
      : null;
    val.iso2_import = val.importing_country_iso
      ? country2code.byIso(val.importing_country_iso).iso2
      : null;
    val.trade_value = val.trade_value ? val.trade_value : 0;
    val.scaled_sci = val.scaled_sci ? val.scaled_sci : 0;
    val.commodity_tradeValue = await commodity_tradeValue(val);
    val.top_commodity = val.commodity_tradeValue[0];
    val.commodities = val.commodities.split(";");
    val.commodities_code = val.commodities_code
      ? val.commodities_code.split(";")
      : [];
    val.export_value = val.export_value ? val.export_value.split(";") : [];
    val.commodity_index = val.commodity_index
      ? val.commodity_index.split(";")
      : [];
    val.top_importers = val.top_importers ? val.top_importers.split(";") : [];
    val.top_exporters = val.top_exporters ? val.top_exporters.split(";") : [];
    val.demand = val.demand ? val.demand.split(";") : [];
    val.supply = val.supply ? val.supply.split(";") : [];
    val.exporters_opi = val.exporters_opi ? val.exporters_opi.split(";") : [];
    val.importers_opi = val.importers_opi ? val.importers_opi.split(";") : [];
    val.supplyoverdemand = val.supplyoverdemand
      ? val.supplyoverdemand.split(";")
      : [];
    val.tradeoverdemand = val.tradeoverdemand
      ? val.tradeoverdemand.split(";")
      : [];
    val.exported_value = val.exported_value
      ? val.exported_value.split(";")
      : [];
    val.imported_value = val.imported_value
      ? val.imported_value.split(";")
      : [];
    val.ranked_sci = ordinal_suffix_of(val.ranked_sci);

    // update Db
    await Trade.updateOne(
      {
        Exporting_country: val.Exporting_country,
        Importing_country: val.Importing_country,
      },
      { $set: val },
      { upsert: true, new: true }
    );
  }
  console.log("All African trades added to database.");
};
const db_commodity = async () => {
  console.log("Creating commodities.....");
  let jsoned = await FileData();
  let commodities = [];

  for (let dt of jsoned) {
    const comms = dt.commodities.split(";");
    comms.forEach((val) => commodities.push(val));
  }

  commodities = [...new Set(commodities)];
  for (let commodity of commodities) {
    let obj = {};
    obj.commodity = commodity;
    obj.category = Category(commodity);
    await Commodity.updateOne(
      { commodity },
      { $set: obj },
      { upsert: true, new: true }
    );
  }

  console.log("All commodities added");
};

function singleCommodity(between, commodity, ranker) {
  const comms = between.commodities;
  const export_value = between.export_value;

  const commodityCode = between.commodity_code;

  const commodity_index = between.commodity_index;

  const top_importers = between.top_importers;
  const top_exporters = between.top_exporters;
  const exporters_opi = between.exporters_opi;
  const importers_opi = between.importers_opi;
  const imported_value = between.imported_value;
  const exported_value = between.exported_value;
  const demand = between.demand;
  const supply = between.supply;

  const SupplyOverDemand = between.supplyoverdemand;
  const tradeOverDemand = between.tradeoverdemand;

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
  delete payload.commodity;
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
      opi: parseFloat(parseFloat(payload.exporters_opi[x]).toFixed(2)) || 0,
      commodity_value:
        parseFloat(parseFloat(payload.exported_value[x]).toFixed(2)) || 0,
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
      opi: parseFloat(parseFloat(payload.importers_opi[x]).toFixed(2)) || 0,
      commodity_value:
        parseFloat(parseFloat(payload.imported_value[x]).toFixed(2)) || 0,
    };

    importers.push(top_importers);
  }
  return importers;
}

exports.decoder = (stringer) => {
  return decodeUriComponent(stringer);
};
exports.orderByOi = orderByOi;

exports.limitData = limitData;
exports.categs = categorize;
exports.Payload = Payload;
exports.connected = interconnect;
exports.destructured = destructured;
exports.db_trade = db_trade;
exports.db_commodity = db_commodity;
exports.singleCommodity = singleCommodity;
exports.exporters = exporters;
exports.importers = importers;
exports.lessThanPoint01 = lessThanPoint01;
exports.FileData = FileData;
