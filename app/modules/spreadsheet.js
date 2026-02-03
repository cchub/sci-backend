const { GoogleSpreadsheet } = require("google-spreadsheet");
const logger = require("../../bootstrap/logger");
const _ = require("lodash");
const { Report_Info } = require("../models/Report_Info");
const {
  readdirSync,
  unlinkSync,
  writeFileSync,
  statSync,
  existsSync,
} = require("fs");
const { resolve } = require("path");
const config = require("config");
require("dotenv").config();
const doc = new GoogleSpreadsheet(
  "1JwRPkg_c1lEXnyysb4x_hJEdRtla9EnerEn4NQBRQ9c"
);
const YOUR_ROOT_FOLDER = process.env.FILE_NAME
  ? require(`../../${process.env.FILE_NAME}`)
  : require("../../drive.json");

async function ReportData() {
  logger.info(`\x1b[39m\x1b[32mCommunicating with Spreadsheet...\n`);
  // const script = resolve(resolve(__dirname, "storage/report_info.json"));
  await doc.useServiceAccountAuth(YOUR_ROOT_FOLDER);

  await doc.loadInfo();
  const sheet = doc.sheetsByTitle["Report_info"]
    ? doc.sheetsByTitle["Report_info"]
    : doc.sheetsByIndex[1];
  const rows = await sheet.getRows();
  const rawHeaders = Object.keys(rows[0]);
  const headers = rawHeaders.filter(
    (val) => !~["_sheet", "_rowNumber", "_rawData"].indexOf(val)
  );
  // let data = [];
  for (let row of rows) {
    let obj = {};
    for (let header of headers) {
      if (header === "Report_table_of_content") {
        obj[header] = row[header].split(", ");
      } else if (header === "Report_price") {
        obj[header] = parseFloat(row[header]);
      } else if (header === "Reports_index") {
        obj[header] = row[header] ? parseInt(row[header]) : null;
      } else {
        obj[header] = row[header];
      }
    }
    obj.Report_cover_images_png = reorganise("png", obj.Country);
    obj.Report_cover_images_svg = reorganise("svg", obj.Country);
    obj.Report_banner = banners(obj.Country);
    obj.Report_preview = preview(obj.Country);
    obj.Available = exists(obj.Country);
    await Report_Info.updateOne(
      { Country: obj.Country },
      { $set: obj },
      { upsert: true, new: true }
    );
  }
  // console.log(data);
  // writeFileSync(script, JSON.stringify(data));
  logger.info(`\x1b[39m\x1b[32mUpdated Report information....\n`);
}

// function pngImages(country) {
//   const files = getFiles(png, country);
//   return `${config.get("url")}/assets/png/${files[0]}`;
// }

// function svgImages(country) {
//   const files = getFiles(svg, country);
// }

function reorganise(format, country) {
  const files = getFiles(format, country);
  let obj = {};
  for (let file of files) {
    if (file === `${country} + no shadow.${format}`) {
      obj.no_shadow = `${config.get("url")}/assets/${format}/${file}`;
    }
    if (file === `${country} + shadow.${format}`) {
      obj.shadow = `${config.get("url")}/assets/${format}/${file}`;
    }
  }
  return obj;
}

function getFiles(folder, country) {
  const data = [];
  const script = resolve(
    resolve(resolve(__dirname, "../..", `bootstrap/public/assets/${folder}`))
  );
  readdirSync(script).forEach((file) => {
    if (
      file
        .toLowerCase()
        .match(new RegExp("\\b" + country.toLowerCase() + "\\b"))
    ) {
      data.push(file);
    }
  });

  return data;
}

function preview(country) {
  if (checkIfPreviewExists(country)) {
    return `${config.get(
      "url"
    )}/files/SCI Trade Opportunity Report - ${country} preview.pdf`;
  }
  return false;
}

function checkIfPreviewExists(country) {
  const script = resolve(
    resolve(__dirname, "../../", "bootstrap/public/files")
  );
  if (
    existsSync(
      `${script}/SCI Trade Opportunity Report - ${country} preview.pdf`
    )
  ) {
    return true;
  } else {
    return false;
  }
}

function banners(country) {
  return `${config.get("url")}/assets/${country}_Banner.jpg`;
}

function exists(country) {
  const script = resolve(resolve(__dirname, "storage/reports"));
  if (existsSync(`${script}/SCI Trade Opportunity Report - ${country}.pdf`)) {
    return true;
  } else {
    return false;
  }
}
module.exports = ReportData;
