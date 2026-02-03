const { Transaction } = require("../../models/Transactions");
const { User } = require("../../models/User");
const _ = require("lodash");
const Report = require("../../helpers/report");
const ReportAttachments = require("../../mails/ReportAttachments");
const { Discount } = require("../../models/Discount");
const { FreePlan } = require("../../models/FreePlan");
const { Report_Info } = require("../../models/Report_Info");
const {
  OK,
  NOT_FOUND,
  BAD_GATEWAY,
  BAD_REQUEST,
} = require("http-status-codes");

module.exports = class {
  static discountCodes() {
    return async (req, res) => {
      const discounts = await Discount.find({});
      return res.json(discounts);
    };
  }
  static discountCode() {
    return async (req, res) => {
      const { discountCode } = req.params;
      const discount = await Discount.findOne({ code: discountCode });
      return res.json({ status: OK, data: discount });
    };
  }

  static reports() {
    return async (req, res) => {
      try {
        const reportInformation = await Report_Info.find({});
        return res.json(reportInformation);
      } catch (e) {
        return res.json([]);
      }
    };
  }

  static report() {
    return async (req, res) => {
      try {
        const reportInformation = await Report_Info.findOne({
          Country: {
            $regex: new RegExp(
              "\\b" + decodeURIComponent(req.params.country) + "\\b",
              "i"
            ),
          },
        });
        if (!reportInformation)
          return res
            .status(404)
            .json({ message: "Report Description does not exist yet" });
        return res.json(reportInformation);
      } catch (e) {
        return res.json([]);
      }
    };
  }
  static post() {
    return async (req, res) => {
      try {
        let { customer, status, reports_purchased, discountCode } = req.body;

        // Get reports
        let reportsModule = new Report(reports_purchased, status);
        let reports = reportsModule.reportsPath();

        const userObj = _.pick(customer, ["email"]);
        await User.updateOne(
          { email: userObj.email },
          { $set: userObj },
          { upsert: true, new: true }
        );

        let transactionObj = _.pick(req.body, [
          "tx_ref",
          "flw_ref",
          "amount",
          "currency",
          "status",
          "transaction_id",
          "reports_purchased",
        ]);
        let userFound = await User.findOne({ email: userObj.email });
        transactionObj.customer = userFound._id;

        await Transaction.updateOne(
          { tx_ref: transactionObj.tx_ref },
          { $set: transactionObj },
          { upsert: true, new: true }
        );

        // update discounts
        if (discountCode) {
          const discount = await Discount.findOne({ code: discountCode });
          await Discount.updateOne(
            { code: discountCode },
            {
              $addToSet: { users: userFound._id },
              $set: { count: discount.count + 1 },
            }
          );
        }

        // send email attachments
        try {
          const attachments = await reportsModule.zipFile();
          let reportAttachments = new ReportAttachments(
            customer.email,
            attachments
          );
          await reportAttachments.build();
          await reportAttachments.send();
        } catch (e) {
          console.log(e);
        }

        if (reports.length > 1) {
          return res.zip(reports, "SCI Trade Opportunity Reports.zip");
        } else {
          return res.download(reports[0].path, reports[0].name);
        }
      } catch (e) {
        return res.status(400).send({ status: 400, message: e.message });
      }
    };
  }

  static freePlan() {
    return async (req, res) => {
      try {
        const { free_reports, email } = req.body;
        // Get reports
        let reportsModule = new Report(free_reports, "successful");
        let reports = reportsModule.reportsPath();
        for (let report of free_reports) {
          const found = await FreePlan.findOne({ report_name: report });
          if (found) {
            found.count = found.count + 1;
            await found.save();
          } else {
            let freeP = new FreePlan();
            freeP.report_name = report;
            freeP.count = 1;
            await freeP.save();
          }
        }

        await User.updateOne(
          { email },
          { $set: { email } },
          { upsert: true, new: true }
        );

        // send email attachments
        try {
          const attachments = await reportsModule.zipFile();
          let reportAttachments = new ReportAttachments(email, attachments);
          await reportAttachments.build();
          await reportAttachments.send();
        } catch (e) {
          console.log(e);
        }

        if (reports.length > 1) {
          return res.zip(reports, "SCI Trade Opportunity Reports.zip");
        } else {
          return res.download(reports[0].path, reports[0].name);
        }
      } catch (e) {
        return res.status(400).send({ status: 400, message: e.message });
      }
    };
  }

  static disableDiscount() {
    return async (req, res) => {
      const { discountCode } = req.params;
      const discount = await Discount.findOne({ code: discountCode });
      if (!discount)
        return res
          .status(NOT_FOUND)
          .json({ status: NOT_FOUND, message: "Discount not found" });
      await Discount.updateOne(
        { code: discountCode },
        { $set: { active: false } }
      );
      return res.json({ status: OK, message: "Discount disabled" });
    };
  }

  static enableDiscount() {
    return async (req, res) => {
      const { discountCode } = req.params;
      const discount = await Discount.findOne({ code: discountCode });
      if (!discount)
        return res
          .status(NOT_FOUND)
          .json({ status: NOT_FOUND, message: "Discount not found" });
      await Discount.updateOne(
        { code: discountCode },
        { $set: { active: true } }
      );
      return res.json({ status: OK, message: "Discount enabled" });
    };
  }
};
