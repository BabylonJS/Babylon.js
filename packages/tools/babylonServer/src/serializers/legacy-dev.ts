/* eslint-disable import/no-internal-modules */
import * as OBJSerializers from "../../../../dev/serializers/src/OBJ/index";

/**
 * This is the entry point for the UMD module.
 * The entry point for a future ESM package should be index.ts
 */
const globalObject = typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : undefined;
if (typeof globalObject !== "undefined") {
    for (const serializer in OBJSerializers) {
        (<any>globalObject).BABYLON[serializer] = (<any>OBJSerializers)[serializer];
    }
}

export * from "../../../../dev/serializers/src/OBJ/index";

/* eslint-disable import/no-internal-modules */
import * as STLSerializers from "../../../../dev/serializers/src/stl/index";

/**
 * This is the entry point for the UMD module.
 * The entry point for a future ESM package should be index.ts
 */
if (typeof globalObject !== "undefined") {
    for (const serializer in STLSerializers) {
        (<any>globalObject).BABYLON[serializer] = (<any>STLSerializers)[serializer];
    }
}

export * from "../../../../dev/serializers/src/stl/index";

/* eslint-disable import/no-internal-modules */
import * as Exporters from "../../../../dev/serializers/src/glTF/glTFFileExporter";
import * as Datas from "../../../../dev/serializers/src/glTF/2.0/glTFData";
import * as Serializers from "../../../../dev/serializers/src/glTF/2.0/glTFSerializer";
import * as Extensions from "../../../../dev/serializers/src/glTF/2.0/Extensions/index";
import * as GLTF2 from "../../../../dev/serializers/src/glTF/2.0/index";

/**
 * This is the entry point for the UMD module.
 * The entry point for a future ESM package should be index.ts
 */
if (typeof globalObject !== "undefined") {
    (<any>globalObject).BABYLON = (<any>globalObject).BABYLON || {};
    const BABYLON = (<any>globalObject).BABYLON;
    BABYLON.GLTF2 = BABYLON.GLTF2 || {};
    BABYLON.GLTF2.Exporter = BABYLON.GLTF2.Exporter || {};
    BABYLON.GLTF2.Exporter.Extensions = BABYLON.GLTF2.Exporter.Extensions || {};

    const keys = [];
    for (const key in Exporters) {
        BABYLON[key] = (<any>Exporters)[key];
        keys.push(key);
    }
    for (const key in Datas) {
        BABYLON[key] = (<any>Datas)[key];
        keys.push(key);
    }
    for (const key in Serializers) {
        BABYLON[key] = (<any>Serializers)[key];
        keys.push(key);
    }

    for (const key in Extensions) {
        BABYLON.GLTF2.Exporter.Extensions[key] = (<any>Extensions)[key];
        keys.push(key);
    }

    for (const key in GLTF2) {
        // Prevent Reassignment.
        if (keys.indexOf(key) > -1) {
            continue;
        }

        BABYLON.GLTF2.Exporter[key] = (<any>GLTF2)[key];
    }
}

export * from "../../../../dev/serializers/src/glTF/glTFFileExporter";
export * from "../../../../dev/serializers/src/glTF/2.0/index";
