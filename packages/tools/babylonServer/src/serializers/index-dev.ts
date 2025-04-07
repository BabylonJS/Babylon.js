/* eslint-disable import/export */
/* eslint-disable import/namespace */
// eslint-disable-next-line @typescript-eslint/naming-convention
import * as SERIALIZERS from "./legacy-dev";

const GlobalObject = typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : undefined;
if (typeof GlobalObject !== "undefined") {
    (<any>GlobalObject).BABYLON = (<any>GlobalObject).BABYLON || {};
    (<any>GlobalObject).SERIALIZERS = SERIALIZERS;
}

export * from "./legacy-dev";
