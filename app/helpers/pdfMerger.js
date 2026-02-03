"use strict";

const zl = require("zip-lib");
const { resolve } = require("path");

const Zipped = async (pathedFiles) => {
  const zip = new zl.Zip();
  for (let path of pathedFiles) {
    // Adds a file from the file system
    zip.addFile(path.path);
  }

  const final = resolve(
    resolve(
      __dirname,
      "..",
      "modules/storage/reports/SCI Trade Opportunity Reports.zip"
    )
  );

  // Generate zip file.
  await zip.archive(final);

  return final;
};

exports.Zipper = Zipped;
