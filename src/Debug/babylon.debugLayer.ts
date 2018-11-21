module BABYLON {

    // declare INSPECTOR namespace for compilation issue
    declare var INSPECTOR: any;
    // load the inspector using require, if not present in the global namespace.

    /**
     * Interface used to define scene explorer extensibility option
     */
    export interface IExplorerExtensibilityOption {
        /**
         * Define the option label
         */
        label: string;
        /**
         * Defines the action to execute on click
         */
        action: (entity: any) => void;
    }

    /**
     * Defines a group of actions associated with a predicate to use when extending the Inspector scene explorer
     */
    export interface IExplorerExtensibilityGroup {
        /**
         * Defines a predicate to test if a given type mut be extended
         */
        predicate: (entity: any) => boolean;
        /**
         * Gets the list of options added to a type
         */
        entries: IExplorerExtensibilityOption[];
    }

    /**
     * Interface used to define the options to use to create the Inspector
     */
    export interface IInspectorOptions {
        /**
         * Display in overlay mode (default: false)
         */
        overlay?: boolean;
        /**
         * HTML element to use as root (the parent of the rendering canvas will be used as default value)
         */
        globalRoot?: HTMLElement;
        /**
         * Display the Scene explorer
         */
        showExplorer?: boolean;
        /**
         * Display the property inspector
         */
        showInspector?: boolean;
        /**
         * Display in embed mode (both panes on the right)
         */
        embedMode?: boolean;
        /**
         * let the Inspector handles resize of the canvas when panes are resized (default to true)
         */
        handleResize?: boolean;
        /**
         * Allow the panes to popup (default: true)
         */
        enablePopup?: boolean;
        /**
         * Allow the panes to be closed by users (default: true)
         */
        enableClose?: boolean;
        /**
         * Optional list of extensibility entries
         */
        explorerExtensibility?: IExplorerExtensibilityGroup[];
    }

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
        private _createInspector(config?: Partial<IInspectorOptions>) {
            if (this.isVisible()) {
                return;
            }

            const userOptions: IInspectorOptions = {
                overlay: false,
                showExplorer: true,
                showInspector: true,
                embedMode: false,
                handleResize: true,
                enablePopup: true,
                ...config
            };

            this.BJSINSPECTOR = this.BJSINSPECTOR || typeof INSPECTOR !== 'undefined' ? INSPECTOR : undefined;

            this.BJSINSPECTOR.Inspector.Show(this._scene, userOptions);
        }

        /**
         * Get if the inspector is visible or not.
         * @returns true if visible otherwise, false
         */
        public isVisible(): boolean {
            return this.BJSINSPECTOR && this.BJSINSPECTOR.Inspector.IsVisible;
        }

        /**
         * Hide the inspector and close its window.
         */
        public hide() {
            this.BJSINSPECTOR.Inspector.Hide();
        }

        /**
          * Launch the debugLayer.
          * @param config Define the configuration of the inspector
          */
        public show(config?: IInspectorOptions): void {

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
