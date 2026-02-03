"use strict";

const lookup = require("country-code-lookup");

exports.Code = (code) => {
  // const all = countryCode.allCountriesList();
  // const data = all.find(val => val.alpha2 === code.toUpperCase());
  // return data ? data.country_name_en.replace(" (the)", "") : undefined;

  const countryInfo = lookup.byIso(code.toUpperCase());
  if (countryInfo.country === "Democratic Republic of the Congo")
    return "Congo - Kinshasa";
  if (countryInfo.country === "Republic of the Congo")
    return "Congo - Brazzaville";
  if (countryInfo.country === "The Gambia") return "Gambia";
  return countryInfo ? countryInfo.country : undefined;
};

exports.Country = (country) => {
  if (country === "Congo - Kinshasa") {
    return lookup.byCountry("Democratic Republic of the Congo").iso2;
  }
  if (country === "Congo - Brazzaville") {
    return lookup.byCountry("Republic of the Congo").iso2;
  }
  if (country === "Gambia") {
    return lookup.byCountry("The Gambia").iso2;
  }

  return lookup.byCountry(country).iso2;
};
