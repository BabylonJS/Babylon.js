// import { PerformanceTestType } from "@tools/test-tools";
import * as path from "path";
import * as fs from "fs";

import { test, expect, Page, Browser } from "@playwright/test";
import { getGlobalConfig } from "@tools/test-tools";
import { evaluateDisposeSceneForVisualization, evaluateInitEngineForVisualization, evaluatePrepareScene } from "./visualizationPlaywright.utils";

export const checkPerformanceOfScene = async (page: Page, baseUrl: string, numberOfPasses: number = 7, framesToRender: number = 10000, metadata?: { playgroundId: string }) => {
    if (numberOfPasses < 5) {
        numberOfPasses = 5;
    }
    console.log("framesToRender", framesToRender);
    await page.waitForSelector("#babylon-canvas", { timeout: 20000 });

    const time: number[] = [];
    for (let i = 0; i < numberOfPasses; i++) {
        await page.evaluate(evaluatePrepareScene, {
            sceneMetadata: {
                ...metadata,
            },
            globalConfig: getGlobalConfig(),
        });
        time.push(await page.evaluate(evaluateRenderScene, { renderCount: framesToRender }));
        await page.evaluate(evaluateDisposeSceneForVisualization, {
            forceUseReverseDepthBuffer: true,
            forceUseNonCompatibilityMode: true,
        });
    }
    time.sort();
    // remove edge cases - 2 of each end
    time.pop();
    time.shift();
    // return the average rendering time
    return time.reduce((partialSum, a) => partialSum + a, 0) / (numberOfPasses - 2);
};

export const evaluateRenderScene = async ({ renderCount }: { renderCount: number }): Promise<number> => {
    window.BABYLON.SceneLoader.ShowLoadingScreen = false;
    (window.scene as any).useConstantAnimationDeltaTime = true;

    await (window.scene as any).whenReadyAsync();

    if (window.scene && window.engine) {
        const now = performance.now();
        for (let i = 0; i < renderCount; i++) {
            window.scene.render();
        }
        return performance.now() - now;
    } else {
        throw new Error("no scene found");
    }
};

