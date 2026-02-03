/**
 * @description Base command
 */
"use strict";
// Dependencies...
const fs = require("fs"),
  moment = require("moment-timezone");

module.exports = class {
  /**
   * @description Date
   */
  constructor() {
    this.time = moment();
    this.file = "";
  }

  /**
   * @description Run worker every minute.
   */
  everyMinute() {
    this.time = moment().startOf("minute");

    return this;
  }

  everyMinuteRwanda() {
    this.time = moment().tz("Africa/Harare").startOf("minute");

    return this;
  }

  /**
   * @description Run worker every minute.
   */
  everyhour() {
    this.time = moment().startOf("hour");

    return this;
  }

  /**
   *
   *@description Run worker every second
   */
  everySecond() {
    this.time = moment().startOf("second");
    return this;
  }

  /**
   *
   *@description Run worker every day
   */
  everyDay() {
    this.time = moment().startOf("day");
    return this;
  }

  /**
   *
   *@description Run worker every day Rwanda Time
   */
  everyDayRwanda() {
    this.time = moment().tz("Africa/Kigali").startOf("day");
    return this;
  }

  /**
   *
   *@description Run worker every day Kenya Time
   */
  everyDayKenya() {
    this.time = moment().tz("Africa/Nairobi").startOf("day");
    return this;
  }

  customTime() {
    const today = this.time.format("YYYY-MM-DD");
    this.time = moment(today + " " + "10:00:00.000");
    return this;
  }

  customTime2() {
    const today = this.time.format("YYYY-MM-DD");
    this.time = moment(today + " " + "12:10:00.000");
    return this;
  }

  command(file) {
    if (fs.existsSync(file)) {
      this.file = file;
    }

    return this;
  }

  handle() {
    if (
      this.time.diff(moment().tz("Africa/Kigali").format(), "milliseconds") ===
      0
    ) {
      const command = require(this.file);

      command();
    }

    return this;
  }

  handle2() {
    const command = require(this.file);
    command();
  }
};
