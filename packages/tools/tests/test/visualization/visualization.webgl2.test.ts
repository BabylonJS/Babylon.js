import * as jestScreenshot from "jest-screenshot";
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

// nested BBG, Chibi Rex, DDS2D, Glow layer and LODs

// jest doesn't support custom CLI variables
// const engineType = buildTools.checkArgs("--engine", false, true) || "webgl2";
// const debug = buildTools.checkArgs("--debug", true);
// const configPath = buildTools.checkArgs("--config", false, true) || "../config.json";

const engineType = "webgl2";
const debug = process.env.DEBUG === "true" || false;
const configPath = process.env.CONFIG || path.resolve(__dirname, "config.json");
// load the config
const rawJsonData = fs.readFileSync(configPath, "utf8");
// console.log(data);
const config = JSON.parse(rawJsonData.replace(/^\uFEFF/, ''));

// 2% error rate

let engineFlags: {
    forceUseReverseDepthBuffer: boolean;
    forceUseNonCompatibilityMode: boolean;
    renderer: string;
};

beforeAll(async () => {
    page.on("console", async (msg) => {
        // serialize my args the way I want
        const args = await Promise.all(
            msg.args().map((arg) =>
                arg.executionContext().evaluate((argument: string | Error) => {
                    // I'm in a page context now. If my arg is an error - get me its message.
                    if (argument instanceof Error) return argument.message;
                    //Return null if the arg is not a error
                    return null;
                }, arg)
            )
        );
        args.filter((arg) => arg !== null).forEach((arg) => console.log(arg));
        // fallback
        if (!debug) {
            if (args.filter((arg) => arg !== null).length === 0 && msg.type().substring(0, 3).toUpperCase() === "ERR") {
                console.log(`${msg.type().substring(0, 3).toUpperCase()} ${msg.text()}`);
            }
        } else {
            console.log(`${msg.type().substring(0, 3).toUpperCase()} ${msg.text()}`);
        }
    });
    page.on("pageerror", ({ message }) => console.log(message)).on("requestfailed", (request) => console.log(`${request.failure().errorText} ${request.url()}`));
    console.log("opening page");
    await page.setViewport({ width: 600, height: 400 });
    page.setDefaultTimeout(0);
    await page.goto(getGlobalConfig({ root: config.root }).baseUrl + `/empty.html`, {
        waitUntil: "load", // for chrome should be "networkidle0"
        timeout: 0,
    });
    // await page.evaluate(ensurePageIsReady);

    console.log("page opened");
    // await jestPuppeteer.debug();
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

beforeEach(async () => {
    // prepare the engine, scene
    await page.evaluate(() => {
        if (window.scene && window.scene.dispose) {
            // run the dispose function here
            window.scene.dispose();
            window.scene = null;
            window.engine && window.engine.dispose();
        }
    });

    engineFlags = await page.evaluate(evaluateInitEngineForVisualization, engineType, false, false, getGlobalConfig().baseUrl);
    console.log(engineFlags.renderer);
});
// afterEach(async () => {
//     // cleanup, check heap size after each test
// });

test /*.concurrent*/
    .each(config.tests.filter((test) => !test.excludeFromAutomaticTesting && !(test.excludedEngines && test.excludedEngines.includes(engineType))))(
    "$title",
    async (test) => {
        console.log(`Running - ${test.title}`);
        try {
            // set the screenshot fail rate
            expect(await page.evaluate(evaluatePrepareScene, test, getGlobalConfig({ root: config.root }))).toBeTruthy();

            const renderCount = /*getGlobalConfig().qs && getGlobalConfig().qs.checkresourcecreation ? 50 : */ test.renderCount || 1;
            
            const renderResult = await page.evaluate(evaluateRenderSceneForVisualization, renderCount);
            debug && await jestPuppeteer.debug();
            expect(renderResult).toBeTruthy();
            
            const glError = await page.evaluate(evaluateIsGLError);
            expect(glError).toBe(false);
            // Take screenshot
            const screenshot = await page.screenshot();

            jestScreenshot.setupJestScreenshot({
                pixelThresholdRelative: (test.errorRatio || 2.5) / 100,
            });
            // Test screenshot (also save this new screenshot if -u is set)
            expect(screenshot).toMatchImageSnapshot({
                path: path.resolve(__dirname, `./ReferenceImages/${test.referenceImage}`),
            });
        } finally {
            // dispose the scene
            const disposeResult = await page.evaluate(evaluateDisposeSceneForVisualization, engineFlags);
            expect(disposeResult).toBe(true);
        }
    },
    debug ? 1000000 : 40000
);
