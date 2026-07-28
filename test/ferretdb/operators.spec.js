"use strict";

/**
 * FerretDB operator compatibility suite.
 *
 * Tests every aggregation operator and query pattern used in the live
 * controllers directly against the connected database — no HTTP layer.
 * Each test is labelled with the controller method(s) that depend on it
 * so a failure immediately tells you which endpoint is broken.
 *
 * Run:  npm test  (or mocha 'test/ferretdb/**\/*.spec.js' ...)
 *
 * Requires the DB to be seeded (at least one Trade + Commodity + Index doc).
 * The suite is read-only — it never writes or modifies data.
 */

require("dotenv").config();

const mongoose = require("mongoose");
const { expect } = require("chai");

const { Trade } = require("../../app/models/Trade");
const { Commodity } = require("../../app/models/Commodity");
const { Index } = require("../../app/models/Index");

// ─── connection ──────────────────────────────────────────────────────────────

const MONGO_URI =
  process.env.MONGODB_URI ||
  `mongodb://${process.env.MONGODB_APP_USER || "root"}:${
    process.env.MONGODB_APP_PASSWORD || "root"
  }@${process.env.MONGODB_HOST || "localhost"}:${
    process.env.MONGODB_GUEST_PORT || "27017"
  }/${process.env.MONGODB_INIT_DATABASE || "sci"}?authSource=admin`;

before(async function () {
  this.timeout(20000);
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 10000 });
  }
});

after(async function () {
  await mongoose.disconnect();
});

// ─── helpers ─────────────────────────────────────────────────────────────────

/** Pick one real Trade doc to use as fixture data throughout the suite. */
async function pickTrade() {
  const doc = await Trade.findOne(
    { Exporting_country: { $exists: true }, "commodity_tradeValue.0": { $exists: true } },
    { Exporting_country: 1, Importing_country: 1, RECs: 1, Exporting_RECs: 1,
      Importing_RECs: 1, interconnected_countries: 1, commodity_tradeValue: 1 }
  );
  if (!doc) throw new Error("No seeded Trade documents found — run the seed first.");
  return doc;
}

async function pickCommodity() {
  const doc = await Commodity.findOne({});
  if (!doc) throw new Error("No seeded Commodity documents found — run the seed first.");
  return doc;
}

async function pickIndex() {
  const doc = await Index.findOne({});
  if (!doc) throw new Error("No seeded Index documents found — run the seed first.");
  return doc;
}

// ─── suite ───────────────────────────────────────────────────────────────────

