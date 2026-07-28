"use strict";

/**
 * FerretDB operator compatibility suite.
 *
 * Spins up FerretDB v1 + PostgreSQL Docker containers, seeds minimal fixture
 * data, then runs every aggregation operator and query pattern used in the
 * live controllers directly against FerretDB — not MongoDB.
 *
 * Results legend:
 *   ✓ passing  — operator works correctly in FerretDB v1
 *   - pending  — operator confirmed NOT supported in FerretDB v1 (see note)
 *
 * Requirements: Docker must be running.
 * Run: npx mocha 'test/ferretdb/operators.spec.js' --timeout 120000 --exit
 */

require("dotenv").config();

const { execSync, spawnSync } = require("child_process");
const net      = require("net");
const mongoose = require("mongoose");
const { expect } = require("chai");

const { Trade }     = require("../../app/models/Trade");
const { Commodity } = require("../../app/models/Commodity");
const { Index }     = require("../../app/models/Index");

// ─── docker helpers ───────────────────────────────────────────────────────────

const NETWORK    = "ferretdb_test_net";
const PG_NAME    = "ferretdb_test_postgres";
const FDB_NAME   = "ferretdb_test_ferret";
let   FDB_PORT;
let   FDB_DEBUG;

function run(cmd) {
  execSync(cmd, { stdio: "pipe" });
}

function findFreePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.listen(0, "127.0.0.1", () => {
      const port = srv.address().port;
      srv.close(() => resolve(port));
    });
    srv.on("error", reject);
  });
}

function stopAndRemove(name) {
  spawnSync("docker", ["rm", "-f", name], { stdio: "pipe" });
}

// ─── fixture data ─────────────────────────────────────────────────────────────

const COMMODITY_A = { commodity: "Phosphoric Esters and Salts", category: "Chemicals" };
const COMMODITY_B = { commodity: "Cassava",                     category: "Agriculture" };
const COMMODITY_C = { commodity: "Graphite",                    category: "Minerals" };

const INDEX_NG = { country: "Nigeria", country_code: "NG", region: "West Africa", country_index: 72.5 };
const INDEX_NE = { country: "Niger",   country_code: "NE", region: "West Africa", country_index: 41.2 };
const INDEX_KE = { country: "Kenya",   country_code: "KE", region: "East Africa", country_index: 65.0 };

function buildTrade(exporter, importer, commodityIds, interconnected) {
  return {
    Exporting_country: exporter,
    Importing_country: importer,
    Exporting_region: "West Africa",
    Importing_region: "West Africa",
    Exporting_RECs: "ECOWAS;AU",
    Importing_RECs: "ECOWAS;CEN-SAD",
    RECs: "ECOWAS;AU",
    Exporting_GDP: 440000000000,
    Importing_GDP:  14000000000,
    Exporting_GDP_per_Capita: 2100,
    Importing_GDP_per_Capita:  600,
    iso2_export: "NG", iso2_import: "NE",
    dist: 1200, distcap: 1200, contig: 1, comcol: 0, comlang_off: 1,
    scaled_sci: 31500, year: "2019",
    Commodities_count: 3,
    Opportunity_Index: 58.4,
    Country_Index: 72.5,
    total_export_value: 95000,
    trade_value: 95000,
    ranked_sci: "5th",
    interconnected_countries: interconnected || [],
    interconnected_countries_number: (interconnected || []).length,
    Exporting_exchange_rate: "460.50 NGN",
    Importing_exchange_rate: "590.30 XOF",
    Yesterday_Exporting_exchange_rate: "459.00 NGN",
    Yesterday_Importing_exchange_rate: "589.00 XOF",
    commodity_tradeValue: commodityIds.map((id, i) => ({
      commodity:       id,
      export_value:    40000 - i * 10000,
      commodity_index: parseFloat((0.75 - i * 0.1).toFixed(2)),
      commodity_code:  2900 + i,
    })),
    top_commodity: { commodity: commodityIds[0], export_value: 40000, commodity_index: 0.75 },
    commodities:      [COMMODITY_A.commodity, COMMODITY_B.commodity, COMMODITY_C.commodity],
    export_value:     ["40000", "30000", "25000"],
    commodity_code:   ["2901", "2902", "2903"],
    commodity_index:  ["0.75", "0.65", "0.55"],
    top_exporters:    ["Nigeria/Ghana",  "Nigeria/Ghana",  "Nigeria/Ghana"],
    top_importers:    ["Niger/Benin",    "Niger/Benin",    "Niger/Benin"],
    exporters_opi:    ["0.8/0.6", "0.7/0.5", "0.6/0.4"],
    importers_opi:    ["0.5/0.4", "0.4/0.3", "0.3/0.2"],
    exported_value:   ["40000/20000", "30000/15000", "25000/12000"],
    imported_value:   ["15000/8000",  "12000/6000",  "10000/5000"],
    demand:           ["5000", "4000", "3000"],
    supply:           ["6000", "5000", "4000"],
    supplyoverdemand: ["1.2", "1.25", "1.33"],
    tradeoverdemand:  ["0.8", "0.75", "0.7"],
  };
}

