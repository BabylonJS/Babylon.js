import { type ISerializedInfo } from "@memlab/core";
import { type RunOptions, run } from "memlab";

import { GetGlobalConfig, type IGlobalConfig } from "./config";
import { CreateMemlabScenario, ResolveScenarioDefinitions, type MemoryLeakScenarioDefinition, type ScenarioSuite } from "./scenarios";

/**
 * Options accepted by the Babylon memory leak runner.
 */
export interface IMemoryLeakRunnerOptions {
    /** Scenario suite to execute. */
    suite?: ScenarioSuite;
    /** Optional explicit scenario ids. */
    scenarioIds?: string[];
    /** Override the shared global configuration. */
    configOverride?: Partial<IGlobalConfig>;
    /** Whether to stop on the first failing scenario. */
    failFast?: boolean;
    /** Optional work directory override for memlab output. */
    workDir?: string;
    /** Optional Chromium binary override. */
    chromiumBinary?: string;
    /** Whether to skip the memlab warmup phase. */
    skipWarmup?: boolean;
}

/**
 * Result for a single scenario execution.
 */
export interface IMemoryLeakScenarioResult {
    /** Scenario definition. */
    definition: MemoryLeakScenarioDefinition;
    /** Root directory containing the memlab artifacts. */
    resultDirectory: string;
    /** Serialized memlab leaks. */
    leaks: ISerializedInfo[];
}

/**
 * Error thrown when one or more memory leak scenarios fail.
 */
export class MemoryLeakRunnerError extends Error {
    /** Scenario results produced before the runner failed. */
    public readonly results: IMemoryLeakScenarioResult[];

    /**
     * Creates a new runner error.
     * @param message Error message.
     * @param results Partial or complete runner results.
     */
    public constructor(message: string, results: IMemoryLeakScenarioResult[] = []) {
        super(message);
        this.name = "MemoryLeakRunnerError";
        this.results = results;
    }
}

const FormatLeakCountMessage = (definition: MemoryLeakScenarioDefinition, leaks: ISerializedInfo[], resultDirectory: string) => {
    return `${definition.id}: detected ${leaks.length} leak(s). Memlab artifacts: ${resultDirectory}`;
};

const WriteStderrLine = (message: string) => {
    process.stderr.write(`${message}\n`);
};

const WriteStdoutLine = (message: string) => {
    process.stdout.write(`${message}\n`);
};

const GetScenarioUrl = (definition: MemoryLeakScenarioDefinition, config: IGlobalConfig): string => {
    if (definition.kind === "viewer") {
        return `${config.viewerBaseUrl}${definition.urlPath}`;
    }
    return `${config.baseUrl}/empty.html`;
};

const FormatStartMessage = (definition: MemoryLeakScenarioDefinition, config: IGlobalConfig, index: number, total: number): string => {
    const url = GetScenarioUrl(definition, config);
    const detail =
        definition.kind === "playground" ? ` playground=${definition.playgroundId}` : definition.kind === "package" ? ` packageScenario=${definition.packageScenario}` : "";
    return `[memleak ${index + 1}/${total}] running ${definition.id} (${definition.kind}) \u2014 ${definition.name} [${definition.packageName}]${detail}\n  url: ${url}`;
};

const RunScenarioDefinitionsSequentiallyAsync = async (
    definitions: MemoryLeakScenarioDefinition[],
    options: IMemoryLeakRunnerOptions,
    config: IGlobalConfig,
    results: IMemoryLeakScenarioResult[],
    definitionIndex = 0
): Promise<void> => {
    if (definitionIndex >= definitions.length) {
        return;
    }

    const definition = definitions[definitionIndex];
    WriteStdoutLine(FormatStartMessage(definition, config, definitionIndex, definitions.length));
    const startedAtMs = Date.now();
    let result: IMemoryLeakScenarioResult;
    try {
        result = await RunScenario(definition, options, config);
    } catch (error) {
        const elapsedSeconds = ((Date.now() - startedAtMs) / 1000).toFixed(1);
        WriteStderrLine(`[memleak ${definitionIndex + 1}/${definitions.length}] FAILED ${definition.id} after ${elapsedSeconds}s: ${(error as Error)?.message ?? error}`);
        throw error;
    }
    results.push(result);
    const elapsedSeconds = ((Date.now() - startedAtMs) / 1000).toFixed(1);

    if (result.leaks.length > 0) {
        const message = FormatLeakCountMessage(definition, result.leaks, result.resultDirectory);
        WriteStderrLine(`[memleak ${definitionIndex + 1}/${definitions.length}] LEAKED ${definition.id} in ${elapsedSeconds}s`);
        if (options.failFast ?? true) {
            throw new MemoryLeakRunnerError(message, results);
        }
        WriteStderrLine(message);
    } else {
        WriteStdoutLine(`[memleak ${definitionIndex + 1}/${definitions.length}] passed ${definition.id} in ${elapsedSeconds}s`);
    }

    await RunScenarioDefinitionsSequentiallyAsync(definitions, options, config, results, definitionIndex + 1);
};

/**
 * Runs a single memory leak scenario.
 * @param definition The scenario definition.
 * @param options Runner options.
 * @param config Resolved global config.
 * @returns The scenario result.
 */
export async function RunScenario(
    definition: MemoryLeakScenarioDefinition,
    options: IMemoryLeakRunnerOptions = {},
    config: IGlobalConfig = GetGlobalConfig(options.configOverride)
): Promise<IMemoryLeakScenarioResult> {
    const scenario = CreateMemlabScenario(definition, config);
    const memlabOptions: RunOptions = {
        scenario,
        chromiumBinary: options.chromiumBinary,
        skipWarmup: options.skipWarmup,
        workDir: options.workDir,
    };

    const { leaks, runResult } = await run(memlabOptions);

    return {
        definition,
        leaks,
        resultDirectory: runResult.getRootDirectory(),
    };
}

/**
 * Runs the selected scenario suite.
 * @param options Runner options.
 * @returns All scenario results.
 */
export async function RunScenarioSuite(options: IMemoryLeakRunnerOptions = {}): Promise<IMemoryLeakScenarioResult[]> {
    const config = GetGlobalConfig(options.configOverride);
    const definitions = ResolveScenarioDefinitions(options.suite ?? "ci", options.scenarioIds);
    if (definitions.length === 0) {
        throw new Error(`No memory leak scenarios matched the requested suite or scenario IDs (suite: "${options.suite ?? "ci"}").`);
    }
    const results: IMemoryLeakScenarioResult[] = [];

    await RunScenarioDefinitionsSequentiallyAsync(definitions, options, config, results);

    const failingResults = results.filter((result) => result.leaks.length > 0);
    if (failingResults.length > 0) {
        throw new MemoryLeakRunnerError(failingResults.map((result) => FormatLeakCountMessage(result.definition, result.leaks, result.resultDirectory)).join("\n"), results);
    }

    return results;
}
