const Foreign = require("../../app/modules/foreign_exchange/index");
const Drive = require("../../app/modules/drive");

const run = async () => {
  await Foreign();
  await Drive();
};

exports = module.exports = run; // eslint-disable-line no-global-assign
