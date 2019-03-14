import * as Exporters from "../glTF/glTFFileExporter";
import * as Datas from "../glTF/2.0/glTFData";
import * as Serializers from "../glTF/2.0/glTFSerializer";
import * as Extensions from "../glTF/2.0/Extensions";
import * as GLTF2 from "../glTF/2.0";

/**
 * This is the entry point for the UMD module.
 * The entry point for a future ESM package should be index.ts
 */
var globalObject = (typeof global !== 'undefined') ? global : ((typeof window !== 'undefined') ? window : undefined);
if (typeof globalObject !== "undefined") {
    (<any>globalObject).BABYLON = (<any>globalObject).BABYLON || {};
    var BABYLON = (<any>globalObject).BABYLON;
    BABYLON.GLTF2 = BABYLON.GLTF2 || {};
    BABYLON.GLTF2.Exporter = BABYLON.GLTF2.Exporter || {};
    BABYLON.GLTF2.Exporter.Extensions = BABYLON.GLTF2.Exporter.Extensions || {};

    const keys = [];
    for (var key in Exporters) {
        BABYLON[key] = (<any>Exporters)[key];
        keys.push(key);
    }
    for (var key in Datas) {
        BABYLON[key] = (<any>Datas)[key];
        keys.push(key);
    }
    for (var key in Serializers) {
        BABYLON[key] = (<any>Serializers)[key];
        keys.push(key);
    }

    for (var key in Extensions) {
        BABYLON.GLTF2.Exporter.Extensions[key] = (<any>Extensions)[key];
        keys.push(key);
    }

    for (var key in GLTF2) {
        // Prevent Reassignment.
        if (keys.indexOf(key) > -1) {
            continue;
        }

        BABYLON.GLTF2.Exporter[key] = (<any>GLTF2)[key];
    }
}

export * from "../glTF/glTFFileExporter";
export * from "../glTF/2.0";