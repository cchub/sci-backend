"use strict";

const chai = require("chai");
const chaihttp = require("chai-http");
const server = require("../../index");
const { OK, BAD_REQUEST, NOT_FOUND } = require("http-status-codes");

chai.should();
chai.use(chaihttp);

describe("Functional/Get/Country/Index", () => {
  it("Should get all African Countries with their Country Index", (done) => {
    chai
      .request(server)
      .get("/api/country/index")
      .query({})
      .end((req, res) => {
        res.should.have.status(OK);
        res.body.data.should.be.a("array");
        res.body.regions.should.be.a("array");
        res.body.data.length.should.be.above(52);
        res.body.regions.length.should.be.above(4);
        done();
      });
  });

  it("Should be able to sort by country", (done) => {
    chai
      .request(server)
      .get("/api/country/index")
      .query({ sort_by: "country", order: "desc" })
      .end((req, res) => {
        res.should.have.status(OK);
        res.body.data[0].country.should.be.equal("Zimbabwe");
        done();
      });
  });

  it("Should be able to query regions", (done) => {
    chai
      .request(server)
      .get("/api/country/index")
      .query({ region: "Eastern Africa" })
      .end((req, res) => {
        res.should.have.status(OK);
        res.body.data[0].region.should.be.equal("Eastern Africa");
        done();
      });
  });
});
