import type {
    FrameGraph,
    FrameGraphTextureHandle,
    Scene,
    Camera,
    FrameGraphObjectList,
    FrameGraphRenderContext,
    ObjectRendererOptions,
    Light,
    Nullable,
    Observer,
    FrameGraphShadowGeneratorTask,
    FrameGraphRenderPass,
    // eslint-disable-next-line import/no-internal-modules
} from "core/index";
import { backbufferColorTextureHandle, backbufferDepthStencilTextureHandle } from "../../frameGraphTypes";
import { FrameGraphTask } from "../../frameGraphTask";
import { ObjectRenderer } from "../../../Rendering/objectRenderer";
import { FrameGraphCascadedShadowGeneratorTask } from "./csmShadowGeneratorTask";

/**
 * Task used to render objects to a texture.
 */
export class FrameGraphObjectRendererTask extends FrameGraphTask {
    /**
     * The target texture where the objects will be rendered.
     */
    public targetTexture: FrameGraphTextureHandle;

    /**
     * The depth attachment texture where the objects will be rendered (optional).
     */
    public depthTexture?: FrameGraphTextureHandle;

    /**
     * The shadow generators used to render the objects (optional).
     */
    public shadowGenerators?: FrameGraphShadowGeneratorTask[] = [];

    private _camera: Camera;

    /**
     * Gets or sets the camera used to render the objects.
     */
    public get camera() {
        return this._camera;
    }

    public set camera(camera: Camera) {
        this._camera = camera;
        this._renderer.activeCamera = this.camera;
    }

    /**
     * The list of objects to render.
     */
    public objectList: FrameGraphObjectList;

    /**
     * If depth testing should be enabled (default is true).
     */
    public depthTest = true;

    /**
     * If depth writing should be enabled (default is true).
     */
    public depthWrite = true;

    /**
     * If shadows should be disabled (default is false).
     */
    public disableShadows = false;

    /**
     * If image processing should be disabled (default is false).
     * false means that the default image processing configuration will be applied (the one from the scene)
     */
    public disableImageProcessing = false;

    /**
     * The output texture.
     * This texture will point to the same texture than the targetTexture property if it is set.
     * Note, however, that the handle itself will be different!
     */
    public readonly outputTexture: FrameGraphTextureHandle;

    /**
     * The output depth attachment texture.
     * This texture will point to the same texture than the depthTexture property if it is set.
     * Note, however, that the handle itself will be different!
     */
    public readonly outputDepthTexture: FrameGraphTextureHandle;

    /**
     * The object renderer used to render the objects.
     */
    public get objectRenderer() {
        return this._renderer;
    }

    public override get name() {
        return this._name;
    }

    public override set name(value: string) {
        this._name = value;
        if (this._renderer) {
            this._renderer.name = value;
        }
    }

    protected readonly _scene: Scene;
    protected readonly _renderer: ObjectRenderer;
    protected _textureWidth: number;
    protected _textureHeight: number;
    protected _onBeforeRenderObservable: Nullable<Observer<number>> = null;
    protected _onAfterRenderObservable: Nullable<Observer<number>> = null;
    protected _externalObjectRenderer = false;

    /**
     * Constructs a new object renderer task.
     * @param name The name of the task.
     * @param frameGraph The frame graph the task belongs to.
     * @param scene The scene the frame graph is associated with.
     * @param options The options of the object renderer.
     * @param existingObjectRenderer An existing object renderer to use (optional). If provided, the options parameter will be ignored.
     */
    constructor(name: string, frameGraph: FrameGraph, scene: Scene, options?: ObjectRendererOptions, existingObjectRenderer?: ObjectRenderer) {
        super(name, frameGraph);

        this._scene = scene;
        this._externalObjectRenderer = !!existingObjectRenderer;
        this._renderer = existingObjectRenderer ?? new ObjectRenderer(name, scene, options);
        this.name = name;

        if (!this._externalObjectRenderer) {
            this._renderer.onBeforeRenderingManagerRenderObservable.add(() => {
                if (!this._renderer.options.doNotChangeAspectRatio) {
                    scene.updateTransformMatrix(true);
                }
            });
        }

        this.outputTexture = this._frameGraph.textureManager.createDanglingHandle();
        this.outputDepthTexture = this._frameGraph.textureManager.createDanglingHandle();
    }

    public override isReady() {
        return this._renderer.isReadyForRendering(this._textureWidth, this._textureHeight);
    }

    public record(skipCreationOfDisabledPasses = false, additionalExecute?: (context: FrameGraphRenderContext) => void): FrameGraphRenderPass {
        if (this.targetTexture === undefined || this.objectList === undefined) {
            throw new Error(`FrameGraphObjectRendererTask ${this.name}: targetTexture and objectList are required`);
        }

