const chai = require("chai");
const chaihttp = require("chai-http");
const server = require("../../index");
const { OK, NOT_FOUND, BAD_REQUEST } = require("http-status-codes");

chai.should();
chai.use(chaihttp);

describe("Functional/Get/Search/Commodities", () => {
  it("Should search for a commodity between two countries", (done) => {
    chai
      .request(server)
      .get("/api/trade/search")
      .query({ export_code: "ng", import_code: "ne", search: "tea" })
      .end((req, res) => {
        res.should.have.status(OK);
        res.body.should.be.a("array");
        done();
      });
  });

  it("Should get 400 if search query is not provided", (done) => {
    chai
      .request(server)
      .get("/api/trade/search")
      .query({ export_code: "ng", import_code: "ne" })
      .end((req, res) => {
        res.should.have.status(BAD_REQUEST);
        res.body.message.should.match(/search query missing/);
        done();
      });
  });
});
