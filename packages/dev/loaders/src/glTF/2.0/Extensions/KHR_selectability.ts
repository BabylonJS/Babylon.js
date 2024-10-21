import { FlowGraphBlockNames } from "core/FlowGraph/Blocks/flowGraphBlockNames";
import type { GLTFLoader } from "../glTFLoader";
import type { IGLTFLoaderExtension } from "../glTFLoaderExtension";
import { addNewInteractivityFlowGraphMapping, connectFlowGraphNodes } from "./KHR_interactivity/interactivityUtils";
import { registerGLTFExtension, unregisterGLTFExtension } from "../glTFLoaderExtensionRegistry";

const NAME = "KHR_selectability";

declare module "../../glTFFileLoader" {
    // eslint-disable-next-line jsdoc/require-jsdoc
    export interface GLTFLoaderExtensionOptions {
        /**
         * Defines options for the KHR_selectability extension.
         */
        // NOTE: Don't use NAME here as it will break the UMD type declarations.
        ["KHR_selectability"]: {};
    }
}

export function updateInteractivity() {
    addNewInteractivityFlowGraphMapping("event/onSelect", {
        // using GetVariable as the nodeIndex is a configuration and not a value (i.e. it's not mutable)
        blocks: [FlowGraphBlockNames.MeshPickEvent, FlowGraphBlockNames.GetVariable],
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
                // TODO - not mapped currently!
                selectedNodeIndex: { name: "pickedMesh" },
                controllerIndex: { name: "pointerId" },
                selectionPoint: { name: "pickedPoint" },
                selectionRayOrigin: { name: "pickOrigin" },
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
            const variableName = "pickedMesh_" + nodeIndex;
            // connect the mesh to the asset input
            connectFlowGraphNodes("asset", "value", serializedObjects[0], serializedObjects[1], true);

            // find the nodeIndex value
            serializedObjects[1].config.variable = variableName;
            context._userVariables[variableName] = {
                className: "Mesh",
                id: globalGLTF.nodes?.[nodeIndex]._babylonTransformNode?.id,
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
export class KHR_selectability implements IGLTFLoaderExtension {
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
            if (node.extensions?.KHR_selectability && node.extensions?.KHR_selectability.selectable === false) {
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
registerGLTFExtension(NAME, true, (loader) => new KHR_selectability(loader));