        // Make sure the renderList / particleSystemList are set when FrameGraphObjectRendererTask.isReady() is called!
        this._renderer.renderList = this.objectList.meshes;
        this._renderer.particleSystemList = this.objectList.particleSystems;
        this._renderer.disableImageProcessing = this.disableImageProcessing;

        const outputTextureDescription = this._frameGraph.textureManager.getTextureDescription(this.targetTexture);

        let depthEnabled = false;

        if (this.depthTexture !== undefined) {
            if (this.depthTexture === backbufferDepthStencilTextureHandle && this.targetTexture !== backbufferColorTextureHandle) {
                throw new Error(
                    `FrameGraphObjectRendererTask ${this.name}: the back buffer color texture is the only color texture allowed when the depth is the back buffer depth/stencil`
                );
            }
            if (this.depthTexture !== backbufferDepthStencilTextureHandle && this.targetTexture === backbufferColorTextureHandle) {
                throw new Error(
                    `FrameGraphObjectRendererTask ${this.name}: the back buffer depth/stencil texture is the only depth texture allowed when the target is the back buffer color`
                );
            }

            const depthTextureDescription = this._frameGraph.textureManager.getTextureDescription(this.depthTexture);
            if (depthTextureDescription.options.samples !== outputTextureDescription.options.samples) {
                throw new Error(`FrameGraphObjectRendererTask ${this.name}: the depth texture and the output texture must have the same number of samples`);
            }

            depthEnabled = true;
        }

        this._frameGraph.textureManager.resolveDanglingHandle(this.outputTexture, this.targetTexture);
        if (this.depthTexture !== undefined) {
            this._frameGraph.textureManager.resolveDanglingHandle(this.outputDepthTexture, this.depthTexture);
        }

        this._textureWidth = outputTextureDescription.size.width;
        this._textureHeight = outputTextureDescription.size.height;

        this._setLightsForShadow();

        const pass = this._frameGraph.addRenderPass(this.name);

        pass.setRenderTarget(this.targetTexture);
        pass.setRenderTargetDepth(this.depthTexture);
        pass.setExecuteFunc((context) => {
            this._renderer.renderList = this.objectList.meshes;
            this._renderer.particleSystemList = this.objectList.particleSystems;
            this._renderer.disableImageProcessing = this.disableImageProcessing;

            context.setDepthStates(this.depthTest && depthEnabled, this.depthWrite && depthEnabled);
            context.render(this._renderer, this._textureWidth, this._textureHeight);

            additionalExecute?.(context);
        });

        if (!skipCreationOfDisabledPasses) {
            const passDisabled = this._frameGraph.addRenderPass(this.name + "_disabled", true);

            passDisabled.setRenderTarget(this.targetTexture);
            passDisabled.setRenderTargetDepth(this.depthTexture);
            passDisabled.setExecuteFunc((_context) => {});
        }

        return pass;
    }

    public override dispose(): void {
        this._renderer.onBeforeRenderObservable.remove(this._onBeforeRenderObservable);
        this._renderer.onAfterRenderObservable.remove(this._onAfterRenderObservable);
        if (!this._externalObjectRenderer) {
            this._renderer.dispose();
        }
        super.dispose();
    }

    protected _setLightsForShadow() {
        const lightsForShadow: Set<Light> = new Set();
        const shadowEnabled: Map<Light, boolean> = new Map();

        if (this.shadowGenerators) {
            for (const shadowGeneratorTask of this.shadowGenerators) {
                const shadowGenerator = shadowGeneratorTask.shadowGenerator;
                const light = shadowGenerator.getLight();
                if (light.isEnabled() && light.shadowEnabled) {
                    lightsForShadow.add(light);
                    if (FrameGraphCascadedShadowGeneratorTask.IsCascadedShadowGenerator(shadowGeneratorTask)) {
                        light._shadowGenerators!.set(shadowGeneratorTask.camera, shadowGenerator);
                    } else {
                        light._shadowGenerators!.set(null, shadowGenerator);
                    }
                }
            }
        }

        this._renderer.onBeforeRenderObservable.remove(this._onBeforeRenderObservable);
        this._onBeforeRenderObservable = this._renderer.onBeforeRenderObservable.add(() => {
            for (let i = 0; i < this._scene.lights.length; i++) {
                const light = this._scene.lights[i];
                shadowEnabled.set(light, light.shadowEnabled);
                light.shadowEnabled = !this.disableShadows && lightsForShadow.has(light);
            }
        });

        this._renderer.onAfterRenderObservable.remove(this._onAfterRenderObservable);
        this._onAfterRenderObservable = this._renderer.onAfterRenderObservable.add(() => {
            for (let i = 0; i < this._scene.lights.length; i++) {
                const light = this._scene.lights[i];
                light.shadowEnabled = shadowEnabled.get(light)!;
            }
        });
    }
}
