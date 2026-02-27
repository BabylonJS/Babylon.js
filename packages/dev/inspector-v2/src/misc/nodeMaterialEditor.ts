import type { NodeMaterial } from "core/index";

export async function EditNodeMaterial(material: NodeMaterial) {
    // TODO: Figure out how to get all the various build steps to work with this.
    //       See the initial attempt here: https://github.com/BabylonJS/Babylon.js/pull/17646
    // const { NodeEditor } = await import("node-editor/nodeEditor");
    // NodeEditor.Show({ nodeMaterial: material });
    await material.edit({ nodeEditorConfig: { backgroundColor: material.getScene().clearColor } });
}
