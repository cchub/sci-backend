const { resolve } = require("path");
const { unlinkSync, existsSync } = require("fs");
const deleteOld = () => {
  const script = resolve(
    "./",
    "app/modules/storage/SCI_Trade_merged_wide.json"
  );

  const script1 = resolve("./", "app/modules/storage/SCI_POPI_data.json");

  const script2 = resolve("./", "app/modules/storage/response.json");

  const script3 = resolve("./", "app/modules/storage/response.js");

  const script4 = resolve("./", "app/modules/storage/cso.json");

  const script5 = resolve("./", "app/modules/storage/report_info.json");

  if (existsSync(script)) {
    unlinkSync(script);
    console.log("Old dataset deleted....");
  }

  if (existsSync(script1)) {
    unlinkSync(script1);
    console.log("SCI POPI  dataset deleted....");
  }

  if (existsSync(script2)) {
    unlinkSync(script2);
    console.log("Response json deleted....");
  }

  if (existsSync(script3)) {
    unlinkSync(script3);
    console.log("Response js deleted....");
  }

  if (existsSync(script4)) {
    unlinkSync(script4);
    console.log("Cso js deleted....");
  }

  if (existsSync(script5)) {
    unlinkSync(script5);
    console.log("Report info js deleted....");
  }
};

deleteOld();
