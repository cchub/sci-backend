const mongoose = require("mongoose");
const Joi = require("@hapi/joi");
const config = require("config");
const allowedCountries = require("../modules/Index/all");

const countries = () => {
  const countries = [];
  allowedCountries.forEach((val) =>
    val.country ? countries.push(val.country) : false
  );
  return countries;
};

const schema = new mongoose.Schema(
  {
    report_name: { type: String, unique: true },
    count: { type: Number, default: 0 },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    autoCreate: false,
  }
);

const validateFreePlan = Joi.object({
  free_reports: Joi.array()
    .items(Joi.string().valid(...countries()))
    .required(),
  email: Joi.string().email().required(),
});

const FreePlan = mongoose.model("FreePlan", schema);

exports.FreePlan = FreePlan;
exports.ValidateFreePlan = async (req, res, next) => {
  const details = req.body;

  const schema = validateFreePlan;

  const options = config.get("joiOptions");

  const { error } = schema.validate(details, options);
  if (error) return res.status(422).json({ Error: error.details[0].message });

  next();
};
