import type {
    FrameGraph,
    Scene,
    DrawWrapper,
    FrameGraphTextureCreationOptions,
    ObjectRendererOptions,
    FrameGraphRenderTarget,
    FrameGraphRenderPass,
    Observer,
    ObjectRenderer,
} from "core/index";
import { FrameGraphObjectRendererTask } from "./objectRendererTask";
import { ThinTAAPostProcess } from "core/PostProcesses/thinTAAPostProcess";
import { Constants } from "core/Engines/constants";

/**
 * Task used to render objects to a texture with Temporal Anti-Aliasing (TAA).
 */
export class FrameGraphTAAObjectRendererTask extends FrameGraphObjectRendererTask {
    /**
     * The TAA post process.
     */
    public readonly postProcess: ThinTAAPostProcess;

    protected readonly _postProcessDrawWrapper: DrawWrapper;
    protected _initRenderingObserver: Observer<ObjectRenderer>;

    /**
     * Constructs a new TAA object renderer task.
     * @param name The name of the task
     * @param frameGraph The frame graph the task belongs to.
     * @param scene The scene the frame graph is associated with.
     * @param options The options of the object renderer.
     */
    constructor(name: string, frameGraph: FrameGraph, scene: Scene, options?: ObjectRendererOptions) {
        super(name, frameGraph, scene, options);

        this.postProcess = new ThinTAAPostProcess(`${name} post-process`, scene.getEngine());
        this._postProcessDrawWrapper = this.postProcess.drawWrapper;
        this._renderer.dontSetTransformationMatrix = true;
    }

    public override record(): FrameGraphRenderPass {
        if (this.targetTexture === undefined || this.objectList === undefined) {
            throw new Error(`FrameGraphTAAObjectRendererTask ${this.name}: destinationTexture and objectList are required`);
        }

        const textureManager = this._frameGraph.textureManager;
        const targetTextures = Array.isArray(this.targetTexture) ? this.targetTexture : [this.targetTexture];

        if (textureManager.isBackbuffer(targetTextures[0]) || (this.depthTexture !== undefined && textureManager.isBackbuffer(this.depthTexture))) {
            throw new Error(`FrameGraphTAAObjectRendererTask ${this.name}: the back buffer color/depth textures are not allowed. Use regular textures instead.`);
        }

        // Make sure the renderList / particleSystemList are set when FrameGraphObjectRendererTask.isReady() is called!
        this._renderer.renderList = this.objectList.meshes;
        this._renderer.particleSystemList = this.objectList.particleSystems;

        const outputTextureDescription = textureManager.getTextureDescription(targetTextures[0]);

        let depthEnabled = false;

        if (this.depthTexture !== undefined) {
            const depthTextureDescription = textureManager.getTextureDescription(this.depthTexture);
            if (depthTextureDescription.options.samples !== outputTextureDescription.options.samples) {
                throw new Error(`FrameGraphTAAObjectRendererTask ${this.name}: the depth texture and the output texture must have the same number of samples`);
            }

            depthEnabled = true;
        }

        this.postProcess.camera = this.camera;
        this.postProcess.textureWidth = outputTextureDescription.size.width;
        this.postProcess.textureHeight = outputTextureDescription.size.height;

        const textureCreationOptions: FrameGraphTextureCreationOptions = {
            size: outputTextureDescription.size,
            options: {
                createMipMaps: outputTextureDescription.options.createMipMaps,
                types: [Constants.TEXTURETYPE_HALF_FLOAT],
                formats: [Constants.TEXTUREFORMAT_RGBA],
                samples: 1,
                useSRGBBuffers: [false],
                creationFlags: [0],
                labels: [""],
            },
            sizeIsPercentage: false,
            isHistoryTexture: true,
        };

        const pingPongHandle = textureManager.createRenderTargetTexture(`${this.name} history`, textureCreationOptions);

        textureManager.resolveDanglingHandle(this.outputTexture, pingPongHandle);
        if (this.depthTexture !== undefined) {
            textureManager.resolveDanglingHandle(this.outputDepthTexture, this.depthTexture);
        }

        this._textureWidth = outputTextureDescription.size.width;
        this._textureHeight = outputTextureDescription.size.height;

        let pingPongRenderTargetWrapper: FrameGraphRenderTarget | undefined;

        this._setLightsForShadow();

        this._renderer.onInitRenderingObservable.remove(this._initRenderingObserver);

        this._initRenderingObserver = this._renderer.onInitRenderingObservable.add(() => {
            // We pass false to this.camera.getProjectionMatrix() when TAA is enabled to avoid overwriting the projection matrix calculated by the call to this.postProcess.updateProjectionMatrix()
            this._scene.setTransformMatrix(this.camera.getViewMatrix(), this.camera.getProjectionMatrix(this.postProcess.disabled));
        });

        const pass = this._frameGraph.addRenderPass(this.name);

        pass.setRenderTarget(this.targetTexture);
        pass.setRenderTargetDepth(this.depthTexture);
        pass.setExecuteFunc((context) => {
            this._renderer.renderList = this.objectList.meshes;
            this._renderer.particleSystemList = this.objectList.particleSystems;

            this.postProcess.updateProjectionMatrix();

            context.setDepthStates(this.depthTest && depthEnabled, this.depthWrite && depthEnabled);

            context.render(this._renderer, this._textureWidth, this._textureHeight);

            this._scene.activeCamera = null;

            pingPongRenderTargetWrapper = pingPongRenderTargetWrapper || context.createRenderTarget(`${this.name} ping/pong`, pingPongHandle);

            context.bindRenderTarget(pingPongRenderTargetWrapper, "frame graph - TAA merge with history texture");

            if (!this.postProcess.disabled) {
                context.applyFullScreenEffect(this._postProcessDrawWrapper, () => {
                    this.postProcess.bind();
                    context.bindTextureHandle(this._postProcessDrawWrapper.effect!, "textureSampler", targetTextures[0]);
                    context.bindTextureHandle(this._postProcessDrawWrapper.effect!, "historySampler", pingPongHandle);
                });
            } else {
                context.copyTexture(targetTextures[0]);
            }
        });

        const passDisabled = this._frameGraph.addRenderPass(this.name + "_disabled", true);

        passDisabled.setRenderTarget(this.outputTexture);
        passDisabled.setRenderTargetDepth(this.depthTexture);
        passDisabled.setExecuteFunc((context) => {
            context.copyTexture(targetTextures[0]);
        });

        return pass;
    }

    public override dispose() {
        this._renderer.onInitRenderingObservable.remove(this._initRenderingObserver);
        super.dispose();
    }
}
