import type { FrameGraph } from "../frameGraph";
import type { FrameGraphTaskOutputReference, IFrameGraphTask } from "./IFrameGraphTask";
import type { TextureHandle } from "../frameGraphTextureManager";
import { RenderTargetTexture } from "../../Materials/Textures/renderTargetTexture";
import type { Scene } from "../../scene";
import type { Camera } from "../../Cameras/camera";
import type { AbstractMesh } from "../../Meshes/abstractMesh";
import type { IParticleSystem } from "../../Particles/IParticleSystem";

export type FrameGraphObjectList = {
    meshes: AbstractMesh[];
    particleSystems: IParticleSystem[];
};

export class FrameGraphRenderObjectsTask implements IFrameGraphTask {
    public destinationTexture?: FrameGraphTaskOutputReference | TextureHandle;

    public depthTexture?: FrameGraphTaskOutputReference | TextureHandle;

    public camera: Camera;

    public objectList: FrameGraphObjectList;

    public readonly outputTextureReference: FrameGraphTaskOutputReference = [this, "output"];

    public readonly outputDepthTextureReference: FrameGraphTaskOutputReference = [this, "outputDepth"];

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
        if (this.destinationTexture === undefined) {
            throw new Error(`FrameGraphRenderObjectsTask ${this.name}: destinationTexture is required`);
        }

        const outputTextureHandle = frameGraph.getTextureHandle(this.destinationTexture);
        const textureDescription = frameGraph.getTextureDescription(outputTextureHandle);

        this._rtt._size = textureDescription.size;

        const pass = frameGraph.addRenderPass(this.name);

        pass.setRenderTarget(outputTextureHandle);
        if (this.depthTexture !== undefined) {
            pass.setRenderTargetDepth(frameGraph.getTextureHandle(this.depthTexture));
        }
        pass.setExecuteFunc((_context) => {
            this._scene.resetCachedMaterial();

            this._rtt.activeCamera = this.camera;
            this._rtt.renderList = this.objectList.meshes;
            this._rtt.render();
        });

        const passDisabled = frameGraph.addRenderPass(this.name + "_disabled", true);

        passDisabled.setRenderTarget(outputTextureHandle);
        passDisabled.setExecuteFunc((_context) => {});
    }

    public disposeFrameGraph(): void {
        this._rtt.dispose();
    }
}
