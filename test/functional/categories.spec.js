"use strict";

const chai = require("chai");
const chaihttp = require("chai-http");
const server = require("../../index");
const { OK, NOT_FOUND } = require("http-status-codes");

chai.should();
chai.use(chaihttp);

describe("Functional/Get/Categories", () => {
  it("Should view categories and sizes of commodities between two countries", (done) => {
    chai
      .request(server)
      .get("/api/categories")
      .query({ export_code: "ng", import_code: "ne" })
      .end((req, res) => {
        res.should.have.status(OK);
        res.body.should.be.a("array");
        done();
      });
  });
});
