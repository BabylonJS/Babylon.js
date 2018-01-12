module BABYLON {

    // declare INSPECTOR namespace for compilation issue
    declare var INSPECTOR: any;
    // load the inspector using require, if not present in the global namespace.

    export class DebugLayer {
        private _scene: Scene;
        public static InspectorURL = 'https://preview.babylonjs.com/inspector/babylon.inspector.bundle.js';
        // The inspector instance
        private _inspector: any;

        private BJSINSPECTOR = typeof INSPECTOR !== 'undefined' ? INSPECTOR : undefined;

        constructor(scene: Scene) {
            this._scene = scene;
            // load inspector using require, if it doesn't exist on the global namespace.

        }

        /** Creates the inspector window. */
        private _createInspector(config: {
            popup?: boolean,
            initialTab?: number,
            parentElement?: HTMLElement,
            newColors?: {
                backgroundColor?: string,
                backgroundColorLighter?: string,
                backgroundColorLighter2?: string,
                backgroundColorLighter3?: string,
                color?: string,
                colorTop?: string,
                colorBot?: string
            }
        } = {}) {
            let popup = config.popup || false;
            let initialTab = config.initialTab || 0;
            let parentElement = config.parentElement || null;
            if (!this._inspector) {
                this.BJSINSPECTOR = this.BJSINSPECTOR || typeof INSPECTOR !== 'undefined' ? INSPECTOR : undefined;

                this._inspector = new this.BJSINSPECTOR.Inspector(this._scene, popup, initialTab, parentElement, config.newColors);
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
                try {
                    this._inspector.dispose();
                } catch (e) {
                    // If the inspector has been removed directly from the inspector tool
                }
                this._inspector = null;
            }
        }

        public show(config: {
            popup?: boolean,
            initialTab?: number,
            parentElement?: HTMLElement,
            newColors?: {
                backgroundColor?: string,
                backgroundColorLighter?: string,
                backgroundColorLighter2?: string,
                backgroundColorLighter3?: string,
                color?: string,
                colorTop?: string,
                colorBot?: string
            }
        } = {}) {
            if (typeof this.BJSINSPECTOR == 'undefined') {
                // Load inspector and add it to the DOM
                Tools.LoadScript(DebugLayer.InspectorURL, this._createInspector.bind(this, config));
            } else {
                // Otherwise creates the inspector
                this._createInspector(config);
            }
        }

    }
}
