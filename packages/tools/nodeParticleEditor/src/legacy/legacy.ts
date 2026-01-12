/* eslint-disable @typescript-eslint/no-restricted-imports */
import * as NODEPARTICLEEDITOR from "../index";

const GlobalObject = typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : undefined;
if (typeof GlobalObject !== "undefined") {
    (<any>GlobalObject).BABYLON = (<any>GlobalObject).BABYLON || {};
    (<any>GlobalObject).BABYLON.NodeParticleEditor = NODEPARTICLEEDITOR.NodeParticleEditor;
    (<any>GlobalObject).BABYLON.NODEPARTICLEEDITOR = NODEPARTICLEEDITOR;
}

export * from "../index";
