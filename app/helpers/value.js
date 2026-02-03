exports.value = function (labelValue) {
  // Nine Zeroes for Billions
  return Math.abs(Number(labelValue)) >= 1.0e9
    ? parseFloat((Math.abs(Number(labelValue)) / 1.0e9).toFixed(2)) + " Billion"
    : // Six Zeroes for Millions
    Math.abs(Number(labelValue)) >= 1.0e6
    ? parseFloat((Math.abs(Number(labelValue)) / 1.0e6).toFixed(2)) + " Million"
    : // Three Zeroes for Thousands
    Math.abs(Number(labelValue)) >= 1.0e3
    ? parseFloat((Math.abs(Number(labelValue)) / 1.0e3).toFixed(2)) +
      " Thousand"
    : Math.abs(Number(labelValue))
    ? Math.abs(Number(labelValue))
    : 0;
};

exports.value2 = function (labelValue) {
  // Nine Zeroes for Billions
  return Math.abs(Number(labelValue)) >= 1.0e9
    ? Math.round((Math.abs(Number(labelValue)) / 1.0e9).toFixed(2)) + "B"
    : // Six Zeroes for Millions
    Math.abs(Number(labelValue)) >= 1.0e6
    ? Math.round((Math.abs(Number(labelValue)) / 1.0e6).toFixed(2)) + "M"
    : // Three Zeroes for Thousands
    Math.abs(Number(labelValue)) >= 1.0e3
    ? Math.round((Math.abs(Number(labelValue)) / 1.0e3).toFixed(2)) + "K"
    : Math.abs(Number(labelValue));
};

exports.value3 = function (labelValue) {
  // Nine Zeroes for Billions
  return Math.abs(Number(labelValue)) >= 1.0e9
    ? "USD " +
        parseFloat((Math.abs(Number(labelValue)) / 1.0e9).toFixed(2)) +
        "B"
    : Math.abs(Number(labelValue)) >= 1.0e6
    ? "USD " +
      parseFloat((Math.abs(Number(labelValue)) / 1.0e6).toFixed(2)) +
      "M"
    : Math.abs(Number(labelValue)) >= 1.0e3
    ? "USD " +
      Math.round((Math.abs(Number(labelValue)) / 1.0e3).toFixed(2)) +
      ",000"
    : "Not Available";
};

exports.foreignEx = function (str) {
  let temp = str.split(" ");
  let final = temp[0];
  return final;
};

function upperCase(str) {
  return str.toUpperCase();
}

function lowerCase(str) {
  return str.toLowerCase();
}

exports.properCase = function (str) {
  return lowerCase(str).replace(/^\w|\s\w/g, upperCase);
};

exports.dist = function (num) {
  const twoDec = parseFloat(parseFloat(num).toFixed(2));
  return twoDec.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};
