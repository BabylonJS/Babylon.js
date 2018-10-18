module BABYLON {
    export interface Scene {
        /** @hidden (Backing field) */
        _depthRenderer: { [id: string]: DepthRenderer };

        /**
         * Creates a depth renderer a given camera which contains a depth map which can be used for post processing.
         * @param camera The camera to create the depth renderer on (default: scene's active camera)
         * @returns the created depth renderer
         */
        enableDepthRenderer(camera?: Nullable<Camera>): DepthRenderer;

        /**
         * Disables a depth renderer for a given camera
         * @param camera The camera to disable the depth renderer on (default: scene's active camera)
         */
        disableDepthRenderer(camera?: Nullable<Camera>): void;
    }

    Scene.prototype.enableDepthRenderer = function(camera?: Nullable<Camera>): DepthRenderer {
        camera = camera || this.activeCamera;
        if (!camera) {
            throw "No camera available to enable depth renderer";
        }
        if (!this._depthRenderer) {
            this._depthRenderer = {};
        }
        if (!this._depthRenderer[camera.id]) {
            var textureType = 0;
            if (this.getEngine().getCaps().textureHalfFloatRender) {
                textureType = Engine.TEXTURETYPE_HALF_FLOAT;
            }
            else if (this.getEngine().getCaps().textureFloatRender) {
                textureType = Engine.TEXTURETYPE_FLOAT;
            } else {
                throw "Depth renderer does not support int texture type";
            }
            this._depthRenderer[camera.id] = new DepthRenderer(this, textureType, camera);
        }

        return this._depthRenderer[camera.id];
    };

    Scene.prototype.disableDepthRenderer = function(camera?: Nullable<Camera>): void {
        camera = camera || this.activeCamera;
        if (!camera || !this._depthRenderer || !this._depthRenderer[camera.id]) {
            return;
        }

        this._depthRenderer[camera.id].dispose();
        delete this._depthRenderer[camera.id];
    };

    /**
     * Defines the Depth Renderer scene component responsible to manage a depth buffer usefull
     * in several rendering techniques.
     */
    export class DepthRendererSceneComponent implements ISceneComponent {
        /**
         * The component name helpfull to identify the component in the list of scene components.
         */
        public readonly name = SceneComponentConstants.NAME_DEPTHRENDERER;

        /**
         * The scene the component belongs to.
         */
        public scene: Scene;

        /**
         * Creates a new instance of the component for the given scene
         * @param scene Defines the scene to register the component in
         */
        constructor(scene: Scene) {
            this.scene = scene;
        }

        /**
         * Registers the component in a given scene
         */
        public register(): void {
            this.scene._gatherRenderTargetsStage.registerStep(SceneComponentConstants.STEP_GATHERRENDERTARGETS_DEPTHRENDERER, this, this._gatherRenderTargets);
            this.scene._gatherActiveCameraRenderTargetsStage.registerStep(SceneComponentConstants.STEP_GATHERACTIVECAMERARENDERTARGETS_DEPTHRENDERER, this, this._gatherActiveCameraRenderTargets);
        }

        /**
         * Rebuilds the elements related to this component in case of
         * context lost for instance.
         */
        public rebuild(): void {
            // Nothing to do for this component
        }

        /**
         * Disposes the component and the associated ressources
         */
        public dispose(): void {
            for (var key in this.scene._depthRenderer) {
                this.scene._depthRenderer[key].dispose();
            }
        }

        private _gatherRenderTargets(renderTargets: SmartArrayNoDuplicate<RenderTargetTexture>): void {
            if (this.scene._depthRenderer) {
                for (var key in this.scene._depthRenderer) {
                    let depthRenderer = this.scene._depthRenderer[key];
                    if (!depthRenderer.useOnlyInActiveCamera) {
                        renderTargets.push(depthRenderer.getDepthMap());
                    }
                }
            }
        }

        private _gatherActiveCameraRenderTargets(renderTargets: SmartArrayNoDuplicate<RenderTargetTexture>): void {
            if (this.scene._depthRenderer) {
                for (var key in this.scene._depthRenderer) {
                    let depthRenderer = this.scene._depthRenderer[key];
                    if (depthRenderer.useOnlyInActiveCamera && this.scene.activeCamera!.id === key) {
                        renderTargets.push(depthRenderer.getDepthMap());
                    }
                }
            }
        }
    }
}