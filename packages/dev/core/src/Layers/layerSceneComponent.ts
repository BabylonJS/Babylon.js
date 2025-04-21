import type { Camera } from "../Cameras/camera";
import type { Scene } from "../scene";
import type { AbstractEngine } from "../Engines/abstractEngine";
import type { ISceneComponent } from "../sceneComponent";
import { SceneComponentConstants } from "../sceneComponent";
import type { Layer } from "./layer";
import type { RenderTargetTexture } from "../Materials/Textures/renderTargetTexture";
import { EngineStore } from "../Engines/engineStore";
import type { IAssetContainer } from "core/IAssetContainer";

/**
 * Defines the layer scene component responsible to manage any layers
 * in a given scene.
 */
export class LayerSceneComponent implements ISceneComponent {
    /**
     * The component name helpful to identify the component in the list of scene components.
     */
    public readonly name = SceneComponentConstants.NAME_LAYER;

    /**
     * The scene the component belongs to.
     */
    public scene: Scene;

    private _engine: AbstractEngine;

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
        this.scene._beforeCameraDrawStage.registerStep(SceneComponentConstants.STEP_BEFORECAMERADRAW_LAYER, this, this._drawCameraBackground);
        this.scene._afterCameraDrawStage.registerStep(SceneComponentConstants.STEP_AFTERCAMERADRAW_LAYER, this, this._drawCameraForegroundWithPostProcessing);
        this.scene._afterCameraPostProcessStage.registerStep(SceneComponentConstants.STEP_AFTERCAMERAPOSTPROCESS_LAYER, this, this._drawCameraForegroundWithoutPostProcessing);

        this.scene._beforeRenderTargetDrawStage.registerStep(SceneComponentConstants.STEP_BEFORERENDERTARGETDRAW_LAYER, this, this._drawRenderTargetBackground);
        this.scene._afterRenderTargetDrawStage.registerStep(SceneComponentConstants.STEP_AFTERRENDERTARGETDRAW_LAYER, this, this._drawRenderTargetForegroundWithPostProcessing);
        this.scene._afterRenderTargetPostProcessStage.registerStep(
            SceneComponentConstants.STEP_AFTERRENDERTARGETPOSTPROCESS_LAYER,
            this,
            this._drawRenderTargetForegroundWithoutPostProcessing
        );
    }

    /**
     * Rebuilds the elements related to this component in case of
     * context lost for instance.
     */
    public rebuild(): void {
        const layers = this.scene.layers;

        for (const layer of layers) {
            layer._rebuild();
        }
    }

    /**
     * Disposes the component and the associated resources.
     */
    public dispose(): void {
        const layers = this.scene.layers;

        while (layers.length) {
            layers[0].dispose();
        }
    }

    private _draw(predicate: (layer: Layer) => boolean): void {
        const layers = this.scene.layers;

        if (layers.length) {
            this._engine.setDepthBuffer(false);
            for (const layer of layers) {
                if (predicate(layer)) {
                    layer.render();
                }
            }
            this._engine.setDepthBuffer(true);
        }
    }

    private _drawCameraPredicate(layer: Layer, isBackground: boolean, applyPostProcess: boolean, cameraLayerMask: number): boolean {
        return (
            !layer.renderOnlyInRenderTargetTextures &&
            layer.isBackground === isBackground &&
            layer.applyPostProcess === applyPostProcess &&
            (layer.layerMask & cameraLayerMask) !== 0
        );
    }

    private _drawCameraBackground(camera: Camera): void {
        this._draw((layer: Layer) => {
            return this._drawCameraPredicate(layer, true, true, camera.layerMask);
        });
    }

    private _drawCameraForegroundWithPostProcessing(camera: Camera): void {
        this._draw((layer: Layer) => {
            return this._drawCameraPredicate(layer, false, true, camera.layerMask);
        });
    }

    private _drawCameraForegroundWithoutPostProcessing(camera: Camera): void {
        this._draw((layer: Layer) => {
            return this._drawCameraPredicate(layer, false, false, camera.layerMask);
        });
    }

    private _drawRenderTargetPredicate(layer: Layer, isBackground: boolean, applyPostProcess: boolean, cameraLayerMask: number, renderTargetTexture: RenderTargetTexture): boolean {
        return (
            layer.renderTargetTextures.length > 0 &&
            layer.isBackground === isBackground &&
            layer.applyPostProcess === applyPostProcess &&
            layer.renderTargetTextures.indexOf(renderTargetTexture) > -1 &&
            (layer.layerMask & cameraLayerMask) !== 0
        );
    }

    private _drawRenderTargetBackground(renderTarget: RenderTargetTexture): void {
        this._draw((layer: Layer) => {
            return this._drawRenderTargetPredicate(layer, true, true, this.scene.activeCamera!.layerMask, renderTarget);
        });
    }

    private _drawRenderTargetForegroundWithPostProcessing(renderTarget: RenderTargetTexture): void {
        this._draw((layer: Layer) => {
            return this._drawRenderTargetPredicate(layer, false, true, this.scene.activeCamera!.layerMask, renderTarget);
        });
    }

    private _drawRenderTargetForegroundWithoutPostProcessing(renderTarget: RenderTargetTexture): void {
        this._draw((layer: Layer) => {
            return this._drawRenderTargetPredicate(layer, false, false, this.scene.activeCamera!.layerMask, renderTarget);
        });
    }

    /**
     * Adds all the elements from the container to the scene
     * @param container the container holding the elements
     */
    public addFromContainer(container: IAssetContainer): void {
        if (!container.layers) {
            return;
        }
        for (const layer of container.layers) {
            this.scene.layers.push(layer);
        }
    }

    /**
     * Removes all the elements in the container from the scene
     * @param container contains the elements to remove
     * @param dispose if the removed element should be disposed (default: false)
     */
    public removeFromContainer(container: IAssetContainer, dispose = false): void {
        if (!container.layers) {
            return;
        }
        for (const layer of container.layers) {
            const index = this.scene.layers.indexOf(layer);
            if (index !== -1) {
                this.scene.layers.splice(index, 1);
            }
            if (dispose) {
                layer.dispose();
            }
        }
    }
}
