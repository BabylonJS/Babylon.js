module BABYLON {

    // declare INSPECTOR namespace for compilation issue
    declare var INSPECTOR: any;
    // load the inspector using require, if not present in the global namespace.

    export interface Scene {
        /**
         * @hidden
         * Backing field
         */
        _debugLayer: DebugLayer;

        /**
         * Gets the debug layer (aka Inspector) associated with the scene
         * @see http://doc.babylonjs.com/features/playground_debuglayer
         */
        debugLayer: DebugLayer;
    }

    Object.defineProperty(Scene.prototype, "debugLayer", {
        get: function(this: Scene) {
            if (!this._debugLayer) {
                this._debugLayer = new DebugLayer(this);
            }
            return this._debugLayer;
        },
        enumerable: true,
        configurable: true
    });

    /**
     * The debug layer (aka Inspector) is the go to tool in order to better understand
     * what is happening in your scene
     * @see http://doc.babylonjs.com/features/playground_debuglayer
     */
    export class DebugLayer {
        /**
         * Define the url to get the inspector script from.
         * By default it uses the babylonjs CDN.
         * @ignoreNaming
         */
        public static InspectorURL = 'https://preview.babylonjs.com/inspector/babylon.inspector.bundle.js';

        private _scene: Scene;
        // The inspector instance
        private _inspector: any;

        private BJSINSPECTOR = typeof INSPECTOR !== 'undefined' ? INSPECTOR : undefined;

        /**
         * Observable triggered when a property is changed through the inspector.
         */
        public onPropertyChangedObservable = new BABYLON.Observable<{ object: any, property: string, value: any, initialValue: any }>();

        /**
         * Instantiates a new debug layer.
         * The debug layer (aka Inspector) is the go to tool in order to better understand
         * what is happening in your scene
         * @see http://doc.babylonjs.com/features/playground_debuglayer
         * @param scene Defines the scene to inspect
         */
        constructor(scene: Scene) {
            this._scene = scene;
            this._scene.onDisposeObservable.add(() => {
                // Debug layer
                if (this._scene._debugLayer) {
                    this._scene._debugLayer.hide();
                }
            });
        }

        /** Creates the inspector window. */
        private _createInspector(config: {
            popup?: boolean,
            initialTab?: number | string,
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
            } // else nothing to do as instance is already created
        }

        /**
         * Get if the inspector is visible or not.
         * @returns true if visible otherwise, false
         */
        public isVisible(): boolean {
            if (!this._inspector) {
                return false;
            }
            return true;
        }

        /**
         * Hide the inspector and close its window.
         */
        public hide() {
            if (this._inspector) {
                try {
                    this._inspector.dispose();
                } catch (e) {
                    // If the inspector has been removed directly from the inspector tool
                }
                this.onPropertyChangedObservable.clear();
                this._inspector = null;
            }
        }

        /**
        *
        * Launch the debugLayer.
        *
        * initialTab:
        * | Value | Tab Name |
        * | --- | --- |
        * | 0 | Scene |
        * | 1 | Console |
        * | 2 | Stats |
        * | 3 | Textures |
        * | 4 | Mesh |
        * | 5 | Light |
        * | 6 | Material |
        * | 7 | GLTF |
        * | 8 | GUI |
        * | 9 | Physics |
        * | 10 | Camera |
        * | 11 | Audio |
        *
        * @param config Define the configuration of the inspector
        */
        public show(config: {
            popup?: boolean,
            initialTab?: number | string,
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
        } = {}): void {
            if (typeof this.BJSINSPECTOR == 'undefined') {
                // Load inspector and add it to the DOM
                Tools.LoadScript(DebugLayer.InspectorURL, this._createInspector.bind(this, config));
            } else {
                // Otherwise creates the inspector
                this._createInspector(config);
            }
        }

        /**
         * Gets the active tab
         * @return the index of the active tab or -1 if the inspector is hidden
         */
        public getActiveTab(): number {
            return this._inspector ? this._inspector.getActiveTabIndex() : -1;
        }
    }
}
