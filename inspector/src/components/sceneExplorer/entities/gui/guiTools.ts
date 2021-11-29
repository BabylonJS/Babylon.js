import { AdvancedDynamicTexture } from "babylonjs-gui/2D/advancedDynamicTexture";
import { Engine } from "babylonjs/Engines/engine";
import { Tools } from "babylonjs/Misc/tools";

declare var GUIEDITOR: any;
declare var BABYLON: any;

let guiEditor: any = null;
/** Get the inspector from bundle or global */
function _getGlobalGUIEditor(): any {
    // UMD Global name detection from Webpack Bundle UMD Name.
    if (typeof GUIEDITOR !== 'undefined') {
        return GUIEDITOR;
    }

    // In case of module let's check the global emitted from the editor entry point.
    if (typeof BABYLON !== 'undefined' && typeof BABYLON.GUIEditor !== 'undefined') {
        return BABYLON;
    }

    return undefined;
}

export async function EditAdvancedDynamicTexture(adt: AdvancedDynamicTexture) {
    if (!guiEditor) {
        if (typeof BABYLON !== 'undefined') {
            // we are in UMD environment
            guiEditor = guiEditor || _getGlobalGUIEditor();
            if (typeof guiEditor == 'undefined') {
                const editorUrl = `https://unpkg.com/babylonjs-gui-editor@${Engine.Version}/babylon.guiEditor.js`;;

                // Load editor and add it to the DOM
                try {
                    await Tools.LoadScriptAsync(editorUrl);
                    guiEditor = guiEditor || _getGlobalGUIEditor();
                } catch {
                    Tools.Error(`Failed to load GUI editor from ${editorUrl}`);
                }
            }
        } else {
            // we are in ES6 environment
            try {
                guiEditor = await import("@babylonjs/gui-editor");
            } catch {
                Tools.Error("Failed to import @babylonjs/gui-editor. Please install the package if you want to use the GUI editor.");
            }
        }
    }
    guiEditor.GUIEditor.Show({liveGuiTexture: adt});
}