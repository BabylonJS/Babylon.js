import { type GLTFLoader } from "../glTFLoader.pure";
import { type IGLTFLoaderExtension } from "../glTFLoaderExtension";
import { registerGLTFExtension, unregisterGLTFExtension } from "../glTFLoaderExtensionRegistry";
import { FlowGraphBlockNames } from "core/FlowGraph/Blocks/flowGraphBlockNames";
import { addNewInteractivityFlowGraphMapping } from "./KHR_interactivity/declarationMapper";
import { type INode } from "../glTFLoaderInterfaces";
import { AddObjectAccessorToKey } from "./objectModelMapping";
import { GetInteractivityNodeState, InitializeInteractivityNodeState, SetInteractivityNodeState } from "./KHR_interactivity/interactivityNodeState";
import { FlowGraphTypes } from "core/FlowGraph/flowGraphRichTypes.pure";

const NAME = "KHR_node_hoverability";

// interactivity
const MeshPointerOverPrefix = "targetMeshPointerOver_";

const MeshPointerOutPrefix = "targetMeshPointerOut_";

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
        InitializeInteractivityNodeState(this._loader.gltf.nodes ?? [], "hoverable", (node) => node.extensions?.KHR_node_hoverability?.hoverable);
    }

    public dispose() {
        (this._loader as any) = null;
    }
}

let _RuntimeRegistered = false;
/**
 * @internal
 * Registers KHR_node_hoverability runtime dependencies without changing the extension registry.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export function _RegisterKHRNodeHoverabilityRuntime(): void {
    if (_RuntimeRegistered) {
        return;
    }
    _RuntimeRegistered = true;

    addNewInteractivityFlowGraphMapping("event/onHoverIn", NAME, {
        // using GetVariable as the nodeIndex is a configuration and not a value (i.e. it's not mutable)
        blocks: [
            FlowGraphBlockNames.PointerOverEvent,
            FlowGraphBlockNames.GetVariable,
            FlowGraphBlockNames.IndexOf,
            "KHR_interactivity/FlowGraphGLTFDataProvider",
            "KHR_interactivity/FlowGraphEventReferenceBlock",
        ],
        declarationSchema: {
            inputValueSockets: {},
            outputValueSockets: {
                hoveredNode: "ref",
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
                    return MeshPointerOverPrefix + data;
                },
            },
        },
        outputs: {
            values: {
                hoverNodeIndex: { name: "index", toBlock: FlowGraphBlockNames.IndexOf },
                hoveredNode: { name: "nodeReference", toBlock: "KHR_interactivity/FlowGraphEventReferenceBlock" },
                controllerIndex: { name: "controllerIndex", toBlock: "KHR_interactivity/FlowGraphEventReferenceBlock" },
                event: { name: "value", toBlock: "KHR_interactivity/FlowGraphEventReferenceBlock" },
            },
            flows: {
                out: { name: "out", toBlock: "KHR_interactivity/FlowGraphEventReferenceBlock" },
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
            {
                input: "node",
                output: "meshUnderPointer",
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
            const variableName = validNodeIndex ? MeshPointerOverPrefix + nodeIndex : MeshPointerOverPrefix + "unbound";
            // find the nodeIndex value
            serializedObjects[1].config.variable = variableName;
            context._userVariables[variableName] = validNodeIndex
                ? {
                      className: "Mesh",
                      id: globalGLTF?.nodes?.[nodeIndex]._babylonTransformNode?.id,
                      uniqueId: globalGLTF?.nodes?.[nodeIndex]._babylonTransformNode?.uniqueId,
                  }
                : { type: FlowGraphTypes.Any, value: [{}] };
            const eventKey = `${NAME}:event/onHoverIn:${nodeIndex}`;
            serializedObjects[0].config.eventKey = eventKey;
            serializedObjects[4].config.eventKey = eventKey;
            return serializedObjects;
        },
    });

    addNewInteractivityFlowGraphMapping("event/onHoverOut", NAME, {
        // using GetVariable as the nodeIndex is a configuration and not a value (i.e. it's not mutable)
        blocks: [
            FlowGraphBlockNames.PointerOutEvent,
            FlowGraphBlockNames.GetVariable,
            FlowGraphBlockNames.IndexOf,
            "KHR_interactivity/FlowGraphGLTFDataProvider",
            "KHR_interactivity/FlowGraphEventReferenceBlock",
        ],
        declarationSchema: {
            inputValueSockets: {},
            outputValueSockets: {
                hoveredNode: "ref",
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
                    return MeshPointerOutPrefix + data;
                },
            },
        },
        outputs: {
            values: {
                hoverNodeIndex: { name: "index", toBlock: FlowGraphBlockNames.IndexOf },
                hoveredNode: { name: "nodeReference", toBlock: "KHR_interactivity/FlowGraphEventReferenceBlock" },
                controllerIndex: { name: "controllerIndex", toBlock: "KHR_interactivity/FlowGraphEventReferenceBlock" },
                event: { name: "value", toBlock: "KHR_interactivity/FlowGraphEventReferenceBlock" },
            },
            flows: {
                out: { name: "out", toBlock: "KHR_interactivity/FlowGraphEventReferenceBlock" },
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
            {
                input: "node",
                output: "meshOutOfPointer",
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
                input: "in",
                output: "done",
                inputBlockIndex: 4,
                outputBlockIndex: 0,
            },
        ],
        extraProcessor(gltfBlock, _declaration, _mapping, _arrays, serializedObjects, context, globalGLTF) {
            const nodeIndex = gltfBlock.configuration?.["nodeIndex"]?.value?.[0];
            const validNodeIndex = typeof nodeIndex === "number" && Number.isInteger(nodeIndex) && nodeIndex >= 0 && nodeIndex < (globalGLTF?.nodes?.length ?? 0);
            const variableName = validNodeIndex ? MeshPointerOutPrefix + nodeIndex : MeshPointerOutPrefix + "unbound";
            // find the nodeIndex value
            serializedObjects[1].config.variable = variableName;
            context._userVariables[variableName] = validNodeIndex
                ? {
                      className: "Mesh",
                      id: globalGLTF?.nodes?.[nodeIndex]._babylonTransformNode?.id,
                      uniqueId: globalGLTF?.nodes?.[nodeIndex]._babylonTransformNode?.uniqueId,
                  }
                : { type: FlowGraphTypes.Any, value: [{}] };
            const eventKey = `${NAME}:event/onHoverOut:${nodeIndex}`;
            serializedObjects[0].config.eventKey = eventKey;
            serializedObjects[4].config.eventKey = eventKey;
            return serializedObjects;
        },
    });

    AddObjectAccessorToKey("/nodes/{}/extensions/KHR_node_hoverability/hoverable", {
        get: (node: INode) => {
            return GetInteractivityNodeState(node, "hoverable");
        },
        set: (value: boolean, node: INode) => {
            SetInteractivityNodeState(node, "hoverable", value);
        },
        getTarget: (node: INode) => node._babylonTransformNode,
        getPropertyName: [() => "pointerOverDisableMeshTesting"],
        type: "boolean",
    });
}

let _Registered = false;
/**
 * Registers the KHR_node_hoverability glTF loader extension.
 * Safe to call multiple times; only the first call has an effect.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export function RegisterKHR_node_hoverability(): void {
    if (_Registered) {
        return;
    }
    _Registered = true;

    _RegisterKHRNodeHoverabilityRuntime();

    unregisterGLTFExtension(NAME);

    registerGLTFExtension(NAME, true, (loader) => new KHR_node_hoverability(loader));
}
