"use strict";
const { resolve } = require("path");
const {
  readdirSync,
  createReadStream,
  unlinkSync,
  createWriteStream,
  statSync,
  existsSync,
} = require("fs");
const zlib = require("zlib");
const { Zipper } = require("./pdfMerger");
const File = class {
  constructor(fileNames, status) {
    this.fileNames = fileNames;
    this.status = status;
    this.folder = resolve(resolve(__dirname, "..", "modules/storage/reports"));
  }

  // get all pdf reports available
  pdfs() {
    const data = [];
    readdirSync(this.folder).forEach((file) => data.push(file));
    let finale = data.filter((val) => val !== ".gitkeep");
    return finale;
  }

  // check if country name is included in any reports
  byCountryReports() {
    const finalReports = [];
    for (let report of this.pdfs()) {
      for (let country of this.fileNames) {
        if (report === `SCI Trade Opportunity Report - ${country}.pdf`) {
          finalReports.push(report);
        }
      }
    }
    return finalReports;
  }

  // get pdfs without extensions
  noExtensions() {
    const files = [];
    this.byCountryReports().forEach((val) =>
      files.push(val.replace(/\.[^/.]+$/, ""))
    );
    return files;
  }

  // Check if reports exist
  checkExists() {
    // use regular expression
    if (this.byCountryReports().length !== this.fileNames.length) {
      throw new Error(`The available reports at this time are ${this.pdfs()}`);
    }
    if (this.status !== "successful") {
      throw new Error("Payment is not successful");
    }
  }

  // Send the reports path
  reportsPath() {
    this.checkExists();
    const files = this.noExtensions();
    const paths = [];
    files.forEach((file) => {
      let obj = {
        path: resolve(resolve(this.folder, file + ".pdf")),
        name: file + ".pdf",
      };
      paths.push(obj);
    });
    return paths;
  }

  // organise attachment
  attachments() {
    const reportAttachments = [];
    const paths = this.reportsPath();
    for (let path of paths) {
      let obj = {
        filename: path.name,
        path: path.path,
      };
      reportAttachments.push(obj);
    }
    return reportAttachments;
  }

  // zip files and send as streams

  async zipFile() {
    // get the size of all files to download
    let size = 0;
    let newAttachments = [];
    let files = this.attachments();

    for (let file of files) {
      let x = statSync(file.path).size;
      size += x;
    }

    if (size < 24214400) {
      for (let file of files) {
        let stream = createReadStream(file.path);
        file.content = stream;
        delete file.path;
        newAttachments.push(file);
      }
    } else {
      let obj = {
        filename: "SCI Trade Opportunity Reports.zip",
        content: createReadStream(await Zipper(files)),
      };

      newAttachments.push(obj);
    }

    return newAttachments;
  }
};

// const Files = new File(["Nigeria"], "successful");
// console.log(Files.byCountryReports());
module.exports = File;
