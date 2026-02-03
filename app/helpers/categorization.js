const fs = require("fs");
const _ = require("lodash");
const { resolve } = require("path");

const CommoditySet = function () {
  const script = resolve(
    resolve(__dirname, "..", "modules/storage/Section Level Data.json")
  );
  const jsoned = JSON.parse(JSON.stringify(require(script)));
  let result = [];
  for (let com of jsoned) {
    const obj = {};
    obj.commodity = com.hs4_exports;
    obj.category = com.section;
    result.push(obj);
  }
  result = _.uniqBy(result, "commodity");
  return result;
};

const Category = function (commodity) {
  let result = CommoditySet().filter((val) =>
    independent(val.commodity.toLowerCase(), commodity.toLowerCase())
  );

  let single = result.find(
    (item) => item.commodity.toLowerCase() === commodity.toLowerCase()
  );

  let data = _.head(_(result).countBy("category").entries().maxBy(_.last));

  data = data ? data : "Unspecified";

  return single ? single.category : data;
};

const independent = function (str, word) {
  return str.match(new RegExp("\\b" + word + "\\b")) != null;
};

const grouped = function (data) {
  const arr = data;
  const category = function (d) {
    return d.category;
  };

  const grouping = function (group, category) {
    return {
      category: category,
      // data: group,
      size: group.length,
    };
  };

  let results = _(arr).groupBy(category).map(grouping).value();

  return results;
};

exports.Category = Category;
exports.List = CommoditySet;
exports.Grouping = grouped;
