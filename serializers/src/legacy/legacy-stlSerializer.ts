import * as Serializers from "../stl";

/**
 * This is the entry point for the UMD module.
 * The entry point for a future ESM package should be index.ts
 */
var globalObject = (typeof global !== 'undefined') ? global : ((typeof window !== 'undefined') ? window : undefined);
if (typeof globalObject !== "undefined") {
    for (var serializer in Serializers) {
        (<any>globalObject).BABYLON[serializer] = (<any>Serializers)[serializer];
    }
}

export * from "../stl";