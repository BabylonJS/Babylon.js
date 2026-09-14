import { type AbstractMesh } from "core/Meshes/abstractMesh.pure";
import { type INode } from "../../glTFLoaderInterfaces";

type InteractivityNodeState = "hoverable" | "selectable";

const _NodeSets = /*#__PURE__*/ new WeakMap<INode, readonly INode[]>();
const _Hoverable = /*#__PURE__*/ new WeakMap<INode, boolean>();
const _Selectable = /*#__PURE__*/ new WeakMap<INode, boolean>();

function _GetStateMap(state: InteractivityNodeState): WeakMap<INode, boolean> {
    return state === "selectable" ? _Selectable : _Hoverable;
}

function _GetLocalState(node: INode, state: InteractivityNodeState): boolean {
    return _GetStateMap(state).get(node) ?? true;
}

function _GetEffectiveState(node: INode, state: InteractivityNodeState): boolean {
    let current: INode | undefined = node;
    while (current) {
        if (!_GetLocalState(current, state)) {
            return false;
        }
        current = current.parent;
    }
    return true;
}

function _ApplyMeshState(mesh: AbstractMesh, state: InteractivityNodeState, value: boolean): void {
    if (state === "selectable") {
        mesh.isPickable = value;
    } else {
        mesh._isPointerMovePickable = value;
    }
}

function _ApplyNodeState(node: INode, state: InteractivityNodeState): void {
    const effective = _GetEffectiveState(node, state);
    const meshes = node._primitiveBabylonMeshes ?? [];
    for (const mesh of meshes) {
        _ApplyMeshState(mesh, state, effective);
    }
    const transformNode = node._babylonTransformNode;
    if (transformNode && "isPickable" in transformNode) {
        _ApplyMeshState(transformNode as AbstractMesh, state, effective);
    }
}

function _IsDescendantNode(node: INode, ancestor: INode): boolean {
    let current: INode | undefined = node;
    while (current) {
        if (current === ancestor) {
            return true;
        }
        current = current.parent;
    }
    return false;
}

/**
 * Initializes authored and inherited selectability or hoverability state.
 * @param nodes all nodes in the glTF asset
 * @param state state kind to initialize
 * @param getAuthoredState reads the extension-authored local state
 */
export function InitializeInteractivityNodeState(nodes: readonly INode[], state: InteractivityNodeState, getAuthoredState: (node: INode) => boolean | undefined): void {
    const stateMap = _GetStateMap(state);
    for (const node of nodes) {
        _NodeSets.set(node, nodes);
        stateMap.set(node, getAuthoredState(node) ?? true);
    }
    for (const node of nodes) {
        _ApplyNodeState(node, state);
    }
}

/**
 * Gets the locally authored runtime state for a node.
 * @param node glTF node
 * @param state state kind
 * @returns local state, defaulting to true
 */
export function GetInteractivityNodeState(node: INode, state: InteractivityNodeState): boolean {
    return _GetLocalState(node, state);
}

/**
 * Updates local state and reapplies inherited state to the affected subtree.
 * @param node glTF node
 * @param state state kind
 * @param value new local state
 */
export function SetInteractivityNodeState(node: INode, state: InteractivityNodeState, value: boolean): void {
    _GetStateMap(state).set(node, value);
    const nodes = _NodeSets.get(node) ?? [node];
    for (const candidate of nodes) {
        if (_IsDescendantNode(candidate, node)) {
            _ApplyNodeState(candidate, state);
        }
    }
}
