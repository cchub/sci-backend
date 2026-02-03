const { google } = require("googleapis");
const fs = require("fs");
const { resolve } = require("path");

require("dotenv").config();

const logger = require("../../../bootstrap/logger");

const credentials = require(`../../../drive.json`);

const scopes = ["https://www.googleapis.com/auth/drive"];

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

async function DriveUpdate() {
  try {
    const res = await drive.files.list({
      auth: jwtClient,
    });

    const file = res.data.files.find(
      (val) => val.name === "comprehensive_dataset_wide.json"
    );
    const script = resolve(
      resolve(__dirname, "..", "storage/comprehensive_dataset_wide.json")
    );

    await drive.files.update({
      auth: jwtClient,
      fileId: file.id,
      media: {
        mimeType: "application/json",
        body: fs.createReadStream(script),
      },
      supportsAllDrives: true,
    });

    logger.info(`File with ID: ${file.id} has been successfully updated`);
    process.stdout.write(
      `\x1b[39m\x1b[32mFile with ID: ${file.id} has been successfully updated\n`
    );
  } catch (e) {
    logger.error(e.message);
    process.stdout.write(`\x1b[39m\x1b[33m[ERROR]: ${e.message}\n`);
  }
}

module.exports = DriveUpdate;
