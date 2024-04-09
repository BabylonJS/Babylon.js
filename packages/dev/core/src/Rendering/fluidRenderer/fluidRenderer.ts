import { Scene } from "core/scene";
import type { Engine } from "core/Engines/engine";
import type { FloatArray, Nullable } from "core/types";
import type { Observer } from "core/Misc/observable";
import type { Camera } from "core/Cameras/camera";
import type { IParticleSystem } from "core/Particles/IParticleSystem";
import type { ISceneComponent } from "core/sceneComponent";
import { SceneComponentConstants } from "core/sceneComponent";
import type { SmartArrayNoDuplicate } from "core/Misc/smartArray";
import type { RenderTargetTexture } from "core/Materials/Textures/renderTargetTexture";
import { Constants } from "core/Engines/constants";
import type { Buffer } from "core/Buffers/buffer";

import type { FluidRenderingObject } from "./fluidRenderingObject";
import { FluidRenderingObjectParticleSystem } from "./fluidRenderingObjectParticleSystem";
import { FluidRenderingTargetRenderer } from "./fluidRenderingTargetRenderer";
import { FluidRenderingObjectCustomParticles } from "./fluidRenderingObjectCustomParticles";
import { FluidRenderingDepthTextureCopy } from "./fluidRenderingDepthTextureCopy";

import "../../Shaders/fluidRenderingParticleDepth.vertex";
import "../../Shaders/fluidRenderingParticleDepth.fragment";
import "../../Shaders/fluidRenderingParticleThickness.vertex";
import "../../Shaders/fluidRenderingParticleThickness.fragment";
import "../../Shaders/fluidRenderingParticleDiffuse.vertex";
import "../../Shaders/fluidRenderingParticleDiffuse.fragment";
import "../../Shaders/fluidRenderingBilateralBlur.fragment";
import "../../Shaders/fluidRenderingStandardBlur.fragment";
import "../../Shaders/fluidRenderingRender.fragment";

declare module "../../abstractScene" {
    export interface AbstractScene {
        /** @internal (Backing field) */
        _fluidRenderer: Nullable<FluidRenderer>;

        /**
         * Gets or Sets the fluid renderer associated to the scene.
         */
        fluidRenderer: Nullable<FluidRenderer>;

        /**
         * Enables the fluid renderer and associates it with the scene
         * @returns the FluidRenderer
         */
        enableFluidRenderer(): Nullable<FluidRenderer>;

        /**
         * Disables the fluid renderer associated with the scene
         */
        disableFluidRenderer(): void;
    }
}

Object.defineProperty(Scene.prototype, "fluidRenderer", {
    get: function (this: Scene) {
        return this._fluidRenderer;
    },
    set: function (this: Scene, value: Nullable<FluidRenderer>) {
        this._fluidRenderer = value;
    },
    enumerable: true,
    configurable: true,
});

Scene.prototype.enableFluidRenderer = function (): Nullable<FluidRenderer> {
    if (this._fluidRenderer) {
        return this._fluidRenderer;
    }

    this._fluidRenderer = new FluidRenderer(this);

    return this._fluidRenderer;
};

Scene.prototype.disableFluidRenderer = function (): void {
    this._fluidRenderer?.dispose();
    this._fluidRenderer = null;
};

type CameraMapForFluidRendering = [Array<FluidRenderingTargetRenderer>, { [key: string]: FluidRenderingDepthTextureCopy }];

function IsParticleSystemObject(obj: FluidRenderingObject): obj is FluidRenderingObjectParticleSystem {
    return !!(obj as FluidRenderingObjectParticleSystem).particleSystem;
}

function IsCustomParticlesObject(obj: FluidRenderingObject): obj is FluidRenderingObjectCustomParticles {
    return !!(obj as FluidRenderingObjectCustomParticles).addBuffers;
}

/**
 * Defines the fluid renderer scene component responsible to render objects as fluids
 */
