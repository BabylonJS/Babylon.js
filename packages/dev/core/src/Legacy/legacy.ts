/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/no-restricted-imports */
// Ensure Symbol.metadata exists before any decorated class in core/index is evaluated.
// This must be the first import so the polyfill runs before "core/index" below.
import "core/Misc/decorators.functions";
import * as BABYLON from "core/index";
import * as DebugImport from "core/Debug/index";
import { RegisterMathColor } from "core/Maths/math.color.pure";
import { RegisterMathVector } from "core/Maths/math.vector.pure";

declare let global: any;

/**
 * Legacy support, defining window.BABYLON (global variable).
 *
 * This is the entry point for the UMD module.
 * The entry point for a future ESM package should be index.ts
 */
const GlobalObject = typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : undefined;
function RegisterLegacyGlobal(): void {
    if (typeof GlobalObject === "undefined") {
        return;
    }

    GlobalObject.BABYLON = GlobalObject.BABYLON || {};
    const BABYLONGLOBAL = GlobalObject.BABYLON;
    if (!BABYLONGLOBAL.Debug) {
        BABYLONGLOBAL.Debug = BABYLONGLOBAL.Debug || {};

        for (const key in DebugImport) {
            if (!BABYLONGLOBAL.Debug[key]) {
                BABYLONGLOBAL.Debug[key] = (<any>DebugImport)[key];
            }
        }
    }
    for (const key in BABYLON) {
        if (!BABYLONGLOBAL[key]) {
            BABYLONGLOBAL[key] = (<any>BABYLON)[key];
        }
    }
}

function RegisterLegacyRuntime(): void {
    RegisterMathColor();
    RegisterMathVector();
    RegisterLegacyGlobal();
}

RegisterLegacyRuntime();

export * from "core/index";
export const Debug = {
    AxesViewer: BABYLON.AxesViewer,
    BoneAxesViewer: BABYLON.BoneAxesViewer,
    PhysicsViewer: BABYLON.PhysicsViewer,
    SkeletonViewer: BABYLON.SkeletonViewer,
};
