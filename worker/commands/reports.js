"use strict";

const run = async () => await require("../../app/modules/getReports")();

if (require.main !== module) {
  exports = module.exports = run; // eslint-disable-line no-global-assign
}
