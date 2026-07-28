const mongoose = require("mongoose");
const Joi = require("@hapi/joi");
const { Category } = require("../helpers/categorization");

const schema = new mongoose.Schema(
  {
    Exporting_country_iso2c: { type: String, max: 2, min: 2 },
    Importing_country_iso2c: { type: String, max: 2, min: 2 },
    Importing_country: { type: String },
    Exporting_country: { type: String },
    Exporting_region: { type: String },
    Importing_region: { type: String },
    Exporting_RECs: { type: String },
    Importing_RECs: { type: String },
    Exporting_GDP: { type: Number },
    Importing_GDP: { type: Number },
    Exporting_GDP_per_Capita: { type: Number },
    Importing_GDP_per_Capita: { type: Number },
    Exporting_total_import: { type: Number },
    Importing_total_import: { type: Number },
    commodity_tradeValue: [
      {
        commodity: { type: mongoose.Schema.Types.ObjectId, ref: "Commodity" },
        export_value: { type: Number },
        commodity_code: { type: Number, default: undefined },
        commodity_index: { type: Number },
      },
    ],
    top_commodity: {
      commodity: { type: mongoose.Schema.Types.ObjectId, ref: "Commodity" },
      export_value: { type: Number },
      commodity_code: { type: Number, default: undefined },
      commodity_index: { type: Number },
    },
    commodities: { type: Array },
    export_value: { type: Array },
    commodity_code: { type: Array },
    commodity_index: { type: Array },
    top_exporters: { type: Array },
    top_importers: { type: Array },
    demand: { type: Array },
    supply: { type: Array },
    supplyoverdemand: { type: Array },
    tradeoverdemand: { type: Array },
    exporters_opi: { type: Array },
    importers_opi: { type: Array },
    exported_value: { type: Array },
    imported_value: { type: Array },
    dist: { type: Number },
    distcap: { type: Number },
    comcol: { type: Number },
    contig: { type: Number },
    comlang_off: { type: Number },
    year: { type: String },
    RECs: { type: String },
    comRec: { type: String },
    Commodities_count: { type: Number },
    scaled_sci: { type: Number },
    WA_SCI: { type: Number },
    interconnected_countries_number: { type: Number },
    interconnected_countries: { type: Array },
    Opportunity_Index: { type: Number },
    Country_Index: { type: Number },
    Exporting_exchange_rate: { type: String },
    Importing_exchange_rate: { type: String },
    Yesterday_Exporting_exchange_rate: { type: String },
    Yesterday_Importing_exchange_rate: { type: String },
    Importing_Country_Index: { type: String },
    total_export_value: { type: Number },
    iso2_export: { type: String, max: 2, min: 2 },
    iso2_import: { type: String, max: 2, min: 2 },
    ranked_sci: { type: String },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    autoCreate: false,
  }
);

// const validateTrade = Joi.object({
//   email: Joi.string().email().required(),
// });

const Trade = mongoose.model("Trade", schema);

exports.Trade = Trade;
// exports.ValidateTrade = async (req, res, next) => {
//   const details = req.body;

//   const schema = validateTrade;

//   const options = config.get("joiOptions");

//   const { error } = schema.validate(details, options);
//   if (error) return res.status(422).json({ Error: error.details[0].message });

//   next();
// };