export class FluidRendererSceneComponent implements ISceneComponent {
    /**
     * The component name helpful to identify the component in the list of scene components.
     */
    public readonly name = SceneComponentConstants.NAME_FLUIDRENDERER;

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
        this.scene._gatherActiveCameraRenderTargetsStage.registerStep(
            SceneComponentConstants.STEP_GATHERACTIVECAMERARENDERTARGETS_FLUIDRENDERER,
            this,
            this._gatherActiveCameraRenderTargets
        );
        this.scene._afterCameraDrawStage.registerStep(SceneComponentConstants.STEP_AFTERCAMERADRAW_FLUIDRENDERER, this, this._afterCameraDraw);
    }

    private _gatherActiveCameraRenderTargets(_renderTargets: SmartArrayNoDuplicate<RenderTargetTexture>): void {
        this.scene.fluidRenderer?._prepareRendering();
    }

    private _afterCameraDraw(camera: Camera) {
        this.scene.fluidRenderer?._render(camera);
    }

    /**
     * Rebuilds the elements related to this component in case of
     * context lost for instance.
     */
    public rebuild(): void {
        const fluidRenderer = this.scene.fluidRenderer;
        if (!fluidRenderer) {
            return;
        }

        const buffers = new Set<Buffer>();
        for (let i = 0; i < fluidRenderer.renderObjects.length; ++i) {
            const obj = fluidRenderer.renderObjects[i].object;
            if (IsCustomParticlesObject(obj)) {
                const vbuffers = obj.vertexBuffers;
                for (const name in vbuffers) {
                    buffers.add(vbuffers[name].getWrapperBuffer());
                }
            }
        }

        buffers.forEach((buffer) => {
            buffer._rebuild();
        });
    }

    /**
     * Disposes the component and the associated resources
     */
    public dispose(): void {
        this.scene.disableFluidRenderer();
    }
}

/**
 * An object rendered as a fluid.
 * It consists of the object itself as well as the render target renderer (which is used to generate the textures (render target) needed for fluid rendering)
 */
export interface IFluidRenderingRenderObject {
    /** object rendered as a fluid */
    object: FluidRenderingObject;
    /** target renderer used to render the fluid object */
    targetRenderer: FluidRenderingTargetRenderer;
}

/**
 * Class responsible for fluid rendering.
 * It is implementing the method described in https://developer.download.nvidia.com/presentations/2010/gdc/Direct3D_Effects.pdf
 */
export class FluidRenderer {
    /** @internal */
    public static _SceneComponentInitialization(scene: Scene) {
        let component = scene._getComponent(SceneComponentConstants.NAME_FLUIDRENDERER) as FluidRendererSceneComponent;
        if (!component) {
            component = new FluidRendererSceneComponent(scene);
            scene._addComponent(component);
        }
    }

    private _scene: Scene;
    private _engine: Engine;
    private _onEngineResizeObserver: Nullable<Observer<Engine>>;
    private _cameras: Map<Camera, CameraMapForFluidRendering>;

    /** Retrieves all the render objects managed by the class */
    public readonly renderObjects: Array<IFluidRenderingRenderObject>;

    /** Retrieves all the render target renderers managed by the class */
    public readonly targetRenderers: FluidRenderingTargetRenderer[];

    /**
     * Initializes the class
     * @param scene Scene in which the objects are part of
     */
    constructor(scene: Scene) {
        this._scene = scene;
        this._engine = scene.getEngine();
        this._onEngineResizeObserver = null;
        this.renderObjects = [];
        this.targetRenderers = [];
        this._cameras = new Map();

        FluidRenderer._SceneComponentInitialization(this._scene);

        this._onEngineResizeObserver = this._engine.onResizeObservable.add(() => {
            this._initialize();
        });
    }

    /**
     * Reinitializes the class
     * Can be used if you change the object priority (FluidRenderingObject.priority), to make sure the objects are rendered in the right order
     */
    public recreate(): void {
        this._sortRenderingObjects();
        this._initialize();
    }

