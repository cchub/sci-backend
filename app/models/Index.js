const mongoose = require("mongoose");
const Joi = require("@hapi/joi");
const config = require("config");

const schema = new mongoose.Schema(
  {
    country: { type: String },
    country_code: { type: String },
    region: { type: String },
    country_index: { type: Number },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    autoCreate: false,
  }
);

// const validateTrade = Joi.object({
//   email: Joi.string().email().required(),
// });

const Index = mongoose.model("Index", schema);

exports.Index = Index;
// exports.ValidateTrade = async (req, res, next) => {
//   const details = req.body;

//   const schema = validateTrade;

//   const options = config.get("joiOptions");

//   const { error } = schema.validate(details, options);
//   if (error) return res.status(422).json({ Error: error.details[0].message });

//   next();
// };
