import * as FileLoader from "loaders/glTF/glTFFileLoader";
import * as Validation from "loaders/glTF/glTFValidation";

/**
 * This is the entry point for the UMD module.
 * The entry point for a future ESM package should be index.ts
 */
const GlobalObject = typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : undefined;
if (typeof GlobalObject !== "undefined") {
    (<any>GlobalObject).BABYLON = (<any>GlobalObject).BABYLON || {};
    for (const key in FileLoader) {
        (<any>GlobalObject).BABYLON[key] = (<any>FileLoader)[key];
    }
    for (const key in Validation) {
        (<any>GlobalObject).BABYLON[key] = (<any>Validation)[key];
    }
}

export * from "loaders/glTF/glTFFileLoader";
export * from "loaders/glTF/glTFValidation";
