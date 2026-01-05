/* eslint-disable @typescript-eslint/no-restricted-imports */
import { NodeParticleEditor } from "../index";

const GlobalObject = typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : undefined;
if (typeof GlobalObject !== "undefined") {
    (<any>GlobalObject).BABYLON = (<any>GlobalObject).BABYLON || {};
    (<any>GlobalObject).BABYLON.NodeParticleEditor = NodeParticleEditor;
}

export * from "../index";
