import { AbstractMesh, Nullable, Scene } from "babylonjs";
import { Helpers } from "../helpers/Helpers";
import { Inspector } from "../Inspector";
import { AbstractTool } from "./AbstractTool";
import { guiLoaded } from "../properties_gui";

export class LabelTool extends AbstractTool {

    /** True if label are displayed, false otherwise */
    private _isDisplayed: boolean = false;
    private _advancedTexture: Nullable<any/*AdvancedDynamicTexture*/> = null;
    private _labelInitialized: boolean = false;
    private _scene: Nullable<Scene> = null;

    constructor(parent: HTMLElement, inspector: Inspector) {
        super('fa', 'fa-tags', parent, inspector, 'Display mesh names on the canvas');

        this._scene = inspector.scene;
    }

    public dispose() {

        if (this._advancedTexture) {
            this._advancedTexture.dispose();
        }
    }

    private _checkGUILoaded(): boolean {
        return guiLoaded;
    }

    private _initializeLabels() {

        // Can't initialize them if the GUI lib is not loaded yet
        if (!this._checkGUILoaded()) {
            return;
        }

        // Check if the label are already initialized and quit if it's the case
        if (this._labelInitialized || !this._scene) {
            return false;
        }
        // Create the canvas that will be used to display the labels
        this._advancedTexture = Inspector.GUIObject.AdvancedDynamicTexture.CreateFullscreenUI("UI");

        // Create label for all the Meshes, Lights and Cameras
        // Those that will be created/removed after this method is called will be taken care by the event handlers added below

        for (let m of this._scene.meshes) {
            this._createLabel(m, Inspector.GUIObject);
        }

        this._scene.onNewMeshAddedObservable.add((m) => {
            this._createLabel(m, Inspector.GUIObject);
        });

        this._scene.onMeshRemovedObservable.add((m) => {
            this._removeLabel(m);
        });

        this._labelInitialized = true;

        return true;
    }

    private _createLabel(mesh: AbstractMesh, GUI: any) {
        // Don't create label for "system nodes" (starting and ending with ###)
        let name = mesh.name;

        if (Helpers.IsSystemName(name)) {
            return;
        }

        if (mesh && this._advancedTexture) {
            let rect1 = new GUI.Rectangle();
            rect1.width = 4 + 10 * name.length + "px";
            rect1.height = "22px";
            rect1.background = "rgba(0,0,0,0.6)";
            rect1.color = "black";
            this._advancedTexture.addControl(rect1);

            let label = new GUI.TextBlock();
            label.text = name;
            label.fontSize = 12;
            rect1.addControl(label);

            rect1.linkWithMesh(mesh);
        }
    }

    private _removeLabel(mesh: AbstractMesh) {
        if (!this._advancedTexture) {
            return;
        }
        for (let g of this._advancedTexture._rootContainer.children) {
            let ed = g._linkedMesh;
            if (ed === mesh) {
                this._advancedTexture.removeControl(g);
                break;
            }
        }
    }

    // Action : Display/hide mesh names on the canvas
    public action() {
        // Don't toggle if the script is not loaded
        if (!this._checkGUILoaded()) {
            return;
        }

        // Toggle the label display state
        this._isDisplayed = !this._isDisplayed;

        // Check if we have to display the labels
        if (this._isDisplayed) {
            this._initializeLabels();
            if (this._advancedTexture) {
                this._advancedTexture._rootContainer.isVisible = true;
            }

        }

        // Or to hide them
        else {
            if (this._advancedTexture) {
                this._advancedTexture._rootContainer.isVisible = false;
            }
        }
    }
}
