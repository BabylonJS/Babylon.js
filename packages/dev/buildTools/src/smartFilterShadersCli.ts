import { externalArgs } from "./utils.js";

/**
 * Extracts the positional arguments after the command name, then replaces
 * process.argv so that the dynamically-imported script (which reads
 * process.argv.slice(2)) sees only the positional args.
 */
function setupArgv(commandNames: string[]): void {
    const args = externalArgs.length ? externalArgs : process.argv.slice(2);
    const cmdIdx = args.findIndex((a) => commandNames.includes(a));
    const positional = args.slice(cmdIdx + 1);
    process.argv = [process.argv[0]!, process.argv[1]!, ...positional];
}

/**
 * Builds all smart filter .glsl shaders into .ts files.
 * Proxies to @dev/smart-filters/buildShaders which is a self-running script.
 */
export async function BuildSmartFilterShaders(): Promise<void> {
    setupArgv(["smart-filter-shaders", "sfs"]);
    await import("@dev/smart-filters/buildShaders");
}

/**
 * Watches smart filter .glsl shaders and rebuilds them on change.
 * Proxies to @dev/smart-filters/watchShaders which is a self-running script.
 */
export async function WatchSmartFilterShaders(): Promise<void> {
    setupArgv(["watch-smart-filter-shaders", "wsfs"]);
    await import("@dev/smart-filters/watchShaders");
}
