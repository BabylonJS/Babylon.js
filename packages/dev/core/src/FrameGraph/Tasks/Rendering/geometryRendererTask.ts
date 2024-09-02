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

export interface IFrameGraphGeometryRendererTextureDescription {
    type: number;
    textureType: number;
    textureFormat: number;
}

export class FrameGraphGeometryRendererTask implements IFrameGraphTask {
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

    public geometryTextureSize: { width: number; height: number } = { width: 100, height: 100 };
    public geometryTextureSizeIsPercentage = true;
    public geometryTextureSamples = 1;
    public geometryTextureDescriptions: IFrameGraphGeometryRendererTextureDescription[] = [];

    public readonly outputTextureReference: FrameGraphTaskOutputReference = [this, "output"];

    public readonly outputDepthTextureReference: FrameGraphTaskOutputReference = [this, "outputDepth"];

    public readonly geometryDepthTextureReference: FrameGraphTaskOutputReference = [this, "geometryDepth"];

    public readonly geometryNormalTextureReference: FrameGraphTaskOutputReference = [this, "geometryNormal"];

    public readonly geometryPositionTextureReference: FrameGraphTaskOutputReference = [this, "geometryPosition"];

    public readonly geometryAlbedoTextureReference: FrameGraphTaskOutputReference = [this, "geometryAlbedo"];

    public readonly geometryReflectivityTextureReference: FrameGraphTaskOutputReference = [this, "geometryReflectivity"];

    public readonly geometryVelocityTextureReference: FrameGraphTaskOutputReference = [this, "geometryVelocity"];

    public disabled = false;

    private _scene: Scene;
    private _rtt: RenderTargetTexture;

    public get renderTargetTexture() {
        return this._rtt;
    }

    constructor(
        public name: string,
        scene: Scene
    ) {
        this._scene = scene;
        this._rtt = new RenderTargetTexture(name, 1, scene, {
            delayAllocation: true,
        });
        this._rtt.skipInitialClear = true;
    }

    public isReadyFrameGraph() {
        return this._rtt.isReadyForRendering();
    }

    public recordFrameGraph(frameGraph: FrameGraph) {
        if (this.geometryTextureDescriptions.length === 0) {
            throw new Error(`FrameGraphGeometryRendererTask ${this.name}: at least one geometry texture description must be provided`);
        }

        // TODO: create a multi render target texture if there are more than one geometry texture
        const outputTextureHandle = frameGraph.createRenderTargetTexture(this.name, {
            size: this.geometryTextureSize,
            sizeIsPercentage: this.geometryTextureSizeIsPercentage,
            options: {
                samples: this.geometryTextureSamples,
                type: this.geometryTextureDescriptions[0].textureType,
                format: this.geometryTextureDescriptions[0].textureFormat,
            },
        });

        const outputTextureDescription = frameGraph.getTextureDescription(outputTextureHandle);

        let depthEnabled = false;

        if (this.depthTexture !== undefined) {
            const depthTextureHandle = frameGraph.getTextureHandle(this.depthTexture);
            if (depthTextureHandle === backbufferDepthStencilTextureHandle && outputTextureHandle !== backbufferColorTextureHandle) {
                throw new Error(
                    `FrameGraphGeometryRendererTask ${this.name}: the back buffer color texture is the only color texture allowed when the depth is the back buffer depth/stencil`
                );
            }
            if (depthTextureHandle !== backbufferDepthStencilTextureHandle && outputTextureHandle === backbufferColorTextureHandle) {
                throw new Error(
                    `FrameGraphGeometryRendererTask ${this.name}: the back buffer depth/stencil texture is the only depth texture allowed when the destination is the back buffer color`
                );
            }

            const depthTextureDescription = frameGraph.getTextureDescription(depthTextureHandle);
            if (depthTextureDescription.options.samples !== outputTextureDescription.options.samples) {
                throw new Error(`FrameGraphGeometryRendererTask ${this.name}: the depth texture and the output texture must have the same number of samples`);
            }

            depthEnabled = true;
        }

        this._rtt._size = outputTextureDescription.size;

        const pass = frameGraph.addRenderPass(this.name);

        pass.setRenderTarget(outputTextureHandle);
        pass.setOutputTexture(outputTextureHandle, 0, "geometryDepth"); // TODO: fix this and all the other output textures
        if (this.depthTexture !== undefined) {
            pass.setRenderTargetDepth(frameGraph.getTextureHandle(this.depthTexture));
        }
        pass.setExecuteFunc((_context) => {
            this._scene.incrementRenderId();
            _context.setDepthStates(this.depthTest && depthEnabled, this.depthWrite && depthEnabled);
            // TODO: clear all targets
            _context.render(this._rtt);
        });
    }

    public disposeFrameGraph(): void {
        this._rtt.dispose();
    }
}
