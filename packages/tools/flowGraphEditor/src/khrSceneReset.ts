import { type AbstractMesh } from "core/Meshes/abstractMesh";
import { type IKHRInteractivityImportResult } from "loaders/glTF/2.0/Extensions/KHR_interactivity.pure";

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
    for (const [index, node] of (importResult.glTF.nodes ?? []).entries()) {
        const visibility = node.extensions?.KHR_node_visibility;
        if (visibility) {
            // KHR_node_visibility defaults an omitted visible property to true.
            const visible = visibility.visible === undefined ? true : visibility.visible;
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
        if (selectability) {
            const selectable = selectability.selectable === undefined ? true : selectability.selectable;
            if (typeof selectable === "boolean") {
                // Use the import's converter so the same loader runtime state that
                // pointer/set changed is restored, even when the editor is bundled separately.
                const accessor = importResult.pathConverter.convert(`/nodes/${index}/extensions/KHR_node_selectability/selectable`);
                accessor.info.set?.(selectable, accessor.object);
            }
        }

        const hoverability = node.extensions?.KHR_node_hoverability;
        if (hoverability) {
            const hoverable = hoverability.hoverable === undefined ? true : hoverability.hoverable;
            if (typeof hoverable === "boolean") {
                const accessor = importResult.pathConverter.convert(`/nodes/${index}/extensions/KHR_node_hoverability/hoverable`);
                accessor.info.set?.(hoverable, accessor.object);
            }
        }
    }
}
