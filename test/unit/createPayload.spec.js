"use strict";

const chai = require("chai");
const expect = chai.expect;
const assert = chai.assert;

const {
  Payload,
  destructured,
  limitData,
  categs,
  connected,
} = require("../../app/helpers/fileData");

describe("Unit/Payload", () => {
  it("Should organise and filter big data json file", (done) => {
    Payload().then((data) => {
      expect(data).to.be.lengthOf(53);
      assert.isArray(data);
      done();
    });
  });

  it("Should re-construct C�te d�Ivoire", (done) => {
    const correct = destructured("C�te d�Ivoire");

    expect(correct).to.be.equal("Cote d'Ivoire");

    done();
  });

  it("Should re-construct S�o Tom� & Pr�ncipe", (done) => {
    const correct = destructured("S�o Tom� & Pr�ncipe");

    expect(correct).to.be.equal("Sao Tome and Principe");

    done();
  });
});
