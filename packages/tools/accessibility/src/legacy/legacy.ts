/* eslint-disable import/no-internal-modules */
import { HTMLTwinRenderer } from "../index";

const globalObject = typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : undefined;
if (typeof globalObject !== "undefined") {
    (<any>globalObject).BABYLON = (<any>globalObject).BABYLON || {};
    (<any>globalObject).BABYLON.HtmlTwinRenderer = HTMLTwinRenderer;
    (<any>globalObject).BABYLON.HTMLTwinRenderer = HTMLTwinRenderer;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    (<any>globalObject).HTMLTWINRENDERER = { HTMLTwinRenderer };
}

export * from "../index";
