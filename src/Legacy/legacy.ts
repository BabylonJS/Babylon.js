import * as Babylon from "../index";
import * as DebugImort from "../Debug/index";

declare var global: any;

/**
 * Legacy support, defining window.BABYLON (global variable).
 *
 * This is the entry point for the UMD module.
 * The entry point for a future ESM package should be index.ts
 */
var globalObject = (typeof global !== 'undefined') ? global : ((typeof window !== 'undefined') ? window : undefined);
if (typeof globalObject !== "undefined") {
    (<any>globalObject).BABYLON = BABYLON;
    (<any>globalObject).BABYLON = (<any>globalObject).BABYLON || {};
    var BABYLON = (<any>globalObject).BABYLON;
    BABYLON.Debug = BABYLON.Debug || {};

    const keys = [];
    for (var key in DebugImort) {
        BABYLON.Debug[key] = (<any>DebugImort)[key];
        keys.push(key);
    }
    for (var key in Babylon) {
        BABYLON[key] = (<any>Babylon)[key];
    }
}

export * from "../index";
export const Debug = {
    AxesViewer: DebugImort.AxesViewer,
    BoneAxesViewer: DebugImort.BoneAxesViewer,
    PhysicsViewer: DebugImort.PhysicsViewer,
    SkeletonViewer: DebugImort.SkeletonViewer,
};