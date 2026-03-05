/* eslint-disable no-console */

/**
 * Log function - defaults to console.log, upgraded to Logger.Log if @babylonjs/core is available.
 */
export let log: (message: string) => void = console.log;

/**
 * Error function - defaults to console.error, upgraded to Logger.Error if @babylonjs/core is available.
 */
export let error: (message: string) => void = console.error;

/**
 * Initializes the logger. Attempts to use Logger from @babylonjs/core if available,
 * otherwise falls back to console. Must be called (and awaited) before any logging.
 */
export async function initLogger(): Promise<void> {
    try {
        // Use a variable so TypeScript doesn't try to resolve the module at compile time
        const coreLoggerModule = "@babylonjs/core/Misc/logger.js";
        const { Logger } = await import(/* webpackIgnore: true */ coreLoggerModule);
        log = Logger.Log.bind(Logger);
        error = Logger.Error.bind(Logger);
    } catch {
        // @babylonjs/core not available (e.g. pre-build context), keep console defaults
    }
}