    /**
     * Gets the render object corresponding to a particle system (null if the particle system is not rendered as a fluid)
     * @param ps The particle system
     * @returns the render object corresponding to this particle system if any, otherwise null
     */
    public getRenderObjectFromParticleSystem(ps: IParticleSystem): Nullable<IFluidRenderingRenderObject> {
        const index = this._getParticleSystemIndex(ps);
        return index !== -1 ? this.renderObjects[index] : null;
    }

    /**
     * Adds a particle system to the fluid renderer.
     * @param ps particle system
     * @param generateDiffuseTexture True if you want to generate a diffuse texture from the particle system and use it as part of the fluid rendering (default: false)
     * @param targetRenderer The target renderer used to display the particle system as a fluid. If not provided, the method will create a new one
     * @param camera The camera used by the target renderer (if the target renderer is created by the method)
     * @returns the render object corresponding to the particle system
     */
    public addParticleSystem(ps: IParticleSystem, generateDiffuseTexture?: boolean, targetRenderer?: FluidRenderingTargetRenderer, camera?: Camera): IFluidRenderingRenderObject {
        const object = new FluidRenderingObjectParticleSystem(this._scene, ps);

        object.onParticleSizeChanged.add(() => this._setParticleSizeForRenderTargets());

        if (!targetRenderer) {
            targetRenderer = new FluidRenderingTargetRenderer(this._scene, camera);
            this.targetRenderers.push(targetRenderer);
        }

        if (!targetRenderer._onUseVelocityChanged.hasObservers()) {
            targetRenderer._onUseVelocityChanged.add(() => this._setUseVelocityForRenderObject());
        }

        if (generateDiffuseTexture !== undefined) {
            targetRenderer.generateDiffuseTexture = generateDiffuseTexture;
        }

        const renderObject = { object, targetRenderer };

        this.renderObjects.push(renderObject);

        this._sortRenderingObjects();

        this._setParticleSizeForRenderTargets();

        return renderObject;
    }

    /**
     * Adds a custom particle set to the fluid renderer.
     * @param buffers The list of buffers (should contain at least a "position" buffer!)
     * @param numParticles Number of particles in each buffer
     * @param generateDiffuseTexture True if you want to generate a diffuse texture from buffers and use it as part of the fluid rendering (default: false). For the texture to be generated correctly, you need a "color" buffer in the set!
     * @param targetRenderer The target renderer used to display the particle system as a fluid. If not provided, the method will create a new one
     * @param camera The camera used by the target renderer (if the target renderer is created by the method)
     * @returns the render object corresponding to the custom particle set
     */
    public addCustomParticles(
        buffers: { [key: string]: FloatArray },
        numParticles: number,
        generateDiffuseTexture?: boolean,
        targetRenderer?: FluidRenderingTargetRenderer,
        camera?: Camera
    ): IFluidRenderingRenderObject {
        const object = new FluidRenderingObjectCustomParticles(this._scene, buffers, numParticles);

        object.onParticleSizeChanged.add(() => this._setParticleSizeForRenderTargets());

        if (!targetRenderer) {
            targetRenderer = new FluidRenderingTargetRenderer(this._scene, camera);
            this.targetRenderers.push(targetRenderer);
        }

        if (!targetRenderer._onUseVelocityChanged.hasObservers()) {
            targetRenderer._onUseVelocityChanged.add(() => this._setUseVelocityForRenderObject());
        }

        if (generateDiffuseTexture !== undefined) {
            targetRenderer.generateDiffuseTexture = generateDiffuseTexture;
        }

        const renderObject = { object, targetRenderer };

        this.renderObjects.push(renderObject);

        this._sortRenderingObjects();

        this._setParticleSizeForRenderTargets();

        return renderObject;
    }

    /**
     * Removes a render object from the fluid renderer
     * @param renderObject the render object to remove
     * @param removeUnusedTargetRenderer True to remove/dispose of the target renderer if it's not used anymore (default: true)
     * @returns True if the render object has been found and released, else false
     */
    public removeRenderObject(renderObject: IFluidRenderingRenderObject, removeUnusedTargetRenderer = true): boolean {
        const index = this.renderObjects.indexOf(renderObject);
        if (index === -1) {
            return false;
        }

        renderObject.object.dispose();

        this.renderObjects.splice(index, 1);

        if (removeUnusedTargetRenderer && this._removeUnusedTargetRenderers()) {
            this._initialize();
        } else {
            this._setParticleSizeForRenderTargets();
        }

        return true;
    }

