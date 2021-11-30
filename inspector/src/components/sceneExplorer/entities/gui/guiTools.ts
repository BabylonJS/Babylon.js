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

/** Used to pass in the gui-editor package. */
export function InjectGUIEditor(guiEditorPackage: any) {
    guiEditor = guiEditorPackage;
}

/**
 * Opens an ADT in the GUI editor
 * if you are in an ES6 environment, you must first call InjectGUIEditor to provide the gui-editor package
 * If you are in a UMD environment, you have the option to load the editor from a custom URL, or use the default (unpkg CDN) 
*/
export async function EditAdvancedDynamicTexture(adt: AdvancedDynamicTexture, customEditorURL?: string) {
    if (!guiEditor) {
        if (typeof BABYLON !== 'undefined') {
            // we are in UMD environment
            guiEditor = guiEditor || _getGlobalGUIEditor();
            if (typeof guiEditor == 'undefined') {
                const editorUrl = customEditorURL || `https://unpkg.com/babylonjs-gui-editor@${Engine.Version}/babylon.guiEditor.js`;;

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
            Tools.Error(`Tried to call EditAdvancedDynamicTexture without first injecting the GUI editor. You need to call InjectGUIEditor() with a reference to @babylonjs/gui-editor. It can be imported at runtime using await import("@babylonjs/gui-editor").`);
        }
    }
    guiEditor.GUIEditor.Show({liveGuiTexture: adt});
}