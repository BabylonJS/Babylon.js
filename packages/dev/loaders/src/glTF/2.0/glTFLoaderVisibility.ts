import { type INode } from "./glTFLoaderInterfaces";

/** @internal */
export function InitializeNodeVisibility(nodes: INode[], extensionEnabled: boolean): void {
    for (const node of nodes) {
        node._visibility = {
            local: node.visible ?? (extensionEnabled ? node.extensions?.KHR_node_visibility?.visible : undefined) ?? true,
            effective: true,
            children: [],
            hiddenNodes: new Map(),
            hiddenLights: new Map(),
        };
    }
    for (const node of nodes) {
        node.parent?._visibility?.children.push(node);
    }
    for (const node of nodes) {
        if (!node.parent?._visibility) {
            UpdateNodeVisibility(node, true);
        }
    }
}

/** @internal */
export function SetNodeVisibility(node: INode, visible: boolean): void {
    if (!node._visibility) {
        throw new Error("Node visibility has not been initialized.");
    }
    node._visibility.local = visible;
    UpdateNodeVisibility(node, node.parent?._visibility?.effective ?? true);
}

function UpdateNodeVisibility(node: INode, parentVisible: boolean): void {
    const updates: { node: INode; visible: boolean }[] = [];
    // Capture descendants before hiding ancestors, since their visibility may be inherited.
    const collect = (current: INode, ancestorVisible: boolean) => {
        const state = current._visibility!;
        const visible = ancestorVisible && state.local;
        if (visible !== state.effective) {
            updates.push({ node: current, visible });
            if (!visible) {
                for (const target of [current._babylonTransformNode, current._babylonTransformNodeForSkin, ...(current._primitiveBabylonMeshes ?? [])]) {
                    if (target && !state.hiddenNodes.has(target)) {
                        const inherited = target.inheritVisibility;
                        target.inheritVisibility = false;
                        try {
                            state.hiddenNodes.set(target, target.isVisible);
                        } finally {
                            target.inheritVisibility = inherited;
                        }
                    }
                }
                for (const light of current._babylonLights ?? []) {
                    state.hiddenLights.set(light, light.isEnabled(false));
                }
            }
        }
        for (const child of state.children) {
            collect(child, visible);
        }
    };
    collect(node, parentVisible);

    for (const update of updates) {
        const state = update.node._visibility!;
        state.effective = update.visible;
        for (const [target, wasVisible] of state.hiddenNodes) {
            target.isVisible = update.visible ? wasVisible : false;
        }
        for (const [light, wasEnabled] of state.hiddenLights) {
            light.setEnabled(update.visible ? wasEnabled : false);
        }
        if (update.visible) {
            state.hiddenNodes.clear();
            state.hiddenLights.clear();
        }
    }
}
