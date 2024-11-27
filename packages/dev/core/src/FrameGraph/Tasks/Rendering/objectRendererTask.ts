// eslint-disable-next-line import/no-internal-modules
import type { FrameGraph, FrameGraphTextureHandle, Scene, Camera, FrameGraphObjectList, FrameGraphRenderContext, ObjectRendererOptions } from "core/index";
import { backbufferColorTextureHandle, backbufferDepthStencilTextureHandle } from "../../frameGraphTypes";
import { FrameGraphTask } from "../../frameGraphTask";
import { ObjectRenderer } from "../../../Rendering/objectRenderer";

/**
 * Task used to render objects to a texture.
 */
export class FrameGraphObjectRendererTask extends FrameGraphTask {
    /**
     * The destination texture where the objects will be rendered.
     */
    public destinationTexture: FrameGraphTextureHandle;

    /**
     * The depth attachment texture where the objects will be rendered (optional).
     */
    public depthTexture?: FrameGraphTextureHandle;

    /**
     * The dependencies of the task (optional).
     */
    public dependencies?: FrameGraphTextureHandle[] = [];

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
     * The output texture.
     * This texture will point to the same texture than the destinationTexture property if it is set.
     * Note, however, that the handle itself will be different!
     */
    public readonly outputTexture: FrameGraphTextureHandle;

    /**
     * The output depth attachment texture.
     * This texture will point to the same texture than the depthTexture property if it is set.
     * Note, however, that the handle itself will be different!
     */
    public readonly outputDepthTexture: FrameGraphTextureHandle;

    protected readonly _scene: Scene;
    protected readonly _renderer: ObjectRenderer;
    protected _textureWidth: number;
    protected _textureHeight: number;

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

    /**
     * Constructs a new object renderer task.
     * @param name The name of the task.
     * @param frameGraph The frame graph the task belongs to.
     * @param scene The scene the frame graph is associated with.
     * @param options The options of the object renderer.
     */
    constructor(name: string, frameGraph: FrameGraph, scene: Scene, options?: ObjectRendererOptions) {
        super(name, frameGraph);

        this._scene = scene;
        this._renderer = new ObjectRenderer(name, scene, options);
        this.name = name;

        this._renderer.onBeforeRenderingManagerRenderObservable.add(() => {
            if (!this._renderer.options.doNotChangeAspectRatio) {
                scene.updateTransformMatrix(true);
            }
        });

        this.outputTexture = this._frameGraph.textureManager.createDanglingHandle();
        this.outputDepthTexture = this._frameGraph.textureManager.createDanglingHandle();
    }

    public override isReady() {
        return this._renderer.isReadyForRendering(this._textureWidth, this._textureHeight);
    }

    public record(skipCreationOfDisabledPasses = false, additionalExecute?: (context: FrameGraphRenderContext) => void) {
        if (this.destinationTexture === undefined || this.objectList === undefined) {
            throw new Error(`FrameGraphObjectRendererTask ${this.name}: destinationTexture and objectList are required`);
        }

        const outputTextureDescription = this._frameGraph.textureManager.getTextureDescription(this.destinationTexture);

        let depthEnabled = false;

        if (this.depthTexture !== undefined) {
            if (this.depthTexture === backbufferDepthStencilTextureHandle && this.destinationTexture !== backbufferColorTextureHandle) {
                throw new Error(
                    `FrameGraphObjectRendererTask ${this.name}: the back buffer color texture is the only color texture allowed when the depth is the back buffer depth/stencil`
                );
            }
            if (this.depthTexture !== backbufferDepthStencilTextureHandle && this.destinationTexture === backbufferColorTextureHandle) {
                throw new Error(
                    `FrameGraphObjectRendererTask ${this.name}: the back buffer depth/stencil texture is the only depth texture allowed when the destination is the back buffer color`
                );
            }

            const depthTextureDescription = this._frameGraph.textureManager.getTextureDescription(this.depthTexture);
            if (depthTextureDescription.options.samples !== outputTextureDescription.options.samples) {
                throw new Error(`FrameGraphObjectRendererTask ${this.name}: the depth texture and the output texture must have the same number of samples`);
            }

            depthEnabled = true;
        }

        this._frameGraph.textureManager.resolveDanglingHandle(this.outputTexture, this.destinationTexture);
        if (this.depthTexture !== undefined) {
            this._frameGraph.textureManager.resolveDanglingHandle(this.outputDepthTexture, this.depthTexture);
        }

        this._textureWidth = outputTextureDescription.size.width;
        this._textureHeight = outputTextureDescription.size.height;

        const pass = this._frameGraph.addRenderPass(this.name);

        pass.setRenderTarget(this.destinationTexture);
        pass.setRenderTargetDepth(this.depthTexture);
        pass.setExecuteFunc((context) => {
            this._renderer.renderList = this.objectList.meshes;
            this._renderer.particleSystemList = this.objectList.particleSystems;

            context.setDepthStates(this.depthTest && depthEnabled, this.depthWrite && depthEnabled);
            context.render(this._renderer, this._textureWidth, this._textureHeight);

            additionalExecute?.(context);
        });

        if (this.dependencies !== undefined) {
            for (const handle of this.dependencies) {
                pass.useTexture(handle);
            }
        }

        if (!skipCreationOfDisabledPasses) {
            const passDisabled = this._frameGraph.addRenderPass(this.name + "_disabled", true);

            passDisabled.setRenderTarget(this.destinationTexture);
            passDisabled.setRenderTargetDepth(this.depthTexture);
            passDisabled.setExecuteFunc((_context) => {});

            if (this.dependencies !== undefined) {
                for (const handle of this.dependencies) {
                    passDisabled.useTexture(handle);
                }
            }
        }
    }

    public override dispose(): void {
        this._renderer.dispose();
        super.dispose();
    }
}
