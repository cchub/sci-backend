"use strict";

const chai = require("chai");
const chaihttp = require("chai-http");
const server = require("../../index");
const { OK, NOT_FOUND } = require("http-status-codes");

chai.should();
chai.use(chaihttp);

describe("Functional/Get/Trade/byCommodity", () => {
  it("Should view opportunities by commodity", (done) => {
    chai
      .request(server)
      .get("/api/trade/byCommodity")
      .query({ export_code: "eg", commodity: "Alcohol > 80% ABV" })
      .end((req, res) => {
        res.should.have.status(OK);
        res.body.should.be.a("array");
        res.body.length.should.be.above(1);
        done();
      });
  });

  it("Should not break during json call", (done) => {
    chai
      .request(server)
      .get("/api/trade/byCommodity")
      .query({ export_code: "ng", commodity: "Coffee" })
      .end((req, res) => {
        res.should.have.status(OK);
        res.body.should.be.a("array");
        res.body.length.should.be.above(0);
        done();
      });
  });
});
