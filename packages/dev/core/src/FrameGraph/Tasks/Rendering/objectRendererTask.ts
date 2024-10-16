import type { FrameGraph } from "../../frameGraph";
import type { FrameGraphTextureHandle } from "../../frameGraphTypes";
import { backbufferColorTextureHandle, backbufferDepthStencilTextureHandle } from "../../frameGraphTypes";
import { RenderTargetTexture } from "../../../Materials/Textures/renderTargetTexture";
import type { Scene } from "../../../scene";
import type { Camera } from "../../../Cameras/camera";
import { FrameGraphTask } from "../../frameGraphTask";
import type { FrameGraphObjectList } from "core/FrameGraph/frameGraphObjectList";
import type { FrameGraphRenderContext } from "core/FrameGraph/frameGraphRenderContext";

export class FrameGraphObjectRendererTask extends FrameGraphTask {
    public destinationTexture: FrameGraphTextureHandle;

    public depthTexture?: FrameGraphTextureHandle;

    public dependencies?: FrameGraphTextureHandle[] = [];

    private _camera: Camera;

    public get camera() {
        return this._camera;
    }

    public set camera(camera: Camera) {
        this._camera = camera;
        this._rtt.activeCamera = this.camera;
    }

    public objectList: FrameGraphObjectList;

    public depthTest = true;

    public depthWrite = true;

    public readonly outputTexture: FrameGraphTextureHandle;

    public readonly outputDepthTexture: FrameGraphTextureHandle;

    protected _scene: Scene;
    protected _rtt: RenderTargetTexture;

    public get renderTargetTexture() {
        return this._rtt;
    }

    public override get name() {
        return this._name;
    }

    public override set name(value: string) {
        this._name = value;
        if (this._rtt) {
            this._rtt.name = value + "_internal_rtt";
        }
    }

    constructor(name: string, frameGraph: FrameGraph, scene: Scene) {
        super(name, frameGraph);

        this._scene = scene;
        this._rtt = new RenderTargetTexture(name, 1, scene, {
            delayAllocation: true,
        });
        this._rtt.skipInitialClear = true;
        this.name = name;

        this.outputTexture = this._frameGraph.createDanglingHandle();
        this.outputDepthTexture = this._frameGraph.createDanglingHandle();
    }

    public override isReady() {
        return this._rtt.isReadyForRendering();
    }

    public record(skipCreationOfDisabledPasses = false, additionalExecute?: (context: FrameGraphRenderContext) => void) {
        if (this.destinationTexture === undefined || this.objectList === undefined) {
            throw new Error(`FrameGraphObjectRendererTask ${this.name}: destinationTexture and objectList are required`);
        }

        const outputTextureDescription = this._frameGraph.getTextureDescription(this.destinationTexture);

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

            const depthTextureDescription = this._frameGraph.getTextureDescription(this.depthTexture);
            if (depthTextureDescription.options.samples !== outputTextureDescription.options.samples) {
                throw new Error(`FrameGraphObjectRendererTask ${this.name}: the depth texture and the output texture must have the same number of samples`);
            }

            depthEnabled = true;
        }

        this._frameGraph.resolveDanglingHandle(this.outputTexture, this.destinationTexture);
        if (this.depthTexture !== undefined) {
            this._frameGraph.resolveDanglingHandle(this.outputDepthTexture, this.depthTexture);
        }

        this._rtt._size = outputTextureDescription.size;

        const pass = this._frameGraph.addRenderPass(this.name);

        pass.setRenderTarget(this.destinationTexture);
        if (this.depthTexture !== undefined) {
            pass.setRenderTargetDepth(this.depthTexture);
        }
        pass.setExecuteFunc((_context) => {
            this._rtt.renderList = this.objectList.meshes;
            this._rtt.particleSystemList = this.objectList.particleSystems;
            this._scene.incrementRenderId();
            this._scene.resetCachedMaterial();
            _context.setDepthStates(this.depthTest && depthEnabled, this.depthWrite && depthEnabled);
            _context.render(this._rtt);
            additionalExecute?.(_context);
        });

        if (this.dependencies !== undefined) {
            for (const handle of this.dependencies) {
                pass.useTexture(handle);
            }
        }

        if (!skipCreationOfDisabledPasses) {
            const passDisabled = this._frameGraph.addRenderPass(this.name + "_disabled", true);

            passDisabled.setRenderTarget(this.destinationTexture);
            if (this.depthTexture !== undefined) {
                passDisabled.setRenderTargetDepth(this.depthTexture);
            }
            passDisabled.setExecuteFunc((_context) => {});

            if (this.dependencies !== undefined) {
                for (const handle of this.dependencies) {
                    passDisabled.useTexture(handle);
                }
            }
        }
    }

    public override dispose(): void {
        this._rtt.dispose();
        super.dispose();
    }
}
