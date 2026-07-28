"use strict";

const path = require("path");
const country2code = require("country-code-lookup");
const { Category } = require("../../app/helpers/categorization");
const { Trade } = require("../../app/models/Trade");
const { Commodity } = require("../../app/models/Commodity");
const { Index } = require("../../app/models/Index");

function destructured(country) {
  if (country === "C�te d�Ivoire") return "Cote d'Ivoire";
  if (country === "S�o Tom� & Pr�ncipe") return "Sao Tome and Principe";
  return country;
}

function ordinalSuffix(i) {
  if (isNaN(i)) return i;
  const j = i % 10, k = i % 100;
  if (j === 1 && k !== 11) return i + "st";
  if (j === 2 && k !== 12) return i + "nd";
  if (j === 3 && k !== 13) return i + "rd";
  return i + "th";
}

function splitSemi(str) {
  return str ? str.split(";") : [];
}

async function seedCommodities(rows) {
  console.log("[seed] Seeding commodities...");
  const uniqueCommodities = new Set();
  for (const row of rows) {
    if (row.commodities) {
      for (const c of row.commodities.split(";")) uniqueCommodities.add(c);
    }
  }
  const bulk = Commodity.collection.initializeUnorderedBulkOp();
  for (const commodity of uniqueCommodities) {
    bulk.find({ commodity }).upsert().updateOne({ $set: { commodity, category: Category(commodity) } });
  }
  const result = await bulk.execute();
  console.log(`[seed] Commodities upserted: ${result.nUpserted + result.nModified}`);
}

async function seedIndex(rows) {
  console.log("[seed] Seeding country index...");
  const seen = new Set();
  const entries = [];
  for (const row of rows) {
    const country = destructured(row.exporting_country);
    if (!country || seen.has(country)) continue;
    seen.add(country);
    let iso2 = null;
    try { iso2 = row.exporting_country_iso ? country2code.byIso(row.exporting_country_iso).iso2 : null; } catch (_) {}
    entries.push({
      country,
      country_code: iso2,
      country_index: row.country_Index ? parseFloat((row.country_Index * 100).toFixed(2)) : 0,
      region: row.exporting_region,
    });
  }
  const bulk = Index.collection.initializeUnorderedBulkOp();
  for (const entry of entries) {
    bulk.find({ country: entry.country }).upsert().updateOne({ $set: entry });
  }
  const result = await bulk.execute();
  console.log(`[seed] Index entries upserted: ${result.nUpserted + result.nModified}`);
}

