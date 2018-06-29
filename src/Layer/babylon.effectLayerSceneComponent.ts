module BABYLON {
    // Adds the parser to the scene parsers.
    AbstractScene.AddParser(SceneComponentConstants.NAME_EFFECTLAYER, (parsedData: any, scene: Scene, container: AssetContainer, rootUrl: string) => {
        if (parsedData.effectLayers) {
            for (let index = 0; index < parsedData.effectLayers.length; index++) {
                var effectLayer = EffectLayer.Parse(parsedData.effectLayers[index], scene, rootUrl);
                container.effectLayers.push(effectLayer);
            }
        }
    });

    export interface AbstractScene {
        /**
         * The list of effect layers (highlights/glow) added to the scene
         * @see http://doc.babylonjs.com/how_to/highlight_layer
         * @see http://doc.babylonjs.com/how_to/glow_layer
         */
        effectLayers: Array<EffectLayer>;

        /**
         * Removes the given effect layer from this scene.
         * @param toRemove defines the effect layer to remove
         * @returns the index of the removed effect layer
         */
        removeEffectLayer(toRemove: EffectLayer): number;

        /**
         * Adds the given effect layer to this scene
         * @param newEffectLayer defines the effect layer to add
         */     
        addEffectLayer(newEffectLayer: EffectLayer): void;
    }

    AbstractScene.prototype.removeEffectLayer = function(toRemove: EffectLayer): number {
        var index = this.effectLayers.indexOf(toRemove);
        if (index !== -1) {
            this.effectLayers.splice(index, 1);
        }

        return index;
    }

    AbstractScene.prototype.addEffectLayer = function(newEffectLayer: EffectLayer): void {
        this.effectLayers.push(newEffectLayer);
    }

    /**
     * Defines the layer scene component responsible to manage any effect layers
     * in a given scene.
     */
    export class EffectLayerSceneComponent implements ISceneComponent {
        /**
         * The component name helpfull to identify the component in the list of scene components.
         */
        public readonly name = SceneComponentConstants.NAME_EFFECTLAYER;

        /**
         * The scene the component belongs to.
         */
        public scene: Scene

        private _engine: Engine;
        private _effectLayers: Array<EffectLayer>;

        private _renderEffects = false;
        private _needStencil = false;
        private _previousStencilState = false;

        /**
         * Creates a new instance of the component for the given scene
         * @param scene Defines the scene to register the component in
         */
        constructor(scene: Scene) {
            this.scene = scene;
            this._engine = scene.getEngine();
            this._effectLayers = scene.effectLayers = new Array<EffectLayer>();
        }

        /**
         * Registers the component in a given scene
         */
        public register(): void {
            this.scene._isReadyForMeshStage.registerStep(SceneComponentConstants.STEP_ISREADYFORMESH_EFFECTLAYER, this, this._isReadyForMesh);

            this.scene._cameraDrawRenderTargetStage.registerStep(SceneComponentConstants.STEP_CAMERADRAWRENDERTARGET_EFFECTLAYER, this, this._renderMainTexture);

            this.scene._beforeCameraDrawStage.registerStep(SceneComponentConstants.STEP_BEFORECAMERADRAW_EFFECTLAYER, this, this._setStencil);

            this.scene._afterRenderingGroupDrawStage.registerStep(SceneComponentConstants.STEP_AFTERRENDERINGGROUPDRAW_EFFECTLAYER_DRAW, this, this._drawRenderingGroup);

            this.scene._afterCameraDrawStage.registerStep(SceneComponentConstants.STEP_AFTERCAMERADRAW_EFFECTLAYER, this, this._setStencilBack);
            this.scene._afterCameraDrawStage.registerStep(SceneComponentConstants.STEP_AFTERCAMERADRAW_EFFECTLAYER_DRAW, this, this._drawCamera);
        }

        /**
         * Rebuilds the elements related to this component in case of
         * context lost for instance.
         */
        public rebuild(): void {
            for (let effectLayer of this._effectLayers) {
                effectLayer._rebuild();
            }
        }

        /**
         * Serializes the component data to the specified json object
         * @param serializationObject The object to serialize to
         */
        public serialize(serializationObject: any): void {
            // Effect layers
            serializationObject.effectLayers = [];

            for (let effectLayer of this._effectLayers) {
                if (effectLayer.serialize) {
                    serializationObject.effectLayers.push(effectLayer.serialize());
                }
            }
        }

        /**
         * Adds all the element from the container to the scene
         * @param container the container holding the elements
         */
        public addFromContainer(container: AbstractScene): void {
            if (!container.effectLayers) {
                return;
            }
            container.effectLayers.forEach((o) => {
                this.scene.addEffectLayer(o);
            });
        }

        /**
         * Removes all the elements in the container from the scene
         * @param container contains the elements to remove 
         */
        public removeFromContainer(container: AbstractScene): void {
            if (!container.effectLayers) {
                return;
            }
            container.effectLayers.forEach((o) => {
                this.scene.removeEffectLayer(o);
            });
        }

        /**
         * Disposes the component and the associated ressources.
         */
        public dispose(): void {
            while (this._effectLayers.length) {
                this._effectLayers[0].dispose();
            }
        }

        private _isReadyForMesh(mesh: AbstractMesh, hardwareInstancedRendering: boolean): boolean {
            for (let layer of this._effectLayers) {
                if (!layer.hasMesh(mesh)) {
                    continue;
                }

                for (var subMesh of mesh.subMeshes) {
                    if (!layer.isReady(subMesh, hardwareInstancedRendering)) {
                        return false;
                    }
                }
            }
            return true;
        }

        private _renderMainTexture(camera: Camera): void {
            this._renderEffects = false;
            this._needStencil = false;

            if (this._effectLayers && this._effectLayers.length > 0) {
                this._previousStencilState = this._engine.getStencilBuffer();
                for (let effectLayer of this._effectLayers) {
                    if (effectLayer.shouldRender() &&
                        (!effectLayer.camera ||
                            (effectLayer.camera.cameraRigMode === Camera.RIG_MODE_NONE && camera === effectLayer.camera) ||
                            (effectLayer.camera.cameraRigMode !== Camera.RIG_MODE_NONE && effectLayer.camera._rigCameras.indexOf(camera) > -1))) {

                        this._renderEffects = true;
                        this._needStencil = this._needStencil || effectLayer.needStencil();

                        let renderTarget = (<RenderTargetTexture>(<any>effectLayer)._mainTexture);
                        if (renderTarget._shouldRender()) {
                            this.scene.incrementRenderId();
                            renderTarget.render(false, false);
                        }
                    }
                }

                this.scene.incrementRenderId();
            }
        }

        private _setStencil(camera: Camera) {
            // Activate effect Layer stencil
            if (this._needStencil) {
                this._engine.setStencilBuffer(true);
            }
        }

        private _setStencilBack(camera: Camera) {
            // Restore effect Layer stencil
            if (this._needStencil) {
                this._engine.setStencilBuffer(this._previousStencilState);
            }
        }

        private _draw(renderingGroupId: number): void {
            if (this._renderEffects) {
                this._engine.setDepthBuffer(false);
                for (let i = 0; i < this._effectLayers.length; i++) {
                    const effectLayer = this._effectLayers[i];
                    if (effectLayer.renderingGroupId === renderingGroupId) {
                        if (effectLayer.shouldRender()) {
                            effectLayer.render();
                        }
                    }
                }
                this._engine.setDepthBuffer(true);
            }
        }

        private _drawCamera(camera: Camera): void {
            if (this._renderEffects) {
                this._draw(-1);
            }
        }
        private _drawRenderingGroup(index: number): void {
            if (!this.scene._isInIntermediateRendering() && this._renderEffects) {
                this._draw(index);
            }
        }
    }
} 
