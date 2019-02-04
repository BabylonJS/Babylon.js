import { Helper } from "../../../commons/helper";
import { assert, expect, should } from "../viewerReference";
import { mapperManager } from "..";
import { IMapper } from "../../../../src/configuration/mappers";

export let name = "configuration mappers";

describe("Configuration mappers", () => {

    it("should have html, json and dom mappers", (done) => {
        assert.isDefined(mapperManager);
        assert.isDefined(mapperManager.getMapper("html"));
        assert.isDefined(mapperManager.getMapper("json"));
        assert.isDefined(mapperManager.getMapper("dom"));
        done();
    });

    it("should map html elements correctly", (done) => {
        let htmlMappers = mapperManager.getMapper("html");

        let randomNumber = Math.random();
        let randomString = "test-" + Math.random();
        let htmlString = `<test-element model.rotation-offset-angle="${randomNumber}" model.cast-shadow="true" model.id="${randomString}"></test-element>`;

        var d = document.createElement('div');
        d.innerHTML = htmlString;
        let htmlElement = d.firstChild;

        let config = htmlMappers.map(htmlElement);

        if (config.model && typeof config.model === 'object') {
            assert.equal(config.model.rotationOffsetAngle, randomNumber);
            assert.isTrue(config.model.castShadow);
            assert.equal(config.model.id, randomString);
            done();
        } else {
            assert.fail();
        }
    });

    it("should map dom elements correctly", (done) => {
        let domMappers = mapperManager.getMapper("dom");

        let randomNumber = Math.random();
        let randomString = "test-" + Math.random();
        let htmlString = `<test-element>
    <model rotation-offset-angle="${randomNumber}" cast-shadow="true" id="${randomString}">
    </model>
</test-element>`;

        var d = document.createElement('div');
        d.innerHTML = htmlString;
        let htmlElement = d.firstChild;

        let config = domMappers.map(htmlElement);

        if (config.model && typeof config.model === 'object') {
            assert.equal(config.model.rotationOffsetAngle, randomNumber);
            assert.isTrue(config.model.castShadow);
            assert.equal(config.model.id, randomString);
            done();
        } else {
            assert.fail();
        }
    });

    it("should register a new mapper and allow to use it", (done) => {

        let randomVersion = "version" + Math.random();
        let randomName = "test" + Math.random();
        randomName = randomName.replace(".", "");
        let newMapper: IMapper = {
            map: (rawSource) => {
                return {
                    version: randomVersion
                };
            }
        };

        console.log("Next error log is expected");

        assert.isUndefined(mapperManager.getMapper(randomName));

        mapperManager.registerMapper(randomName, newMapper);

        let mapperTest = mapperManager.getMapper(randomName);
        assert.isDefined(mapperTest);
        assert.equal(mapperTest, newMapper);

        let config = mapperTest.map("");

        assert.equal(config.version, randomVersion);
        done();

    });

});