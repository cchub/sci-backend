const mongoose = require("mongoose");
const Joi = require("@hapi/joi");
const config = require("config");

const schema = new mongoose.Schema(
  {
    commodity: { type: String },
    category: { type: String },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    autoCreate: false,
  }
);

// const validateTrade = Joi.object({
//   email: Joi.string().email().required(),
// });

const Commodity = mongoose.model("Commodity", schema);

exports.Commodity = Commodity;
// exports.ValidateTrade = async (req, res, next) => {
//   const details = req.body;

//   const schema = validateTrade;

//   const options = config.get("joiOptions");

//   const { error } = schema.validate(details, options);
//   if (error) return res.status(422).json({ Error: error.details[0].message });

//   next();
// };
