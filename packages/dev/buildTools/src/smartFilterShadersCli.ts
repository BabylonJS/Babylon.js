/* eslint-disable no-console */
import { watch } from "chokidar";
import { extname } from "path";
import { ConvertShaders, ConvertShader } from "./smartFilterShaders/convertShaders.js";
import { externalArgs } from "./utils.js";

/**
 * Parses positional arguments after the command name from the CLI args.
 * @param commandNames - The possible command name strings to look for
 * @returns The positional arguments after the command name
 */
function GetPositionalArgs(commandNames: string[]): string[] {
    const args = externalArgs.length ? externalArgs : process.argv.slice(2);
    const cmdIdx = args.findIndex((a) => commandNames.includes(a));
    return args.slice(cmdIdx + 1);
}

/**
 * Builds all smart filter .glsl shaders into .ts files.
 * Invoked via: build-tools -c smart-filter-shaders <shaderPath> <smartFiltersCorePath> [babylonCorePath]
 */
export function BuildSmartFilterShaders(): void {
    const positional = GetPositionalArgs(["smart-filter-shaders", "sfs"]);
    if (positional.length >= 2 && positional[0] && positional[1]) {
        ConvertShaders(positional[0], positional[1], positional[2]);
    } else {
        console.error("Usage: build-tools -c smart-filter-shaders <shaderPath> <smartFiltersCorePath> [babylonCorePath]");
        process.exit(1);
    }
}

/**
 * Watches smart filter .glsl shaders and rebuilds them on change.
 * Invoked via: build-tools -c watch-smart-filter-shaders <shaderPath> <smartFiltersCorePath> [babylonCorePath]
 */
export function WatchSmartFilterShaders(): void {
    const positional = GetPositionalArgs(["watch-smart-filter-shaders", "wsfs"]);
    if (positional.length >= 2 && positional[0] && positional[1]) {
        const shaderPath = positional[0];
        const smartFiltersCorePath = positional[1];
        const babylonCorePath = positional[2];

        watch(shaderPath).on("all", (event: string, file: string) => {
            if (event !== "change" && event !== "add") {
                return;
            }
            if (extname(file) !== ".glsl") {
                return;
            }
            console.log(`Change detected. Starting conversion...`);
            try {
                ConvertShader(file, smartFiltersCorePath, babylonCorePath);
                console.log(`Successfully updated shader ${file}`);
            } catch (error) {
                console.error(`Failed to convert shader ${file}: ${error}`);
            }
            console.log(`Watching for changes in ${shaderPath}...`);
        });
    } else {
        console.error("Usage: build-tools -c watch-smart-filter-shaders <shaderPath> <smartFiltersCorePath> [babylonCorePath]");
        process.exit(1);
    }
}
