import { type AdvancedDynamicTexture } from "gui/2D/advancedDynamicTexture";

/**
 * Opens the GUI editor for the specified AdvancedDynamicTexture.
 * @param texture the AdvancedDynamicTexture to edit
 */
export async function EditAdvancedDynamicTextureAsync(texture: AdvancedDynamicTexture): Promise<void> {
    const { GUIEditor } = await import("gui-editor/guiEditor");
    await GUIEditor.Show({ liveGuiTexture: texture });
}