export const performanceTests = async (engineType = "webgl2", testFileName = "config", debug = false, debugWait = false, logToConsole = true, logToFile = false) => {
    debug = process.env.DEBUG === "true" || debug;

    const timeout = process.env.TIMEOUT ? +process.env.TIMEOUT : 200000;

    if (process.env.TEST_FILENAME) {
        testFileName = process.env.TEST_FILENAME;
    }

    if (process.env.LOG_TO_CONSOLE) {
        logToConsole = process.env.LOG_TO_CONSOLE === "true";
    }

    const configPath = process.env.CONFIG_PATH || path.resolve(__dirname, "../performance", testFileName + ".json");
    // load the config
    const rawJsonData = fs.readFileSync(configPath, "utf8");
    const config = JSON.parse(rawJsonData.replace(/^\uFEFF/, ""));

    const logPath = path.resolve(__dirname, `${testFileName}_${engineType}_log.txt`);

    const excludeRegexArray = process.env.EXCLUDE_REGEX_ARRAY ? process.env.EXCLUDE_REGEX_ARRAY.split(",") : [];

    const environments = process.env.PERFORMANCE_ENVIRONMENTS ? process.env.PERFORMANCE_ENVIRONMENTS.split(",") : ["latest"];

    const acceptedThreshold = process.env.ACCEPTED_THRESHOLD ? +process.env.ACCEPTED_THRESHOLD : 0.05;
    const framesToRender = process.env.FRAMES_TO_RENDER ? +process.env.FRAMES_TO_RENDER : 1000;
    const numberOfPasses = process.env.NUMBER_OF_PASSES ? +process.env.NUMBER_OF_PASSES : 6;

    const environmentBaseUrls: { [key: string]: string } = {};

    environments.forEach((env) => {
        if (config.environments[env]) {
            environmentBaseUrls[env] = config.environments[env].baseUrl;
        } else {
            // assume the environment is the version, live "v6.20.0"
            environmentBaseUrls[env] = `https://cdn.babylonjs.com/${env}`;
        }
    });

    const tests: any[] = config.tests.filter((test: any) => {
        const externallyExcluded = excludeRegexArray.some((regex) => {
            const re = new RegExp(regex, "i");
            return re.test(test.title);
        });
        return !(externallyExcluded || test.excludeFromAutomaticTesting || (test.excludedEngines && test.excludedEngines.includes(engineType)));
    });

    function log(msg: any, title?: string) {
        // skip WebGL warnings
        // if (msg && msg.text && msg.text.includes("WebGL")) {
        //     return;
        // }
        const titleToLog = title ? `[${title}]` : "";
        if (logToConsole) {
            console.log(titleToLog, msg);
        }
        if (logToFile) {
            fs.appendFileSync(logPath, titleToLog + " " + msg + "\n", "utf8");
        }
    }

    let page: Page;

    let testResults: { [key: string]: number };

    let logFunction: (msg: any) => void;

    async function preparePage(browser: Browser, baseUrl: string, title: string) {
        page = await browser.newPage();
        await page.goto(baseUrl + `/empty.html`, {
            // waitUntil: "load", // for chrome should be "networkidle0"
            timeout: 0,
        });
        await page.waitForSelector("#babylon-canvas", { timeout: 20000 });

        await page.waitForFunction(() => {
            return window.BABYLON;
        });
        page.setDefaultTimeout(0);
        page.setViewportSize({ width: 600, height: 400 });
        logFunction = (msg: any) => {
            log(msg, title);
        };
        page.on("console", logFunction);
        await page.evaluate(() => {
            if (window.scene && window.scene.dispose) {
                // run the dispose function here
                window.scene.dispose();
                window.scene = null;
                window.engine && window.engine.dispose();
                window.engine = null;
            }
        });

        await page.evaluate(evaluateInitEngineForVisualization, {
            engineName: engineType,
            useReverseDepthBuffer: "false",
            useNonCompatibilityMode: " false",
            baseUrl: getGlobalConfig({ root: config.root }).baseUrl,
        });
    }

    async function closePage() {
        await page.evaluate(() => {
            window.engine && window.engine.dispose();
            window.scene = null;
            window.engine = null;
        });
        page.off("console", logFunction);
        await page.close();
    }

    async function runTestScenario(browser: Browser, baseUrl: string, title: string, playgroundId: string, renderCount = framesToRender): Promise<number> {
        await preparePage(browser, baseUrl, title);

        const timeToRender = await checkPerformanceOfScene(page, getGlobalConfig().baseUrl, numberOfPasses, renderCount, {
            playgroundId,
        });

        await closePage();

        return timeToRender;
    }

    for (const testCase of tests) {
        if (testCase.excludeFromAutomaticTesting) {
            continue;
        }
        if (testCase.excludedEngines && testCase.excludedEngines.indexOf(engineType) !== -1) {
            continue;
        }
        test(testCase.title, async ({ browser }) => {
            //defensive
            testResults = {};
            console.log("Running test: " + testCase.title, ". Meta: ", testCase.playgroundId);
            test.setTimeout(timeout);
            // run the test for each environment and the current environment
            // now run the current environment
            testResults["current"] = await runTestScenario(browser, getGlobalConfig().baseUrl, testCase.title, testCase.playgroundId, testCase.renderCount);
            for (const environment of environments) {
                testResults[environment] = await runTestScenario(browser, environmentBaseUrls[environment], testCase.title, testCase.playgroundId, testCase.renderCount);
                expect(testResults[environment] / testResults["current"], `Dev: ${testResults["current"]}ms, ${environment}: ${testResults[environment]}ms`).toBeLessThanOrEqual(
                    1 + acceptedThreshold
                );
            }
        });
    }
};

performanceTests("webgl2", "config", false, false, true, false);
