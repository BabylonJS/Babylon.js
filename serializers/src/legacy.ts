import * as Serializers from "./index";

/**
 * Legacy support, defining window.BABYLON.OBJSerializer... (global variable).
 *
 * This is the entry point for the UMD module.
 * The entry point for a future ESM package should be index.ts
 */
var globalObject = (typeof global !== 'undefined') ? global : ((typeof window !== 'undefined') ? window : undefined);
if (typeof globalObject !== "undefined") {
    (<any>globalObject).BABYLON = (<any>globalObject).BABYLON || {};
    for (var serializer in Serializers) {
        if (Serializers.hasOwnProperty(serializer)) {
            (<any>globalObject).BABYLON[serializer] = (<any>Serializers)[serializer];
        }
    }
}

export * from "./index";