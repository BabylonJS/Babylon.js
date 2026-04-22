import * as fs from "fs";
import * as path from "path";

import { DefaultScenarioDefinitions, ValidScenarioSuites, type ScenarioSuite } from "./scenarios";
import { RunScenarioSuite, MemoryLeakRunnerError, type IMemoryLeakRunnerOptions, type IMemoryLeakScenarioResult } from "./runner";

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
 * Generates a GitHub-flavored markdown summary of memory leak results.
 * @param results All scenario results (including those with leaks).
 * @param hasError Whether the runner encountered an error.
 * @returns Markdown string.
 */
function GenerateMarkdownSummary(results: IMemoryLeakScenarioResult[], hasError: boolean): string {
    const passed = results.filter((r) => r.leaks.length === 0);
    const leaked = results.filter((r) => r.leaks.length > 0);
    const icon = leaked.length > 0 ? "🔴" : "🟢";

    const lines: string[] = [];
    lines.push(`## ${icon} Memory Leak Test Results`);
    lines.push("");
    lines.push(`**${passed.length}** passed, **${leaked.length}** leaked out of **${results.length}** scenarios`);
    lines.push("");

    if (leaked.length > 0) {
        lines.push("### Leaked Scenarios");
        lines.push("");
        lines.push("| Scenario | Package | Leaks |");
        lines.push("|----------|---------|------:|");
        for (const r of leaked) {
            lines.push(`| ${r.definition.name} | ${r.definition.packageName} | ${r.leaks.length} |`);
        }
        lines.push("");
    }

    if (passed.length > 0) {
        lines.push("<details>");
        lines.push(`<summary>Passed Scenarios (${passed.length})</summary>`);
        lines.push("");
        lines.push("| Scenario | Package |");
        lines.push("|----------|---------|");
        for (const r of passed) {
            lines.push(`| ${r.definition.name} | ${r.definition.packageName} |`);
        }
        lines.push("");
        lines.push("</details>");
    }

    if (hasError && results.length === 0) {
        lines.push("⚠️ The runner encountered an error before producing any results.");
    }

    return lines.join("\n");
}

/**
 * Writes the markdown comment file if MEMLEAK_COMMENT_FILE is set.
 * @param results Scenario results to summarize.
 * @param hasError Whether the runner failed.
 */
function WriteCommentFileIfRequested(results: IMemoryLeakScenarioResult[], hasError: boolean): void {
    const commentFilePath = process.env.MEMLEAK_COMMENT_FILE;
    if (!commentFilePath) {
        return;
    }
    const markdown = GenerateMarkdownSummary(results, hasError);
    const dir = path.dirname(commentFilePath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(commentFilePath, markdown, "utf-8");
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

    let results: IMemoryLeakScenarioResult[] = [];
    let hasError = false;

    try {
        results = await RunScenarioSuite(options);
    } catch (error) {
        hasError = true;
        if (error instanceof MemoryLeakRunnerError) {
            results = error.results;
        }
        // Re-throw after writing the comment file so CI sees the failure.
        WriteCommentFileIfRequested(results, hasError);
        throw error;
    }

    WriteCommentFileIfRequested(results, hasError);
    results.forEach((result) => {
        WriteStdoutLine(`${result.definition.id}: 0 leak(s). Memlab artifacts: ${result.resultDirectory}`);
    });
}
