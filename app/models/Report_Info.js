const mongoose = require("mongoose");
const Joi = require("@hapi/joi");
const config = require("config");

const schema = new mongoose.Schema(
  {
    Country: { type: String },
    Report_name: { type: String },
    Report_description: { type: String },
    Year_of_data: { type: String },
    Report_cover_images_png: {
      no_shadow: { type: String, default: undefined },
      shadow: { type: String, default: undefined },
    },
    Report_cover_images_svg: {
      no_shadow: { type: String, default: undefined },
      shadow: { type: String, default: undefined },
    },
    Report_banner: { type: String },
    Report_preview: { type: String },
    Report_table_of_content: { type: Array },
    Report_price: { type: Number },
    Reports_index: { type: Number, default: 0 },
    Available: { type: Boolean, default: false },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    autoCreate: false,
  }
);

// const validateTrade = Joi.object({
//   email: Joi.string().email().required(),
// });

const Report_Info = mongoose.model("Report_Info", schema);

exports.Report_Info = Report_Info;
// exports.ValidateTrade = async (req, res, next) => {
//   const details = req.body;

//   const schema = validateTrade;

//   const options = config.get("joiOptions");

//   const { error } = schema.validate(details, options);
//   if (error) return res.status(422).json({ Error: error.details[0].message });

//   next();
// };