    private _sortRenderingObjects(): void {
        this.renderObjects.sort((a, b) => {
            return a.object.priority < b.object.priority ? -1 : a.object.priority > b.object.priority ? 1 : 0;
        });
    }

    private _removeUnusedTargetRenderers(): boolean {
        const indexes: { [id: number]: boolean } = {};

        for (let i = 0; i < this.renderObjects.length; ++i) {
            const targetRenderer = this.renderObjects[i].targetRenderer;
            indexes[this.targetRenderers.indexOf(targetRenderer)] = true;
        }

        let removed = false;
        const newList: Array<FluidRenderingTargetRenderer> = [];
        for (let i = 0; i < this.targetRenderers.length; ++i) {
            if (!indexes[i]) {
                this.targetRenderers[i].dispose();
                removed = true;
            } else {
                newList.push(this.targetRenderers[i]);
            }
        }

        if (removed) {
            this.targetRenderers.length = 0;
            this.targetRenderers.push(...newList);
        }

        return removed;
    }

    private _getParticleSystemIndex(ps: IParticleSystem): number {
        for (let i = 0; i < this.renderObjects.length; ++i) {
            const obj = this.renderObjects[i].object;
            if (IsParticleSystemObject(obj) && obj.particleSystem === ps) {
                return i;
            }
        }

        return -1;
    }

    private _initialize(): void {
        for (let i = 0; i < this.targetRenderers.length; ++i) {
            this.targetRenderers[i].dispose();
        }

        const cameras: Map<Camera, CameraMapForFluidRendering> = new Map();

        for (let i = 0; i < this.targetRenderers.length; ++i) {
            const targetRenderer = this.targetRenderers[i];

            targetRenderer._initialize();

            if (targetRenderer.camera && targetRenderer._renderPostProcess) {
                let list = cameras.get(targetRenderer.camera);
                if (!list) {
                    list = [[], {}];
                    cameras.set(targetRenderer.camera, list);
                }
                list[0].push(targetRenderer);
                targetRenderer.camera.attachPostProcess(targetRenderer._renderPostProcess, i);
            }
        }

        let iterator = cameras.keys();
        for (let key = iterator.next(); key.done !== true; key = iterator.next()) {
            const camera = key.value;
            const list = cameras.get(camera)!;

            const firstPostProcess = camera._getFirstPostProcess();
            if (!firstPostProcess) {
                continue;
            }

            const [targetRenderers, copyDepthTextures] = list;

            firstPostProcess.onSizeChangedObservable.add(() => {
                if (!firstPostProcess.inputTexture.depthStencilTexture) {
                    firstPostProcess.inputTexture.createDepthStencilTexture(
                        0,
                        true,
                        this._engine.isStencilEnable,
                        targetRenderers[0].samples,
                        this._engine.isStencilEnable ? Constants.TEXTUREFORMAT_DEPTH24_STENCIL8 : Constants.TEXTUREFORMAT_DEPTH32_FLOAT,
                        `PostProcessRTTDepthStencil-${firstPostProcess.name}`
                    );
                }
                for (const targetRenderer of targetRenderers) {
                    const thicknessRT = targetRenderer._thicknessRenderTarget?.renderTarget;
                    const thicknessTexture = thicknessRT?.texture;
                    if (thicknessRT && thicknessTexture) {
                        const key = thicknessTexture.width + "_" + thicknessTexture.height;
                        let copyDepthTexture = copyDepthTextures[key];
                        if (!copyDepthTexture) {
                            copyDepthTexture = copyDepthTextures[key] = new FluidRenderingDepthTextureCopy(this._engine, thicknessTexture.width, thicknessTexture.height);
                        }
                        copyDepthTexture.depthRTWrapper.shareDepth(thicknessRT);
                    }
                }
            });
        }

        // Dispose the CopyDepthTexture instances that we don't need anymore
        iterator = this._cameras.keys();
        for (let key = iterator.next(); key.done !== true; key = iterator.next()) {
            const camera = key.value;
            const list = this._cameras.get(camera)!;

            const copyDepthTextures = list[1];

            const list2 = cameras.get(camera);
            if (!list2) {
                for (const key in copyDepthTextures) {
                    copyDepthTextures[key].dispose();
                }
            } else {
                for (const key in copyDepthTextures) {
                    if (!list2[1][key]) {
                        copyDepthTextures[key].dispose();
                    }
                }
            }
        }

        this._cameras.clear();
        this._cameras = cameras;

        this._setParticleSizeForRenderTargets();
    }

