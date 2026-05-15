import { existsSync, readFileSync } from "fs";
import { dirname, join } from "path";

const CONFIG_FILENAME = ".babyloninspector";

const DefaultBrowserPort = 4400;
const DefaultCliPort = 4401;

/**
 * Configuration for the Inspector CLI bridge.
 */
export interface IInspectorBridgeConfig {
    /**
     * WebSocket port for browser sessions to connect to the bridge.
     */
    browserPort: number;

    /**
     * WebSocket port for CLI connections to the bridge.
     */
    cliPort: number;
}

/**
 * Searches for a `.babyloninspector` config file starting from the given directory
 * and walking up the parent chain. Returns the path to the first file found, or
 * undefined if none is found.
 * @param startDir The directory to start searching from.
 * @returns The absolute path to the config file, or undefined.
 */
function FindConfigFile(startDir: string): string | undefined {
    let current = startDir;
    for (;;) {
        const candidate = join(current, CONFIG_FILENAME);
        if (existsSync(candidate)) {
            return candidate;
        }
        const parent = dirname(current);
        if (parent === current) {
            // Reached filesystem root.
            return undefined;
        }
        current = parent;
    }
}

/**
 * Loads the Inspector bridge configuration by searching for a `.babyloninspector`
 * file in the directory parent chain starting from `cwd`. If no file is found,
 * or if fields are missing, defaults are used.
 * @param cwd The working directory to start the search from. Defaults to `process.cwd()`.
 * @returns The resolved configuration.
 */
export function LoadConfig(cwd?: string): IInspectorBridgeConfig {
    const defaults: IInspectorBridgeConfig = {
        browserPort: DefaultBrowserPort,
        cliPort: DefaultCliPort,
    };

    const configPath = FindConfigFile(cwd ?? process.cwd());
    if (!configPath) {
        return defaults;
    }

    try {
        const raw = readFileSync(configPath, "utf-8");
        const parsed = JSON.parse(raw) as Partial<IInspectorBridgeConfig>;
        return {
            browserPort: typeof parsed.browserPort === "number" ? parsed.browserPort : defaults.browserPort,
            cliPort: typeof parsed.cliPort === "number" ? parsed.cliPort : defaults.cliPort,
        };
    } catch {
        // If the file is malformed, fall back to defaults.
        return defaults;
    }
}
