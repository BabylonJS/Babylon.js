import { Camera } from "../Cameras/camera";
import { Scene } from "../scene";
import type { AbstractEngine } from "../Engines/abstractEngine";
import type { AbstractMesh } from "../Meshes/abstractMesh";
import type { RenderTargetTexture } from "../Materials/Textures/renderTargetTexture";
import type { ISceneSerializableComponent } from "../sceneComponent";
import { SceneComponentConstants } from "../sceneComponent";
import { EffectLayer } from "./effectLayer";
import type { AssetContainer } from "../assetContainer";
import { EngineStore } from "../Engines/engineStore";
import { AddParser } from "core/Loading/Plugins/babylonFileParser.function";
import type { IAssetContainer } from "core/IAssetContainer";

// Adds the parser to the scene parsers.
AddParser(SceneComponentConstants.NAME_EFFECTLAYER, (parsedData: any, scene: Scene, container: AssetContainer, rootUrl: string) => {
    if (parsedData.effectLayers) {
        if (!container.effectLayers) {
            container.effectLayers = [] as EffectLayer[];
        }

        for (let index = 0; index < parsedData.effectLayers.length; index++) {
            const effectLayer = EffectLayer.Parse(parsedData.effectLayers[index], scene, rootUrl);
            container.effectLayers.push(effectLayer);
        }
    }
});

declare module "../scene" {
    export interface Scene {
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

Scene.prototype.removeEffectLayer = function (toRemove: EffectLayer): number {
    const index = this.effectLayers.indexOf(toRemove);
    if (index !== -1) {
        this.effectLayers.splice(index, 1);
    }

    return index;
};

Scene.prototype.addEffectLayer = function (newEffectLayer: EffectLayer): void {
    this.effectLayers.push(newEffectLayer);
};

/**
 * Defines the layer scene component responsible to manage any effect layers
 * in a given scene.
 */
export class EffectLayerSceneComponent implements ISceneSerializableComponent {
    /**
     * The component name helpful to identify the component in the list of scene components.
     */
    public readonly name = SceneComponentConstants.NAME_EFFECTLAYER;

    /**
     * The scene the component belongs to.
     */
    public scene: Scene;

    private _engine: AbstractEngine;
    private _renderEffects = false;
    private _needStencil = false;
    private _previousStencilState = false;

    /**
     * Creates a new instance of the component for the given scene
     * @param scene Defines the scene to register the component in
     */
    constructor(scene?: Scene) {
        this.scene = scene || <Scene>EngineStore.LastCreatedScene;
        if (!this.scene) {
            return;
        }
        this._engine = this.scene.getEngine();
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
        const layers = this.scene.effectLayers;
        for (const effectLayer of layers) {
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

        const layers = this.scene.effectLayers;
        for (const effectLayer of layers) {
            if (effectLayer.serialize) {
                serializationObject.effectLayers.push(effectLayer.serialize());
            }
        }
    }

    /**
     * Adds all the elements from the container to the scene
     * @param container the container holding the elements
     */
    public addFromContainer(container: IAssetContainer): void {
        if (!container.effectLayers) {
            return;
        }
        for (const o of container.effectLayers) {
            this.scene.addEffectLayer(o);
        }
    }

    /**
     * Removes all the elements in the container from the scene
     * @param container contains the elements to remove
     * @param dispose if the removed element should be disposed (default: false)
     */
    public removeFromContainer(container: IAssetContainer, dispose?: boolean): void {
        if (!container.effectLayers) {
            return;
        }
        for (const o of container.effectLayers) {
            this.scene.removeEffectLayer(o);
            if (dispose) {
                o.dispose();
            }
        }
    }

    /**
     * Disposes the component and the associated resources.
     */
    public dispose(): void {
        const layers = this.scene.effectLayers;
        while (layers.length) {
            layers[0].dispose();
        }
    }

    private _isReadyForMesh(mesh: AbstractMesh, hardwareInstancedRendering: boolean): boolean {
        const currentRenderPassId = this._engine.currentRenderPassId;
        const layers = this.scene.effectLayers;
        for (const layer of layers) {
            if (!layer.hasMesh(mesh)) {
                continue;
            }

            const renderTarget = <RenderTargetTexture>(<any>layer)._mainTexture;
            this._engine.currentRenderPassId = renderTarget.renderPassId;

            for (const subMesh of mesh.subMeshes) {
                if (!layer.isReady(subMesh, hardwareInstancedRendering)) {
                    this._engine.currentRenderPassId = currentRenderPassId;
                    return false;
                }
            }
        }
        this._engine.currentRenderPassId = currentRenderPassId;
        return true;
    }

    private _renderMainTexture(camera: Camera): boolean {
        this._renderEffects = false;
        this._needStencil = false;

        let needRebind = false;

        const layers = this.scene.effectLayers;
        if (layers && layers.length > 0) {
            this._previousStencilState = this._engine.getStencilBuffer();
            for (const effectLayer of layers) {
                if (
                    effectLayer.shouldRender() &&
                    (!effectLayer.camera ||
                        (effectLayer.camera.cameraRigMode === Camera.RIG_MODE_NONE && camera === effectLayer.camera) ||
                        (effectLayer.camera.cameraRigMode !== Camera.RIG_MODE_NONE && effectLayer.camera._rigCameras.indexOf(camera) > -1))
                ) {
                    this._renderEffects = true;
                    this._needStencil = this._needStencil || effectLayer.needStencil();

                    const renderTarget = <RenderTargetTexture>(<any>effectLayer)._mainTexture;
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

            const layers = this.scene.effectLayers;
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