describe("FerretDB operator compatibility", function () {
  this.timeout(30000);

  // ── 1. $match (exact string) ────────────────────────────────────────────────
  describe("$match — exact string equality", function () {
    it("returns trade rows for a known exporting country  [getTrade, betweenCountries]", async function () {
      const { Exporting_country } = await pickTrade();
      const result = await Trade.aggregate([
        { $match: { Exporting_country } },
        { $project: { _id: 0, Exporting_country: 1 } },
        { $limit: 1 },
      ]);
      expect(result).to.be.an("array").with.length.above(0);
      expect(result[0].Exporting_country).to.equal(Exporting_country);
    });
  });

  // ── 2. $match ($in array) ───────────────────────────────────────────────────
  describe("$match — $in operator", function () {
    it("matches documents whose Importing_country is in a list  [interconnected_countries]", async function () {
      const trade = await pickTrade();
      const countries = (trade.interconnected_countries || []).slice(0, 3);
      if (!countries.length) this.skip();

      const result = await Trade.aggregate([
        {
          $match: {
            Exporting_country: trade.Exporting_country,
            Importing_country: { $in: countries },
          },
        },
        { $project: { _id: 0, Importing_country: 1 } },
      ]);
      expect(result).to.be.an("array").with.length.above(0);
      result.forEach((r) => expect(countries).to.include(r.Importing_country));
    });
  });

  // ── 3. $match ($ne) ─────────────────────────────────────────────────────────
  describe("$match — $ne operator", function () {
    it("excludes a specific commodity from results  [otherPotentials]", async function () {
      const trade = await pickTrade();
      const com = await Commodity.findById(trade.commodity_tradeValue[0].commodity);
      if (!com) this.skip();

      const result = await Trade.aggregate([
        { $match: { Exporting_country: trade.Exporting_country, Importing_country: trade.Importing_country } },
        { $unwind: "$commodity_tradeValue" },
        { $lookup: { from: "commodities", localField: "commodity_tradeValue.commodity", foreignField: "_id", as: "commodities" } },
        { $unwind: { path: "$commodities", preserveNullAndEmptyArrays: false } },
        { $match: { "commodities.commodity": { $ne: com.commodity } } },
        { $project: { _id: 0, commodity: "$commodities.commodity" } },
      ]);
      result.forEach((r) =>
        expect(r.commodity).to.not.equal(com.commodity)
      );
    });
  });

  // ── 4. $match ($gt) ─────────────────────────────────────────────────────────
  describe("$match — $gt operator", function () {
    it("filters commodity rows with commodity_index > 0  [byCommodity]", async function () {
      const trade = await pickTrade();
      const com = await Commodity.findById(trade.commodity_tradeValue[0].commodity);
      if (!com) this.skip();

      const result = await Trade.aggregate([
        { $unwind: "$commodity_tradeValue" },
        { $match: { "commodity_tradeValue.commodity": com._id } },
        { $match: { Exporting_country: trade.Exporting_country } },
        { $lookup: { from: "commodities", localField: "commodity_tradeValue.commodity", foreignField: "_id", as: "commodities" } },
        { $unwind: "$commodities" },
        { $addFields: { commodity_index_rank: { commodity_index: "$commodity_tradeValue.commodity_index" } } },
        { $match: { "commodity_index_rank.commodity_index": { $gt: 0 } } },
        { $project: { _id: 0, Importing_country: 1, "commodity_index_rank.commodity_index": 1 } },
      ]);
      result.forEach((r) =>
        expect(r.commodity_index_rank.commodity_index).to.be.above(0)
      );
    });
  });

  // ── 5. $match + $expr + $gte / $lte ─────────────────────────────────────────
  describe("$match — $expr with $gte / $lte  [RISK: medium]", function () {
    it("filters Index collection by country_index range  [countryIndex]", async function () {
      const idx = await pickIndex();
      const min = 0;
      const max = idx.country_index + 1;

      const result = await Index.aggregate([
        {
          $match: {
            $expr: {
              $and: [
                { $gte: ["$country_index", min] },
                { $lte: ["$country_index", max] },
              ],
            },
          },
        },
        { $project: { _id: 0, country: 1, country_index: 1 } },
        { $limit: 5 },
      ]);
      expect(result).to.be.an("array").with.length.above(0);
      result.forEach((r) => {
        expect(r.country_index).to.be.at.least(min);
        expect(r.country_index).to.be.at.most(max);
      });
    });

    it("filters Trade commodity list by export_value range  [getCommodities]", async function () {
      const trade = await pickTrade();

      const result = await Trade.aggregate([
        { $match: { Exporting_country: trade.Exporting_country, Importing_country: trade.Importing_country } },
        { $unwind: "$commodity_tradeValue" },
        { $lookup: { from: "commodities", localField: "commodity_tradeValue.commodity", foreignField: "_id", as: "commodities" } },
        { $unwind: { path: "$commodities", preserveNullAndEmptyArrays: false } },
        { $addFields: { export_value: "$commodity_tradeValue.export_value" } },
        { $project: { _id: 0, export_value: 1 } },
        {
          $match: {
            $expr: {
              $and: [
                { $gte: ["$export_value", 0] },
                { $lte: ["$export_value", 9999999999] },
              ],
            },
          },
        },
        { $limit: 5 },
      ]);
      expect(result).to.be.an("array");
    });
  });

  // ── 6. $match + $regex ───────────────────────────────────────────────────────
  describe("$match — $regex  [RISK: medium]", function () {
    it("prefix match on commodity name returns results  [search, countryCommodities]", async function () {
      const com = await pickCommodity();
      const prefix = com.commodity.slice(0, 3).toLowerCase();

      const result = await Commodity.aggregate([
        {
          $match: {
            commodity: { $regex: new RegExp("^" + prefix, "i") },
          },
        },
        { $project: { _id: 0, commodity: 1 } },
        { $limit: 5 },
      ]);
      expect(result).to.be.an("array").with.length.above(0);
      result.forEach((r) =>
        expect(r.commodity.toLowerCase()).to.match(new RegExp("^" + prefix, "i"))
      );
    });

    it("word-boundary match on country name returns results  [countryIndex search]", async function () {
      const idx = await pickIndex();
      const word = idx.country.split(" ")[0].toLowerCase();

      const result = await Index.aggregate([
        {
          $match: {
            country: { $regex: new RegExp("\\b" + word + "\\b", "i") },
          },
        },
        { $project: { _id: 0, country: 1 } },
        { $limit: 5 },
      ]);
      expect(result).to.be.an("array").with.length.above(0);
    });

    it("$or regex on commodity pipeline stage returns results  [search endpoint]", async function () {
      const trade = await pickTrade();
      const com = await Commodity.findById(trade.commodity_tradeValue[0].commodity);
      if (!com) this.skip();
      const prefix = com.commodity.slice(0, 3).toLowerCase();

      const result = await Trade.aggregate([
        { $match: { Exporting_country: trade.Exporting_country, Importing_country: trade.Importing_country } },
        { $unwind: "$commodity_tradeValue" },
        { $lookup: { from: "commodities", localField: "commodity_tradeValue.commodity", foreignField: "_id", as: "commodities" } },
        { $unwind: { path: "$commodities", preserveNullAndEmptyArrays: false } },
        {
          $match: {
            $or: [
              { "commodities.commodity": { $regex: new RegExp("^" + prefix, "i") } },
              { "commodities.commodity": { $regex: new RegExp("\\b" + prefix + "\\b", "i") } },
            ],
          },
        },
        { $project: { _id: 0, commodity: "$commodities.commodity" } },
      ]);
      expect(result).to.be.an("array");
    });
  });

  // ── 7. $project + $slice ─────────────────────────────────────────────────────
  describe("$project — $slice expression  [RISK: medium]", function () {
    it("slices commodity_tradeValue array to 3 items  [getTrade, interconnected_countries]", async function () {
      const { Exporting_country, Importing_country } = await pickTrade();

      const result = await Trade.aggregate([
        { $match: { Exporting_country, Importing_country } },
        {
          $project: {
            _id: 0,
            commodity_tradeValue: { $slice: ["$commodity_tradeValue", 3] },
          },
        },
        { $limit: 1 },
      ]);
      expect(result).to.be.an("array").with.length.above(0);
      expect(result[0].commodity_tradeValue).to.be.an("array");
      expect(result[0].commodity_tradeValue.length).to.be.at.most(3);
    });
  });

  // ── 8. $project + $replaceAll ────────────────────────────────────────────────
  describe("$project — $replaceAll string expression  [RISK: high]", function () {
    it("replaces semicolons in RECs field with commas  [betweenCountries/byPopi]", async function () {
      const trade = await pickTrade();
      // Find a doc that actually has semicolons, else skip gracefully
      const doc = await Trade.findOne({ RECs: /;/ });
      if (!doc) {
        // No semicolons in data — test that the operator at least doesn't error
        const result = await Trade.aggregate([
          { $match: { Exporting_country: trade.Exporting_country, Importing_country: trade.Importing_country } },
          {
            $project: {
              _id: 0,
              RECs: { $replaceAll: { input: "$RECs", find: ";", replacement: "," } },
            },
          },
          { $limit: 1 },
        ]);
        expect(result).to.be.an("array").with.length.above(0);
        return;
      }

      const result = await Trade.aggregate([
        { $match: { _id: doc._id } },
        {
          $project: {
            _id: 0,
            RECs: { $replaceAll: { input: "$RECs", find: ";", replacement: "," } },
            Exporting_RECs: { $replaceAll: { input: "$Exporting_RECs", find: ";", replacement: "," } },
            Importing_RECs: { $replaceAll: { input: "$Importing_RECs", find: ";", replacement: "," } },
          },
        },
        { $limit: 1 },
      ]);
      expect(result).to.be.an("array").with.length.above(0);
      if (result[0].RECs) {
        expect(result[0].RECs).to.not.include(";");
        expect(result[0].RECs).to.include(",");
      }
    });
  });

  // ── 9. $unwind ───────────────────────────────────────────────────────────────
  describe("$unwind — array field", function () {
    it("unwinds commodity_tradeValue into individual docs  [getTrade, getCommodities]", async function () {
      const { Exporting_country, Importing_country } = await pickTrade();

      const grouped = await Trade.aggregate([
        { $match: { Exporting_country, Importing_country } },
        { $project: { _id: 0, commodity_tradeValue: 1 } },
        { $limit: 1 },
      ]);
      const before = grouped[0]?.commodity_tradeValue?.length || 0;

      const unwound = await Trade.aggregate([
        { $match: { Exporting_country, Importing_country } },
        { $unwind: "$commodity_tradeValue" },
        { $project: { _id: 0, commodity_tradeValue: 1 } },
      ]);
      expect(unwound.length).to.equal(before);
    });

    it("preserveNullAndEmptyArrays: false drops docs with missing lookup results", async function () {
      const { Exporting_country, Importing_country } = await pickTrade();
      const result = await Trade.aggregate([
        { $match: { Exporting_country, Importing_country } },
        { $unwind: "$commodity_tradeValue" },
        { $lookup: { from: "commodities", localField: "commodity_tradeValue.commodity", foreignField: "_id", as: "commodities" } },
        { $unwind: { path: "$commodities", preserveNullAndEmptyArrays: false } },
        { $limit: 3 },
      ]);
      result.forEach((r) => expect(r.commodities).to.exist);
    });
  });

  // ── 10. $lookup ──────────────────────────────────────────────────────────────
  describe("$lookup — join Trade → Commodity", function () {
    it("populates commodity name from ObjectId reference  [getTrade, getCommodities, search]", async function () {
      const { Exporting_country, Importing_country } = await pickTrade();

      const result = await Trade.aggregate([
        { $match: { Exporting_country, Importing_country } },
        { $unwind: "$commodity_tradeValue" },
        { $lookup: { from: "commodities", localField: "commodity_tradeValue.commodity", foreignField: "_id", as: "commodities" } },
        { $unwind: { path: "$commodities", preserveNullAndEmptyArrays: false } },
        { $project: { _id: 0, commodity: "$commodities.commodity", category: "$commodities.category" } },
        { $limit: 3 },
      ]);
      expect(result).to.be.an("array").with.length.above(0);
      result.forEach((r) => {
        expect(r.commodity).to.be.a("string").and.not.empty;
        expect(r.category).to.be.a("string").and.not.empty;
      });
    });
  });

  // ── 11. $addFields ───────────────────────────────────────────────────────────
  describe("$addFields — synthetic field injection", function () {
    it("injects commodity and export_value fields onto each unwound doc  [getTrade, getCommodities]", async function () {
      const { Exporting_country, Importing_country } = await pickTrade();

      const result = await Trade.aggregate([
        { $match: { Exporting_country, Importing_country } },
        { $unwind: "$commodity_tradeValue" },
        { $lookup: { from: "commodities", localField: "commodity_tradeValue.commodity", foreignField: "_id", as: "commodities" } },
        { $unwind: { path: "$commodities", preserveNullAndEmptyArrays: false } },
        { $addFields: { commodity: "$commodities.commodity", export_value: "$commodity_tradeValue.export_value", category: "$commodities.category" } },
        { $project: { _id: 0, commodity: 1, export_value: 1, category: 1 } },
        { $limit: 3 },
      ]);
      expect(result).to.be.an("array").with.length.above(0);
      result.forEach((r) => {
        expect(r).to.have.property("commodity");
        expect(r).to.have.property("export_value");
        expect(r).to.have.property("category");
      });
    });
  });

  // ── 12. $group + $push ───────────────────────────────────────────────────────
  describe("$group — with $push accumulator", function () {
    it("re-groups unwound commodity rows back per trade pair  [getTrade, interconnected]", async function () {
      const { Exporting_country, Importing_country } = await pickTrade();

      const result = await Trade.aggregate([
        { $match: { Exporting_country, Importing_country } },
        { $project: { _id: 0, commodity_tradeValue: { $slice: ["$commodity_tradeValue", 3] }, Exporting_country: 1, Importing_country: 1, iso2_export: 1, iso2_import: 1, Commodities_count: 1, Opportunity_Index: 1 } },
        { $unwind: "$commodity_tradeValue" },
        { $lookup: { from: "commodities", localField: "commodity_tradeValue.commodity", foreignField: "_id", as: "commodities" } },
        { $unwind: { path: "$commodities", preserveNullAndEmptyArrays: false } },
        { $addFields: { commodity: "$commodities.commodity", export_value: "$commodity_tradeValue.export_value", category: "$commodities.category" } },
        {
          $group: {
            _id: { Exporting_country: "$Exporting_country", Importing_country: "$Importing_country", iso2_export: "$iso2_export", iso2_import: "$iso2_import", Commodities_count: "$Commodities_count", Opportunity_Index: "$Opportunity_Index" },
            commodity_tradeValue: { $push: { commodity: "$commodity", export_value: "$export_value", category: "$category" } },
          },
        },
        { $project: { _id: 0, Exporting_country: "$_id.Exporting_country", Importing_country: "$_id.Importing_country", Opportunity_Index: "$_id.Opportunity_Index", iso2_export: "$_id.iso2_export", iso2_import: "$_id.iso2_import", commodity_tradeValue: 1 } },
        { $limit: 1 },
      ]);
      expect(result).to.be.an("array").with.length.above(0);
      expect(result[0].commodity_tradeValue).to.be.an("array").with.length.above(0);
      expect(result[0].Exporting_country).to.be.a("string");
    });
  });

  // ── 13. $group + $sum ────────────────────────────────────────────────────────
  describe("$group — with $sum accumulator", function () {
    it("counts Index docs per region  [countryIndex regions]", async function () {
      const result = await Index.aggregate([
        { $group: { _id: { region: "$region" }, size: { $sum: 1 } } },
        { $project: { _id: 0, region: "$_id.region", size: 1 } },
      ]);
      expect(result).to.be.an("array").with.length.above(0);
      result.forEach((r) => {
        expect(r.size).to.be.a("number").and.above(0);
        expect(r).to.have.property("region");
      });
    });

    it("counts Trade commodities per category  [categories]", async function () {
      const { Exporting_country, Importing_country } = await pickTrade();

      const result = await Trade.aggregate([
        { $match: { Exporting_country, Importing_country } },
        { $unwind: "$commodity_tradeValue" },
        { $lookup: { from: "commodities", localField: "commodity_tradeValue.commodity", foreignField: "_id", as: "commodities" } },
        { $unwind: { path: "$commodities", preserveNullAndEmptyArrays: false } },
        { $addFields: { category: "$commodities.category" } },
        { $project: { _id: 0, category: 1 } },
        { $group: { _id: { category: "$category" }, size: { $sum: 1 } } },
        { $project: { _id: 0, category: "$_id.category", size: 1 } },
      ]);
      expect(result).to.be.an("array").with.length.above(0);
      result.forEach((r) => expect(r.size).to.be.above(0));
    });
  });

  // ── 14. $sort ────────────────────────────────────────────────────────────────
  describe("$sort", function () {
    it("sorts trade results by Opportunity_Index descending  [getTrade]", async function () {
      const { Exporting_country } = await pickTrade();

      const result = await Trade.aggregate([
        { $match: { Exporting_country } },
        { $project: { _id: 0, Opportunity_Index: 1 } },
        { $sort: { Opportunity_Index: -1 } },
        { $limit: 10 },
      ]);
      expect(result).to.be.an("array").with.length.above(0);
      for (let i = 1; i < result.length; i++) {
        expect(result[i - 1].Opportunity_Index).to.be.at.least(result[i].Opportunity_Index);
      }
    });

    it("sorts Index by country_index ascending  [countryIndex sort]", async function () {
      const result = await Index.aggregate([
        { $sort: { country_index: 1 } },
        { $project: { _id: 0, country_index: 1 } },
        { $limit: 10 },
      ]);
      for (let i = 1; i < result.length; i++) {
        expect(result[i - 1].country_index).to.be.at.most(result[i].country_index);
      }
    });
  });

  // ── 15. $limit ───────────────────────────────────────────────────────────────
  describe("$limit", function () {
    it("caps result set to 20 rows  [getCommodities pdf query]", async function () {
      const { Exporting_country, Importing_country } = await pickTrade();

      const result = await Trade.aggregate([
        { $match: { Exporting_country, Importing_country } },
        { $unwind: "$commodity_tradeValue" },
        { $lookup: { from: "commodities", localField: "commodity_tradeValue.commodity", foreignField: "_id", as: "commodities" } },
        { $unwind: { path: "$commodities", preserveNullAndEmptyArrays: false } },
        { $addFields: { commodity: "$commodities.commodity", export_value: "$commodity_tradeValue.export_value", category: "$commodities.category" } },
        { $project: { _id: 0, commodity: 1, export_value: 1, category: 1 } },
        { $limit: 20 },
      ]);
      expect(result.length).to.be.at.most(20);
    });
  });

  // ── 16. findOne with field projection ────────────────────────────────────────
  describe("findOne — projection", function () {
    it("returns a trade doc excluding heavy array fields  [betweenCountries]", async function () {
      const { Exporting_country, Importing_country } = await pickTrade();

      const doc = await Trade.findOne(
        { Exporting_country, Importing_country },
        { _id: 0, commodity_tradeValue: 0, commodities: 0, export_value: 0,
          commodity_code: 0, commodity_index: 0, top_exporters: 0,
          top_importers: 0, demand: 0, supply: 0, supplyoverdemand: 0,
          tradeoverdemand: 0, exporters_opi: 0, importers_opi: 0,
          exported_value: 0, imported_value: 0 }
      );
      expect(doc).to.exist;
      expect(doc.Exporting_country).to.equal(Exporting_country);
      expect(doc.commodity_tradeValue).to.be.undefined;
    });

    it("returns only interconnected_countries field  [interconnected]", async function () {
      const { Exporting_country, Importing_country } = await pickTrade();

      const doc = await Trade.findOne(
        { Exporting_country, Importing_country },
        { _id: 0, interconnected_countries: 1 }
      );
      expect(doc).to.exist;
      expect(doc).to.have.property("interconnected_countries");
    });
  });

  // ── 17. $set in updateOne ────────────────────────────────────────────────────
  describe("$set — update operator  [transaction controller]", function () {
    it("$set is accepted as an update operator (dry-run on Index collection)", async function () {
      const idx = await pickIndex();
      // We update with the same value — effectively a no-op, but confirms the
      // operator is accepted by FerretDB
      const result = await Index.updateOne(
        { _id: idx._id },
        { $set: { country: idx.country } }
      );
      expect(result.acknowledged).to.equal(true);
    });
  });

  // ── 18. Full getTrade pipeline (end-to-end operator chain) ───────────────────
  describe("Full pipeline — getTrade shape", function () {
    it("returns shaped trade objects with commodity_tradeValue array  [getTrade]", async function () {
      const { Exporting_country } = await pickTrade();

      const result = await Trade.aggregate([
        { $match: { Exporting_country } },
        { $project: { _id: 0, commodity_tradeValue: { $slice: ["$commodity_tradeValue", 3] }, Exporting_country: 1, Importing_country: 1, iso2_export: 1, iso2_import: 1, Commodities_count: 1, Opportunity_Index: 1, scaled_sci: 1, trade_value: "$total_export_value", total_export_value: 1, year: 1 } },
        { $unwind: "$commodity_tradeValue" },
        { $lookup: { from: "commodities", localField: "commodity_tradeValue.commodity", foreignField: "_id", as: "commodities" } },
        { $unwind: { path: "$commodities", preserveNullAndEmptyArrays: false } },
        { $addFields: { commodity: "$commodities.commodity", export_value: "$commodity_tradeValue.export_value", category: "$commodities.category" } },
        { $group: { _id: { Exporting_country: "$Exporting_country", Importing_country: "$Importing_country", iso2_export: "$iso2_export", iso2_import: "$iso2_import", Commodities_count: "$Commodities_count", Opportunity_Index: "$Opportunity_Index" }, commodity_tradeValue: { $push: { commodity: "$commodity", export_value: "$export_value", category: "$category" } } } },
        { $project: { _id: 0, Exporting_country: "$_id.Exporting_country", Importing_country: "$_id.Importing_country", Opportunity_Index: "$_id.Opportunity_Index", iso2_export: "$_id.iso2_export", iso2_import: "$_id.iso2_import", Commodities_count: "$_id.Commodities_count", commodity_tradeValue: 1 } },
        { $sort: { Opportunity_Index: -1 } },
        { $limit: 5 },
      ]);

      expect(result).to.be.an("array").with.length.above(0);
      const row = result[0];
      expect(row).to.have.property("Exporting_country", Exporting_country);
      expect(row).to.have.property("Importing_country").that.is.a("string");
      expect(row).to.have.property("commodity_tradeValue").that.is.an("array");
      expect(row.commodity_tradeValue[0]).to.have.property("commodity").that.is.a("string");
    });
  });

  // ── 19. Full byPopi pipeline ($replaceAll integration) ───────────────────────
  describe("Full pipeline — byPopi $replaceAll shape  [RISK: high]", function () {
    it("returns RECs with commas instead of semicolons  [byPopi]", async function () {
      const { Exporting_country, Importing_country } = await pickTrade();

      const result = await Trade.aggregate([
        { $match: { Exporting_country, Importing_country } },
        {
          $project: {
            _id: 0,
            Exporting_country: 1,
            Importing_country: 1,
            RECs: { $replaceAll: { input: "$RECs", find: ";", replacement: "," } },
            Exporting_RECs: { $replaceAll: { input: "$Exporting_RECs", find: ";", replacement: "," } },
            Importing_RECs: { $replaceAll: { input: "$Importing_RECs", find: ";", replacement: "," } },
            scaled_sci: 1,
            Opportunity_Index: 1,
          },
        },
        { $limit: 1 },
      ]);

      expect(result).to.be.an("array").with.length.above(0);
      const row = result[0];
      expect(row).to.have.property("Exporting_country");
      // If the field is populated and had semicolons, they must now be commas
      if (row.RECs) expect(row.RECs).to.not.include(";");
      if (row.Exporting_RECs) expect(row.Exporting_RECs).to.not.include(";");
      if (row.Importing_RECs) expect(row.Importing_RECs).to.not.include(";");
    });
  });
});
