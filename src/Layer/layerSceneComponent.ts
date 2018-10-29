import { Camera } from "Cameras/camera";
import { Scene } from "scene";
import { Engine } from "Engine/engine";
import { SceneComponentConstants, ISceneComponent } from "sceneComponent";
import { _TimeToken } from "Instrumentation/timeToken";
import { _DepthCullingState, _StencilState, _AlphaState } from "States";
import { Layer } from "./layer";

declare module "abstractScene" {
    export interface AbstractScene {
        /**
         * The list of layers (background and foreground) of the scene
         */
        layers: Array<Layer>;
    }
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

        /**
         * Creates a new instance of the component for the given scene
         * @param scene Defines the scene to register the component in
         */
        constructor(scene: Scene) {
            this.scene = scene;
            this._engine = scene.getEngine();
            scene.layers = new Array<Layer>();
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
            let layers = this.scene.layers;

            for (let layer of layers) {
                layer._rebuild();
            }
        }

        /**
         * Disposes the component and the associated ressources.
         */
        public dispose(): void {
            let layers = this.scene.layers;

            while (layers.length) {
                layers[0].dispose();
            }
        }

        private _draw(camera: Camera, isBackground: boolean): void {
            let layers = this.scene.layers;

            if (layers.length) {
                this._engine.setDepthBuffer(false);
                const cameraLayerMask = camera.layerMask;
                for (let layer of layers) {
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