// ─── container lifecycle ──────────────────────────────────────────────────────

before(async function () {
  this.timeout(180000);

  FDB_PORT  = await findFreePort();
  FDB_DEBUG = await findFreePort();

  stopAndRemove(FDB_NAME);
  stopAndRemove(PG_NAME);
  spawnSync("docker", ["network", "rm", NETWORK], { stdio: "pipe" });

  run(`docker network create ${NETWORK}`);

  run([
    "docker run -d",
    `--name ${PG_NAME}`,
    `--network ${NETWORK}`,
    "--network-alias postgres",
    "-e POSTGRES_USER=ferret",
    "-e POSTGRES_PASSWORD=ferret",
    "-e POSTGRES_DB=ferret",
    "postgres:16",
  ].join(" "));

  const pgDeadline = Date.now() + 60000;
  while (true) {
    const r = spawnSync("docker", ["exec", PG_NAME, "pg_isready", "-U", "ferret"], { stdio: "pipe" });
    if (r.status === 0) break;
    if (Date.now() > pgDeadline) throw new Error("Postgres did not become ready within 60s");
    await new Promise((res) => setTimeout(res, 1000));
  }

  // v1 is the last FerretDB release that works with plain postgres:16.
  // v2 (latest) requires the DocumentDB extension which is not in the
  // standard postgres image.
  run([
    "docker run -d",
    `--name ${FDB_NAME}`,
    `--network ${NETWORK}`,
    `-p ${FDB_PORT}:27017`,
    `-p ${FDB_DEBUG}:8088`,
    `-e FERRETDB_POSTGRESQL_URL=postgres://ferret:ferret@postgres:5432/ferret`,
    `-e FERRETDB_AUTH=false`,
    "ghcr.io/ferretdb/ferretdb:1",
  ].join(" "));

  // /debug/readyz returns 200 only once FerretDB has finished initialising
  // its Postgres schemas and is ready to handle commands.
  const healthDeadline = Date.now() + 60000;
  while (true) {
    const r = spawnSync("curl", ["-sf", `http://127.0.0.1:${FDB_DEBUG}/debug/readyz`], { stdio: "pipe" });
    if (r.status === 0) break;
    if (Date.now() > healthDeadline) throw new Error("FerretDB did not become ready within 60s");
    await new Promise((res) => setTimeout(res, 1000));
  }

  await mongoose.connect(`mongodb://127.0.0.1:${FDB_PORT}/sci?directConnection=true`, {
    serverSelectionTimeoutMS: 15000,
  });

  const [comA, comB, comC] = await Commodity.insertMany([COMMODITY_A, COMMODITY_B, COMMODITY_C]);
  await Index.insertMany([INDEX_NG, INDEX_NE, INDEX_KE]);
  await Trade.insertMany([
    // Niger has 2 interconnected countries, Ghana has 1, Benin has none
    buildTrade("Nigeria", "Niger",   [comA._id, comB._id, comC._id], ["Ghana", "Benin"]),
    buildTrade("Nigeria", "Ghana",   [comA._id, comC._id, comB._id], ["Niger"]),
    buildTrade("Nigeria", "Benin",   [comB._id, comA._id, comC._id], []),
    buildTrade("Kenya",   "Nigeria", [comC._id, comB._id, comA._id], []),
  ]);
});

after(async function () {
  this.timeout(30000);
  await mongoose.disconnect();
  stopAndRemove(FDB_NAME);
  stopAndRemove(PG_NAME);
  spawnSync("docker", ["network", "rm", NETWORK], { stdio: "pipe" });
});

// ─── constants ────────────────────────────────────────────────────────────────

const EXPORTER = "Nigeria";
const IMPORTER = "Niger";

// ─── tests ────────────────────────────────────────────────────────────────────

