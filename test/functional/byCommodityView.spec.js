"use strict";

const chai = require("chai");
const chaihttp = require("chai-http");
const server = require("../../index");
const { OK, NOT_FOUND } = require("http-status-codes");

chai.should();
chai.use(chaihttp);

describe("Functional/Get/Trade/byCommodity/view", () => {
  it("Should view demand, supply between countries", (done) => {
    chai
      .request(server)
      .get("/api/trade/byCommodity/view")
      .query({
        export_code: "ke",
        import_code: "ug",
        commodity: "alcohol > 80% abv",
      })
      .end((req, res) => {
        res.should.have.status(OK);
        res.body.should.be.a("object");
        done();
      });
  });
});
