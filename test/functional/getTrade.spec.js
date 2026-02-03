"use strict";

const chai = require("chai");
const chaihttp = require("chai-http");
const server = require("../../index");
const { OK, BAD_REQUEST, INTERNAL_SERVER_ERROR } = require("http-status-codes");

chai.should();
chai.use(chaihttp);

describe("Functional/Get/Trade", () => {
  it("Should get all countries trading with the focus country", (done) => {
    chai
      .request(server)
      .get("/api/trade")
      .query({ code: "ng" })
      .end((req, res) => {
        res.should.have.status(OK);
        res.body.data.should.be.a("array");
        res.body.data.length.should.be.above(40);
        done();
      });
  });

  it("Should get 400 if no query is passed", (done) => {
    chai
      .request(server)
      .get("/api/trade")
      .query({})
      .end((req, res) => {
        res.should.have.status(BAD_REQUEST);
        res.body.error.should.match(
          /Please provide a focus country or country code/
        );
        done();
      });
  });

  it("Should get 400 if both queries (code and focus_country) are  passed", (done) => {
    chai
      .request(server)
      .get("/api/trade")
      .query({ code: "ng", focus_country: "Nigeria" })
      .end((req, res) => {
        res.should.have.status(BAD_REQUEST);
        res.body.error.should.match(
          /You cant query both code and focus_country/
        );
        done();
      });
  });

  // it("Should get 400 if country is not an African country", (done) => {
  //   chai
  //     .request(server)
  //     .get("/api/trade")
  //     .query({ code: "us" })
  //     .end((req, res) => {
  //       res.should.have.status(BAD_REQUEST);
  //       res.body.stack.should.match(
  //         /Country not found or not an African Country/
  //       );
  //       done();
  //     });
  // });
});
