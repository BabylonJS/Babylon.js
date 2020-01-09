import * as FileLoader from "../glTF/glTFFileLoader";
import * as Validation from "../glTF/glTFValidation";

/**
 * This is the entry point for the UMD module.
 * The entry point for a future ESM package should be index.ts
 */
var globalObject = (typeof global !== 'undefined') ? global : ((typeof window !== 'undefined') ? window : undefined);
if (typeof globalObject !== "undefined") {
    (<any>globalObject).BABYLON = (<any>globalObject).BABYLON || {};
    for (var key in FileLoader) {
        (<any>globalObject).BABYLON[key] = (<any>FileLoader)[key];
    }
    for (var key in Validation) {
        (<any>globalObject).BABYLON[key] = (<any>Validation)[key];
    }
}

export * from "../glTF/glTFFileLoader";
export * from "../glTF/glTFValidation";