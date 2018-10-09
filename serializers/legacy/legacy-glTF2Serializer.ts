import * as Exporters from "../src/glTF/glTFFileExporter";
import * as Serializers from "../src/glTF/2.0";

/**
 * This is the entry point for the UMD module.
 * The entry point for a future ESM package should be index.ts
 */
var globalObject = (typeof global !== 'undefined') ? global : ((typeof window !== 'undefined') ? window : undefined);
if (typeof globalObject !== "undefined") {
    for (var exporter in Exporters) {
        (<any>globalObject).BABYLON[exporter] = (<any>Exporters)[exporter];
    }
    for (var serializer in Serializers) {
        (<any>globalObject).BABYLON[serializer] = (<any>Serializers)[serializer];
    }
}

export * from "../src/glTF/glTFFileExporter";
export * from "../src/glTF/2.0";