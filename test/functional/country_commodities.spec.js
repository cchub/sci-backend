"use strict";

const chai = require("chai");
const chaihttp = require("chai-http");
const server = require("../../index");
const { OK, NOT_FOUND } = require("http-status-codes");

chai.should();
chai.use(chaihttp);

describe("Functional/Get/Country/Commodities", () => {
  it("Should view all commodities a specific country exports", (done) => {
    chai
      .request(server)
      .get("/api/country/commodities")
      .query({ export_code: "eg" })
      .end((req, res) => {
        res.should.have.status(OK);
        res.body.should.be.a("array");
        res.body.length.should.be.above(200);
        done();
      });
  });

  it("Should search all commodities available", (done) => {
    chai
      .request(server)
      .get("/api/country/commodities")
      .query({ export_code: "eg", query: "furniture" })
      .end((req, res) => {
        res.should.have.status(OK);
        res.body.should.be.a("array");
        res.body.length.should.be.above(0);
        done();
      });
  });
});
