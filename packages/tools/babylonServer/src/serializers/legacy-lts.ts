/* eslint-disable @typescript-eslint/no-restricted-imports */
import * as OBJSerializers from "serializers/OBJ/index";

/**
 * This is the entry point for the UMD module.
 * The entry point for a future ESM package should be index.ts
 */
const GlobalObject = typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : undefined;
if (typeof GlobalObject !== "undefined") {
    for (const serializer in OBJSerializers) {
        (<any>GlobalObject).BABYLON[serializer] = (<any>OBJSerializers)[serializer];
    }
}

/* eslint-disable @typescript-eslint/no-restricted-imports */
import * as STLSerializers from "serializers/stl/index";

/**
 * This is the entry point for the UMD module.
 * The entry point for a future ESM package should be index.ts
 */
if (typeof GlobalObject !== "undefined") {
    for (const serializer in STLSerializers) {
        (<any>GlobalObject).BABYLON[serializer] = (<any>STLSerializers)[serializer];
    }
}

import * as USDZSerializers from "serializers/USDZ/index";
if (typeof GlobalObject !== "undefined") {
    for (const serializer in USDZSerializers) {
        (<any>GlobalObject).BABYLON[serializer] = (<any>USDZSerializers)[serializer];
    }
}

import * as tmfSerializers from "serializers/3MF/index";
if (typeof GlobalObject !== "undefined") {
    for (const serializer in tmfSerializers) {
        (<any>GlobalObject).BABYLON[serializer] = (<any>tmfSerializers)[serializer];
    }
}

/* eslint-disable @typescript-eslint/no-restricted-imports */
import * as Exporters from "serializers/glTF/glTFFileExporter";
import * as Datas from "serializers/glTF/2.0/glTFData";
import * as Serializers from "serializers/glTF/2.0/glTFSerializer";
import * as Extensions from "serializers/glTF/2.0/Extensions/index";
import * as GLTF2 from "serializers/glTF/2.0/index";

/**
 * This is the entry point for the UMD module.
 * The entry point for a future ESM package should be index.ts
 */
if (typeof GlobalObject !== "undefined") {
    (<any>GlobalObject).BABYLON = (<any>GlobalObject).BABYLON || {};
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const BABYLON = (<any>GlobalObject).BABYLON;
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

export * from "serializers/index";
