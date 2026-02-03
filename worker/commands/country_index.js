const { writeIndex } = require("../../app/helpers/countryIndex");

const run = async () => {
  await writeIndex();
};

exports = module.exports = run; // eslint-disable-line no-global-assign
