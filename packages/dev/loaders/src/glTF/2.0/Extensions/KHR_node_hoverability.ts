import { FlowGraphBlockNames } from "core/FlowGraph/Blocks/flowGraphBlockNames";
import type { GLTFLoader } from "../glTFLoader";
import type { IGLTFLoaderExtension } from "../glTFLoaderExtension";
import { registerGLTFExtension, unregisterGLTFExtension } from "../glTFLoaderExtensionRegistry";
import { addNewInteractivityFlowGraphMapping } from "./KHR_interactivity/declarationMapper";
import type { INode } from "../glTFLoaderInterfaces";
import { AddObjectAccessorToKey } from "./objectModelMapping";

const NAME = "KHR_node_hoverability";

declare module "../../glTFFileLoader" {
    // eslint-disable-next-line jsdoc/require-jsdoc, @typescript-eslint/naming-convention
    export interface GLTFLoaderExtensionOptions {
        /**
         * Defines options for the KHR_node_hoverability extension.
         */
        // NOTE: Don't use NAME here as it will break the UMD type declarations.
        ["KHR_node_hoverability"]: {};
    }
}

// interactivity
const MeshPointerOverPrefix = "targetMeshPointerOver_";
addNewInteractivityFlowGraphMapping("event/onHoverIn", NAME, {
    // using GetVariable as the nodeIndex is a configuration and not a value (i.e. it's not mutable)
    blocks: [FlowGraphBlockNames.PointerOverEvent, FlowGraphBlockNames.GetVariable, FlowGraphBlockNames.IndexOf, "KHR_interactivity/FlowGraphGLTFDataProvider"],
    configuration: {
        stopPropagation: { name: "stopPropagation" },
        nodeIndex: {
            name: "variable",
            toBlock: FlowGraphBlockNames.GetVariable,
            dataTransformer(data) {
                return [MeshPointerOverPrefix + data[0]];
            },
        },
    },
    outputs: {
        values: {
            hoverNodeIndex: { name: "index", toBlock: FlowGraphBlockNames.IndexOf },
            controllerIndex: { name: "pointerId" },
        },
        flows: {
            out: { name: "done" },
        },
    },
    interBlockConnectors: [
        {
            input: "targetMesh",
            output: "value",
            inputBlockIndex: 0,
            outputBlockIndex: 1,
            isVariable: true,
        },
        {
            input: "array",
            output: "nodes",
            inputBlockIndex: 2,
            outputBlockIndex: 3,
            isVariable: true,
        },
        {
            input: "object",
            output: "meshUnderPointer",
            inputBlockIndex: 2,
            outputBlockIndex: 0,
            isVariable: true,
        },
    ],
    extraProcessor(gltfBlock, _declaration, _mapping, _arrays, serializedObjects, context, globalGLTF) {
        // add the glTF to the configuration of the last serialized object
        const serializedObject = serializedObjects[serializedObjects.length - 1];
        serializedObject.config = serializedObject.config || {};
        serializedObject.config.glTF = globalGLTF;
        // find the listener nodeIndex value
        const nodeIndex = gltfBlock.configuration?.["nodeIndex"]?.value[0];
        if (nodeIndex === undefined || typeof nodeIndex !== "number") {
            throw new Error("nodeIndex not found in configuration");
        }
        const variableName = MeshPointerOverPrefix + nodeIndex;
        // find the nodeIndex value
        serializedObjects[1].config.variable = variableName;
        context._userVariables[variableName] = {
            className: "Mesh",
            id: globalGLTF?.nodes?.[nodeIndex]._babylonTransformNode?.id,
            uniqueId: globalGLTF?.nodes?.[nodeIndex]._babylonTransformNode?.uniqueId,
        };
        return serializedObjects;
    },
});

