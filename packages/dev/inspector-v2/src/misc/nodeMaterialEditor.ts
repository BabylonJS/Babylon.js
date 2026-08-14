import { type NodeMaterial } from "core/index";

/**
 * Opens the node material editor for the specified NodeMaterial.
 * @param material the NodeMaterial to edit
 */
export async function EditNodeMaterial(material: NodeMaterial) {
    const { NodeEditor } = await import("node-editor/nodeEditor");
    NodeEditor.Show({ nodeMaterial: material, backgroundColor: material.getScene().clearColor });
}
