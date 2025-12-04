// NOTE: This is only for UMD backward compatibility with very old versions of Inspector v1.

// eslint-disable-next-line @typescript-eslint/no-restricted-imports, @typescript-eslint/naming-convention
import * as INSPECTOR from "../index";

let CachedInspector: typeof INSPECTOR | undefined;

/**
 * Attaches Inspector v2 to the global INSPECTOR and BABYLON.Inspector.
 */
export function AttachInspectorGlobals() {
    // Check if Inspector v2 is already attached, but don't compare the modules directly as
    // WebPack does some weird stuff with modules that makes direct comparison unreliable.
    // Instead, check the Inspector class.
    if ((<any>globalThis).BABYLON?.Inspector !== INSPECTOR.Inspector) {
        // First cache any existing global INSPECTOR value (e.g. Inspector v1).
        CachedInspector = (<any>globalThis).INSPECTOR;

        // Then inject Inspector v2 as the global INSPECTOR and BABYLON.Inspector.
        (<any>globalThis).BABYLON = (<any>globalThis).BABYLON || {};
        (<any>globalThis).BABYLON.Inspector = INSPECTOR.Inspector;
        (<any>globalThis).INSPECTOR = INSPECTOR;

        INSPECTOR.AttachDebugLayer();
    }
}

/**
 * Detaches Inspector v2 from the global INSPECTOR and BABYLON.Inspector.
 */
export function DetachInspectorGlobals() {
    // Check if Inspector v2 is already attached, but don't compare the modules directly as
    // WebPack does some weird stuff with modules that makes direct comparison unreliable.
    // Instead, check the Inspector class.
    if ((<any>globalThis).BABYLON?.Inspector === INSPECTOR.Inspector) {
        // Remove the global INSPECTOR and BABYLON.Inspector.
        if (CachedInspector) {
            (<any>globalThis).BABYLON.Inspector = CachedInspector.Inspector;
            (<any>globalThis).INSPECTOR = CachedInspector;
            CachedInspector = undefined;
        } else {
            delete (<any>globalThis).BABYLON.Inspector;
            delete (<any>globalThis).INSPECTOR;
        }

        INSPECTOR.DetachDebugLayer();
    }
}

// eslint-disable-next-line @typescript-eslint/no-restricted-imports
export * from "../index";

// Attach Inspector v2 to the global INSPECTOR and BABYLON.Inspector as a side effect for back compat.
AttachInspectorGlobals();
