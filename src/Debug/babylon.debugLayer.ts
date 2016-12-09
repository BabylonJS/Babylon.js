module BABYLON {

    // declare INSPECTOR namespace for compilation issue
    declare var INSPECTOR : any;

    export class DebugLayer {
        private _scene: Scene;
        public static InspectorURL = 'http://www.babylonjs.com/inspector.js'

        constructor(scene: Scene) {
            this._scene = scene;
        }

        /** Creates the inspector window. */
        private _createInspector() {
            new INSPECTOR.Inspector(this._scene);
        }
        
        public isVisible(): boolean {
            return false;
        }

        public hide() {
            console.warn('')
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
