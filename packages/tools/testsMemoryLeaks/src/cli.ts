import { DefaultScenarioDefinitions, ValidScenarioSuites, type ScenarioSuite } from "./scenarios";
import { RunScenarioSuite, type IMemoryLeakRunnerOptions } from "./runner";

const GetArgValue = (argv: string[], name: string): string | undefined => {
    const prefixedArg = `--${name}=`;
    const directMatch = argv.find((arg) => arg.startsWith(prefixedArg));
    if (directMatch) {
        return directMatch.slice(prefixedArg.length);
    }

    const index = argv.indexOf(`--${name}`);
    if (index !== -1 && index + 1 < argv.length) {
        return argv[index + 1];
    }

    return undefined;
};

const WriteStdoutLine = (message: string) => {
    process.stdout.write(`${message}\n`);
};

/**
 * Parses CLI arguments for the memory leak runner.
 * @param argv Raw process arguments.
 * @returns Parsed runner options and control flags.
 */
export function ParseCliArgs(argv: string[]) {
    const suiteArg = GetArgValue(argv, "suite");
    if (suiteArg !== undefined && !ValidScenarioSuites.includes(suiteArg as ScenarioSuite)) {
        throw new Error(`Unknown suite "${suiteArg}". Valid suites: ${ValidScenarioSuites.join(", ")}.`);
    }
    const suite: ScenarioSuite = (suiteArg as ScenarioSuite | undefined) ?? "ci";
    const scenarioArg = GetArgValue(argv, "scenario");
    const scenarioIds = scenarioArg
        ?.split(",")
        .map((scenarioId) => scenarioId.trim())
        .filter(Boolean);
    const workDir = GetArgValue(argv, "work-dir");
    const chromiumBinary = GetArgValue(argv, "chromium-binary");
    const failFast = !argv.includes("--no-fail-fast");
    const listOnly = argv.includes("--list");
    const skipWarmup = argv.includes("--skip-warmup");

    const options: IMemoryLeakRunnerOptions = {
        suite,
        scenarioIds,
        workDir,
        chromiumBinary,
        failFast,
        skipWarmup,
    };

    return { listOnly, options };
}

/**
 * Executes the memory leak runner CLI.
 * @param argv Raw process arguments.
 */
export async function RunCli(argv: string[]): Promise<void> {
    const { listOnly, options } = ParseCliArgs(argv);

    if (listOnly) {
        DefaultScenarioDefinitions.forEach((definition) => {
            WriteStdoutLine(`${definition.id}\t${definition.packageName}\t${definition.suites.join(",")}\t${definition.name}`);
        });
        return;
    }

    const results = await RunScenarioSuite(options);
    results.forEach((result) => {
        WriteStdoutLine(`${result.definition.id}: 0 leak(s). Memlab artifacts: ${result.resultDirectory}`);
    });
}
