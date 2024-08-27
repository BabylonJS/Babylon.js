import type { Nullable } from "../types";
import type { InternalTexture } from "../Materials/Textures/internalTexture";
import type { PostProcess } from "./postProcess";
import { VertexBuffer } from "../Buffers/buffer";
import { Constants } from "../Engines/constants";
import type { DataBuffer } from "../Buffers/dataBuffer";
import type { RenderTargetWrapper } from "../Engines/renderTargetWrapper";
import { Observable } from "../Misc/observable";
import type { Scene } from "../scene";

/**
 * PostProcessManager is used to manage one or more post processes or post process pipelines
 * See https://doc.babylonjs.com/features/featuresDeepDive/postProcesses/usePostProcesses
 */
export class PostProcessManager {
    private _scene: Scene;
    private _indexBuffer: Nullable<DataBuffer>;
    private _vertexBuffers: { [key: string]: Nullable<VertexBuffer> } = {};

    /**
     * Creates a new instance PostProcess
     * @param scene The scene that the post process is associated with.
     */
    constructor(scene: Scene) {
        this._scene = scene;
    }

    private _prepareBuffers(): void {
        if (this._vertexBuffers[VertexBuffer.PositionKind]) {
            return;
        }

        // VBO
        const vertices = [];
        vertices.push(1, 1);
        vertices.push(-1, 1);
        vertices.push(-1, -1);
        vertices.push(1, -1);

        this._vertexBuffers[VertexBuffer.PositionKind] = new VertexBuffer(this._scene.getEngine(), vertices, VertexBuffer.PositionKind, false, false, 2);

        this._buildIndexBuffer();
    }

    private _buildIndexBuffer(): void {
        // Indices
        const indices = [];
        indices.push(0);
        indices.push(1);
        indices.push(2);

        indices.push(0);
        indices.push(2);
        indices.push(3);

        this._indexBuffer = this._scene.getEngine().createIndexBuffer(indices);
    }

    public onBeforeRenderObservable = new Observable<PostProcessManager>();

    /**
     * Rebuilds the vertex buffers of the manager.
     * @internal
     */
    public _rebuild(): void {
        const vb = this._vertexBuffers[VertexBuffer.PositionKind];

        if (!vb) {
            return;
        }
        vb._rebuild();
        this._buildIndexBuffer();
    }

    // Methods
    /**
     * Prepares a frame to be run through a post process.
     * @param sourceTexture The input texture to the post processes. (default: null)
     * @param postProcesses An array of post processes to be run. (default: null)
     * @returns True if the post processes were able to be run.
     * @internal
     */
    public _prepareFrame(sourceTexture: Nullable<InternalTexture> = null, postProcesses: Nullable<PostProcess[]> = null): boolean {
        const camera = this._scene.activeCamera;
        if (!camera) {
            return false;
        }

        postProcesses = postProcesses || <Nullable<PostProcess[]>>camera._postProcesses.filter((pp) => {
                return pp != null;
            });

        if (!postProcesses || postProcesses.length === 0 || !this._scene.postProcessesEnabled) {
            return false;
        }

        postProcesses[0].activate(camera, sourceTexture, postProcesses !== null && postProcesses !== undefined);
        return true;
    }

