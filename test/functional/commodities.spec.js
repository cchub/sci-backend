"use strict";

const chai = require("chai");
const chaihttp = require("chai-http");
const server = require("../../index");
const { OK, NOT_FOUND } = require("http-status-codes");

chai.should();
chai.use(chaihttp);

describe("Functional/Get/Commodities", () => {
  it("Should view commodities between two countries", (done) => {
    chai
      .request(server)
      .get("/api/trade/commodities")
      .query({ export_code: "ng", import_code: "ne" })
      .end((req, res) => {
        res.should.have.status(OK);
        res.body.should.be.a("array");
        done();
      });
  });

  it("Should sort commodities by commodity ", (done) => {
    chai
      .request(server)
      .get("/api/trade/commodities")
      .query({
        export_code: "ng",
        import_code: "ne",
        sort_by: "commodity",
        order: "desc",
      })
      .end((req, res) => {
        res.should.have.status(OK);
        res.body.should.be.a("array");
        res.body[0].commodity.toLowerCase().should.match(/zippers/);
        done();
      });
  });
});
