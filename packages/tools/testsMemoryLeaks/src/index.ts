/* eslint-disable no-console */
import { findLeaks } from "@memlab/api";
import { MemLabConfig } from "@memlab/core";
import type { IScenario } from "@memlab/core";
import { checkArgs, populateEnvironment } from "@dev/build-tools";
import type { RunOptions } from "memlab";
import { BrowserInteractionResultReader, testInBrowser } from "memlab";
import { TestPlanner } from "@memlab/e2e";

const playgrounds: string[] = ["#2FDQT5#1508", "#T90MQ4#14", "#8EDB5N#2", "#YACNQS#2", "#SLV8LW#3"];

/**
 * Get the global configuration for the tests
 * @param overrideConfig override the default configuration
 * @returns the configuration
 */
export const getGlobalConfig = (overrideConfig: { root?: string; baseUrl?: string } = {}) => {
    populateEnvironment();
    return {
        snippetUrl: "https://snippet.babylonjs.com",
        pgRoot: "https://playground.babylonjs.com",
        baseUrl: process.env.CDN_BASE_URL || (checkArgs(["--enable-https"], true) ? "https" : "http") + "://localhost:1337",
        root: "https://cdn.babylonjs.com",
        ...overrideConfig,
    };
};

function getConfigFromRunOptions(options: RunOptions): MemLabConfig {
    const config = MemLabConfig.resetConfigWithTransientDir();
    // if you have issues with WebGL not supported, run it in headful mode
    // config.puppeteerConfig.headless = false;
    config.isFullRun = !!options.snapshotForEachStep;
    config.oversizeObjectAsLeak = true;
    config.oversizeThreshold = 50000;
    return config;
}
/**
 * Take snapshots of the playgrounds
 * @param options the options to use
 * @returns the result reader
 */
export async function takeSnapshotsLocal(options: RunOptions = {}): Promise<BrowserInteractionResultReader> {
    const config = getConfigFromRunOptions(options);
    config.externalCookiesFile = options.cookiesFile;
    config.scenario = options.scenario;
    const testPlanner = new TestPlanner();
    const { evalInBrowserAfterInitLoad } = options;
    await testInBrowser({ testPlanner, config, evalInBrowserAfterInitLoad });
    return BrowserInteractionResultReader.from(config.workDir);
}

(async function () {
    const conf = getGlobalConfig();
    const scenarios = playgrounds.map((playground) => {
        return async () => {
            const scenario: IScenario = {
                url: () => conf.baseUrl + "/test.html" + playground,
                action: async (page) => {
                    await page.click("#start");
                    await page.evaluate(async () => {
                        await new Promise<void>((resolve, reject) => {
                            let att = 0;
                            function checkScene() {
                                if ((window as any).BABYLON.Engine.LastCreatedScene) {
                                    console.log("resolved");
                                    resolve();
                                } else {
                                    if (att++ === 12) {
                                        return reject();
                                    }
                                    setTimeout(checkScene, 500);
                                }
                            }
                            checkScene();
                        });
                        // console.log("waiting", (window as any).BABYLON.Engine.LastCreatedScene.isReady());
                        await (window as any).BABYLON.Engine.LastCreatedScene.whenReadyAsync();
                    });
                },
                back: async (page) => {
                    await page.click("#dispose");
                },
                leakFilter: (node, _snapshot, _leakedNodeIds) => {
                    if (node.name === "FontAwesomeConfig") {
                        return false;
                    }
                    if (node.retainedSize < 40000) {
                        return false;
                    }
                    if (node.pathEdge?.type === "internal" || node.pathEdge?.type === "hidden") {
                        return false;
                    }
                    if (
                        (!node.name && node.type === "object") ||
                        node.name === "Object" ||
                        node.type === "hidden" ||
                        node.type.includes("system ") ||
                        node.name.includes("system ")
                    ) {
                        return false;
                    }
                    // custom cases
                    if (node.name === "WebGL2RenderingContext") {
                        return false;
                    }
                    return true;
                },
            };
            console.log("Running scenario", scenario.url());
            const leaks = await findLeaks(await takeSnapshotsLocal({ scenario }));
            if (leaks.length > 0) {
                // console.log(leaks);
                throw new Error(leaks.length + " leak(s) found @ " + playground);
            }
        };
    });
    const promiseExecution = async () => {
        for (const promise of scenarios) {
            try {
                const message = await promise();
                console.log(message);
            } catch (error) {
                console.log(error.message);
                throw error;
            }
        }
    };
    await promiseExecution();
})();
