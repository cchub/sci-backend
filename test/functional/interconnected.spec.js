"use strict";

const chai = require("chai");
const chaihttp = require("chai-http");
const server = require("../../index");
const { OK, NOT_FOUND } = require("http-status-codes");

chai.should();
chai.use(chaihttp);

describe("Functional/Get/Interconnected/Countries", () => {
  it("Should view commodities between two countries", (done) => {
    chai
      .request(server)
      .get("/api/trade/interconnected/countries")
      .query({ export_code: "ng", import_code: "ne" })
      .end((req, res) => {
        res.should.have.status(OK);
        res.body.should.be.a("array");
        done();
      });
  });
});
