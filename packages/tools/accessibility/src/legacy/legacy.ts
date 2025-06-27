/* eslint-disable @typescript-eslint/no-restricted-imports */
import { HTMLTwinRenderer } from "../index";

const GlobalObject = typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : undefined;
if (typeof GlobalObject !== "undefined") {
    (<any>GlobalObject).BABYLON = (<any>GlobalObject).BABYLON || {};
    // eslint-disable-next-line @typescript-eslint/naming-convention
    (<any>GlobalObject).BABYLON.Accessibility = { HTMLTwinRenderer };
    // eslint-disable-next-line @typescript-eslint/naming-convention
    (<any>GlobalObject).ACCESSIBILITY = { HTMLTwinRenderer };
}

export * from "../index";
