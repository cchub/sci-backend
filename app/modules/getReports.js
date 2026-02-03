require("dotenv").config();
const NodeGoogleDrive = require("node-google-drive");
const logger = require("../../bootstrap/logger");
const path = require("path");
const { readdirSync, unlinkSync } = require("fs");

const ReportDrive = async () => {
  // // remove all files first
  // readdirSync(path.resolve(`${__dirname}/storage/reports`)).forEach((file) => {
  //   if (file !== ".gitkeep") {
  //     unlinkSync(path.resolve(`${__dirname}/storage/reports/${file}`));
  //   }
  // });
  const YOUR_ROOT_FOLDER = process.env.FILE_NAME
    ? require(`../../${process.env.FILE_NAME}`)
    : require("../../drive.json");

  const googleDriveInstance = new NodeGoogleDrive({
    ROOT_FOLDER: process.env.REPORT_FOLDER_ID,
  });
  process.stdout.write(`\x1b[39m\x1b[32mCommunicating with Report Drive...\n`);
  try {
    await googleDriveInstance.useServiceAccountAuth(YOUR_ROOT_FOLDER);

    // List files under the root folder
    let folderResponse = await googleDriveInstance.listFolders(
      YOUR_ROOT_FOLDER
    );
    let allFiles = await googleDriveInstance.listFiles(YOUR_ROOT_FOLDER);
    // report pdfs
    let folder = folderResponse.folders.find(
      (val) => val.name === "SCI Reports"
    );
    let folderId = folder.id;
    let files = allFiles.files.filter(
      (val) =>
        val.parents &&
        val.parents.includes(folderId) &&
        val.name !== "Report Images" &&
        val.name !== "Report Banners" &&
        !val.name.match(new RegExp("\\b" + "preview" + "\\b"))
    );

    for (let file of files) {
      await googleDriveInstance.getFile(
        file,
        path.resolve(`${__dirname}/storage/reports`)
      );
    }

    // report pdfs previews
    let previewFolder = folderResponse.folders.find(
      (val) => val.name === "SCI Reports"
    );
    let previewFolderId = previewFolder.id;
    let previewFiles = allFiles.files.filter(
      (val) =>
        val.parents &&
        val.parents.includes(previewFolderId) &&
        val.name.match(new RegExp("\\b" + "preview" + "\\b"))
    );

    for (let file of previewFiles) {
      await googleDriveInstance.getFile(
        file,
        path.resolve(
          path.resolve(__dirname, "../../", "bootstrap/public/files")
        )
      );
    }

    // report svg images
    let svgFolder = folderResponse.folders.find((val) => val.name === "SVG");
    let svgfolderId = svgFolder.id;
    const svgFiles = allFiles.files.filter(
      (val) => val.parents && val.parents.includes(svgfolderId)
    );
    for (let svgFile of svgFiles) {
      await googleDriveInstance.getFile(
        svgFile,
        path.resolve(
          path.resolve(__dirname, "../../", "bootstrap/public/assets/svg")
        )
      );
    }

    // report png images
    let pngFolder = folderResponse.folders.find((val) => val.name === "PNG");
    let pngfolderId = pngFolder.id;
    const pngFiles = allFiles.files.filter(
      (val) => val.parents && val.parents.includes(pngfolderId)
    );
    for (let pngFile of pngFiles) {
      await googleDriveInstance.getFile(
        pngFile,
        path.resolve(
          path.resolve(__dirname, "../../", "bootstrap/public/assets/png")
        )
      );
    }

    // report banners
    let folder3 = folderResponse.folders.find(
      (val) => val.name === "Report Banners"
    );
    let folder3Id = folder3.id;
    let file3 = allFiles.files.filter(
      (val) => val.parents && val.parents.includes(folder3Id)
    );
    for (let file of file3) {
      await googleDriveInstance.getFile(
        file,
        path.resolve(
          path.resolve(__dirname, "../../", "bootstrap/public/assets")
        )
      );
    }

    process.stdout.write(`\x1b[39m\x1b[32mExtracted reports\n`);
    logger.info("Extracted reports");
    return;
  } catch (e) {
    console.log(e.message);
    return e.message;
  }
};
// ReportDrive();

module.exports = ReportDrive;
