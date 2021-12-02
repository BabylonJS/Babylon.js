import { AdvancedDynamicTexture } from "babylonjs-gui/2D/advancedDynamicTexture";
import { Engine } from "babylonjs/Engines/engine";
import { Tools } from "babylonjs/Misc/tools";

declare var GUIEDITOR: any;
declare var BABYLON: any;

let editorUrl = `https://unpkg.com/babylonjs-gui-editor@${Engine.Version}/babylon.guiEditor.js`;
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

/** Change the URL that the GUI editor loads from */
export function SetGUIEditorURL(guiEditorURL: string) {
    editorUrl = guiEditorURL;
}

/**
 * Opens an ADT in the GUI editor
 * if you are in an ES6 environment, you must first call InjectGUIEditor to provide the gui-editor package
 * If you are in a UMD environment, it will load the package from a URL
*/
export async function EditAdvancedDynamicTexture(adt: AdvancedDynamicTexture) {
    if (!guiEditor) {
        if (typeof BABYLON !== 'undefined') {
            // we are in UMD environment
            guiEditor = guiEditor || _getGlobalGUIEditor();
            if (typeof guiEditor === 'undefined') {
                // Load editor and add it to the DOM
                try {
                    await Tools.LoadScriptAsync(editorUrl);
                    guiEditor = guiEditor || _getGlobalGUIEditor();
                } catch {
                    throw `Failed to load GUI editor from ${editorUrl}`;
                }
            }
        } else {
            // we are in ES6 environment
            throw `Tried to call EditAdvancedDynamicTexture without first injecting the GUI editor. You need to call InjectGUIEditor() with a reference to @babylonjs/gui-editor. It can be imported at runtime using await import("@babylonjs/gui-editor").`;
        }
    }
    guiEditor.GUIEditor.Show({liveGuiTexture: adt});
}