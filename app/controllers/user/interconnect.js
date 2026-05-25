const { Code } = require("../../helpers/countryCode");
const { BAD_REQUEST } = require("http-status-codes");

// const TradeClass = require("../../modules/Trade/index");
const { Trade } = require("../../models/Trade");

module.exports = class {
  static interconnected_countries() {
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

      const interconnected = await Trade.findOne(
        { Exporting_country: exporter, Importing_country: importer },
        { _id: 0, interconnected_countries: 1 }
      );

      if (!interconnected || !interconnected.interconnected_countries)
        return res.json([]);

      const finale = await Trade.aggregate([
        {
          $match: {
            Exporting_country: exporter,
            Importing_country: { $in: interconnected.interconnected_countries },
          },
        },
        {
          $project: {
            _id: 0,
            commodity_tradeValue: {
              $slice: ["$commodity_tradeValue", 3],
            },
            top_commodity: 1,
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

      return res.send(finale);
    };
  }
};
