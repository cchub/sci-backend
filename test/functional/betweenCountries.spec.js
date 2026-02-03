"use strict";

const chai = require("chai");
const chaihttp = require("chai-http");
const server = require("../../index");
const { OK, INTERNAL_SERVER_ERROR, NOT_FOUND } = require("http-status-codes");

chai.should();
chai.use(chaihttp);

describe("Functional/Get/Between/Countries", () => {
  it("Should view trade data between two countries", (done) => {
    chai
      .request(server)
      .get("/api/trade/view")
      .query({ export_code: "ng", import_code: "ne" })
      .end((req, res) => {
        res.should.have.status(OK);
        res.body.should.be.a("object");
        done();
      });
  });

  it("Should get 404 if focus country does not trade with import country provided", (done) => {
    chai
      .request(server)
      .get("/api/trade/view")
      .query({ export_code: "ng", import_code: "us" })
      .end((req, res) => {
        res.should.have.status(NOT_FOUND);
        done();
      });
  });
});
