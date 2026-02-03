const { db_commodity } = require("../../app/helpers/fileData");

const run = async () => {
  console.log("Db Commodity crons.....");
  await db_commodity();
};

exports = module.exports = run; // eslint-disable-line no-global-assign
