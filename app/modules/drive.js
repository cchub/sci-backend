const logger = require("../../bootstrap/logger");
const { google } = require("googleapis");
const fs = require("fs");
const { resolve } = require("path");
require("dotenv").config();
const credentials = require(`../../drive.json`);
const scopes = ["https://www.googleapis.com/auth/drive"];
const { db_trade } = require("../helpers/fileData");
// const { writeIndex } = require("../helpers/countryIndex");

const jwtClient = new google.auth.JWT(
  credentials.client_email,
  null,
  credentials.private_key,
  scopes
);

jwtClient.authorize(function (err, tokens) {
  if (err) {
    logger.error(err);
    return;
  } else {
    logger.info("\nGoogle Drive Successfully connected!");
    process.stdout.write(
      `\x1b[39m\x1b[32mGoogle Drive Successfully connected!\n`
    );
  }
});
const drive = google.drive("v3");

const Drive = async () => {
  try {
    const res = await drive.files.list({
      auth: jwtClient,
    });

    const file = res.data.files.find(
      (val) => val.name === "comprehensive_dataset_wide.json"
    );
    const file2 = res.data.files.find(
      (val) => val.name === "Section Level Data.json"
    );
    const script = __dirname + "/storage/comprehensive_dataset_wide.json";
    const script2 = __dirname + "/storage/Section Level Data.json";
    const destination = fs.createWriteStream(script);
    const destination2 = fs.createWriteStream(script2);
    let progress = 0;
    let progress2 = 0;

    await drive.files
      .get(
        { auth: jwtClient, fileId: file.id, alt: "media" },
        { responseType: "stream" }
      )
      .then((res) => {
        res.data
          .on("end", async () => {
            process.stdout.write(
              `\x1b[39m\x1b[32mSuccessfully Downloaded Dataset.....\n`
            );
            await db_trade();
            // await writeIndex();
          })
          .on("error", (err) => {
            logger.error(err.message);
            process.stdout.write(`\x1b[39m\x1b[33m[ERROR]: ${err.message}\n`);
          })
          .on("data", (d) => {
            // progress += d.length;
            // if (process.stdout.isTTY) {
            //   process.stdout.clearLine();
            //   process.stdout.cursorTo(0);
            //   process.stdout.write(
            //     `\x1b[39m\x1b[32mDownloaded ${progress} bytes\n`
            //   );
            // }
          })
          .pipe(destination);
      });

    await drive.files
      .get(
        { auth: jwtClient, fileId: file2.id, alt: "media" },
        { responseType: "stream" }
      )
      .then((res) => {
        res.data
          .on("end", async () => {
            process.stdout.write(
              `\x1b[39m\x1b[32mSuccessfully Downloaded Section Level Data.....\n`
            );
          })
          .on("error", (err) => {
            logger.error(err.message);
            process.stdout.write(`\x1b[39m\x1b[33m[ERROR]: ${err.message}\n`);
          })
          .on("data", (d) => {
            // progress += d.length;
            // if (process.stdout.isTTY) {
            //   process.stdout.clearLine();
            //   process.stdout.cursorTo(0);
            //   process.stdout.write(
            //     `\x1b[39m\x1b[32mDownloaded ${progress2} bytes\n`
            //   );
            // }
          })
          .pipe(destination2);
      });
  } catch (e) {
    console.log(e);
    logger.error(e.message);
    process.stdout.write(`\x1b[39m\x1b[33m[ERROR]: ${e.message}\n`);
  }
};
module.exports = Drive;
