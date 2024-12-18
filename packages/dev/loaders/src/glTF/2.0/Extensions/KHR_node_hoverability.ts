import { FlowGraphBlockNames } from "core/FlowGraph/Blocks/flowGraphBlockNames";
import type { GLTFLoader } from "../glTFLoader";
import type { IGLTFLoaderExtension } from "../glTFLoaderExtension";
import { registerGLTFExtension, unregisterGLTFExtension } from "../glTFLoaderExtensionRegistry";
import { addNewInteractivityFlowGraphMapping, connectFlowGraphNodes } from "./KHR_interactivity/interactivityUtils";

const NAME = "KHR_node_hoverability";

declare module "../../glTFFileLoader" {
    // eslint-disable-next-line jsdoc/require-jsdoc
    export interface GLTFLoaderExtensionOptions {
        /**
         * Defines options for the KHR_node_hoverability extension.
         */
        // NOTE: Don't use NAME here as it will break the UMD type declarations.
        ["KHR_node_hoverability"]: {};
    }
}

// interactivity
export function updateHoverabilityInteractivity() {
    addNewInteractivityFlowGraphMapping("event/onHoverIn", {
        // using GetVariable as the nodeIndex is a configuration and not a value (i.e. it's not mutable)
        blocks: [FlowGraphBlockNames.PointerOverEvent, FlowGraphBlockNames.GetVariable],
        configuration: {
            stopPropagation: { name: "stopPropagation" },
            nodeIndex: {
                name: "variable",
                toBlock: FlowGraphBlockNames.GetVariable,
                dataTransformer(data) {
                    return "targetMeshPointerOver_" + data;
                },
            },
        },
        outputs: {
            values: {
                // TODO - not mapped the same as glTF after the graph has started
                hoverNodeIndex: { name: "meshUnderPointer" },
                controllerIndex: { name: "pointerId" },
            },
            flows: {
                out: { name: "done" },
            },
        },
        extraProcessor(gltfBlock, _mapping, _arrays, serializedObjects, context, globalGLTF) {
            const nodeIndex = gltfBlock.configuration?.find((config) => config.id === "nodeIndex")?.value;
            if (nodeIndex === undefined) {
                throw new Error("nodeIndex not found in configuration");
            }
            const variableName = "targetMeshPointerOver_" + nodeIndex;
            // connect the mesh to the asset input
            connectFlowGraphNodes("targetMesh", "value", serializedObjects[0], serializedObjects[1], true);
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

    addNewInteractivityFlowGraphMapping("event/onHoverOut", {
        // using GetVariable as the nodeIndex is a configuration and not a value (i.e. it's not mutable)
        blocks: [FlowGraphBlockNames.PointerOutEvent, FlowGraphBlockNames.GetVariable],
        configuration: {
            stopPropagation: { name: "stopPropagation" },
            nodeIndex: {
                name: "variable",
                toBlock: FlowGraphBlockNames.GetVariable,
                dataTransformer(data) {
                    return "targetMeshPointerOut_" + data;
                },
            },
        },
        outputs: {
            values: {
                // TODO - not mapped the same as glTF after the graph has started
                hoverNodeIndex: { name: "meshOutOfPointer" },
                controllerIndex: { name: "pointerId" },
            },
            flows: {
                out: { name: "done" },
            },
        },
        extraProcessor(gltfBlock, _mapping, _arrays, serializedObjects, context, globalGLTF) {
            const nodeIndex = gltfBlock.configuration?.find((config) => config.id === "nodeIndex")?.value;
            if (nodeIndex === undefined) {
                throw new Error("nodeIndex not found in configuration");
            }
            const variableName = "targetMeshPointerOut_" + nodeIndex;
            // connect the mesh to the asset input
            connectFlowGraphNodes("targetMesh", "value", serializedObjects[0], serializedObjects[1], true);
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

updateHoverabilityInteractivity();

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
