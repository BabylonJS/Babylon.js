/* eslint-disable @typescript-eslint/no-restricted-imports */
import * as Serializers from "serializers/OBJ/index";

/**
 * This is the entry point for the UMD module.
 * The entry point for a future ESM package should be index.ts
 */
const GlobalObject = typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : undefined;
if (typeof GlobalObject !== "undefined") {
    for (const serializer in Serializers) {
        (<any>GlobalObject).BABYLON[serializer] = (<any>Serializers)[serializer];
    }
}

export * from "serializers/OBJ/index";
