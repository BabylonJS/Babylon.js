import type { AdvancedDynamicTexture } from "gui/2D/advancedDynamicTexture";
import { Engine } from "core/Engines/engine";
import { Tools } from "core/Misc/tools";
import { GUIEditor } from "gui-editor/guiEditor";

declare let BABYLON: any;

let editorUrl = `${Tools._DefaultCdnUrl}/v${Engine.Version}/guiEditor/babylon.guiEditor.js`;
// eslint-disable-next-line @typescript-eslint/naming-convention
let guiEditorContainer: { GUIEditor: typeof GUIEditor };
/** Get the inspector from bundle or global
 * @internal
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
function _getGlobalGUIEditor(): { GUIEditor: typeof GUIEditor } | undefined {
    // UMD Global name detection from Webpack Bundle UMD Name.
    if (typeof GUIEditor !== "undefined") {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        return { GUIEditor };
    }

    // In case of module let's check the global emitted from the editor entry point.
    if (typeof BABYLON !== "undefined" && typeof BABYLON.GUIEditor !== "undefined") {
        return BABYLON;
    }

    return undefined;
}

/**
 * Used to pass in the gui-editor package.
 * @param guiEditorPackage
 */
export function InjectGUIEditor(guiEditorPackage: any) {
    guiEditorContainer = guiEditorPackage;
}

/**
 * Change the URL that the GUI editor loads from
 * @param guiEditorURL
 */
export function SetGUIEditorURL(guiEditorURL: string) {
    editorUrl = guiEditorURL;
}

/**
 * Opens an ADT in the GUI editor
 * if you are in an ES6 environment, you must first call InjectGUIEditor to provide the gui-editor package
 * If you are in a UMD environment, it will load the package from a URL
 * @param adt
 * @param embed defines whether editor is being opened from the Playground
 */
export async function EditAdvancedDynamicTexture(adt: AdvancedDynamicTexture, embed?: boolean) {
    guiEditorContainer = guiEditorContainer || _getGlobalGUIEditor();
    if (!guiEditorContainer) {
        if (typeof BABYLON !== "undefined") {
            // we are in UMD environment
            if (typeof guiEditorContainer === "undefined") {
                // Load editor and add it to the DOM
                try {
                    await Tools.LoadScriptAsync(editorUrl);
                    guiEditorContainer = guiEditorContainer || _getGlobalGUIEditor();
                } catch {
                    // eslint-disable-next-line no-throw-literal
                    throw `Failed to load GUI editor from ${editorUrl}`;
                }
            }
        } else {
            // we are in ES6 environment
            // eslint-disable-next-line no-throw-literal
            throw `Tried to call EditAdvancedDynamicTexture without first injecting the GUI editor. You need to call InjectGUIEditor() with a reference to @babylonjs/gui-editor. It can be imported at runtime using await import("@babylonjs/gui-editor").`;
        }
    }
    guiEditorContainer.GUIEditor.Show({ liveGuiTexture: adt }, embed);
}
