import { type AbstractMesh } from "core/Meshes/abstractMesh";
import { type IKHRInteractivityImportResult } from "loaders/glTF/2.0/Extensions/KHR_interactivity.pure";

type KhrNodeProperty = "visible" | "selectable" | "hoverable";
type TrackedKhrImportResult = IKHRInteractivityImportResult & { mutatedNodeProperties?: Map<number, Set<KhrNodeProperty>> };

/**
 * Track concrete node properties written by imported pointer operations. A graph may target
 * an optional KHR property even when its node has no extension object in the source glTF.
 * @param importResult The import whose editor graph is about to be parsed.
 */
export function TrackKhrNodeStateMutations(importResult: IKHRInteractivityImportResult): void {
    const tracked = importResult as TrackedKhrImportResult;
    if (tracked.mutatedNodeProperties) {
        return;
    }
    const mutations = new Map<number, Set<KhrNodeProperty>>();
    tracked.mutatedNodeProperties = mutations;
    const convert = importResult.pathConverter.convert.bind(importResult.pathConverter);
    importResult.pathConverter.convert = (path) => {
        const accessor = convert(path);
        const match = /^\/nodes\/(0|[1-9]\d*)\/extensions\/KHR_node_(visibility\/visible|selectability\/selectable|hoverability\/hoverable)$/.exec(path);
        if (!match || !accessor.info.set) {
            return accessor;
        }
        const index = Number(match[1]);
        const property = match[2].split("/")[1] as KhrNodeProperty;
        const set = accessor.info.set;
        return {
            ...accessor,
            info: {
                ...accessor.info,
                set: (value, target, arrayIndex, payload) => {
                    set(value, target, arrayIndex, payload);
                    const properties = mutations.get(index) ?? new Set<KhrNodeProperty>();
                    properties.add(property);
                    mutations.set(index, properties);
                },
            },
        };
    };
}

/**
 * Restore the initial values of KHR node properties changed during preview.
 * Reimporting the file here would discard unsaved graph edits and invalidate its
 * import-scoped runtime services, so Reset restores these source values in place.
 * @param importResult The currently loaded KHR_interactivity asset, if any.
 */
export function RestoreKhrNodeState(importResult: IKHRInteractivityImportResult | null): void {
    if (!importResult) {
        return;
    }
    const mutations = (importResult as TrackedKhrImportResult).mutatedNodeProperties;
    for (const [index, node] of (importResult.glTF.nodes ?? []).entries()) {
        const changed = mutations?.get(index);
        const visibility = node.extensions?.KHR_node_visibility;
        if (visibility || changed?.has("visible")) {
            // KHR_node_visibility defaults an omitted visible property to true.
            const visible = visibility?.visible === undefined ? true : visibility.visible;
            if (typeof visible === "boolean") {
                const transform = node._babylonTransformNode as AbstractMesh | undefined;
                if (transform) {
                    transform.inheritVisibility = true;
                    transform.isVisible = visible;
                }
                node._primitiveBabylonMeshes?.forEach((mesh) => {
                    mesh.inheritVisibility = true;
                    mesh.isVisible = visible;
                });
            }
        }

        const selectability = node.extensions?.KHR_node_selectability;
        if (selectability || changed?.has("selectable")) {
            const selectable = selectability?.selectable === undefined ? true : selectability.selectable;
            if (typeof selectable === "boolean") {
                // Use the import's converter so the same loader runtime state that
                // pointer/set changed is restored, even when the editor is bundled separately.
                const accessor = importResult.pathConverter.convert(`/nodes/${index}/extensions/KHR_node_selectability/selectable`);
                accessor.info.set?.(selectable, accessor.object);
            }
        }

        const hoverability = node.extensions?.KHR_node_hoverability;
        if (hoverability || changed?.has("hoverable")) {
            const hoverable = hoverability?.hoverable === undefined ? true : hoverability.hoverable;
            if (typeof hoverable === "boolean") {
                const accessor = importResult.pathConverter.convert(`/nodes/${index}/extensions/KHR_node_hoverability/hoverable`);
                accessor.info.set?.(hoverable, accessor.object);
            }
        }
    }
    mutations?.clear();
}
