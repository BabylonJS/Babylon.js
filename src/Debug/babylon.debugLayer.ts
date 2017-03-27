module BABYLON {

    // declare INSPECTOR namespace for compilation issue
    declare var INSPECTOR: any;

    export class DebugLayer {
        private _scene: Scene;
        public static InspectorURL = 'http://www.babylonjs.com/babylon.inspector.bundle.js';
        // The inspector instance
        private _inspector: any;

        constructor(scene: Scene) {
            this._scene = scene;
        }

        /** Creates the inspector window. */
        private _createInspector(config: { popup?: boolean, initialTab?: number, parentElement?: HTMLElement } = {}) {
            let popup = config.popup || false;
            let initialTab = config.initialTab || 0;
            let parentElement = config.parentElement || null;
            if (!this._inspector) {
                this._inspector = new INSPECTOR.Inspector(this._scene, popup, initialTab, parentElement);
            } // else nothing to do,; instance is already existing
        }

        public isVisible(): boolean {
            if (!this._inspector) {
                return false;
            }
            return true;
        }

        public hide() {
            if (this._inspector) {
                this._inspector.dispose();
                this._inspector = null;
            }
        }

        public show(config: { popup?: boolean, initialTab?: number, parentElement?: HTMLElement } = {}) {
            if (typeof INSPECTOR == 'undefined') {
                // Load inspector and add it to the DOM
                Tools.LoadScript(DebugLayer.InspectorURL, this._createInspector.bind(this, config));
            } else {
                // Otherwise creates the inspector
                this._createInspector(config);
            }
        }

    }
}