describe("FerretDB operator compatibility", function () {
  this.timeout(30000);

  // ── 1. $match — exact string ─────────────────────────────────────────────────
  describe("$match — exact string equality", function () {
    it("returns trade rows for a known exporting country  [getTrade, betweenCountries]", async function () {
      const result = await Trade.aggregate([
        { $match: { Exporting_country: EXPORTER } },
        { $project: { _id: 0, Exporting_country: 1 } },
        { $limit: 1 },
      ]);
      expect(result).to.be.an("array").with.length.above(0);
      expect(result[0].Exporting_country).to.equal(EXPORTER);
    });
  });

  // ── 2. $match — $in ──────────────────────────────────────────────────────────
  describe("$match — $in operator", function () {
    it("matches documents whose Importing_country is in a list  [interconnected_countries]", async function () {
      const countries = ["Ghana", "Benin"];
      const result = await Trade.aggregate([
        { $match: { Exporting_country: EXPORTER, Importing_country: { $in: countries } } },
        { $project: { _id: 0, Importing_country: 1 } },
      ]);
      expect(result).to.be.an("array").with.length(2);
      result.forEach((r) => expect(countries).to.include(r.Importing_country));
    });
  });

  // ── 3. $match — $ne ──────────────────────────────────────────────────────────
  describe("$match — $ne operator", function () {
    it("excludes a specific importing country from results  [otherPotentials]", async function () {
      const result = await Trade.aggregate([
        { $match: { Exporting_country: EXPORTER, Importing_country: { $ne: IMPORTER } } },
        { $project: { _id: 0, Importing_country: 1 } },
      ]);
      // Nigeria trades with Niger, Ghana, Benin — excluding Niger leaves 2
      expect(result).to.be.an("array").with.length(2);
      result.forEach((r) => expect(r.Importing_country).to.not.equal(IMPORTER));
    });
  });

  // ── 4. $match — $gt ──────────────────────────────────────────────────────────
  describe("$match — $gt operator", function () {
    it("filters trade rows by Opportunity_Index > 50  [byCommodity]", async function () {
      const result = await Trade.aggregate([
        { $match: { Opportunity_Index: { $gt: 50 } } },
        { $project: { _id: 0, Opportunity_Index: 1, Importing_country: 1 } },
      ]);
      expect(result).to.be.an("array").with.length.above(0);
      result.forEach((r) => expect(r.Opportunity_Index).to.be.above(50));
    });
  });

  // ── 5. $match — $expr + $gte / $lte ─────────────────────────────────────────
  // CONFIRMED INCOMPATIBLE: $expr with $and/$gte/$lte is not implemented in
  // FerretDB v1. Affects: GET /api/country/index (range filter),
  // GET /api/trade/commodities (export_value range filter).
  describe("$match — $expr with $gte / $lte  [INCOMPATIBLE: not implemented in FerretDB v1]", function () {
    it("filters Index by country_index range  [countryIndex]", async function () {
      this.skip();
    });

    it("filters Trade commodities by export_value range  [getCommodities]", async function () {
      this.skip();
    });
  });

  // ── 6. $match — $regex ───────────────────────────────────────────────────────
  describe("$match — $regex", function () {
    it("prefix match on commodity name  [search, countryCommodities]", async function () {
      const result = await Commodity.aggregate([
        { $match: { commodity: { $regex: new RegExp("^phos", "i") } } },
        { $project: { _id: 0, commodity: 1 } },
      ]);
      expect(result).to.be.an("array").with.length(1);
      expect(result[0].commodity).to.equal(COMMODITY_A.commodity);
    });

    it("word-boundary match on country name  [countryIndex search]", async function () {
      const result = await Index.aggregate([
        { $match: { country: { $regex: new RegExp("\\bNigeria\\b", "i") } } },
        { $project: { _id: 0, country: 1 } },
      ]);
      expect(result).to.be.an("array").with.length(1);
      expect(result[0].country).to.equal("Nigeria");
    });

    it("$or with regex matches multiple patterns  [search endpoint]", async function () {
      // Match on Commodity — only COMMODITY_B starts with "cas"
      // and COMMODITY_C matches "\\bgraphite\\b"
      const result = await Commodity.aggregate([
        {
          $match: {
            $or: [
              { commodity: { $regex: new RegExp("^cas", "i") } },
              { commodity: { $regex: new RegExp("\\bgraphite\\b", "i") } },
            ],
          },
        },
        { $project: { _id: 0, commodity: 1 } },
      ]);
      expect(result).to.be.an("array").with.length(2);
      const names = result.map((r) => r.commodity).sort();
      expect(names).to.deep.equal([COMMODITY_B.commodity, COMMODITY_C.commodity].sort());
    });
  });

  // ── 7. $project — $slice ─────────────────────────────────────────────────────
  // CONFIRMED INCOMPATIBLE: $slice as an aggregation expression inside
  // $project is not implemented in FerretDB v1. Affects: GET /api/trade
  // (getTrade), GET /api/trade/interconnected/countries.
  describe("$project — $slice expression  [INCOMPATIBLE: not implemented in FerretDB v1]", function () {
    it("slices commodity_tradeValue to 3 items  [getTrade, interconnected]", async function () {
      this.skip();
    });
  });

  // ── 8. $project — $replaceAll ────────────────────────────────────────────────
  // CONFIRMED INCOMPATIBLE: $replaceAll is not implemented in FerretDB v1.
  // Affects: GET /api/trade/view (betweenCountries),
  // GET /api/trade/byCommodity/view (byPopi), POST /api/pdf.
  describe("$project — $replaceAll string expression  [INCOMPATIBLE: not implemented in FerretDB v1]", function () {
    it("replaces semicolons with commas in RECs fields  [betweenCountries, byPopi]", async function () {
      this.skip();
    });
  });

  // ── 9. $unwind ───────────────────────────────────────────────────────────────
  describe("$unwind — array field", function () {
    it("produces one doc per commodity entry  [getTrade, getCommodities]", async function () {
      const result = await Trade.aggregate([
        { $match: { Exporting_country: EXPORTER, Importing_country: IMPORTER } },
        { $unwind: "$commodity_tradeValue" },
        { $project: { _id: 0, "commodity_tradeValue.export_value": 1 } },
      ]);
      expect(result).to.be.an("array").with.length(3); // 3 commodities in fixture
    });

    // CONFIRMED INCOMPATIBLE: $unwind with options object (preserveNullAndEmptyArrays)
    // is not implemented in FerretDB v1. Only the simple string form works.
    // Affects: all endpoints that use $unwind with options.
    it("preserveNullAndEmptyArrays option  [INCOMPATIBLE: not implemented in FerretDB v1]", async function () {
      this.skip();
    });
  });

  // ── 10. $lookup ──────────────────────────────────────────────────────────────
  // CONFIRMED INCOMPATIBLE: $lookup is not implemented in FerretDB v1.
  // Affects: GET /api/trade (getTrade), GET /api/trade/commodities,
  // GET /api/trade/search, GET /api/trade/byCommodity,
  // GET /api/trade/interconnected/countries, GET /api/categories,
  // GET /api/country/commodities, POST /api/pdf.
  describe("$lookup — Trade → Commodity join  [INCOMPATIBLE: not implemented in FerretDB v1]", function () {
    it("populates commodity name from ObjectId reference  [getTrade, getCommodities, search]", async function () {
      this.skip();
    });
  });

  // ── 11. $addFields ───────────────────────────────────────────────────────────
  // CONFIRMED INCOMPATIBLE: $addFields with field reference expressions
  // (e.g. "$Exporting_region") is not implemented in FerretDB v1.
  // Affects: all pipelines that use $addFields to inject commodity/category
  // fields after $lookup — i.e. getTrade, getCommodities, search, etc.
  describe("$addFields — synthetic field injection  [INCOMPATIBLE: not implemented in FerretDB v1]", function () {
    it("injects a field computed from an existing field reference  [getTrade, getCommodities]", async function () {
      this.skip();
    });
  });

  // ── 12. $group + $push ───────────────────────────────────────────────────────
  // CONFIRMED INCOMPATIBLE: $push accumulator in $group is not implemented
  // in FerretDB v1. Affects: getTrade and interconnected_countries pipelines
  // which use $push to re-group commodity rows after $lookup + $unwind.
  describe("$group — with $push accumulator  [INCOMPATIBLE: not implemented in FerretDB v1]", function () {
    it("collects values per group into an array  [getTrade, interconnected]", async function () {
      this.skip();
    });
  });

  // ── 13. $group + $sum ────────────────────────────────────────────────────────
  describe("$group — with $sum accumulator", function () {
    it("counts Index docs per region  [countryIndex regions]", async function () {
      // Group by region string directly to avoid $project rename of $_id.subfield
      const result = await Index.aggregate([
        { $group: { _id: "$region", size: { $sum: 1 } } },
      ]);
      expect(result).to.be.an("array").with.length(2); // West Africa + East Africa
      const westAfrica = result.find((r) => r._id === "West Africa");
      expect(westAfrica).to.exist;
      expect(westAfrica.size).to.equal(2);
    });

    it("counts Trade docs per importing country  [categories]", async function () {
      const result = await Trade.aggregate([
        { $match: { Exporting_country: EXPORTER } },
        { $group: { _id: "$Importing_country", count: { $sum: 1 } } },
      ]);
      expect(result).to.be.an("array").with.length(3); // Niger, Ghana, Benin
      result.forEach((r) => expect(r.count).to.equal(1));
    });
  });

  // ── 14. $sort ────────────────────────────────────────────────────────────────
  describe("$sort", function () {
    it("sorts trade results by Opportunity_Index descending  [getTrade]", async function () {
      const result = await Trade.aggregate([
        { $match: { Exporting_country: EXPORTER } },
        { $project: { _id: 0, Opportunity_Index: 1 } },
        { $sort: { Opportunity_Index: -1 } },
      ]);
      expect(result).to.be.an("array").with.length.above(0);
      for (let i = 1; i < result.length; i++) {
        expect(result[i - 1].Opportunity_Index).to.be.at.least(result[i].Opportunity_Index);
      }
    });

    it("sorts Index by country ascending  [countryIndex sort]", async function () {
      const result = await Index.aggregate([
        { $sort: { country: 1 } },
        { $project: { _id: 0, country: 1 } },
      ]);
      const names = result.map((r) => r.country);
      expect(names).to.deep.equal([...names].sort());
    });
  });

  // ── 15. $limit ───────────────────────────────────────────────────────────────
  describe("$limit", function () {
    it("caps the result set to 2 rows  [getCommodities, pdf query]", async function () {
      const result = await Trade.aggregate([
        { $match: { Exporting_country: EXPORTER } },
        { $project: { _id: 0, Importing_country: 1 } },
        { $limit: 2 },
      ]);
      expect(result.length).to.equal(2);
    });
  });

  // ── 16. findOne with field projection ────────────────────────────────────────
  describe("findOne — projection", function () {
    it("returns a trade doc excluding heavy array fields  [betweenCountries]", async function () {
      const doc = await Trade.findOne(
        { Exporting_country: EXPORTER, Importing_country: IMPORTER },
        {
          _id: 0, commodity_tradeValue: 0, commodities: 0, export_value: 0,
          commodity_code: 0, commodity_index: 0, top_exporters: 0,
          top_importers: 0, demand: 0, supply: 0, supplyoverdemand: 0,
          tradeoverdemand: 0, exporters_opi: 0, importers_opi: 0,
          exported_value: 0, imported_value: 0,
        }
      );
      expect(doc).to.exist;
      expect(doc.Exporting_country).to.equal(EXPORTER);
      expect(doc.commodity_tradeValue).to.be.undefined;
      expect(doc.Opportunity_Index).to.equal(58.4);
    });

    it("returns only interconnected_countries field  [interconnected]", async function () {
      const doc = await Trade.findOne(
        { Exporting_country: EXPORTER, Importing_country: IMPORTER },
        { _id: 0, interconnected_countries: 1 }
      );
      expect(doc).to.exist;
      expect(doc.interconnected_countries).to.deep.equal(["Ghana", "Benin"]);
    });
  });

  // ── 17. $set in updateOne ────────────────────────────────────────────────────
  describe("$set — update operator  [transaction controller]", function () {
    it("updates a field value and confirms the change", async function () {
      const before = await Index.findOne({ country: "Nigeria" });
      await Index.updateOne({ _id: before._id }, { $set: { country_index: 73.0 } });
      const after = await Index.findOne({ _id: before._id });
      expect(after.country_index).to.equal(73.0);
    });
  });

  // ── 18. Full getTrade pipeline ───────────────────────────────────────────────
  // CONFIRMED INCOMPATIBLE: relies on $slice (not implemented) and $lookup
  // (not implemented). The full getTrade pipeline does not work in FerretDB v1.
  describe("Full pipeline — getTrade shape  [INCOMPATIBLE: requires $slice + $lookup]", function () {
    it("returns shaped trade objects with resolved commodity names  [getTrade]", async function () {
      this.skip();
    });
  });

  // ── 19. Full byPopi pipeline ─────────────────────────────────────────────────
  // CONFIRMED INCOMPATIBLE: relies on $replaceAll (not implemented).
  // The byPopi pipeline does not work in FerretDB v1.
  describe("Full pipeline — byPopi $replaceAll shape  [INCOMPATIBLE: requires $replaceAll]", function () {
    it("returns RECs with commas and correct trade fields  [byPopi]", async function () {
      this.skip();
    });
  });
});
