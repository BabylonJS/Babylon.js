import type { FrameGraph } from "../../frameGraph";
import {
    type FrameGraphTaskOutputReference,
    type IFrameGraphTask,
    type FrameGraphObjectList,
    type FrameGraphTextureId,
    backbufferColorTextureHandle,
    backbufferDepthStencilTextureHandle,
} from "../../frameGraphTypes";
import { RenderTargetTexture } from "../../../Materials/Textures/renderTargetTexture";
import type { Scene } from "../../../scene";
import type { Camera } from "../../../Cameras/camera";

export class FrameGraphRenderObjectsTask implements IFrameGraphTask {
    public destinationTexture?: FrameGraphTextureId;

    public depthTexture?: FrameGraphTextureId;

    private _camera: Camera;

    public get camera() {
        return this._camera;
    }

    public set camera(camera: Camera) {
        this._camera = camera;
        this._rtt.activeCamera = this.camera;
    }

    private _objectList: FrameGraphObjectList;

    public get objectList() {
        return this._objectList;
    }

    public set objectList(objectList: FrameGraphObjectList) {
        this._objectList = objectList;
        this._rtt.renderList = this.objectList.meshes;
    }

    public depthTest = true;

    public depthWrite = true;

    public readonly outputTextureReference: FrameGraphTaskOutputReference = [this, "output"];

    public readonly outputDepthTextureReference: FrameGraphTaskOutputReference = [this, "outputDepth"];

    public disabled = false;

    private _rtt: RenderTargetTexture;

    public get renderTargetTexture() {
        return this._rtt;
    }

    constructor(
        public name: string,
        scene: Scene
    ) {
        this._rtt = new RenderTargetTexture(name, 1, scene, {
            delayAllocation: true,
        });
        this._rtt.skipInitialClear = true;
    }

    public isReadyFrameGraph() {
        return this._rtt.isReadyForRendering();
    }

    public recordFrameGraph(frameGraph: FrameGraph) {
        if (this.destinationTexture === undefined) {
            throw new Error(`FrameGraphRenderObjectsTask ${this.name}: destinationTexture is required`);
        }

        const outputTextureHandle = frameGraph.getTextureHandle(this.destinationTexture);
        const textureDescription = frameGraph.getTextureDescription(outputTextureHandle);

        if (this.depthTexture !== undefined) {
            const depthTextureHandle = frameGraph.getTextureHandle(this.depthTexture);
            if (depthTextureHandle === backbufferDepthStencilTextureHandle && outputTextureHandle !== backbufferColorTextureHandle) {
                throw new Error(
                    `FrameGraphRenderObjectsTask ${this.name}: the back buffer color texture is the only color texture allowed when the depth is the back buffer depth/stencil`
                );
            }
            if (depthTextureHandle !== backbufferDepthStencilTextureHandle && outputTextureHandle === backbufferColorTextureHandle) {
                throw new Error(
                    `FrameGraphRenderObjectsTask ${this.name}: the back buffer depth/stencil texture is the only depth texture allowed when the destination is the back buffer color`
                );
            }
        }

        this._rtt._size = textureDescription.size;

        const pass = frameGraph.addRenderPass(this.name);

        pass.setRenderTarget(outputTextureHandle);
        if (this.depthTexture !== undefined) {
            pass.setRenderTargetDepth(frameGraph.getTextureHandle(this.depthTexture));
        }
        pass.setExecuteFunc((_context) => {
            _context.setDepthStates(this.depthTest, this.depthWrite);
            _context.render(this._rtt);
        });

        const passDisabled = frameGraph.addRenderPass(this.name + "_disabled", true);

        passDisabled.setRenderTarget(outputTextureHandle);
        if (this.depthTexture !== undefined) {
            passDisabled.setRenderTargetDepth(frameGraph.getTextureHandle(this.depthTexture));
        }
        passDisabled.setExecuteFunc((_context) => {});
    }

    public disposeFrameGraph(): void {
        this._rtt.dispose();
    }
}
