const Foreign = require("../../app/modules/foreign_exchange/index");

const run = async () => {
  await Foreign();
};

exports = module.exports = run; // eslint-disable-line no-global-assign
