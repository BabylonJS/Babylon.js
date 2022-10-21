/* eslint-disable import/no-internal-modules */
import { HTMLTwinRenderer } from "../index";

const globalObject = typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : undefined;
if (typeof globalObject !== "undefined") {
    (<any>globalObject).BABYLON = (<any>globalObject).BABYLON || {};
    // eslint-disable-next-line @typescript-eslint/naming-convention
    (<any>globalObject).BABYLON.Accessibility = { HTMLTwinRenderer };
    // eslint-disable-next-line @typescript-eslint/naming-convention
    (<any>globalObject).ACCESSIBILITY = { HTMLTwinRenderer };
}

export * from "../index";
