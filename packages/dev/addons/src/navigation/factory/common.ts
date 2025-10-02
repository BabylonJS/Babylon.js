import { _LoadScriptModuleAsync } from "core/Misc/tools.internals";
import type { Nullable } from "core/types";

import type { RecastInjection } from "../types";

/**
 * Gets the RecastInjection instance (reference to the recast-navigation-js library).
 * @returns The RecastInjection instance
 * @throws Error if Recast is not initialized
 */
export function GetRecast(): RecastInjection {
    if (!_Recast) {
        throw new Error("Recast is not initialized. Please call InitRecast first.");
    }
    return _Recast;
}

/**
 * Sets the RecastInjection instance (reference to the recast-navigation-js library).
 * @param recast The RecastInjection instance to set
 */
export function SetRecast(recast: RecastInjection) {
    _Recast = recast;
}

/**
 * Reference to the recast-navigation-js library
 */
let _Recast: RecastInjection;

/**
 * Promise to wait for the recast-navigation-js library to be ready
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
let _InitPromise: Nullable<Promise<{ core: any; generators: any }>> = null;

/**
 * Initializes the Recast navigation library.
 *
 * @param options Optional configuration. options.version: The version of Recast to use. options.instance: A custom Recast instance to inject instead of loading one.
 * @returns A promise that resolves when initialization is complete.
 */
export async function InitRecast(options?: { version?: string; instance?: RecastInjection }) {
    const version = options?.version ?? "0.43.0";
    const localOptions = {
        url: "https://unpkg.com/@recast-navigation",
        version,
        ...options,
    };

    if (_Recast) {
        return; // Already initialized
    }

    if (_InitPromise) {
        await _InitPromise;
        return;
    }

    if (localOptions.instance) {
        _Recast = localOptions.instance;
    } else {
        _InitPromise = ImportRecast(localOptions.url, localOptions.version);

        const result = await _InitPromise;
        // eslint-disable-next-line require-atomic-updates
        _Recast = { ...result.core, ...result.generators };

        await _Recast.init();
    }
}

async function ImportRecast(baseUrl: string, version: string) {
    const importMap = {
        imports: {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            "@recast-navigation/core": `${baseUrl}/core@${version}/dist/index.mjs`,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            "@recast-navigation/wasm": `${baseUrl}/wasm@${version}/dist/recast-navigation.wasm-compat.js`,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            "@recast-navigation/generators": `${baseUrl}/generators@${version}/dist/index.mjs`,
        },
    };

    const script = document.createElement("script");
    script.type = "importmap";
    script.textContent = JSON.stringify(importMap);
    document.body.appendChild(script);

    const result = await _LoadScriptModuleAsync(
        `
                import * as CoreModule from '${baseUrl}/core@${version}/dist/index.mjs';
                import * as GeneratorsModule from '${baseUrl}/generators@${version}/dist/index.mjs';
                const returnedValue =  {core: CoreModule, generators: GeneratorsModule};
            `
    );
    return result;
}
