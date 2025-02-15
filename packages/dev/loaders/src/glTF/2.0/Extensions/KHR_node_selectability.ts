import { FlowGraphBlockNames } from "core/FlowGraph/Blocks/flowGraphBlockNames";
import type { GLTFLoader } from "../glTFLoader";
import type { IGLTFLoaderExtension } from "../glTFLoaderExtension";
import { registerGLTFExtension, unregisterGLTFExtension } from "../glTFLoaderExtensionRegistry";
import { addNewInteractivityFlowGraphMapping } from "./KHR_interactivity/declarationMapper";

const NAME = "KHR_node_selectability";

declare module "../../glTFFileLoader" {
    // eslint-disable-next-line jsdoc/require-jsdoc
    export interface GLTFLoaderExtensionOptions {
        /**
         * Defines options for the KHR_selectability extension.
         */
        // NOTE: Don't use NAME here as it will break the UMD type declarations.
        ["KHR_node_selectability"]: {};
    }
}

export function updateInteractivity() {
    addNewInteractivityFlowGraphMapping("event/onSelect", NAME, {
        // using GetVariable as the nodeIndex is a configuration and not a value (i.e. it's not mutable)
        blocks: [FlowGraphBlockNames.MeshPickEvent, FlowGraphBlockNames.GetVariable, FlowGraphBlockNames.IndexOf, "KHR_interactivity/FlowGraphGLTFDataProvider"],
        configuration: {
            stopPropagation: { name: "stopPropagation" },
            nodeIndex: {
                name: "variable",
                toBlock: FlowGraphBlockNames.GetVariable,
                dataTransformer(data) {
                    return "pickedMesh_" + data;
                },
            },
        },
        outputs: {
            values: {
                selectedNodeIndex: { name: "index", toBlock: FlowGraphBlockNames.IndexOf },
                controllerIndex: { name: "pointerId" },
                selectionPoint: { name: "pickedPoint" },
                selectionRayOrigin: { name: "pickOrigin" },
            },
            flows: {
                out: { name: "done" },
            },
        },
        interBlockConnectors: [
            {
                input: "asset",
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
                output: "pickedMesh",
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
            const variableName = "pickedMesh_" + nodeIndex;
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
}

updateInteractivity();

/**
 * Loader extension for KHR_selectability
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export class KHR_node_selectability implements IGLTFLoaderExtension {
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

    public async onReady(): Promise<void> {
        this._loader.gltf.nodes?.forEach((node) => {
            if (node.extensions?.KHR_node_selectability && node.extensions?.KHR_node_selectability.selectable === false) {
                // TODO - this works on load, but will not work if a pointer changes the value in real time
                node._babylonTransformNode?.getChildMeshes().forEach((mesh) => {
                    mesh.isPickable = false;
                });
            }
        });
    }

    public dispose() {
        (this._loader as any) = null;
    }
}

unregisterGLTFExtension(NAME);
registerGLTFExtension(NAME, true, (loader) => new KHR_node_selectability(loader));