    /**
     * Manually render a set of post processes to a texture.
     * Please note, the frame buffer won't be unbound after the call in case you have more render to do.
     * @param postProcesses An array of post processes to be run.
     * @param targetTexture The render target wrapper to render to.
     * @param forceFullscreenViewport force gl.viewport to be full screen eg. 0,0,textureWidth,textureHeight
     * @param faceIndex defines the face to render to if a cubemap is defined as the target
     * @param lodLevel defines which lod of the texture to render to
     * @param doNotBindFrambuffer If set to true, assumes that the framebuffer has been bound previously
     */
    public directRender(
        postProcesses: PostProcess[],
        targetTexture: Nullable<RenderTargetWrapper> = null,
        forceFullscreenViewport = false,
        faceIndex = 0,
        lodLevel = 0,
        doNotBindFrambuffer = false
    ): void {
        const engine = this._scene.getEngine();

        for (let index = 0; index < postProcesses.length; index++) {
            if (index < postProcesses.length - 1) {
                postProcesses[index + 1].activate(this._scene.activeCamera, targetTexture?.texture);
            } else {
                if (targetTexture) {
                    engine.bindFramebuffer(targetTexture, faceIndex, undefined, undefined, forceFullscreenViewport, lodLevel);
                } else if (!doNotBindFrambuffer) {
                    engine.restoreDefaultFramebuffer();
                }
                engine._debugInsertMarker?.(`post process ${postProcesses[index].name} output`);
            }

            const pp = postProcesses[index];
            const effect = pp.apply();

            if (effect) {
                pp.onBeforeRenderObservable.notifyObservers(effect);

                // VBOs
                this._prepareBuffers();
                engine.bindBuffers(this._vertexBuffers, this._indexBuffer, effect);

                // Draw order
                engine.drawElementsType(Constants.MATERIAL_TriangleFillMode, 0, 6);

                pp.onAfterRenderObservable.notifyObservers(effect);
            }
        }

        // Restore depth buffer
        engine.setDepthBuffer(true);
        engine.setDepthWrite(true);
    }

    /**
     * Finalize the result of the output of the postprocesses.
     * @param doNotPresent If true the result will not be displayed to the screen.
     * @param targetTexture The render target wrapper to render to.
     * @param faceIndex The index of the face to bind the target texture to.
     * @param postProcesses The array of post processes to render.
     * @param forceFullscreenViewport force gl.viewport to be full screen eg. 0,0,textureWidth,textureHeight (default: false)
     * @internal
     */
    public _finalizeFrame(
        doNotPresent?: boolean,
        targetTexture?: RenderTargetWrapper,
        faceIndex?: number,
        postProcesses?: Array<PostProcess>,
        forceFullscreenViewport = false
    ): void {
        const camera = this._scene.activeCamera;

        if (!camera) {
            return;
        }

        this.onBeforeRenderObservable.notifyObservers(this);

        postProcesses = postProcesses || <Array<PostProcess>>camera._postProcesses.filter((pp) => {
                return pp != null;
            });
        if (postProcesses.length === 0 || !this._scene.postProcessesEnabled) {
            return;
        }
        const engine = this._scene.getEngine();

        for (let index = 0, len = postProcesses.length; index < len; index++) {
            const pp = postProcesses[index];

            if (index < len - 1) {
                pp._outputTexture = postProcesses[index + 1].activate(camera, targetTexture?.texture);
            } else {
                if (targetTexture) {
                    engine.bindFramebuffer(targetTexture, faceIndex, undefined, undefined, forceFullscreenViewport);
                    pp._outputTexture = targetTexture;
                } else {
                    engine.restoreDefaultFramebuffer();
                    pp._outputTexture = null;
                }
                engine._debugInsertMarker?.(`post process ${postProcesses[index].name} output`);
            }

            if (doNotPresent) {
                break;
            }

            const effect = pp.apply();

            if (effect) {
                pp.onBeforeRenderObservable.notifyObservers(effect);

                // VBOs
                this._prepareBuffers();
                engine.bindBuffers(this._vertexBuffers, this._indexBuffer, effect);

                // Draw order
                engine.drawElementsType(Constants.MATERIAL_TriangleFillMode, 0, 6);

                pp.onAfterRenderObservable.notifyObservers(effect);
            }
        }

        // Restore states
        engine.setDepthBuffer(true);
        engine.setDepthWrite(true);
        engine.setAlphaMode(Constants.ALPHA_DISABLE);
    }

    /**
     * Disposes of the post process manager.
     */
    public dispose(): void {
        const buffer = this._vertexBuffers[VertexBuffer.PositionKind];
        if (buffer) {
            buffer.dispose();
            this._vertexBuffers[VertexBuffer.PositionKind] = null;
        }

        if (this._indexBuffer) {
            this._scene.getEngine()._releaseBuffer(this._indexBuffer);
            this._indexBuffer = null;
        }
    }
}
