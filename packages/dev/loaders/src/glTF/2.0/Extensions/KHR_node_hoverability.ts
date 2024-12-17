import type { GLTFLoader } from "../glTFLoader";
import type { IGLTFLoaderExtension } from "../glTFLoaderExtension";
import { registerGLTFExtension, unregisterGLTFExtension } from "../glTFLoaderExtensionRegistry";
// import { addNewInteractivityFlowGraphMapping } from "./KHR_interactivity/interactivityUtils";

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
export function updateInteractivity() {
    // addNewInteractivityFlowGraphMapping("event/onHoverIn", {
    //     // using GetVariable as the nodeIndex is a configuration and not a value (i.e. it's not mutable)
    //     blocks: [FlowGraphBlockNames.MeshPickEvent, FlowGraphBlockNames.GetVariable],
    //     configuration: {
    //         stopPropagation: { name: "stopPropagation" },
    //         nodeIndex: {
    //             name: "variable",
    //             toBlock: FlowGraphBlockNames.GetVariable,
    //             dataTransformer(data) {
    //                 return "pickedMesh_" + data;
    //             },
    //         },
    //     },
    //     outputs: {
    //         values: {
    //             // TODO - not mapped currently!
    //             selectedNodeIndex: { name: "pickedMesh" },
    //             controllerIndex: { name: "pointerId" },
    //             selectionPoint: { name: "pickedPoint" },
    //             selectionRayOrigin: { name: "pickOrigin" },
    //         },
    //         flows: {
    //             out: { name: "done" },
    //         },
    //     },
    //     extraProcessor(gltfBlock, _mapping, _arrays, serializedObjects, context, globalGLTF) {
    //         const nodeIndex = gltfBlock.configuration?.find((config) => config.id === "nodeIndex")?.value;
    //         if (nodeIndex === undefined) {
    //             throw new Error("nodeIndex not found in configuration");
    //         }
    //         const variableName = "pickedMesh_" + nodeIndex;
    //         // connect the mesh to the asset input
    //         connectFlowGraphNodes("asset", "value", serializedObjects[0], serializedObjects[1], true);
    //         // find the nodeIndex value
    //         serializedObjects[1].config.variable = variableName;
    //         context._userVariables[variableName] = {
    //             className: "Mesh",
    //             id: globalGLTF?.nodes?.[nodeIndex]._babylonTransformNode?.id,
    //         };
    //         return serializedObjects;
    //     },
    // });
}

updateInteractivity();

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
