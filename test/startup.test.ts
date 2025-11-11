import { assert } from "chai";
import packageJson from "../package.json";

const { config } = packageJson;

describe("startup", function () {
  it("should have plugin instance defined", function () {
    assert.isNotEmpty(Zotero[config.addonInstance]);
  });
});
