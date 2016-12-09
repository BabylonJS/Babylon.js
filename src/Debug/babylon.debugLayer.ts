module BABYLON {

    // declare INSPECTOR namespace for compilation issue
    declare var INSPECTOR : any;

    export class DebugLayer {
        private _scene: Scene;
        public static InspectorURL = 'http://www.babylonjs.com/babylon.inspector.bundle.js';
        // The inspector instance
        private _inspector : any;

        constructor(scene: Scene) {
            this._scene = scene;
        }

        /** Creates the inspector window. */
        private _createInspector() {
            if (!this._inspector) {
                this._inspector = new INSPECTOR.Inspector(this._scene);
            } // else nothing to do,; instance is already existing
        }
        
        public isVisible(): boolean {
            return false;
        }

        public hide() {
            if (this._inspector) {
                this._inspector.dispose();
                this._inspector = null;
            }
        }
        
        public show() {
            if (typeof INSPECTOR == 'undefined') {
                // Load inspector and add it to the DOM
                Tools.LoadScript(DebugLayer.InspectorURL, this._createInspector.bind(this));
            } else {
                // Otherwise creates the inspector
                this._createInspector();
            }
        }

    }
}
