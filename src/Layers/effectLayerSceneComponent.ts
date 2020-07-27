import { Camera } from "../Cameras/camera";
import { Scene } from "../scene";
import { Engine } from "../Engines/engine";
import { AbstractMesh } from "../Meshes/abstractMesh";
import { RenderTargetTexture } from "../Materials/Textures/renderTargetTexture";
import { SceneComponentConstants, ISceneSerializableComponent } from "../sceneComponent";
import { EffectLayer } from "./effectLayer";
import { AbstractScene } from "../abstractScene";
import { AssetContainer } from "../assetContainer";
// Adds the parser to the scene parsers.
AbstractScene.AddParser(SceneComponentConstants.NAME_EFFECTLAYER, (parsedData: any, scene: Scene, container: AssetContainer, rootUrl: string) => {
    if (parsedData.effectLayers) {
        if (!container.effectLayers) {
            container.effectLayers = new Array<EffectLayer>();
        }

        for (let index = 0; index < parsedData.effectLayers.length; index++) {
            var effectLayer = EffectLayer.Parse(parsedData.effectLayers[index], scene, rootUrl);
            container.effectLayers.push(effectLayer);
        }
    }
});

declare module "../abstractScene" {
    export interface AbstractScene {
        /**
         * The list of effect layers (highlights/glow) added to the scene
         * @see https://doc.babylonjs.com/how_to/highlight_layer
         * @see https://doc.babylonjs.com/how_to/glow_layer
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
}

AbstractScene.prototype.removeEffectLayer = function(toRemove: EffectLayer): number {
    var index = this.effectLayers.indexOf(toRemove);
    if (index !== -1) {
        this.effectLayers.splice(index, 1);
    }

    return index;
};

AbstractScene.prototype.addEffectLayer = function(newEffectLayer: EffectLayer): void {
    this.effectLayers.push(newEffectLayer);
};

/**
 * Defines the layer scene component responsible to manage any effect layers
 * in a given scene.
 */
export class EffectLayerSceneComponent implements ISceneSerializableComponent {
    /**
     * The component name helpfull to identify the component in the list of scene components.
     */
    public readonly name = SceneComponentConstants.NAME_EFFECTLAYER;

    /**
     * The scene the component belongs to.
     */
    public scene: Scene;

    private _engine: Engine;
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
        scene.effectLayers = new Array<EffectLayer>();
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
        let layers = this.scene.effectLayers;
        for (let effectLayer of layers) {
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

        let layers = this.scene.effectLayers;
        for (let effectLayer of layers) {
            if (effectLayer.serialize) {
                serializationObject.effectLayers.push(effectLayer.serialize());
            }
        }
    }

    /**
     * Adds all the elements from the container to the scene
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
     * @param dispose if the removed element should be disposed (default: false)
     */
    public removeFromContainer(container: AbstractScene, dispose?: boolean): void {
        if (!container.effectLayers) {
            return;
        }
        container.effectLayers.forEach((o) => {
            this.scene.removeEffectLayer(o);
            if (dispose) {
                o.dispose();
            }
        });
    }

    /**
     * Disposes the component and the associated ressources.
     */
    public dispose(): void {
        let layers = this.scene.effectLayers;
        while (layers.length) {
            layers[0].dispose();
        }
    }

    private _isReadyForMesh(mesh: AbstractMesh, hardwareInstancedRendering: boolean): boolean {
        let layers = this.scene.effectLayers;
        for (let layer of layers) {
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

    private _renderMainTexture(camera: Camera): boolean {
        this._renderEffects = false;
        this._needStencil = false;

        let needRebind = false;

        let layers = this.scene.effectLayers;
        if (layers && layers.length > 0) {
            this._previousStencilState = this._engine.getStencilBuffer();
            for (let effectLayer of layers) {
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
                        needRebind = true;
                    }
                }
            }

            this.scene.incrementRenderId();
        }

        return needRebind;
    }

    private _setStencil() {
        // Activate effect Layer stencil
        if (this._needStencil) {
            this._engine.setStencilBuffer(true);
        }
    }

    private _setStencilBack() {
        // Restore effect Layer stencil
        if (this._needStencil) {
            this._engine.setStencilBuffer(this._previousStencilState);
        }
    }

    private _draw(renderingGroupId: number): void {
        if (this._renderEffects) {
            this._engine.setDepthBuffer(false);

            let layers = this.scene.effectLayers;
            for (let i = 0; i < layers.length; i++) {
                const effectLayer = layers[i];
                if (effectLayer.renderingGroupId === renderingGroupId) {
                    if (effectLayer.shouldRender()) {
                        effectLayer.render();
                    }
                }
            }
            this._engine.setDepthBuffer(true);
        }
    }

    private _drawCamera(): void {
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

EffectLayer._SceneComponentInitialization = (scene: Scene) => {
    let component = scene._getComponent(SceneComponentConstants.NAME_EFFECTLAYER) as EffectLayerSceneComponent;
    if (!component) {
        component = new EffectLayerSceneComponent(scene);
        scene._addComponent(component);
    }
};