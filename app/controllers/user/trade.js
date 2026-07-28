"use strict";

const {
  destructured,
  decoder,
  orderByOi,
  singleCommodity,
  lessThanPoint01,
  exporters,
  importers,
} = require("../../helpers/fileData");
const { Regions } = require("../../helpers/countryIndex");
// const { finale } = require("../../helpers/correctImports");
// const Copi = require("../../modules/Index/all");
const { Category } = require("../../helpers/categorization");
const { Code } = require("../../helpers/countryCode");
const _ = require("lodash");
const {
  BAD_REQUEST,
  INTERNAL_SERVER_ERROR,
  NOT_FOUND,
} = require("http-status-codes");
// const TradeClass = require("../../modules/Trade/index");
const { Trade } = require("../../models/Trade");
const { Index } = require("../../models/Index");
const { Commodity } = require("../../models/Commodity");

module.exports = class {
  static getTrade() {
    return async (req, res) => {
      /**
       * @desc User provides country of interest
       * @param focus_country
       * @final find country group in dataset and send data
       */

      // get focus country
      try {
        const { focus_country, code } = req.query;

        if (!focus_country && !code)
          return res
            .status(400)
            .send({ error: "Please provide a focus country or country code" });
        if (focus_country && code)
          return res
            .status(400)
            .send({ error: "You cant query both code and focus_country" });

        // filter out focus country info
        let country;
        if (code) {
          country = Code(code);
          if (!country)
            return res
              .status(BAD_REQUEST)
              .send({ error: "Country Code does not exist" });
        } else {
          country = decoder(focus_country);
        }

        const result = await Trade.aggregate([
          {
            $match: {
              Exporting_country: country,
            },
          },
          {
            $project: {
              _id: 0,
              commodity_tradeValue: {
                $slice: ["$commodity_tradeValue", 3],
              },
              Exporting_country: 1,
              Importing_country: 1,
              iso2_export: 1,
              iso2_import: 1,
              Commodities_count: 1,
              Opportunity_Index: 1,
              scaled_sci: 1,
              trade_value: "$total_export_value",
              total_export_value: 1,
              year: 1,
            },
          },

          { $unwind: "$commodity_tradeValue" },
          {
            $lookup: {
              from: "commodities",
              localField: "commodity_tradeValue.commodity",
              foreignField: "_id",
              as: "commodities",
            },
          },
          {
            $unwind: {
              path: "$commodities",
              preserveNullAndEmptyArrays: false,
            },
          },
          {
            $addFields: {
              commodity: "$commodities.commodity",
              export_value: "$commodity_tradeValue.export_value",
              category: "$commodities.category",
            },
          },
          {
            $group: {
              _id: {
                Exporting_country: "$Exporting_country",
                Importing_country: "$Importing_country",
                iso2_export: "$iso2_export",
                iso2_import: "$iso2_import",
                Commodities_count: "$Commodities_count",
                Opportunity_Index: "$Opportunity_Index",
              },
              commodity_tradeValue: {
                $push: {
                  commodity: "$commodity",
                  export_value: "$export_value",
                  category: "$category",
                },
              },
            },
          },
          {
            $project: {
              _id: 0,
              Exporting_country: "$_id.Exporting_country",
              Importing_country: "$_id.Importing_country",
              Opportunity_Index: "$_id.Opportunity_Index",
              iso2_export: "$_id.iso2_export",
              iso2_import: "$_id.iso2_import",
              Commodities_count: "$_id.Commodities_count",
              commodity_tradeValue: "$commodity_tradeValue",
            },
          },
          { $sort: { Opportunity_Index: -1 } },
        ]);
        if (!result.length)
          return res.status(NOT_FOUND).json({ message: "trade not found" });
        return res.json({
          origin: country,
          data: result,
        });
      } catch (e) {
        console.log(e);
        return res.status(BAD_REQUEST).send({ message: e.message });
      }
    };
  }

  static betweenCountries() {
    return async (req, res) => {
      // focus country and an import country
      let { export_code, import_code } = req.query;

      if (!export_code || !import_code)
        return res.status(BAD_REQUEST).send({
          error:
            "Please provide export(focus) country code and import country code.",
        });

      let exporter = Code(export_code);
      let importer = Code(import_code);
      if (!exporter || !importer)
        return res
          .status(BAD_REQUEST)
          .send({ error: "Country Code does not exist" });
      // const Trade = new TradeClass({ exporter, importer });
      let between = await Trade.findOne(
        { Exporting_country: exporter, Importing_country: importer },
        {
          _id: 0,
          commodity_tradeValue: 0,
          commodities: 0,
          export_value: 0,
          export_value: 0,
          commodity_code: 0,
          commodity_index: 0,
          top_exporters: 0,
          top_importers: 0,
          demand: 0,
          supply: 0,
          supplyoverdemand: 0,
          tradeoverdemand: 0,
          exporters_opi: 0,
          importers_opi: 0,
          exported_value: 0,
          imported_value: 0,
        }
      );

      if (!between) return res.status(NOT_FOUND).json(between);

      return res.send(between);
    };
  }

  static search() {
    return async (req, res) => {
      let { export_code, import_code, search } = req.query;

      if (!export_code || !import_code)
        return res.status(BAD_REQUEST).send({
          error:
            "Please provide export(focus) country code and import country code.",
        });
      if (!search)
        return res
          .status(BAD_REQUEST)
          .send({ message: "search query missing" });
      search = decoder(search);

      let exporter = Code(export_code);
      let importer = Code(import_code);
      if (!exporter || !importer)
        return res
          .status(BAD_REQUEST)
          .send({ error: "Country Code does not exist" });
      // const Trade = new TradeClass({ exporter, importer });
      const searchedCommodity = await Trade.aggregate([
        {
          $match: { Exporting_country: exporter, Importing_country: importer },
        },
        { $unwind: "$commodity_tradeValue" },
        {
          $lookup: {
            from: "commodities",
            localField: "commodity_tradeValue.commodity",
            foreignField: "_id",
            as: "commodities",
          },
        },
        {
          $unwind: {
            path: "$commodities",
            preserveNullAndEmptyArrays: false,
          },
        },
        {
          $match: {
            $or: [
              {
                "commodities.commodity": {
                  $regex: new RegExp("^" + search.toLowerCase(), "i"),
                },
              },
              {
                "commodities.commodity": {
                  $regex: new RegExp(
                    "\\b" + search.toLowerCase() + "(?:es|s)?\\b",
                    "i"
                  ),
                },
              },
            ],
          },
        },
        {
          $addFields: {
            commodity: "$commodities.commodity",
            export_value: "$commodity_tradeValue.export_value",
            category: "$commodities.category",
          },
        },
        {
          $project: {
            _id: 0,
            commodity: 1,
            export_value: 1,
            category: 1,
          },
        },
      ]);
      return res.send(searchedCommodity);
    };
  }

  static countryIndex() {
    return async (req, res) => {
      try {
        let { region, sort_by, order, max, min, search } = req.query;

        let pipeline = [];

        if (region) {
          pipeline.push({ $match: { region } });
        }

        if (sort_by && order) {
          const allowedSort = ["country", "region", "country_index"];
          const allowedOrder = ["ascending", "descending", "asc", "desc"];
          if (!allowedOrder.includes(order) || !allowedSort.includes(sort_by))
            return res.status(BAD_REQUEST).send({
              error: "Either sort_by or order query has the wrong input value",
            });
          order = order === "ascending" || order === "asc" ? 1 : -1;
          pipeline.push({ $sort: { [sort_by]: order } });
        }

        if (max && min) {
          pipeline.push({
            $match: {
              $expr: {
                $and: [
                  { $gte: ["$country_index", parseFloat(min)] },
                  { $lte: ["$country_index", parseFloat(max)] },
                ],
              },
            },
          });
        }

        if (search) {
          search = decoder(search);
          pipeline = [];
          pipeline.push({
            $match: {
              $or: [
                {
                  country: {
                    $regex: new RegExp("^" + search.toLowerCase(), "i"),
                  },
                },
                {
                  country: {
                    $regex: new RegExp(
                      "\\b" + search.toLowerCase() + "\\b",
                      "i"
                    ),
                  },
                },
              ],
            },
          });
        }

        pipeline.push({
          $project: {
            _id: 0,
            country: 1,
            country_code: 1,
            country_index: 1,
            region: 1,
          },
        });

        const data = await Index.aggregate(pipeline);
        const regions = await Index.aggregate([
          { $group: { _id: { region: "$region" }, size: { $sum: 1 } } },
          { $project: { _id: 0, region: "$_id.region", size: 1 } },
        ]);

        let result = { data, regions };
        return res.json(result);
      } catch (e) {
        return res.status(BAD_REQUEST).send({ error: e.message });
      }
    };
  }

  static getCommodities() {
    return async (req, res) => {
      let { export_code, import_code, category, sort_by, order, min, max } =
        req.query;

      if (!export_code || !import_code)
        return res.status(BAD_REQUEST).send({
          error:
            "Please provide export(focus) country code and import country code.",
        });

      let exporter = Code(export_code);
      let importer = Code(import_code);
      if (!exporter || !importer)
        return res
          .status(BAD_REQUEST)
          .send({ error: "Country Code does not exist" });

      const pipeline = [
        {
          $match: { Exporting_country: exporter, Importing_country: importer },
        },
        { $unwind: "$commodity_tradeValue" },
        {
          $lookup: {
            from: "commodities",
            localField: "commodity_tradeValue.commodity",
            foreignField: "_id",
            as: "commodities",
          },
        },
        {
          $unwind: {
            path: "$commodities",
            preserveNullAndEmptyArrays: false,
          },
        },

        {
          $addFields: {
            commodity: "$commodities.commodity",
            export_value: "$commodity_tradeValue.export_value",
            category: "$commodities.category",
          },
        },
        {
          $project: {
            _id: 0,
            commodity: 1,
            export_value: 1,
            category: 1,
          },
        },
      ];

      // const Trade = new TradeClass({ exporter, importer });
      // let commodities = Trade.categorised();

      if (category) {
        pipeline.push({ $match: { category } });
      }
      if (sort_by && order) {
        const allowedSort = ["commodity", "export_value"];
        const allowedOrder = ["ascending", "descending", "asc", "desc"];
        if (!allowedOrder.includes(order) || !allowedSort.includes(sort_by))
          return res.status(BAD_REQUEST).send({
            error: "Either sort_by or order query has the wrong input value",
          });

        order = order === "ascending" || order === "asc" ? 1 : -1;
        pipeline.push({ $sort: { [sort_by]: order } });
      }

      if (min && max) {
        pipeline.push({
          $match: {
            $expr: {
              $and: [
                { $gte: ["$export_value", parseFloat(min)] },
                { $lte: ["$export_value", parseFloat(max)] },
              ],
            },
          },
        });
      }
      const commodities = await Trade.aggregate(pipeline);

      return res.send(commodities);
    };
  }

  static categories() {
    return async (req, res) => {
      let { export_code, import_code } = req.query;

      if (!export_code || !import_code)
        return res.status(BAD_REQUEST).send({
          error:
            "Please provide export(focus) country code and import country code.",
        });

      let exporter = Code(export_code);
      let importer = Code(import_code);
      if (!exporter || !importer)
        return res
          .status(BAD_REQUEST)
          .send({ error: "Country Code does not exist" });

      let results = await Trade.aggregate([
        {
          $match: { Exporting_country: exporter, Importing_country: importer },
        },
        { $unwind: "$commodity_tradeValue" },
        {
          $lookup: {
            from: "commodities",
            localField: "commodity_tradeValue.commodity",
            foreignField: "_id",
            as: "commodities",
          },
        },
        {
          $unwind: {
            path: "$commodities",
            preserveNullAndEmptyArrays: false,
          },
        },

        {
          $addFields: {
            commodity: "$commodities.commodity",
            export_value: "$commodity_tradeValue.export_value",
            category: "$commodities.category",
          },
        },
        {
          $project: {
            _id: 0,
            commodity: 1,
            export_value: 1,
            category: 1,
          },
        },

        { $group: { _id: { category: "$category" }, size: { $sum: 1 } } },
        { $project: { _id: 0, category: "$_id.category", size: 1 } },
      ]);

      return res.send(results);
    };
  }

  static countryCommodity() {
    return async (req, res) => {
      let { export_code, query } = req.query;

      if (!export_code)
        return res.status(BAD_REQUEST).send({
          error: "Please provide export(focus) country code.",
        });

      let exporter = Code(export_code);

      let pipeline = [
        {
          $match: { Exporting_country: exporter },
        },
        { $unwind: "$commodity_tradeValue" },
        { $group: { _id: { commodity: "$commodity_tradeValue.commodity" } } },
        { $project: { _id: 0, commodity: "$_id.commodity" } },
        {
          $lookup: {
            from: "commodities",
            localField: "commodity",
            foreignField: "_id",
            as: "commodities",
          },
        },
        {
          $unwind: {
            path: "$commodities",
            preserveNullAndEmptyArrays: false,
          },
        },

        {
          $addFields: {
            commodity: "$commodities.commodity",
            category: "$commodities.category",
          },
        },
        {
          $project: {
            _id: 0,
            commodity: 1,
            category: 1,
          },
        },
        { $sort: { commodity: 1 } },
      ];

      if (query) {
        query = decoder(query);
        pipeline.push({
          $match: {
            $or: [
              {
                commodity: {
                  $regex: new RegExp("^" + query.toLowerCase(), "i"),
                },
              },
              {
                commodity: {
                  $regex: new RegExp("\\b" + query.toLowerCase() + "\\b", "i"),
                },
              },
            ],
          },
        });
      }
      const commodities = await Trade.aggregate(pipeline);
      return res.send(commodities);
    };
  }

  static byCommodity() {
    return async (req, res) => {
      let { export_code, commodity } = req.query;

      if (!export_code)
        return res.status(BAD_REQUEST).send({
          error: "Please provide export(focus) country code.",
        });

      if (!commodity)
        return res.status(BAD_REQUEST).send({
          error: "Please provide a commodity",
        });
      commodity = decoder(commodity);

      let exporter = Code(export_code);

      // look for all countries importing that specific commodity
      const com = await Commodity.findOne({ commodity });
      if (!com)
        return res.status(NOT_FOUND).json({ message: "commodity not found" });
      // const importers = await Trade.aggregate([
      //   { $unwind: { path: "$commodity_tradeValue" } },
      //   { $match: { "commodity_tradeValue.commodity": com._id } },
      //   { $group: { _id: { Importing_country: "$Importing_country" } } },
      //   // { $project: { _id: 0, Importing_country: "$_id.Importing_country" } },
      // ]);
      // const importingCountries = [];
      // importers.forEach((val) =>
      //   importingCountries.push(val.Importing_country)
      // );

      const countriesWithCommodity = await Trade.aggregate([
        { $unwind: { path: "$commodity_tradeValue" } },
        { $match: { "commodity_tradeValue.commodity": com._id } },
        {
          $match: {
            Exporting_country: exporter,
          },
        },
        { $sort: { Opportunity_Index: -1 } },
        // { $unwind: { path: "$commodity_tradeValue" } },
        // { $match: { "commodity_tradeValue.commodity": com._id } },
        {
          $lookup: {
            from: "commodities",
            localField: "commodity_tradeValue.commodity",
            foreignField: "_id",
            as: "commodities",
          },
        },
        { $unwind: { path: "$commodities" } },
        {
          $addFields: {
            commodity_index_rank: {
              commodity: "$commodities.commodity",
              export_value: "$commodity_tradeValue.export_value",
              commodity_index: "$commodity_tradeValue.commodity_index",
            },
          },
        },
        { $match: { "commodity_index_rank.commodity_index": { $gt: 0 } } },
        { $sort: { "commodity_index_rank.commodity_index": -1 } },
        {
          $project: {
            _id: 0,
            Exporting_country: 1,
            Importing_country: 1,
            scaled_sci: 1,
            Opportunity_Index: 1,
            iso2_export: 1,
            iso2_import: 1,
            commodity_index_rank: 1,
          },
        },
      ]);
      return res.send(countriesWithCommodity);
    };
  }

  static byPopi() {
    return async (req, res) => {
      let { export_code, import_code, commodity, ranker } = req.query;
      if (!export_code || !import_code)
        return res.status(BAD_REQUEST).send({
          error:
            "Please provide export(focus) country code and import country code.",
        });

      let exporter = Code(export_code);
      let importer = Code(import_code);

      // const com = await Commodity.findOne({commodity: new RegExp(commodity, "i")})
      let byCommodity = await Trade.aggregate([
        {
          $match: { Exporting_country: exporter, Importing_country: importer },
        },
        {
          $project: {
            _id: 0,
            Exporting_country: 1,
            Importing_country: 1,
            Importing_region: 1,
            Exporting_region: 1,
            year: 1,
            comcol: 1,
            comlang_off: 1,
            comREC: 1,
            RECs: {
              $replaceAll: { input: "$RECs", find: ";", replacement: "," },
            },
            Exporting_RECs: {
              $replaceAll: {
                input: "$Exporting_RECs",
                find: ";",
                replacement: ",",
              },
            },
            Importing_RECs: {
              $replaceAll: {
                input: "$Importing_RECs",
                find: ";",
                replacement: ",",
              },
            },
            trade_value: 1,
            scaled_sci: 1,
            Opportunity_Index: 1,
            iso2_export: 1,
            iso2_import: 1,
            ranked_SCI: 1,
            dist: 1,
            contig: 1,
            ranked_sci: 1,
            ranked_SCI: "$ranked_sci",
          },
        },
      ]);

      const tradeDoc = await Trade.findOne(
        { Exporting_country: exporter, Importing_country: importer },
        {
          commodities: 1, commodity_index: 1, export_value: 1, commodity_code: 1,
          top_exporters: 1, top_importers: 1, demand: 1, supply: 1,
          supplyoverdemand: 1, tradeoverdemand: 1, exporters_opi: 1,
          importers_opi: 1, exported_value: 1, imported_value: 1,
        }
      );
      if (!tradeDoc)
        return res.status(NOT_FOUND).json({ message: "trade not found" });
      const index = tradeDoc.commodities.findIndex(
        (c) => c.toLowerCase() === commodity.toLowerCase()
      );
      if (index === -1)
        return res.status(NOT_FOUND).json({ message: "commodity not found in trade" });
      const com = {
        commodity: tradeDoc.commodities[index],
        commodity_index: tradeDoc.commodity_index[index],
        export_value: tradeDoc.export_value[index],
        commodity_code: tradeDoc.commodity_code[index],
        top_exporters: (tradeDoc.top_exporters[index] || "").split("/"),
        top_importers: (tradeDoc.top_importers[index] || "").split("/"),
        demand: tradeDoc.demand[index],
        supply: tradeDoc.supply[index],
        supplyoverdemand: tradeDoc.supplyoverdemand[index],
        tradeoverdemand: tradeDoc.tradeoverdemand[index],
        exporters_opi: (tradeDoc.exporters_opi[index] || "").split("/"),
        importers_opi: (tradeDoc.importers_opi[index] || "").split("/"),
        exported_value: (tradeDoc.exported_value[index] || "").split("/"),
        imported_value: (tradeDoc.imported_value[index] || "").split("/"),
      };

      const commodity_tradeValue = {
        commodity: com.commodity,
        commodity_index: parseFloat(parseFloat(com.commodity_index).toFixed(2)),
        export_value: parseFloat(parseFloat(com.export_value).toFixed(2)),
        commodity_code: com.commodity_code,
        demand: parseFloat(parseFloat(com.demand).toFixed(2)),
        supply: parseFloat(parseFloat(com.supply).toFixed(2)),
        supplyOverDemand: lessThanPoint01(com.supplyoverdemand),
        tradeOverDemand: lessThanPoint01(com.tradeoverdemand),
        top_exporters: exporters(
          {
            top_exporters: com.top_exporters,
            exported_value: com.exported_value,
            exporters_opi: com.exporters_opi,
          },
          com.top_exporters.length
        )
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
          .filter((val) => val.country !== "NA"),
        top_importers: importers(
          {
            top_importers: com.top_importers,
            imported_value: com.imported_value,
            importers_opi: com.importers_opi,
          },
          com.top_importers.length
        )
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
          .filter((val) => val.country !== "NA"),
      };

      const payload = { ...byCommodity[0], commodity_tradeValue };
      return res.json(payload);
    };
  }

  static otherPotentials() {
    return async (req, res) => {
      let { export_code, import_code, commodity } = req.query;
      if (!export_code || !import_code)
        return res.status(BAD_REQUEST).send({
          error:
            "Please provide export(focus) country code and import country code.",
        });

      let exporter = Code(export_code);
      let importer = Code(import_code);

      const payload = await Trade.aggregate([
        {
          $match: { Exporting_country: exporter, Importing_country: importer },
        },
        { $unwind: "$commodity_tradeValue" },
        {
          $lookup: {
            from: "commodities",
            localField: "commodity_tradeValue.commodity",
            foreignField: "_id",
            as: "commodities",
          },
        },
        {
          $unwind: {
            path: "$commodities",
            preserveNullAndEmptyArrays: false,
          },
        },
        {
          $match: {
            "commodities.commodity": { $ne: commodity },
          },
        },
        {
          $addFields: {
            commodity: "$commodities.commodity",
            export_value: "$commodity_tradeValue.export_value",
            category: "$commodities.category",
          },
        },
        {
          $project: {
            _id: 0,
            commodity: 1,
            export_value: 1,
            category: 1,
          },
        },
      ]);

      return res.json(payload);
    };
  }
};
