import * as path from "path";
import * as fs from "fs";
import {
    evaluateDisposeSceneForVisualization,
    evaluateInitEngineForVisualization,
    getGlobalConfig,
    evaluatePrepareScene,
    evaluateIsGLError,
    evaluateRenderSceneForVisualization,
} from "@tools/test-tools";

/**
 * @param engineType name of the engine (webgl1, webgl2, webgpu)
 * @param testFileName name of the .json file (without the .json extension) containing the tests
 * @param debug if true, the browser will be launched in debug mode
 * @param debugWait if true, the browser will wait on the browser in which it is running
 * @param logToConsole if true, the logs will be output to the console
 * @param logToFile if true, the logs will be output to a file
 */
export const evaluateTests = async (engineType = "webgl2", testFileName = "config", debug = false, debugWait = false, logToConsole = true, logToFile = false) => {
    jest.retryTimes(2);

    console.warn(
        "Visualization tests with puppeteer is deprecated! please use playwright instead. See https://doc.babylonjs.com/contribute/toBabylon/HowToContribute#visualization-tests for help."
    );

    debug = process.env.DEBUG === "true" || debug;

    if (process.env.TEST_FILENAME) {
        testFileName = process.env.TEST_FILENAME;
    }

    if (process.env.LOG_TO_CONSOLE) {
        logToConsole = process.env.LOG_TO_CONSOLE === "true";
    }

    const configPath = process.env.CONFIG_PATH || path.resolve(__dirname, testFileName + ".json");
    const useStandardTestList = testFileName === "config";
    // load the config
    const rawJsonData = fs.readFileSync(configPath, "utf8");
    // console.log(data);
    const config = JSON.parse(rawJsonData.replace(/^\uFEFF/, ""));

    const logPath = path.resolve(__dirname, `${testFileName}_${engineType}_log.txt`);

    const excludeRegexArray = process.env.EXCLUDE_REGEX_ARRAY ? process.env.EXCLUDE_REGEX_ARRAY.split(",") : [];

    const tests: any[] = config.tests.filter((test: any) => {
        const externallyExcluded = excludeRegexArray.some((regex) => {
            const re = new RegExp(regex, "i");
            return re.test(test.title);
        });
        return !(externallyExcluded || test.excludeFromAutomaticTesting || (test.excludedEngines && test.excludedEngines.includes(engineType)));
    });

    // 2% error rate

    let engineFlags: {
        forceUseReverseDepthBuffer: boolean;
        forceUseNonCompatibilityMode: boolean;
        engineName: string;
        renderer: string;
    };

    function log(msg: any) {
        if (logToConsole) {
            console.log(msg);
        }
        if (logToFile) {
            fs.appendFileSync(logPath, msg + "\r\n", "utf8");
        }
    }

    async function preparePageForTests() {
        page.on("console", async (msg) => {
            // serialize my args the way I want
            const args = await Promise.all(
                msg.args().map((arg) =>
                    arg.evaluate((argument) => {
                        // I'm in a page context now. If my arg is an error - get me its message.
                        if (argument instanceof Error) return argument.message;
                        //Return null if the arg is not a error
                        return null;
                    }, arg)
                )
            );
            args.filter((arg) => arg !== null).forEach((arg) => log(arg as any));
            // fallback
            if (!debug) {
                if (args.filter((arg) => arg !== null).length === 0 && msg.type().substring(0, 3).toUpperCase() === "ERR") {
                    log(`${msg.type().substring(0, 3).toUpperCase()} ${msg.text()}`);
                }
            } else {
                log(`${msg.type().substring(0, 3).toUpperCase()} ${msg.text()}`);
            }
        });
        page.on("pageerror", ({ message }) => log(message)).on("requestfailed", (request) => log(`${request?.failure()?.errorText} ${request.url()}`));
        log("preparing page");
        await page.setViewport({ width: 600, height: 400 });
        page.setDefaultTimeout(0);
        await page.goto(getGlobalConfig({ root: config.root }).baseUrl + `/empty.html`, {
            // waitUntil: "load",
            timeout: 0,
        });
        await page.waitForSelector("#babylon-canvas", { timeout: 20000 });
        log("page ready");
    }

    beforeAll(async () => {
        if (process.env.RESET_BROWSER !== "true") {
            await preparePageForTests();
        }
    });

    beforeEach(async () => {
        if (process.env.RESET_BROWSER === "true") {
            await jestPuppeteer.resetBrowser();
            await preparePageForTests();
        }

        await page.evaluate(() => {
            if (window.scene && window.scene.dispose) {
                // run the dispose function here
                window.scene.dispose();
                window.scene = null;
                window.engine && window.engine.dispose();
                window.engine = null;
            }
        });

        engineFlags = await page.evaluate(evaluateInitEngineForVisualization, engineType, false, false, getGlobalConfig().baseUrl);
        if (engineFlags.renderer) {
            log(engineFlags.renderer);
        }

        log("engine ready");
    });

    afterAll(async () => {
        await page.evaluate(() => {
            window.engine && window.engine.dispose();
            window.scene = null;
            window.engine = null;
        });
        // await jestPuppeteer.debug();
        // if (browser) await browser.close();
    });

    // afterEach(async () => {
    //     // cleanup, check heap size after each test
    // });

    test /*.concurrent*/
        .each(tests)(
        "$title",
        async (test) => {
            log(`Running - ${test.title}`);
            try {
                // set the screenshot fail rate
                expect(await page.evaluate(evaluatePrepareScene, test, getGlobalConfig({ root: config.root }))).toBeTruthy();

                const renderCount = /*getGlobalConfig().qs && getGlobalConfig().qs.checkresourcecreation ? 50 : */ test.renderCount || 1;

                const renderResult = await page.evaluate(evaluateRenderSceneForVisualization, renderCount);
                debugWait && (await jestPuppeteer.debug());
                expect(renderResult).toBeTruthy();

                if (engineType.startsWith("webgl")) {
                    const glError = await page.evaluate(evaluateIsGLError);
                    expect(glError).toBe(false);
                }
                // Take screenshot
                const screenshot = await page.screenshot();

                const directory = path.resolve(__dirname, "../../../../../jest-screenshot-report");

                // Test screenshot (also save this new screenshot if -u is set)
                expect(screenshot).toMatchImageSnapshot({
                    customDiffConfig: {
                        threshold: 0.1,
                    },
                    customSnapshotsDir: path.resolve(__dirname, `./ReferenceImages/${useStandardTestList ? "" : testFileName}/`),
                    customSnapshotIdentifier: (test.referenceImage ? test.referenceImage : test.title).replace(".png", ""),
                    failureThreshold: (test.errorRatio || 2.5) / 100,
                    failureThresholdType: "percent",
                    customDiffDir: directory,
                });
            } finally {
                // dispose the scene
                const disposeResult = await page.evaluate(evaluateDisposeSceneForVisualization, engineFlags);
                expect(disposeResult).toBe(true);
            }
        },
        debug ? 1000000 : 40000
    );
};
