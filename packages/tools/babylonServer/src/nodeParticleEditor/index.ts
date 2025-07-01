/* eslint-disable @typescript-eslint/no-restricted-imports */
import { NodeParticleEditor } from "../../../nodeParticleEditor/src/index";

const GlobalObject = typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : undefined;
if (typeof GlobalObject !== "undefined") {
    (<any>GlobalObject).BABYLON = (<any>GlobalObject).BABYLON || {};
    (<any>GlobalObject).BABYLON.NodeParticleEditor = NodeParticleEditor;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    (<any>GlobalObject).NODEPARTICLEEDITOR = { NodeParticleEditor };
}

export * from "../../../nodeParticleEditor/src/index";