    private _setParticleSizeForRenderTargets(): void {
        const particleSizes = new Map<FluidRenderingTargetRenderer, number>();

        for (let i = 0; i < this.renderObjects.length; ++i) {
            const renderingObject = this.renderObjects[i];
            let curSize = particleSizes.get(renderingObject.targetRenderer);
            if (curSize === undefined) {
                curSize = 0;
            }
            particleSizes.set(renderingObject.targetRenderer, Math.max(curSize, renderingObject.object.particleSize));
        }

        particleSizes.forEach((particleSize, targetRenderer) => {
            if (targetRenderer._depthRenderTarget) {
                targetRenderer._depthRenderTarget.particleSize = particleSize;
            }
        });
    }

    private _setUseVelocityForRenderObject(): void {
        for (const renderingObject of this.renderObjects) {
            renderingObject.object.useVelocity = renderingObject.targetRenderer.useVelocity;
        }
    }

    /** @internal */
    public _prepareRendering(): void {
        for (const renderer of this.targetRenderers) {
            if (renderer.needInitialization) {
                this._initialize();
                return;
            }
        }
    }

    /** @internal */
    public _render(forCamera?: Camera): void {
        for (let i = 0; i < this.targetRenderers.length; ++i) {
            if (!forCamera || this.targetRenderers[i].camera === forCamera) {
                this.targetRenderers[i]._clearTargets();
            }
        }

        const iterator = this._cameras.keys();
        for (let key = iterator.next(); key.done !== true; key = iterator.next()) {
            const camera = key.value;
            const list = this._cameras.get(camera)!;
            if (forCamera && camera !== forCamera) {
                continue;
            }

            const firstPostProcess = camera._getFirstPostProcess();
            if (!firstPostProcess) {
                continue;
            }

            const sourceCopyDepth = firstPostProcess.inputTexture?.depthStencilTexture;
            if (sourceCopyDepth) {
                const [targetRenderers, copyDepthTextures] = list;
                for (const targetRenderer of targetRenderers) {
                    targetRenderer._bgDepthTexture = sourceCopyDepth;
                }
                for (const key in copyDepthTextures) {
                    copyDepthTextures[key].copy(sourceCopyDepth);
                }
            }
        }

        for (let i = 0; i < this.renderObjects.length; ++i) {
            const renderingObject = this.renderObjects[i];
            if (!forCamera || renderingObject.targetRenderer.camera === forCamera) {
                renderingObject.targetRenderer._render(renderingObject.object);
            }
        }
    }

    /**
     * Disposes of all the ressources used by the class
     */
    public dispose(): void {
        this._engine.onResizeObservable.remove(this._onEngineResizeObserver);
        this._onEngineResizeObserver = null;

        for (let i = 0; i < this.renderObjects.length; ++i) {
            this.renderObjects[i].object.dispose();
        }

        for (let i = 0; i < this.targetRenderers.length; ++i) {
            this.targetRenderers[i].dispose();
        }

        this._cameras.forEach((list) => {
            const copyDepthTextures = list[1];
            for (const key in copyDepthTextures) {
                copyDepthTextures[key].dispose();
            }
        });

        (this.renderObjects as Array<IFluidRenderingRenderObject>) = [];
        (this.targetRenderers as FluidRenderingTargetRenderer[]) = [];
        this._cameras.clear();
    }
}
