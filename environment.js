const fs = require("fs");
require("dotenv").config();
const data = fs.readFileSync("./.env");
fs.writeFileSync(`./.env.${process.env.NODE_ENV}`, data);

const data2 = fs.readFileSync(`./config/${process.env.NODE_ENV}.json.example`);
fs.writeFileSync(`./config/${process.env.NODE_ENV}.json`, data2);

process.exit(0);
