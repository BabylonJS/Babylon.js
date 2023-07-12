import { evaluatePrepareScene, getGlobalConfig, checkPerformanceOfScene } from "@tools/test-tools";
import * as path from "path";
import * as fs from "fs";

const defaultFramesToRender = process.env.PERF_FRAMES_TO_RENDER ? +process.env.PERF_FRAMES_TO_RENDER : 2000;
const defaultNumberOfPasses = process.env.PERF_NUMBER_OF_PASSES ? +process.env.PERF_NUMBER_OF_PASSES : 8;
const acceptedThreshold = process.env.PERF_THRESHOLD ? +process.env.PERF_THRESHOLD : 5; // 5% compensation

const configPath = process.env.CONFIG_PATH || path.resolve(__dirname, "perfTests.json");
const rawJsonData = fs.readFileSync(configPath, "utf8");
// console.log(data);
const config = JSON.parse(rawJsonData.replace(/^\uFEFF/, ""));

const testAgainst = process.env.PERF_TEST_AGAINST ? process.env.PERF_TEST_AGAINST.split(",") : ["https://cdn.babylonjs.com"];

// IN TESTS
// declare const BABYLON: typeof import("core/index");

describe("Playground Memory Leaks", () => {
    // eslint-disable-next-line jest/expect-expect
    test.each(config)(
        "Performance for playground $playground",
        async (testScenario) => {
            const playgroundId = testScenario.playground;
            const passes = testScenario.passes || defaultNumberOfPasses;
            const framesToRender = testScenario.frames || defaultFramesToRender;
            const globalConfig = getGlobalConfig();
            const dev = await checkPerformanceOfScene(
                page,
                globalConfig.baseUrl,
                "dev",
                evaluatePrepareScene,
                passes,
                framesToRender,
                {
                    playgroundId,
                },
                globalConfig
            );
            for (let i = 0; i < testAgainst.length; i++) {
                const against = await checkPerformanceOfScene(
                    page,
                    testAgainst[i],
                    "dev",
                    evaluatePrepareScene,
                    passes,
                    framesToRender,
                    {
                        playgroundId,
                    },
                    globalConfig
                );
                console.log(`Performance - PG ${testScenario.playground}: ${testAgainst[i]}: ${against}ms, dev: ${dev}ms`);
                expect(dev / against, `Dev: ${dev}ms, Stable: ${against}ms`).toBeLessThanOrEqual(1 + acceptedThreshold / 100);
            }
        },
        config.timeout || 40000
    );
});
