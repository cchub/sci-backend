const mongoose = require("mongoose");
const Joi = require("@hapi/joi");
const config = require("config");

const schema = new mongoose.Schema(
  {
    code: { type: String, unique: true },
    discount: {
      type: { num: { type: Number }, unit: { type: String, default: "%" } },
      unique: true,
    },
    users: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    count: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    autoCreate: false,
  }
);

const validateDiscount = Joi.object({
  code: Joi.string().required(),
  discount: Joi.object().keys({
    num: Joi.number().required(),
  }),
});

const Discount = mongoose.model("Discount", schema);

exports.Discount = Discount;
exports.ValidateDiscount = async (req, res, next) => {
  const details = req.body;

  const schema = validateDiscount;

  const options = config.get("joiOptions");

  const { error } = schema.validate(details, options);
  if (error) return res.status(422).json({ Error: error.details[0].message });

  next();
};
