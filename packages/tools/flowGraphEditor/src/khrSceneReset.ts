import { type AbstractMesh } from "core/Meshes/abstractMesh";
import { type IKHRInteractivityImportResult } from "loaders/glTF/2.0/Extensions/KHR_interactivity.pure";

/**
 * Restore the initial values of KHR_node_visibility properties changed during preview.
 * Reimporting the file here would discard unsaved graph edits and invalidate its
 * import-scoped runtime services, so Reset restores these source values in place.
 * @param importResult The currently loaded KHR_interactivity asset, if any.
 */
export function RestoreKhrNodeVisibility(importResult: IKHRInteractivityImportResult | null): void {
    for (const node of importResult?.glTF.nodes ?? []) {
        const extension = node.extensions?.KHR_node_visibility;
        if (!extension) {
            continue;
        }
        // KHR_node_visibility defaults an omitted visible property to true.
        const visible = extension.visible === undefined ? true : extension.visible;
        if (typeof visible !== "boolean") {
            continue;
        }

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
