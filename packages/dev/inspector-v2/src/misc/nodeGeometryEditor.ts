import type { Mesh, NodeGeometry, Nullable, Scene } from "core/index";

export function GetNodeGeometry(mesh: Mesh): Nullable<NodeGeometry> {
    return (mesh._internalMetadata?.nodeGeometry as NodeGeometry | undefined) ?? null;
}

export async function EditNodeGeometry(nodeGeometry: NodeGeometry, hostScene: Scene) {
    // TODO: Figure out how to get all the various build steps to work with this.
    //       See the initial attempt here: https://github.com/BabylonJS/Babylon.js/pull/17646
    // const { NodeGeometryEditor } = await import("node-geometry-editor/nodeGeometryEditor");
    // NodeGeometryEditor.Show({ nodeGeometry: nodeGeometry, hostScene: mesh.getScene() });
    await nodeGeometry.edit({ nodeGeometryEditorConfig: { hostScene } });
}