async function seedTrades(rows) {
  console.log("[seed] Seeding trades...");
  const allCommodities = await Commodity.find({}, { commodity: 1 });
  const commodityMap = new Map();
  for (const c of allCommodities) commodityMap.set(c.commodity, c._id);

  const BATCH = 100;
  let processed = 0;
  for (let i = 0; i < rows.length; i += BATCH) {
    const chunk = rows.slice(i, i + BATCH);
    const bulk = Trade.collection.initializeUnorderedBulkOp();
    for (const row of chunk) {
      const exportCountry = destructured(row.exporting_country);
      const importCountry = destructured(row.importing_country);
      let iso2Export = null, iso2Import = null;
      try { iso2Export = row.exporting_country_iso ? country2code.byIso(row.exporting_country_iso).iso2 : null; } catch (_) {}
      try { iso2Import = row.importing_country_iso ? country2code.byIso(row.importing_country_iso).iso2 : null; } catch (_) {}

      const commodityNames = splitSemi(row.commodities);
      const exportValues = splitSemi(row.export_value);
      const commodityCodes = splitSemi(row.commodities_code || row.commodity_code);
      const commodityIndexes = splitSemi(row.commodity_index);

      const commodity_tradeValue = [];
      for (let j = 0; j < commodityNames.length; j++) {
        const cid = commodityMap.get(commodityNames[j]);
        if (!cid) continue;
        commodity_tradeValue.push({
          commodity: cid,
          commodity_code: parseFloat(commodityCodes[j]) || undefined,
          export_value: parseFloat(exportValues[j]) || 0,
          commodity_index: parseFloat(commodityIndexes[j]) ? parseFloat(parseFloat(commodityIndexes[j]).toFixed(2)) : 0,
        });
      }
      commodity_tradeValue.sort((a, b) => b.export_value - a.export_value);

      const sumExport = exportValues.reduce((acc, v) => acc + (parseInt(v) || 0), 0);

      const doc = {
        Exporting_country: exportCountry,
        Importing_country: importCountry,
        Exporting_region: row.exporting_region,
        Importing_region: row.importing_region,
        Exporting_RECs: row.exporting_recs,
        Importing_RECs: row.importing_recs,
        Exporting_GDP: row.exporting_gdp,
        Importing_GDP: row.importing_gdp,
        Exporting_GDP_per_Capita: row.exporting_gdp_per_capita,
        Importing_GDP_per_Capita: row.importing_gdp_per_capita,
        Exporting_total_import: row.exporting_total_import,
        Importing_total_import: row.importing_total_import,
        iso2_export: iso2Export,
        iso2_import: iso2Import,
        dist: row.dist,
        distcap: row.distcap,
        contig: row.contig,
        comcol: row.comcol,
        comlang_off: row.comlang_off,
        scaled_sci: row.scaled_sci || 0,
        year: row.year ? String(row.year) : undefined,
        RECs: row.recs,
        comRec: row.comrec,
        Commodities_count: row.commodities_count,
        Opportunity_Index: row.opportunity_Index ? parseFloat((row.opportunity_Index * 100).toFixed(2)) : 0,
        Country_Index: row.country_Index ? parseFloat((row.country_Index * 100).toFixed(2)) : 0,
        total_export_value: sumExport,
        trade_value: row.trade_value || 0,
        ranked_sci: ordinalSuffix(row.ranked_sci),
        interconnected_countries_number: row.interconnected_countries_number,
        interconnected_countries: splitSemi(row.interconnected_countries).map(destructured),
        Exporting_exchange_rate: row.exporting_exchange_rate,
        Importing_exchange_rate: row.importing_exchange_rate,
        Yesterday_Exporting_exchange_rate: row.Yesterday_Exporting_exchange_rate,
        Yesterday_Importing_exchange_rate: row.Yesterday_Importing_exchange_rate,
        commodity_tradeValue,
        top_commodity: commodity_tradeValue[0],
        commodities: commodityNames,
        export_value: exportValues,
        commodity_code: commodityCodes,
        commodity_index: commodityIndexes,
        top_exporters: splitSemi(row.top_exporters),
        top_importers: splitSemi(row.top_importers),
        demand: splitSemi(row.demand),
        supply: splitSemi(row.supply),
        supplyoverdemand: splitSemi(row.supplyoverdemand),
        tradeoverdemand: splitSemi(row.tradeoverdemand),
        exporters_opi: splitSemi(row.exporters_opi),
        importers_opi: splitSemi(row.importers_opi),
        exported_value: splitSemi(row.exported_value),
        imported_value: splitSemi(row.imported_value),
      };

      bulk.find({ Exporting_country: exportCountry, Importing_country: importCountry }).upsert().updateOne({ $set: doc });
    }
    await bulk.execute();
    processed += chunk.length;
    process.stdout.write(`[seed] Trades: ${processed}/${rows.length}\r`);
  }
  console.log(`\n[seed] Trades upserted: ${processed}`);
}

const run = async () => {
  try {
    const existingCount = await Trade.countDocuments();
    if (existingCount > 0) {
      console.log(`[seed] DB already has ${existingCount} trade documents, skipping seed.`);
      return;
    }

    console.log("[seed] Starting — loading comprehensive_dataset_wide.json...");
    const dataPath = path.resolve(__dirname, "../../app/modules/storage/comprehensive_dataset_wide.json");
    const rows = require(dataPath);
    console.log(`[seed] Loaded ${rows.length} rows`);

    await seedCommodities(rows);
    await seedIndex(rows);
    await seedTrades(rows);
    console.log("[seed] Complete.");
  } catch (err) {
    console.error("[seed] Failed:", err.message);
  }
};

exports = module.exports = run;