const MeshPointerOutPrefix = "targetMeshPointerOut_";
addNewInteractivityFlowGraphMapping("event/onHoverOut", NAME, {
    // using GetVariable as the nodeIndex is a configuration and not a value (i.e. it's not mutable)
    blocks: [FlowGraphBlockNames.PointerOutEvent, FlowGraphBlockNames.GetVariable, FlowGraphBlockNames.IndexOf, "KHR_interactivity/FlowGraphGLTFDataProvider"],
    configuration: {
        stopPropagation: { name: "stopPropagation" },
        nodeIndex: {
            name: "variable",
            toBlock: FlowGraphBlockNames.GetVariable,
            dataTransformer(data) {
                return [MeshPointerOutPrefix + data[0]];
            },
        },
    },
    outputs: {
        values: {
            hoverNodeIndex: { name: "index", toBlock: FlowGraphBlockNames.IndexOf },
            controllerIndex: { name: "pointerId" },
        },
        flows: {
            out: { name: "done" },
        },
    },
    interBlockConnectors: [
        {
            input: "targetMesh",
            output: "value",
            inputBlockIndex: 0,
            outputBlockIndex: 1,
            isVariable: true,
        },
        {
            input: "array",
            output: "nodes",
            inputBlockIndex: 2,
            outputBlockIndex: 3,
            isVariable: true,
        },
        {
            input: "object",
            output: "meshOutOfPointer",
            inputBlockIndex: 2,
            outputBlockIndex: 0,
            isVariable: true,
        },
    ],
    extraProcessor(gltfBlock, _declaration, _mapping, _arrays, serializedObjects, context, globalGLTF) {
        // add the glTF to the configuration of the last serialized object
        const serializedObject = serializedObjects[serializedObjects.length - 1];
        serializedObject.config = serializedObject.config || {};
        serializedObject.config.glTF = globalGLTF;

        const nodeIndex = gltfBlock.configuration?.["nodeIndex"]?.value[0];
        if (nodeIndex === undefined || typeof nodeIndex !== "number") {
            throw new Error("nodeIndex not found in configuration");
        }
        const variableName = MeshPointerOutPrefix + nodeIndex;
        // find the nodeIndex value
        serializedObjects[1].config.variable = variableName;
        context._userVariables[variableName] = {
            className: "Mesh",
            id: globalGLTF?.nodes?.[nodeIndex]._babylonTransformNode?.id,
            uniqueId: globalGLTF?.nodes?.[nodeIndex]._babylonTransformNode?.uniqueId,
        };
        return serializedObjects;
    },
});

AddObjectAccessorToKey("/nodes/{}/extensions/KHR_node_hoverability/hoverable", {
    get: (node: INode) => {
        const tn = node._babylonTransformNode as any;
        if (tn && tn.pointerOverDisableMeshTesting !== undefined) {
            return tn.pointerOverDisableMeshTesting;
        }
        return true;
    },
    set: (value: boolean, node: INode) => {
        node._primitiveBabylonMeshes?.forEach((mesh) => {
            mesh.pointerOverDisableMeshTesting = !value;
        });
    },
    getTarget: (node: INode) => node._babylonTransformNode,
    getPropertyName: [() => "pointerOverDisableMeshTesting"],
    type: "boolean",
});

/**
 * Loader extension for KHR_node_hoverability
 * @see https://github.com/KhronosGroup/glTF/pull/2426
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export class KHR_node_hoverability implements IGLTFLoaderExtension {
    /**
     * The name of this extension.
     */
    public readonly name = NAME;
    /**
     * Defines whether this extension is enabled.
     */
    public enabled: boolean;

    private _loader: GLTFLoader;

    /**
     * @internal
     */
    constructor(loader: GLTFLoader) {
        this._loader = loader;
        this.enabled = loader.isExtensionUsed(NAME);
    }

    // eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-misused-promises
    public async onReady(): Promise<void> {
        this._loader.gltf.nodes?.forEach((node) => {
            // default is true, so only apply if false
            if (node.extensions?.KHR_node_hoverability && node.extensions?.KHR_node_hoverability.hoverable === false) {
                node._babylonTransformNode?.getChildMeshes().forEach((mesh) => {
                    mesh.pointerOverDisableMeshTesting = true;
                });
            }
        });
    }

    public dispose() {
        (this._loader as any) = null;
    }
}

unregisterGLTFExtension(NAME);
registerGLTFExtension(NAME, true, (loader) => new KHR_node_hoverability(loader));
