/* eslint-disable no-console, @typescript-eslint/naming-convention */

/**
 * Log function - defaults to console.log, upgraded to Logger.Log via setLogger.
 */
export let log: (message: string) => void = console.log;

/**
 * Error function - defaults to console.error, upgraded to Logger.Error via setLogger.
 */
export let error: (message: string) => void = console.error;

/**
 * Upgrades the build tools logger to use the provided Logger class.
 * Call this synchronously after importing to switch from console to Babylon's Logger.
 * @param LoggerClass - The Logger class (e.g. from core/Misc/logger)
 */
export function setLogger(LoggerClass: { Log: (message: string) => void; Error: (message: string) => void }): void {
    log = LoggerClass.Log.bind(LoggerClass);
    error = LoggerClass.Error.bind(LoggerClass);
}
