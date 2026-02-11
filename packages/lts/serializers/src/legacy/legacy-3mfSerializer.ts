/* eslint-disable @typescript-eslint/no-restricted-imports */
import * as Serializers from "serializers/3MF/index";

/**
 * This is the entry point for the UMD module.
 * The entry point for a future ESM package should be index.ts
 */
const globalObject = typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : undefined;
if (typeof globalObject !== "undefined") {
    const keys = [];
    for (const serializer in Serializers) {
        // Prevent Reassignment.
        if (keys.indexOf(serializer) > -1) {
            continue;
        }
        (<any>globalObject).BABYLON[serializer] = (<any>Serializers)[serializer];
        keys.push(serializer);
    }
}

export * from "serializers/3MF/index";
