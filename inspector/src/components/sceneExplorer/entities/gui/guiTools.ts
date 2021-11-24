import { AdvancedDynamicTexture } from "babylonjs-gui/2D/advancedDynamicTexture";
import { Engine } from "babylonjs/Engines/engine";
import { Tools } from "babylonjs/Misc/tools";


declare var GUIEDITOR: any;
declare var BABYLON: any;

export class GUITools {
    private static guiEditor: any = null;
    /** Get the inspector from bundle or global */
    private static _getGlobalGUIEditor(): any {
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

    public static async EditAdvancedDynamicTexture(adt: AdvancedDynamicTexture) {
        if (!this.guiEditor) {
            if (typeof BABYLON !== 'undefined') {
                // we are in UMD environment
                this.guiEditor = this.guiEditor || this._getGlobalGUIEditor();
                if (typeof this.guiEditor == 'undefined') {
                    const editorUrl = `https://unpkg.com/babylonjs-gui-editor@${Engine.Version}/babylon.guiEditor.js`;;

                    // Load editor and add it to the DOM
                    try {
                        await Tools.LoadScriptAsync(editorUrl);
                        this.guiEditor = this.guiEditor || this._getGlobalGUIEditor();
                    } catch {
                        Tools.Error(`Failed to load GUI editor from ${editorUrl}`);
                    }
                }
            } else {
                // we are in ES6 environment
                try {
                    this.guiEditor = await import("@babylonjs/gui-editor");
                } catch {
                    Tools.Error("Failed to import @babylonjs/gui-editor. Please install the package if you want to use the GUI editor.");
                }
            }
        }
        this.guiEditor.GUIEditor.Show({liveGuiTexture: adt});
    }
}

