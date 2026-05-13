import * as GuiEditor from "@babylonjs/gui-editor";
import * as Inspector from "@babylonjs/inspector";
import * as InspectorLegacy from "@babylonjs/inspector-legacy";
import * as NodeEditor from "@babylonjs/node-editor";
import * as NodeGeometryEditor from "@babylonjs/node-geometry-editor";
import * as NodeParticleEditor from "@babylonjs/node-particle-editor";
import * as NodeRenderGraphEditor from "@babylonjs/node-render-graph-editor";

const editorNamespaces = {
    GuiEditor,
    Inspector,
    InspectorLegacy,
    NodeEditor,
    NodeGeometryEditor,
    NodeParticleEditor,
    NodeRenderGraphEditor,
};

const globalObject = globalThis as typeof globalThis & { __babylonEs6EditorImportSmoke?: typeof editorNamespaces };
globalObject.__babylonEs6EditorImportSmoke = editorNamespaces;

if (Object.keys(editorNamespaces).length !== 7) {
    throw new Error("The ES6 editor import smoke test is missing an editor namespace.");
}
