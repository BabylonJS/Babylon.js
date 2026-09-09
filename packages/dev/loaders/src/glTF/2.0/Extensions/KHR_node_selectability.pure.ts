import { type GLTFLoader } from "../glTFLoader.pure";
import { type IGLTFLoaderExtension } from "../glTFLoaderExtension";
import { registerGLTFExtension, unregisterGLTFExtension } from "../glTFLoaderExtensionRegistry";
import { FlowGraphBlockNames } from "core/FlowGraph/Blocks/flowGraphBlockNames";
import { addNewInteractivityFlowGraphMapping } from "./KHR_interactivity/declarationMapper";
import { type INode } from "../glTFLoaderInterfaces";
import { AddObjectAccessorToKey } from "./objectModelMapping";
import { GetInteractivityNodeState, InitializeInteractivityNodeState, SetInteractivityNodeState } from "./KHR_interactivity/interactivityNodeState";
import { FlowGraphTypes } from "core/FlowGraph/flowGraphRichTypes.pure";

const NAME = "KHR_node_selectability";

// add the interactivity mapping for the onSelect event

// object model extension for selectable

/**
 * Loader extension for KHR_selectability
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export class KHR_node_selectability implements IGLTFLoaderExtension {
    /**
     * The name of this extension.
     */
    public readonly name = NAME;
    /** Applies node state before KHR_interactivity graphs start. */
    public readonly order = 100;
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
        InitializeInteractivityNodeState(this._loader.gltf.nodes ?? [], "selectable", (node) => node.extensions?.KHR_node_selectability?.selectable);
    }

    public dispose() {
        (this._loader as any) = null;
    }
}

let _RuntimeRegistered = false;
/**
 * @internal
 * Registers KHR_node_selectability runtime dependencies without changing the extension registry.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export function _RegisterKHRNodeSelectabilityRuntime(): void {
    if (_RuntimeRegistered) {
        return;
    }
    _RuntimeRegistered = true;

    addNewInteractivityFlowGraphMapping("event/onSelect", NAME, {
        // using GetVariable as the nodeIndex is a configuration and not a value (i.e. it's not mutable)
        blocks: [
            FlowGraphBlockNames.MeshPickEvent,
            FlowGraphBlockNames.GetVariable,
            FlowGraphBlockNames.IndexOf,
            "KHR_interactivity/FlowGraphGLTFDataProvider",
            "KHR_interactivity/FlowGraphEventReferenceBlock",
        ],
        declarationSchema: {
            inputValueSockets: {},
            outputValueSockets: {
                selectedNode: "ref",
                selectionRayOrigin: "float3",
                selectionPoint: "float3",
                controllerIndex: "int",
                event: "ref",
            },
        },
        configuration: {
            nodeIndex: {
                name: "variable",
                configurationType: "int",
                toBlock: FlowGraphBlockNames.GetVariable,
                indexSource: "assetNodes",
                invalidUsesDefault: true,
                dataTransformer(data) {
                    return "pickedMesh_" + data;
                },
            },
        },
        outputs: {
            values: {
                selectedNodeIndex: { name: "index", toBlock: FlowGraphBlockNames.IndexOf },
                // `selectedNode` is the new ref-typed output from the Opaque-Reference
                // spec update. It's the picked Babylon mesh itself, available directly
                // from FlowGraphMeshPickEventBlock.pickedMesh — no IndexOf lookup needed.
                selectedNode: { name: "nodeReference", toBlock: "KHR_interactivity/FlowGraphEventReferenceBlock" },
                controllerIndex: { name: "controllerIndex", toBlock: "KHR_interactivity/FlowGraphEventReferenceBlock" },
                selectionPoint: { name: "selectionPoint", toBlock: "KHR_interactivity/FlowGraphEventReferenceBlock" },
                selectionRayOrigin: { name: "selectionRayOrigin", toBlock: "KHR_interactivity/FlowGraphEventReferenceBlock" },
                event: { name: "value", toBlock: "KHR_interactivity/FlowGraphEventReferenceBlock" },
            },
            flows: {
                out: { name: "out", toBlock: "KHR_interactivity/FlowGraphEventReferenceBlock" },
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
            {
                input: "node",
                output: "pickedMesh",
                inputBlockIndex: 4,
                outputBlockIndex: 0,
                isVariable: true,
            },
            {
                input: "controllerIndexInput",
                output: "pointerId",
                inputBlockIndex: 4,
                outputBlockIndex: 0,
                isVariable: true,
            },
            {
                input: "selectionPointInput",
                output: "pickedPoint",
                inputBlockIndex: 4,
                outputBlockIndex: 0,
                isVariable: true,
            },
            {
                input: "selectionRayOriginInput",
                output: "pickOrigin",
                inputBlockIndex: 4,
                outputBlockIndex: 0,
                isVariable: true,
            },
            {
                input: "in",
                output: "done",
                inputBlockIndex: 4,
                outputBlockIndex: 0,
            },
        ],
        extraProcessor(gltfBlock, _declaration, _mapping, _arrays, serializedObjects, context, globalGLTF) {
            // find the listener nodeIndex value
            const nodeIndex = gltfBlock.configuration?.["nodeIndex"]?.value?.[0];
            const validNodeIndex = typeof nodeIndex === "number" && Number.isInteger(nodeIndex) && nodeIndex >= 0 && nodeIndex < (globalGLTF?.nodes?.length ?? 0);
            const variableName = validNodeIndex ? "pickedMesh_" + nodeIndex : "pickedMesh_unbound";
            // find the nodeIndex value
            serializedObjects[1].config.variable = variableName;
            context._userVariables[variableName] = validNodeIndex
                ? {
                      className: "Mesh",
                      id: globalGLTF?.nodes?.[nodeIndex]._babylonTransformNode?.id,
                      uniqueId: globalGLTF?.nodes?.[nodeIndex]._babylonTransformNode?.uniqueId,
                  }
                : { type: FlowGraphTypes.Any, value: [{}] };
            const eventKey = `${NAME}:event/onSelect:${nodeIndex}`;
            serializedObjects[0].config.eventKey = eventKey;
            serializedObjects[0].config.useNaNDefaults = true;
            serializedObjects[0].config.pointerIdDefault = -1;
            serializedObjects[4].config.eventKey = eventKey;
            serializedObjects[4].config.normalizeControllerIndex = true;
            return serializedObjects;
        },
    });

    AddObjectAccessorToKey("/nodes/{}/extensions/KHR_node_selectability/selectable", {
        get: (node: INode) => {
            return GetInteractivityNodeState(node, "selectable");
        },
        set: (value: boolean, node: INode) => {
            SetInteractivityNodeState(node, "selectable", value);
        },
        getTarget: (node: INode) => node._babylonTransformNode,
        getPropertyName: [() => "isPickable"],
        type: "boolean",
    });
}

let _Registered = false;
/**
 * Registers the KHR_node_selectability glTF loader extension.
 * Safe to call multiple times; only the first call has an effect.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export function RegisterKHR_node_selectability(): void {
    if (_Registered) {
        return;
    }
    _Registered = true;

    _RegisterKHRNodeSelectabilityRuntime();

    unregisterGLTFExtension(NAME);

    registerGLTFExtension(NAME, true, (loader) => new KHR_node_selectability(loader));
}
