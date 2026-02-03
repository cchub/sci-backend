"use strict";

const { Discount } = require("../../app/models/Discount");
const randomize = require("random-string-generator");

const run = async () => {
  const data = [
    {
      code: randomize(20, "alphanumeric"),
      discount: { num: 10, unit: "%" },
      count: 0,
      active: true,
      created_at: new Date(),
    },
    {
      code: randomize(20, "alphanumeric"),
      discount: { num: 15, unit: "%" },
      count: 0,
      active: true,
      created_at: new Date(),
    },
    {
      code: randomize(20, "alphanumeric"),
      discount: { num: 20, unit: "%" },
      count: 0,
      active: true,
      created_at: new Date(),
    },
    {
      code: randomize(20, "alphanumeric"),
      discount: { num: 25, unit: "%" },
      count: 0,
      active: true,
      created_at: new Date(),
    },
    {
      code: randomize(20, "alphanumeric"),
      discount: { num: 30, unit: "%" },
      count: 0,
      active: true,
      created_at: new Date(),
    },
    {
      code: randomize(20, "alphanumeric"),
      discount: { num: 35, unit: "%" },
      count: 0,
      active: true,
      created_at: new Date(),
    },
    {
      code: randomize(20, "alphanumeric"),
      discount: { num: 40, unit: "%" },
      count: 0,
      active: true,
      created_at: new Date(),
    },
    {
      code: randomize(20, "alphanumeric"),
      discount: { num: 45, unit: "%" },
      count: 0,
      active: true,
      created_at: new Date(),
    },
    {
      code: randomize(20, "alphanumeric"),
      discount: { num: 50, unit: "%" },
      count: 0,
      active: true,
      created_at: new Date(),
    },
  ];

  for (let dt of data) {
    const discount = await Discount.findOne({ discount: dt.discount });
    if (!discount) {
      await Discount.create(dt);
    }
  }
};

exports = module.exports = run; // eslint-disable-line no-global-assign
