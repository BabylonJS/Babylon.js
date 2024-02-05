import { TSDocConfigFile } from "@microsoft/tsdoc-config";
import * as path from "path";
import * as fs from "fs";

import { Debug } from "./Debug";

interface ICachedConfig {
    loadTimeMs: number;
    lastCheckTimeMs: number;
    configFile: TSDocConfigFile;
}

// How often to check for modified input files.  If a file's modification timestamp has changed, then we will
// evict the cache entry immediately.
const cacheCheckIntervalMs: number = 3 * 1000;

// Evict old entries from the cache after this much time, regardless of whether the file was detected as being
// modified or not.
const cacheExpireMs: number = 20 * 1000;

// If this many objects accumulate in the cache, then it is cleared to avoid a memory leak.
const cacheMaxSize: number = 100;

export class ConfigCache {
    // findConfigPathForFolder() result --> loaded tsdoc.json configuration
    private static _CachedConfigs: Map<string, ICachedConfig> = new Map<string, ICachedConfig>();

    /**
     * Node.js equivalent of performance.now().
     * @returns A high-resolution timestamp in milliseconds.
     */
    private static _GetTimeInMs(): number {
        const [seconds, nanoseconds] = process.hrtime();
        return seconds * 1000 + nanoseconds / 1000000;
    }

    public static GetForSourceFile(sourceFilePath: string): TSDocConfigFile {
        const sourceFileFolder: string = path.dirname(path.resolve(sourceFilePath));

        // First, determine the file to be loaded. If not found, the configFilePath will be an empty string.
        // const configFilePath: string = TSDocConfigFile.findConfigPathForFolder(sourceFileFolder);
        let configFilePath = path.resolve(sourceFileFolder, "tsdoc.json");
        while (configFilePath.length > 11 && !fs.existsSync(configFilePath)) {
            configFilePath = path.resolve(path.dirname(configFilePath), "..", "tsdoc.json");
        }

        // If configFilePath is an empty string, then we'll use the folder of sourceFilePath as our cache key
        // (instead of an empty string)
        const cacheKey: string = configFilePath || sourceFileFolder + "/";
        Debug.Log(`Cache key: "${cacheKey}"`);

        const nowMs: number = ConfigCache._GetTimeInMs();

        let cachedConfig: ICachedConfig | undefined = undefined;

        // Do we have a cached object?
        cachedConfig = ConfigCache._CachedConfigs.get(cacheKey);

        if (cachedConfig) {
            Debug.Log("Cache hit");

            // Is the cached object still valid?
            const loadAgeMs: number = nowMs - cachedConfig.loadTimeMs;
            const lastCheckAgeMs: number = nowMs - cachedConfig.lastCheckTimeMs;

            if (loadAgeMs > cacheExpireMs || loadAgeMs < 0) {
                Debug.Log("Evicting because item is expired");
                cachedConfig = undefined;
                ConfigCache._CachedConfigs.delete(cacheKey);
            } else if (lastCheckAgeMs > cacheCheckIntervalMs || lastCheckAgeMs < 0) {
                Debug.Log("Checking for modifications");
                cachedConfig.lastCheckTimeMs = nowMs;
                if (cachedConfig.configFile.checkForModifiedFiles()) {
                    // Invalidate the cache because it failed to load completely
                    Debug.Log("Evicting because item was modified");
                    cachedConfig = undefined;
                    ConfigCache._CachedConfigs.delete(cacheKey);
                }
            }
        }

        // Load the object
        if (!cachedConfig) {
            if (ConfigCache._CachedConfigs.size > cacheMaxSize) {
                Debug.Log("Clearing cache");
                ConfigCache._CachedConfigs.clear(); // avoid a memory leak
            }

            const configFile: TSDocConfigFile = TSDocConfigFile.loadFile(configFilePath);

            if (configFile.fileNotFound) {
                Debug.Log(`File not found: "${configFilePath}"`);
            } else {
                Debug.Log(`Loaded: "${configFilePath}"`);
            }

            cachedConfig = {
                configFile,
                lastCheckTimeMs: nowMs,
                loadTimeMs: nowMs,
            };

            ConfigCache._CachedConfigs.set(cacheKey, cachedConfig);
        }

        return cachedConfig.configFile;
    }
}
