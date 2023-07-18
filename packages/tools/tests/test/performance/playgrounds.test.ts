import { evaluatePrepareScene, getGlobalConfig, checkPerformanceOfScene } from "@tools/test-tools";

const framesToRender = 2000;
const numberOfPasses = 10;
const acceptedThreshold = 0.05; // 5% compensation

const playgrounds = ["#WIR77Z", "#2AH4YH", "#YEZPVT", "#6HWS9M#28", "#XCPP9Y#1", "#XZ0TH6", "#JU1DZP", "#7V0Y1I#1523", "#6FBD14#2004", "#KQV9SA", "#7CBW04"];

// IN TESTS
// declare const BABYLON: typeof import("core/index");

describe("Playground Memory Leaks", () => {
    jest.setTimeout(40000);

    // eslint-disable-next-line jest/expect-expect
    test.each(playgrounds)(
        "Performance for playground %s",
        async (playgroundId) => {
            const globalConfig = getGlobalConfig();
            const stable = await checkPerformanceOfScene(
                page,
                getGlobalConfig().baseUrl,
                "stable",
                evaluatePrepareScene,
                numberOfPasses,
                framesToRender,
                {
                    playgroundId,
                },
                globalConfig
            );
            const dev = await checkPerformanceOfScene(
                page,
                getGlobalConfig().baseUrl,
                "dev",
                evaluatePrepareScene,
                numberOfPasses,
                framesToRender,
                {
                    playgroundId,
                },
                globalConfig
            );
            console.log(`Performance - scene: stable: ${stable}ms, dev: ${dev}ms`);
            expect(dev / stable, `Dev: ${dev}ms, Stable: ${stable}ms`).toBeLessThanOrEqual(1 + acceptedThreshold);
        },
        40000
    );
});
