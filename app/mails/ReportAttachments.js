const path = require("path"),
  Mailer = require("../services/Mailer");

class ReportAttachments extends Mailer {
  constructor(email, reports) {
    super();

    this.email = email;
    this.reports = reports;
  }

  build() {
    this.content = {
      template: path.join(__dirname, "../../views/emails/reportAttachments"),
      message: { to: this.email, attachments: this.reports },
    };
  }
}

module.exports = ReportAttachments;
