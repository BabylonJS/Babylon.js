import { Helper } from "./../../commons/helper";
import { assert, expect, should } from "./viewerReference";
import { mapperManager, ViewerConfiguration } from ".";
import { camelToKebab, kebabToCamel, isUrl, extendClassWithConfig } from "../../../src/helper";

export let name = "viewer helper tests";

describe("viewer helper", () => {

    it("should convert camelCase to kebab-case and back", (done) => {

        let camelString = "oneTestTwoTestThreeTest";

        let kebab = camelToKebab(camelString);

        assert.equal(kebab, "one-test-two-test-three-test");

        assert.equal(kebabToCamel(kebab), camelString);

        done();
    });

    it("should find absolute and relative http urls", (done) => {

        let url = "http://test.url/?param=123";
        let https = "https://https.url.to.check/";
        let relativeUrl = "/url/to/find";
        let notUrl = "not a url!";
        let ftp = "ftp://test.ftp.server";

        assert.isTrue(isUrl(url));
        assert.isTrue(isUrl(https));
        assert.isTrue(isUrl(relativeUrl));
        assert.isFalse(isUrl(notUrl));
        assert.isFalse(isUrl(ftp));

        done();
    });

    it("should extend objects correctly", (done) => {

        let finalKey = Math.random();

        let toAugoment: any = {
            definedKey: Math.random(),
            color: {
                r: 0,
                g: 0
            },
            test: function() {

            }
        };

        let augmentation: any = {
            definedKey: finalKey,
            color: {
                r: finalKey,
                g: finalKey,
                b: finalKey
            },
            undefinedKey: "shouldNotBeAugmented",
            test: "should be ignored"
        };

        assert.notEqual(toAugoment.definedKey, augmentation.definedKey);

        extendClassWithConfig(toAugoment, augmentation);

        //defined keys should be replaced
        assert.equal(toAugoment.definedKey, finalKey);
        //undefined keys should not be set
        assert.isUndefined(toAugoment.undefinedKey);
        // functions should be ignored
        assert.isFunction(toAugoment.test);
        //should iterate to deep objects
        assert.equal(toAugoment.color.r, finalKey);
        assert.equal(toAugoment.color.g, finalKey);
        //b should not be set!
        assert.isUndefined(toAugoment.color.b);

        done();
    });
});
