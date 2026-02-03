const mongoose = require("mongoose");
const Joi = require("@hapi/joi");
const config = require("config");

const schema = new mongoose.Schema(
  {
    email: { type: String, unique: true },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    autoCreate: false,
  }
);

const validateUser = Joi.object({
  email: Joi.string().email().required(),
});

const User = mongoose.model("User", schema);

exports.User = User;
exports.ValidateUser = async (req, res, next) => {
  const details = req.body;

  const schema = validateUser;

  const options = config.get("joiOptions");

  const { error } = schema.validate(details, options);
  if (error) return res.status(422).json({ Error: error.details[0].message });

  next();
};
