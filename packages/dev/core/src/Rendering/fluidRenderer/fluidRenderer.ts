import type { Scene } from "core/scene";
import type { Engine } from "core/Engines/engine";
import type { FloatArray, Nullable } from "core/types";
import type { Observer } from "core/Misc/observable";
import type { Camera } from "core/Cameras/camera";
import type { IParticleSystem } from "core/Particles/IParticleSystem";

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
    /** @hidden */
    public static _SceneComponentInitialization: (scene: Scene) => void = (/*_*/) => {
        throw `FluidRendererSceneComponent needs to be imported before as it contains a side-effect required by your code.`;
    };

    private _scene: Scene;
    private _engine: Engine;
    private _onEngineResizeObserver: Nullable<Observer<Engine>>;
    private _renderObjects: Array<IFluidRenderingRenderObject>;
    private _targetRenderers: FluidRenderingTargetRenderer[];
    private _cameras: Map<Camera, [Array<FluidRenderingTargetRenderer>, { [key: string]: FluidRenderingDepthTextureCopy }]>;

    /** Retrives all the render objects managed by the class */
    public get renderObjects() {
        return this._renderObjects;
    }

    /** Retrives all the render target renderers managed by the class */
    public get targetRenderers() {
        return this._targetRenderers;
    }

    /**
     * Initializes the class
     * @param scene Scene in which the objects are part of
     */
    constructor(scene: Scene) {
        this._scene = scene;
        this._engine = scene.getEngine();
        this._onEngineResizeObserver = null;
        this._renderObjects = [];
        this._targetRenderers = [];
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

    /** Gets the render object corresponding to a particle system (null if the particle system is not rendered as a fluid) */
    public getRenderObjectFromParticleSystem(ps: IParticleSystem): Nullable<IFluidRenderingRenderObject> {
        const index = this._getParticleSystemIndex(ps);
        return index !== -1 ? this._renderObjects[index] : null;
    }

    /**
     * Adds a particle system to the fluid renderer.
     * Note that you should not normally call this method directly, as you can simply use the renderAsFluid property of the ParticleSystem/GPUParticleSystem class
     * @param ps particle system
     * @param generateDiffuseTexture True if you want to generate a diffuse texture from the particle system and use it as part of the fluid rendering (default: false)
     * @param targetRenderer The target renderer used to display the particle system as a fluid. If not provided, the method will create a new one
     * @param camera The camera used by the target renderer (if the target renderer is created by the method)
     * @returns the render object corresponding to the particle system
     */
    public addParticleSystem(ps: IParticleSystem, generateDiffuseTexture?: boolean, targetRenderer?: FluidRenderingTargetRenderer, camera?: Camera): IFluidRenderingRenderObject {
        const object = new FluidRenderingObjectParticleSystem(this._scene, ps);

        object.onParticleSizeChanged.add(this._setParticleSizeForRenderTargets.bind(this));

        if (!targetRenderer) {
            targetRenderer = new FluidRenderingTargetRenderer(this._scene, camera);
            this._targetRenderers.push(targetRenderer);
        }

        if (!targetRenderer._onUseVelocityChanged.hasObservers()) {
            targetRenderer._onUseVelocityChanged.add(this._setUseVelocityForRenderObject.bind(this));
        }

        if (generateDiffuseTexture !== undefined) {
            targetRenderer.generateDiffuseTexture = generateDiffuseTexture;
        }

        const renderObject = { object, targetRenderer };

        this._renderObjects.push(renderObject);

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

        object.onParticleSizeChanged.add(this._setParticleSizeForRenderTargets.bind(this));

        if (!targetRenderer) {
            targetRenderer = new FluidRenderingTargetRenderer(this._scene, camera);
            this._targetRenderers.push(targetRenderer);
        }

        if (!targetRenderer._onUseVelocityChanged.hasObservers()) {
            targetRenderer._onUseVelocityChanged.add(this._setUseVelocityForRenderObject.bind(this));
        }

        if (generateDiffuseTexture !== undefined) {
            targetRenderer.generateDiffuseTexture = generateDiffuseTexture;
        }

        const renderObject = { object, targetRenderer };

        this._renderObjects.push(renderObject);

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
        const index = this._renderObjects.indexOf(renderObject);
        if (index === -1) {
            return false;
        }

        renderObject.object.dispose();

        this._renderObjects.splice(index, 1);

        if (removeUnusedTargetRenderer && this._removeUnusedTargetRenderers()) {
            this._initialize();
        } else {
            this._setParticleSizeForRenderTargets();
        }

        return true;
    }

    private _sortRenderingObjects(): void {
        this._renderObjects.sort((a, b) => {
            return a.object.priority < b.object.priority ? -1 : a.object.priority > b.object.priority ? 1 : 0;
        });
    }

    private _removeUnusedTargetRenderers(): boolean {
        const indexes: { [id: number]: boolean } = {};

        for (let i = 0; i < this._renderObjects.length; ++i) {
            const targetRenderer = this._renderObjects[i].targetRenderer;
            indexes[this._targetRenderers.indexOf(targetRenderer)] = true;
        }

        let removed = false;
        const newList: Array<FluidRenderingTargetRenderer> = [];
        for (let i = 0; i < this._targetRenderers.length; ++i) {
            if (!indexes[i]) {
                this._targetRenderers[i].dispose();
                removed = true;
            } else {
                newList.push(this._targetRenderers[i]);
            }
        }

        if (removed) {
            this._targetRenderers.length = 0;
            this._targetRenderers.push(...newList);
        }

        return removed;
    }

    private static _IsParticleSystemObject(obj: FluidRenderingObject): obj is FluidRenderingObjectParticleSystem {
        return !!(obj as FluidRenderingObjectParticleSystem).particleSystem;
    }

    private _getParticleSystemIndex(ps: IParticleSystem): number {
        for (let i = 0; i < this._renderObjects.length; ++i) {
            const obj = this._renderObjects[i].object;
            if (FluidRenderer._IsParticleSystemObject(obj) && obj.particleSystem === ps) {
                return i;
            }
        }

        return -1;
    }

    private _initialize(): void {
        for (let i = 0; i < this._targetRenderers.length; ++i) {
            this._targetRenderers[i].dispose();
        }

        const cameras: Map<Camera, [Array<FluidRenderingTargetRenderer>, { [key: string]: FluidRenderingDepthTextureCopy }]> = new Map();

        for (let i = 0; i < this._targetRenderers.length; ++i) {
            const targetRenderer = this._targetRenderers[i];

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

        cameras.forEach((list, camera) => {
            const firstPostProcess = camera._getFirstPostProcess();
            if (!firstPostProcess) {
                return;
            }

            const [targetRenderers, copyDepthTextures] = list;

            firstPostProcess.onSizeChangedObservable.add(() => {
                if (!firstPostProcess.inputTexture.depthStencilTexture) {
                    firstPostProcess.inputTexture.createDepthStencilTexture(0, true, this._engine.isStencilEnable, targetRenderers[0].samples);
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
                        copyDepthTexture.depthRTWrapper._shareDepth(thicknessRT);
                    }
                }
            });
        });

        // Dispose the CopyDepthTexture instances that we don't need anymore
        this._cameras.forEach((list, camera) => {
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
        });

        this._cameras.clear();
        this._cameras = cameras;

        this._setParticleSizeForRenderTargets();
    }

    private _setParticleSizeForRenderTargets(): void {
        const particleSizes = new Map<FluidRenderingTargetRenderer, number>();

        for (let i = 0; i < this._renderObjects.length; ++i) {
            const renderingObject = this._renderObjects[i];
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
        for (let i = 0; i < this._renderObjects.length; ++i) {
            const renderingObject = this._renderObjects[i];
            renderingObject.object.useVelocity = renderingObject.targetRenderer.useVelocity;
        }
    }

    /** @hidden */
    public _prepareRendering(): void {
        let needInitialization = false;
        for (let i = 0; i < this._targetRenderers.length; ++i) {
            needInitialization = needInitialization || this._targetRenderers[i].needInitialization;
        }
        if (needInitialization) {
            this._initialize();
        }
    }

    /** @hidden */
    public _render(forCamera?: Camera): void {
        for (let i = 0; i < this._targetRenderers.length; ++i) {
            if (!forCamera || this._targetRenderers[i].camera === forCamera) {
                this._targetRenderers[i]._clearTargets();
            }
        }

        this._cameras.forEach((list, camera) => {
            if (forCamera && camera !== forCamera) {
                return;
            }

            const firstPostProcess = camera._getFirstPostProcess();
            if (!firstPostProcess) {
                return;
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
        });

        for (let i = 0; i < this._renderObjects.length; ++i) {
            const renderingObject = this._renderObjects[i];
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

        for (let i = 0; i < this._renderObjects.length; ++i) {
            this._renderObjects[i].object.dispose();
        }

        for (let i = 0; i < this._targetRenderers.length; ++i) {
            this._targetRenderers[i].dispose();
        }

        this._cameras.forEach((list) => {
            const copyDepthTextures = list[1];
            for (const key in copyDepthTextures) {
                copyDepthTextures[key].dispose();
            }
        });

        this._renderObjects = [];
        this._targetRenderers = [];
        this._cameras.clear();
    }
}
