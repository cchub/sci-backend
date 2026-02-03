"use strict";

const fs = require("fs");
const { resolve } = require("path");
const _ = require("lodash");
const { destructured } = require("./fileData");
const arr = require("../modules/Index/all");
const country2code = require("country-code-lookup");
const { Index } = require("../models/Index");
const { Trade } = require("../models/Trade");

const Ind = () => {
  const script = resolve(
    resolve(__dirname, "..", "modules/storage/comprehensive_dataset_wide.json")
  );
  const data = fs.readFileSync(script);
  const jsoned = JSON.parse(data);

  let newData = [];

  for (let data of jsoned) {
    let obj = {};
    obj.country = destructured(data.exporting_country);
    obj.country_code = country2code.byIso(data.exporting_country_iso).iso2;
    obj.country_index = data.country_Index * 100;
    obj.country_index = obj.country_index
      ? parseFloat(obj.country_index.toFixed(2))
      : 0;
    obj.region = data.exporting_region;
    newData.push(obj);
  }
  newData = _.uniqBy(newData, "country");
  newData = orderByCountry(newData);
  newData = orderByOi(newData);

  return newData;
};

const DbData = async () => {
  let datas = await Trade.aggregate([
    {
      $group: {
        _id: "$Exporting_country",
        country: { $first: "$Exporting_country" },
        country_index: { $first: "$Country_Index" },
        country_code: { $first: "$iso2_export" },
        region: { $first: "$Exporting_region" },
      },
    },
    { $sort: { country: -1 } },
    { $sort: { country_index: -1 } },

    {
      $project: {
        _id: 0,
      },
    },
  ]);
  return datas;
  // let newData = [];

  // for (let data of datas) {
  //   let obj = {};
  //   obj.country = data.Exporting_country;
  //   obj.country_code = data.iso2_export;
  //   obj.country_index = data.Country_Index * 100;
  //   obj.country_index = obj.country_index
  //     ? parseFloat(obj.country_index.toFixed(2))
  //     : 0;
  //   obj.region = data.Exporting_region;
  //   newData.push(obj);
  // }
  // newData = _.uniqBy(newData, "country");
  // newData = orderByCountry(newData);
  // newData = orderByOi(newData);

  // return newData;
};

const Regions = () => {
  const byRegion = function (d) {
    return d.region;
  };

  const grouping = function (group, region) {
    return {
      region: region,
      size: group.length,
    };
  };

  const final = _(arr).groupBy(byRegion).map(grouping).value();
  return final;
};

function orderByOi(data) {
  return data.sort(function (a, b) {
    return b.country_index - a.country_index;
  });
}

function orderByCountry(data) {
  return data.sort(function (a, b) {
    return a.country - b.country;
  });
}

async function writeFile() {
  process.stdout.write(`\x1b[39m\x1b[32m[info]: Writing Country Indices...\n`);
  const newData = (await DbData()).length ? await DbData() : Ind();
  for (let dt of newData) {
    await Index.updateOne(
      { country: dt.country },
      { $set: dt },
      { upsert: true, new: true }
    );
  }

  // const script2 = resolve(resolve(__dirname, "..", "modules/Index/all.js"));

  // fs.writeFileSync(script2, `module.exports = ${JSON.stringify(newData)}`);

  process.stdout.write(`\x1b[39m\x1b[32m[info]: Index updated\n`);
}

exports = module.exports = writeFile;

exports.Regions = Regions;
// exports.Copi = Index;
exports.writeIndex = writeFile;
