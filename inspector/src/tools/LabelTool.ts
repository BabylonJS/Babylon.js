module INSPECTOR {
     
    export class LabelTool extends AbstractTool {

        /** True if label are displayed, false otherwise */
        private _isDisplayed         : boolean            = false;
        private _canvas              : BABYLON.ScreenSpaceCanvas2D = null;
        private _labelInitialized    : boolean = false;
        private _scene               : BABYLON.Scene = null;
        private _canvas2DLoaded      : boolean = false;

        private _newMeshObserver       : BABYLON.Observer<BABYLON.AbstractMesh> = null;
        private _removedMeshObserver   : BABYLON.Observer<BABYLON.AbstractMesh> = null;
        private _newLightObserver      : BABYLON.Observer<BABYLON.Light> = null;
        private _removedLightObserver  : BABYLON.Observer<BABYLON.Light> = null;
        private _newCameraObserver     : BABYLON.Observer<BABYLON.Camera> = null;
        private _removedCameraObserver : BABYLON.Observer<BABYLON.Camera> = null;
        
        constructor(parent:HTMLElement, inspector:Inspector) {
            super('fa-tags', parent, inspector, 'Display mesh names on the canvas');

            this._scene = inspector.scene;
        }

        public dispose() {
            if (this._newMeshObserver) {
                this._scene.onNewMeshAddedObservable.remove(this._newMeshObserver);
                this._scene.onMeshRemovedObservable.remove (this._removedMeshObserver);

                this._scene.onNewLightAddedObservable.remove(this._newLightObserver);
                this._scene.onLightRemovedObservable.remove (this._removedLightObserver);

                this._scene.onNewCameraAddedObservable.remove(this._newCameraObserver);
                this._scene.onCameraRemovedObservable.remove (this._removedCameraObserver);
    
                this._newMeshObserver = this._newLightObserver = this._newCameraObserver = this._removedMeshObserver = this._removedLightObserver = this._removedCameraObserver = null;
            }

            this._canvas.dispose();
            this._canvas = null;
        }

        private _checkC2DLoaded(): boolean {
            if (this._canvas2DLoaded === true) {
                return true;
            }
            if (BABYLON.Canvas2D) {
                this._canvas2DLoaded = true;
            }
            return this._canvas2DLoaded;
        }

        private _initializeLabels() {
            // Check if the label are already initialized and quit if it's the case
            if (this._labelInitialized) {
                return;
            }

            // Can't initialize them if the Canvas2D lib is not loaded yet
            if (!this._checkC2DLoaded()) {
                return;
            }

            // Create the canvas that will be used to display the labels
            this._canvas = new BABYLON.ScreenSpaceCanvas2D(this._scene, {id: "###Label Canvas###"/*, cachingStrategy: BABYLON.Canvas2D.CACHESTRATEGY_TOPLEVELGROUPS*/});

            // Create label for all the Meshes, Lights and Cameras
            // Those that will be created/removed after this method is called will be taken care by the event handlers added below

            for (let m of this._scene.meshes) {
                this._createLabel(m);
            }

            for (let l of this._scene.lights) {
                this._createLabel(l);
            }

            for (let c of this._scene.cameras) {
                this._createLabel(c);
            }

            // Add handlers for new/removed meshes, camera and lights

            this._newMeshObserver = this._scene.onNewMeshAddedObservable.add((e, s) => {
                this._createLabel(e);
            });

            this._removedMeshObserver = this._scene.onMeshRemovedObservable.add((e, s) => {
                this._removeLabel(e);
            });

            this._newLightObserver = this._scene.onNewLightAddedObservable.add((e, s) => {
                this._createLabel(e);
            });

            this._removedLightObserver = this._scene.onLightRemovedObservable.add((e, s) => {
                this._removeLabel(e);
            });

            this._newCameraObserver = this._scene.onNewCameraAddedObservable.add((e, s) => {
                this._createLabel(e);
            });

            this._removedCameraObserver = this._scene.onCameraRemovedObservable.add((e, s) => {
                this._removeLabel(e);
            });
            
            this._labelInitialized = true;
        }

        private _createLabel(node: BABYLON.Node): BABYLON.Group2D {
            // Don't create label for "system nodes" (starting and ending with ###)
            let name = node.name;

            if (Helpers.IsSystemName(name)) {
                return;
            }

            let labelGroup = new BABYLON.Group2D({ parent: this._canvas, id: `Label of ${node.name}`, trackNode: node, origin: BABYLON.Vector2.Zero(), 
            children: [
                    new BABYLON.Rectangle2D({ id: "LabelRect", x: 0, y: 0, width: 100, height: 30, origin: BABYLON.Vector2.Zero(), border: "#FFFFFFFF", fill: "#808080B0", children: [
                            new BABYLON.Text2D(node.name, { x: 10, y: 4, fontName: "bold 16px Arial", fontSignedDistanceField: true })
                        ]
                    })
                ]}
            );

            let r = labelGroup.children[0] as BABYLON.Rectangle2D;
            let t = r.children[0] as BABYLON.Text2D;
            let ts = t.textSize.width;
            r.width = ts + 20;
            r.height = t.textSize.height + 12;

            labelGroup.addExternalData("owner", node);

            return labelGroup;
        }

        private _removeLabel(node: BABYLON.Node) {
            for (let g of this._canvas.children) {
                let ed = g.getExternalData("owner");
                if (ed === node) {
                    g.dispose();
                    break;
                }
            }
        }

        // Action : Display/hide mesh names on the canvas
        public action() {
            // Don't toggle if the script is not loaded
            if (!this._checkC2DLoaded()) {
                return;
            }

            // Toggle the label display state
            this._isDisplayed = !this._isDisplayed;

            // Check if we have to display the labels
            if (this._isDisplayed) {
                this._initializeLabels();
                this._canvas.levelVisible = true;
            } 
            
            // Or to hide them
            else {
                this._canvas.levelVisible = false;
            }
        }
    }
}