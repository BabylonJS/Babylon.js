import { Helper } from "../../../commons/helper";
import { assert, expect, should } from "../viewerReference";
import { mapperManager, ViewerConfiguration } from "..";
import { IMapper } from "../../../../src/configuration/mappers";
import { ConfigurationLoader } from "../../../../src/configuration/loader";

export let name = "configuration loader";

describe("Configuration loader", () => {

    it("should call callback when configuration is loaded", (done) => {
        let configurationLoader = new ConfigurationLoader();

        configurationLoader.loadConfiguration({}, (newConfig) => {
            done();
        });
    });

    it("should resolve the promise when configuration is loaded", (done) => {
        let configurationLoader = new ConfigurationLoader();

        configurationLoader.loadConfiguration({}).then(() => {
            done();
        });
    });

    it("should not change configuration is not needed initConfig", (done) => {
        let configurationLoader = new ConfigurationLoader();

        let config: ViewerConfiguration = {
            version: "" + Math.random(),
            extends: "none"
        };
        configurationLoader.loadConfiguration(config, (newConfig) => {
            assert.deepEqual(config, newConfig);
            done();
        });
    });

    it("should load default configuration is no configuration extension provided", (done) => {
        let configurationLoader = new ConfigurationLoader();

        let config: ViewerConfiguration = {
            version: "" + Math.random()
        };
        configurationLoader.loadConfiguration(config, (newConfig) => {
            assert.equal(config.version, newConfig.version);
            assert.notDeepEqual(config, newConfig);
            assert.isDefined(newConfig.engine);
            assert.isDefined(newConfig.scene);
            assert.isDefined(newConfig.templates);
            done();
        });
    });
});
