"use strict";
/** @desc Mailer */
const path = require("path");
const config = require("config");
const Email = require("email-templates");
const Queue = require("bull");
const { client } = require("../modules/redis/index");
const { unlinkSync, existsSync } = require("fs");

class Mailer {
  constructor() {
    this.config = config.get("mail");

    this.configure();

    this.configure.bind(this);
    this.send.bind(this);
    this.checkAndBuildMessageProperty.bind(this);
    this.Process = new Queue(`SCI_MAILER`, {
      // redis: JSON.parse(JSON.stringify(config.get("redis"))),
      redis: client.options,
    });
  }

  /**
   * Configure mailer object.
   * @return {void}
   */
  configure() {
    const transport = this.config.client;
    const { from } = this.config.setup;

    this.mailer = new Email({
      views: { root: path.join(__dirname, "../../views/emails") },
      preview: false,
      send: true,
      transport,
      message: { from },
    });
  }

  // add job
  async addQueue() {
    this.checkAndBuildMessageProperty();
    await this.Process.add(this.content);
  }

  /**
   * Send mailer with content.
   * @return {object}
   */
  async send() {
    await this.Process.clean(0, "completed");
    await this.Process.clean(0, "failed");
    await this.addQueue();
    this.Process.process(async (job) => {
      const script = path.resolve(
        path.resolve(
          __dirname,
          "..",
          "modules/storage/reports/SCI Trade Opportunity Reports.zip"
        )
      );
      const { data } = job;
      try {
        // await this.notification(data);
        return this.mailer.send(data).then(() => this.removeTmpFile(script));
      } catch (err) {
        console.log(err);
        return Promise.reject(err);
      }
    });
  }

  /**
   * Build mail content.
   * @throws {Error} If build method does not exist.
   * @return {void}
   */
  checkAndBuildMessageProperty() {
    if (this.build === undefined) {
      const methodError = new Error("[build] method must exist.");

      throw methodError;
    }

    this.build();
  }

  removeTmpFile(name) {
    if (existsSync(name)) {
      try {
        return unlinkSync(name);
      } catch (e) {
        console.log(e);
      }
    }
  }
}

module.exports = Mailer;
