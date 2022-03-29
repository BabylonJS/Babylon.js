import { Helper } from "../../../commons/helper";
import { assert, expect, should } from "../viewerReference";
import { mapperManager } from "..";
import { IMapper } from "../../../../src/configuration/mappers";

export const name = "configuration mappers";

describe("Configuration mappers", () => {
    it("should have html, json and dom mappers", (done) => {
        assert.isDefined(mapperManager);
        assert.isDefined(mapperManager.getMapper("html"));
        assert.isDefined(mapperManager.getMapper("json"));
        assert.isDefined(mapperManager.getMapper("dom"));
        done();
    });

    it("should map html elements correctly", (done) => {
        const htmlMappers = mapperManager.getMapper("html");

        const randomNumber = Math.random();
        const randomString = "test-" + Math.random();
        const htmlString = `<test-element model.rotation-offset-angle="${randomNumber}" model.cast-shadow="true" model.id="${randomString}"></test-element>`;

        const d = document.createElement("div");
        d.innerHTML = htmlString;
        const htmlElement = d.firstChild;

        const config = htmlMappers.map(htmlElement);

        if (config.model && typeof config.model === "object") {
            assert.equal(config.model.rotationOffsetAngle, randomNumber);
            assert.isTrue(config.model.castShadow);
            assert.equal(config.model.id, randomString);
            done();
        } else {
            assert.fail();
        }
    });

    it("should map dom elements correctly", (done) => {
        const domMappers = mapperManager.getMapper("dom");

        const randomNumber = Math.random();
        const randomString = "test-" + Math.random();
        const htmlString = `<test-element>
    <model rotation-offset-angle="${randomNumber}" cast-shadow="true" id="${randomString}">
    </model>
</test-element>`;

        const d = document.createElement("div");
        d.innerHTML = htmlString;
        const htmlElement = d.firstChild;

        const config = domMappers.map(htmlElement);

        if (config.model && typeof config.model === "object") {
            assert.equal(config.model.rotationOffsetAngle, randomNumber);
            assert.isTrue(config.model.castShadow);
            assert.equal(config.model.id, randomString);
            done();
        } else {
            assert.fail();
        }
    });

    it("should register a new mapper and allow to use it", (done) => {
        const randomVersion = "version" + Math.random();
        let randomName = "test" + Math.random();
        randomName = randomName.replace(".", "");
        const newMapper: IMapper = {
            map: (rawSource) => {
                return {
                    version: randomVersion,
                };
            },
        };

        console.log("Next error log is expected");

        assert.isUndefined(mapperManager.getMapper(randomName));

        mapperManager.registerMapper(randomName, newMapper);

        const mapperTest = mapperManager.getMapper(randomName);
        assert.isDefined(mapperTest);
        assert.equal(mapperTest, newMapper);

        const config = mapperTest.map("");

        assert.equal(config.version, randomVersion);
        done();
    });
});
