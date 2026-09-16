import { type Mesh, type NodeGeometry, type Nullable, type Scene } from "core/index";

export function GetNodeGeometry(mesh: Mesh): Nullable<NodeGeometry> {
    return (mesh._internalMetadata?.nodeGeometry as NodeGeometry | undefined) ?? null;
}

export async function EditNodeGeometry(nodeGeometry: NodeGeometry, hostScene: Scene) {
    const { NodeGeometryEditor } = await import("node-geometry-editor/nodeGeometryEditor");
    NodeGeometryEditor.Show({ nodeGeometry, hostScene });
}
