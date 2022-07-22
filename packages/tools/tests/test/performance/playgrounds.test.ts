import { evaluatePrepareScene, getGlobalConfig, checkPerformanceOfScene } from "@tools/test-tools";

const framesToRender = 2500;
const numberOfPasses = 10;
const acceptedThreshold = 0.075; // 7.5% compensation

const playgrounds = [
    "#WIR77Z",
    "#2AH4YH",
    "#YEZPVT",
    // "#SRZRWV#6",
    "#XCPP9Y#1",
    "#XZ0TH6",
    "#JU1DZP",
    "#7V0Y1I#1523",
    "#6FBD14#2004",
    "#KQV9SA",
    "#7CBW04",
];

// IN TESTS
// declare const BABYLON: typeof import("core/index");

describe("Playground Memory Leaks", () => {
    jest.setTimeout(30000);

    // eslint-disable-next-line jest/expect-expect
    test.each(playgrounds)(
        "Performance for playground %s",
        async (playgroundId) => {
            const globalConfig = getGlobalConfig();
            const preview = await checkPerformanceOfScene(
                page,
                getGlobalConfig().baseUrl,
                "preview",
                evaluatePrepareScene,
                numberOfPasses,
                framesToRender,
                {
                    playgroundId,
                },
                globalConfig
            );
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
            console.log(`Performance - scene: preview: ${preview}ms, stable: ${stable}ms, dev: ${dev}ms`);
            expect(dev / preview, `Dev: ${dev}ms, Preview: ${preview}ms`).toBeLessThanOrEqual(1 + acceptedThreshold);
            expect(dev / stable, `Dev: ${dev}ms, Stable: ${stable}ms`).toBeLessThanOrEqual(1 + acceptedThreshold);
        },
        40000
    );
});
