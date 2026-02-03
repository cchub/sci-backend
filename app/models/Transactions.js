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
    tx_ref: { type: String, unique: true },
    flw_ref: { type: String, unique: true },
    amount: { type: Number },
    currency: { type: String, uppercase: true },
    status: { type: String, lowercase: true },
    transaction_id: { type: Number },
    reports_purchased: { type: Array },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    autoCreate: false,
  }
);

const validateTransaction = Joi.object({
  tx_ref: Joi.string().required(),
  flw_ref: Joi.string().required(),
  amount: Joi.number().required(),
  currency: Joi.string().uppercase().required(),
  status: Joi.string().lowercase().required(),
  transaction_id: Joi.number().required(),
  customer: Joi.object()
    .keys({
      email: Joi.string().email().required(),
    })
    .required(),
  reports_purchased: Joi.array()
    .items(Joi.string().valid(...countries()))
    .required(),
  discountCode: Joi.string(),
});

const Transaction = mongoose.model("Transaction", schema);

exports.Transaction = Transaction;
exports.ValidateTransaction = async (req, res, next) => {
  const details = req.body;

  const schema = validateTransaction;

  const options = config.get("joiOptions");

  const { error } = schema.validate(details, options);
  if (error) return res.status(422).json({ Error: error.details[0].message });

  next();
};
