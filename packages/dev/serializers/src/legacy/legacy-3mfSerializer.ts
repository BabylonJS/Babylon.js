/* eslint-disable @typescript-eslint/no-restricted-imports */
import * as Serializers from "serializers/3MF/index";

/**
 * This is the entry point for the UMD module.
 * The entry point for a future ESM package should be index.ts
 */
const GlobalObject = typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : undefined;
if (typeof GlobalObject !== "undefined") {
    const keys = [];
    for (const serializer in Serializers) {
        // Prevent Reassignment.
        if (keys.indexOf(serializer) > -1) {
            continue;
        }
        (<any>GlobalObject).BABYLON[serializer] = (<any>Serializers)[serializer];
        keys.push(serializer);
    }
}

export * from "serializers/3MF/index";
