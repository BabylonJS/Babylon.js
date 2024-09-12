import type { FrameGraph } from "../../frameGraph";
import type { FrameGraphTaskOutputReference, IFrameGraphTask, FrameGraphTextureId, FrameGraphObjectListId } from "../../frameGraphTypes";
import { backbufferColorTextureHandle, backbufferDepthStencilTextureHandle } from "../../frameGraphTypes";
import { RenderTargetTexture } from "../../../Materials/Textures/renderTargetTexture";
import type { Scene } from "../../../scene";
import type { Camera } from "../../../Cameras/camera";

export class FrameGraphObjectRendererTask implements IFrameGraphTask {
    public destinationTexture: FrameGraphTextureId;

    public depthTexture?: FrameGraphTextureId;

    public dependencies?: FrameGraphTextureId[] = [];

    private _camera: Camera;

    public get camera() {
        return this._camera;
    }

    public set camera(camera: Camera) {
        this._camera = camera;
        this._rtt.activeCamera = this.camera;
    }

    public objectList: FrameGraphObjectListId;

    public depthTest = true;

    public depthWrite = true;

    public readonly outputTextureReference: FrameGraphTaskOutputReference = [this, "output"];

    public readonly outputDepthTextureReference: FrameGraphTaskOutputReference = [this, "outputDepth"];

    public disabled = false;

    private _scene: Scene;
    private _rtt: RenderTargetTexture;

    public get renderTargetTexture() {
        return this._rtt;
    }

    private _name: string;

    public get name() {
        return this._name;
    }

    public set name(value: string) {
        this._name = value;
        this._rtt.name = value + "_internal_rtt";
    }

    constructor(name: string, scene: Scene) {
        this._scene = scene;
        this._rtt = new RenderTargetTexture(name, 1, scene, {
            delayAllocation: true,
        });
        this._rtt.skipInitialClear = true;
        this.name = name;
    }

    public isReadyFrameGraph() {
        return this._rtt.isReadyForRendering();
    }

    public recordFrameGraph(frameGraph: FrameGraph) {
        if (this.destinationTexture === undefined || this.objectList === undefined) {
            throw new Error(`FrameGraphObjectRendererTask ${this.name}: destinationTexture and objectList are required`);
        }

        const outputTextureHandle = frameGraph.getTextureHandle(this.destinationTexture);
        const outputTextureDescription = frameGraph.getTextureDescription(outputTextureHandle);

        let depthEnabled = false;

        if (this.depthTexture !== undefined) {
            const depthTextureHandle = frameGraph.getTextureHandle(this.depthTexture);
            if (depthTextureHandle === backbufferDepthStencilTextureHandle && outputTextureHandle !== backbufferColorTextureHandle) {
                throw new Error(
                    `FrameGraphObjectRendererTask ${this.name}: the back buffer color texture is the only color texture allowed when the depth is the back buffer depth/stencil`
                );
            }
            if (depthTextureHandle !== backbufferDepthStencilTextureHandle && outputTextureHandle === backbufferColorTextureHandle) {
                throw new Error(
                    `FrameGraphObjectRendererTask ${this.name}: the back buffer depth/stencil texture is the only depth texture allowed when the destination is the back buffer color`
                );
            }

            const depthTextureDescription = frameGraph.getTextureDescription(depthTextureHandle);
            if (depthTextureDescription.options.samples !== outputTextureDescription.options.samples) {
                throw new Error(`FrameGraphObjectRendererTask ${this.name}: the depth texture and the output texture must have the same number of samples`);
            }

            depthEnabled = true;
        }

        this._rtt._size = outputTextureDescription.size;

        const objectList = frameGraph.getObjectList(this.objectList);

        const pass = frameGraph.addRenderPass(this.name);

        pass.setRenderTarget(outputTextureHandle);
        if (this.depthTexture !== undefined) {
            pass.setRenderTargetDepth(frameGraph.getTextureHandle(this.depthTexture));
        }
        pass.setExecuteFunc((_context) => {
            this._rtt.renderList = objectList.meshes;
            this._rtt.particleSystemList = objectList.particleSystems;
            this._scene.incrementRenderId();
            _context.setDepthStates(this.depthTest && depthEnabled, this.depthWrite && depthEnabled);
            _context.render(this._rtt);
        });

        const passDisabled = frameGraph.addRenderPass(this.name + "_disabled", true);

        passDisabled.setRenderTarget(outputTextureHandle);
        if (this.depthTexture !== undefined) {
            passDisabled.setRenderTargetDepth(frameGraph.getTextureHandle(this.depthTexture));
        }
        passDisabled.setExecuteFunc((_context) => {});

        if (this.dependencies !== undefined) {
            for (const texture of this.dependencies) {
                const handle = frameGraph.getTextureHandle(texture);
                pass.useTexture(handle);
                passDisabled.useTexture(handle);
            }
        }
    }

    public disposeFrameGraph(): void {
        this._rtt.dispose();
    }
}
