module BABYLON {
    export interface AbstractScene {
        /**
         * The list of layers (background and foreground) of the scene
         */
        layers: Array<Layer>;
    }

    /**
     * Defines the layer scene component responsible to manage any layers
     * in a given scene.
     */
    export class LayerSceneComponent implements ISceneComponent {
        /**
         * The component name helpfull to identify the component in the list of scene components.
         */
        public readonly name = SceneComponentConstants.NAME_LAYER;

        /**
         * The scene the component belongs to.
         */
        public scene: Scene;

        private _engine: Engine;
        private _layers: Array<Layer>;

        /**
         * Creates a new instance of the component for the given scene
         * @param scene Defines the scene to register the component in
         */
        constructor(scene: Scene) {
            this.scene = scene;
            this._engine = scene.getEngine();
            this._layers = scene.layers = new Array<Layer>();
        }

        /**
         * Registers the component in a given scene
         */
        public register(): void {
            this.scene._beforeCameraDrawStage.registerStep(SceneComponentConstants.STEP_BEFORECAMERADRAW_LAYER, this, this._drawBackground);
            this.scene._afterCameraDrawStage.registerStep(SceneComponentConstants.STEP_AFTERCAMERADRAW_LAYER, this, this._drawForeground);
        }

        /**
         * Rebuilds the elements related to this component in case of
         * context lost for instance.
         */
        public rebuild(): void {
            for (let layer of this._layers) {
                layer._rebuild();
            }
        }

        /**
         * Serializes the component data to the specified json object
         * @param serializationObject The object to serialize to
         */
        public serialize(serializationObject: any): void {
            // TODO. Implement layer serialization
            // serializationObject.layers = [];

            // for (let layer of this._layers) {
            //     if (layer.serialize) {
            //         serializationObject.layers.push(layer.serialize());
            //     }
            // }
        }

        /**
         * Adds all the element from the container to the scene
         * @param container the container holding the elements
         */
        public addFromContainer(container: AbstractScene): void {
            if (!container.layers) {
                return;
            }
            // container.layers.forEach((o) => {
            //     this.scene.addLayer(o);
            // });
        }

        /**
         * Removes all the elements in the container from the scene
         * @param container contains the elements to remove 
         */
        public removeFromContainer(container: AbstractScene): void {
            if (!container.layers) {
                return;
            }
            // container.layers.forEach((o) => {
            //     this.scene.removeLayer(o);
            // });
        }

        /**
         * Disposes the component and the associated ressources.
         */
        public dispose(): void {
            while (this._layers.length) {
                this._layers[0].dispose();
            }
        }

        private _draw(camera: Camera, isBackground: boolean): void {
            if (this._layers.length) {
                this._engine.setDepthBuffer(false);
                const cameraLayerMask = camera.layerMask;
                for (let layer of this._layers) {
                    if (layer.isBackground === isBackground && ((layer.layerMask & cameraLayerMask) !== 0)) {
                        layer.render();
                    }
                }
                this._engine.setDepthBuffer(true);
            }
        }

        private _drawBackground(camera: Camera): void {
            this._draw(camera, true);
        }

        private _drawForeground(camera: Camera): void {
            this._draw(camera, false);
        }
    }
} 
