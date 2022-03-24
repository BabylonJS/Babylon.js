/* eslint-disable import/no-internal-modules */
import * as Serializers from "serializers/stl/index";

/**
 * This is the entry point for the UMD module.
 * The entry point for a future ESM package should be index.ts
 */
const globalObject = typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : undefined;
if (typeof globalObject !== "undefined") {
    for (const serializer in Serializers) {
        (<any>globalObject).BABYLON[serializer] = (<any>Serializers)[serializer];
    }
}

export * from "serializers/stl/index";
