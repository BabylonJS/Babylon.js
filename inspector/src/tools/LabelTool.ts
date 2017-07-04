module INSPECTOR {
     
    export class LabelTool extends AbstractTool {

        /** True if label are displayed, false otherwise */
        private _isDisplayed         : boolean            = false;
        private _advancedTexture     : BABYLON.GUI.AdvancedDynamicTexture = null;
        private _labelInitialized    : boolean = false;
        private _scene               : BABYLON.Scene = null;
        private _guiLoaded      : boolean = false;
        
        constructor(parent:HTMLElement, inspector:Inspector) {
            super('fa-tags', parent, inspector, 'Display mesh names on the canvas');

            this._scene = inspector.scene;
        }

        public dispose() {

            if(this._advancedTexture){
                this._advancedTexture.dispose();
            }
        }

        private _checkGUILoaded(): boolean {
            if (this._guiLoaded === true) {
                return true;
            }
            if (BABYLON.GUI) {
                this._guiLoaded = true;
            }
            return this._guiLoaded;
        }

        private _initializeLabels() {
            // Check if the label are already initialized and quit if it's the case
            if (this._labelInitialized) {
                return;
            }

            // Can't initialize them if the GUI lib is not loaded yet
            if (!this._checkGUILoaded()) {
                return;
            }

            // Create the canvas that will be used to display the labels
            this._advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");

            // Create label for all the Meshes, Lights and Cameras
            // Those that will be created/removed after this method is called will be taken care by the event handlers added below

            for (let m of this._scene.meshes) {
                this._createLabel(m);
            }
            
            this._scene.onNewMeshAddedObservable.add((m, s) => {
                this._createLabel(m);
            });

            this._scene.onMeshRemovedObservable.add((m, s) => {
                this._removeLabel(m);
            });

            this._labelInitialized = true;
        }

        private _createLabel(mesh: BABYLON.AbstractMesh){
            // Don't create label for "system nodes" (starting and ending with ###)
            let name = mesh.name;

            if (Helpers.IsSystemName(name)) {
                return;
            }

            if(mesh){
                let rect1 = new BABYLON.GUI.Rectangle();
                rect1.width = 4 + 10 * name.length + "px";
                rect1.height = "22px";
                rect1.background = "rgba(0,0,0,0.6)";
                rect1.color = "black";
                this._advancedTexture.addControl(rect1);

                let label = new BABYLON.GUI.TextBlock();
                label.text = name;
                label.fontSize = 12;
                rect1.addControl(label);

                rect1.linkWithMesh(mesh); 
            }
        }

        private _removeLabel(mesh: BABYLON.AbstractMesh) {
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
                this._advancedTexture._rootContainer.isVisible = true;
            } 
            
            // Or to hide them
            else {
                this._advancedTexture._rootContainer.isVisible = false;
            }
        }
    }
}