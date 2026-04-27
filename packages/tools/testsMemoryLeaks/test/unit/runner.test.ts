import { asMock, createMockFn, resetAllMocks, testFramework } from "./testFramework";

testFramework.mock?.("memlab", () => ({
    run: createMockFn(),
}));

const loadRunnerModules = async () => {
    const memlabModule = await import("memlab");
    const cliModule = await import("../../src/cli");
    const runnerModule = await import("../../src/runner");

    return {
        run: memlabModule.run,
        parseCliArgs: cliModule.ParseCliArgs,
        MemoryLeakRunnerError: runnerModule.MemoryLeakRunnerError,
        runScenarioSuite: runnerModule.RunScenarioSuite,
    };
};

describe("memory leak runner", () => {
    beforeEach(() => {
        resetAllMocks();
    });

    it("parses cli arguments", async () => {
        const { parseCliArgs } = await loadRunnerModules();
        const parsed = parseCliArgs(["--suite", "packages", "--scenario=viewer-boombox-web-component", "--skip-warmup", "--no-fail-fast"]);

        expect(parsed.listOnly).toBe(false);
        expect(parsed.options).toEqual(
            expect.objectContaining({
                suite: "packages",
                scenarioIds: ["viewer-boombox-web-component"],
                skipWarmup: true,
                failFast: false,
            })
        );
    });

    it("returns results when every scenario is leak free", async () => {
        const { run, runScenarioSuite } = await loadRunnerModules();
        const mockedRun = asMock(run);
        mockedRun.mockResolvedValue({
            leaks: [],
            runResult: {
                getRootDirectory: () => "/tmp/memlab-ci",
            },
        } as any);

        const results = await runScenarioSuite({ suite: "ci", scenarioIds: ["core-playground-T90MQ4-14"] });

        expect(results).toHaveLength(1);
        expect(results[0].definition.id).toBe("core-playground-T90MQ4-14");
        expect(mockedRun).toHaveBeenCalledTimes(1);
    });

    it("throws a typed error when a scenario leaks", async () => {
        const { run, MemoryLeakRunnerError, runScenarioSuite } = await loadRunnerModules();
        const mockedRun = asMock(run);
        mockedRun.mockResolvedValue({
            leaks: [{ id: "leak-1" }],
            runResult: {
                getRootDirectory: () => "/tmp/memlab-leak",
            },
        } as any);

        await expect(runScenarioSuite({ suite: "ci", scenarioIds: ["core-playground-T90MQ4-14"] })).rejects.toBeInstanceOf(MemoryLeakRunnerError);
    });

    it("throws when an invalid suite is passed to ParseCliArgs", async () => {
        const { parseCliArgs } = await loadRunnerModules();

        expect(() => parseCliArgs(["--suite", "bogus"])).toThrow(/Unknown suite "bogus"/);
    });

    it("throws when the resolved scenario set is empty", async () => {
        const { runScenarioSuite } = await loadRunnerModules();

        await expect(runScenarioSuite({ suite: "ci", scenarioIds: ["nonexistent-scenario-id"] })).rejects.toThrow(/Unknown memory leak scenario/);
    });
});
