import { Nullable } from "../types";
import { Material } from "../Materials/material";
import { InternalTexture } from "../Materials/Textures/internalTexture";
import { PostProcess } from "./postProcess";
import { VertexBuffer } from "../Meshes/buffer";
import { Constants } from "../Engines/constants";
import { DataBuffer } from '../Meshes/dataBuffer';

declare type Scene = import("../scene").Scene;

/**
 * PostProcessManager is used to manage one or more post processes or post process pipelines
 * See https://doc.babylonjs.com/how_to/how_to_use_postprocesses
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
        var vertices = [];
        vertices.push(1, 1);
        vertices.push(-1, 1);
        vertices.push(-1, -1);
        vertices.push(1, -1);

        this._vertexBuffers[VertexBuffer.PositionKind] = new VertexBuffer(this._scene.getEngine(), vertices, VertexBuffer.PositionKind, false, false, 2);

        this._buildIndexBuffer();
    }

    private _buildIndexBuffer(): void {
        // Indices
        var indices = [];
        indices.push(0);
        indices.push(1);
        indices.push(2);

        indices.push(0);
        indices.push(2);
        indices.push(3);

        this._indexBuffer = this._scene.getEngine().createIndexBuffer(indices);
    }

    /**
     * Rebuilds the vertex buffers of the manager.
     * @hidden
     */
    public _rebuild(): void {
        let vb = this._vertexBuffers[VertexBuffer.PositionKind];

        if (!vb) {
            return;
        }
        vb._rebuild();
        this._buildIndexBuffer();
    }

    // Methods
    /**
     * Prepares a frame to be run through a post process.
     * @param sourceTexture The input texture to the post procesess. (default: null)
     * @param postProcesses An array of post processes to be run. (default: null)
     * @returns True if the post processes were able to be run.
     * @hidden
     */
    public _prepareFrame(sourceTexture: Nullable<InternalTexture> = null, postProcesses: Nullable<PostProcess[]> = null): boolean {
        let camera = this._scene.activeCamera;
        if (!camera) {
            return false;
        }

        postProcesses = postProcesses || (<Nullable<PostProcess[]>>camera._postProcesses.filter((pp) => { return pp != null; }));

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
     * @param targetTexture The target texture to render to.
     * @param forceFullscreenViewport force gl.viewport to be full screen eg. 0,0,textureWidth,textureHeight
     * @param faceIndex defines the face to render to if a cubemap is defined as the target
     * @param lodLevel defines which lod of the texture to render to
     */
    public directRender(postProcesses: PostProcess[], targetTexture: Nullable<InternalTexture> = null, forceFullscreenViewport = false, faceIndex = 0, lodLevel = 0): void {
        var engine = this._scene.getEngine();

        for (var index = 0; index < postProcesses.length; index++) {
            if (index < postProcesses.length - 1) {
                postProcesses[index + 1].activate(this._scene.activeCamera, targetTexture);
            } else {
                if (targetTexture) {
                    engine.bindFramebuffer(targetTexture, faceIndex, undefined, undefined, forceFullscreenViewport, lodLevel);
                } else {
                    engine.restoreDefaultFramebuffer();
                }
            }

            var pp = postProcesses[index];
            var effect = pp.apply();

            if (effect) {
                pp.onBeforeRenderObservable.notifyObservers(effect);

                // VBOs
                this._prepareBuffers();
                engine.bindBuffers(this._vertexBuffers, this._indexBuffer, effect);

                // Draw order
                engine.drawElementsType(Material.TriangleFillMode, 0, 6);

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
     * @param targetTexture The target texture to render to.
     * @param faceIndex The index of the face to bind the target texture to.
     * @param postProcesses The array of post processes to render.
     * @param forceFullscreenViewport force gl.viewport to be full screen eg. 0,0,textureWidth,textureHeight (default: false)
     * @hidden
     */
    public _finalizeFrame(doNotPresent?: boolean, targetTexture?: InternalTexture, faceIndex?: number, postProcesses?: Array<PostProcess>, forceFullscreenViewport = false): void {
        let camera = this._scene.activeCamera;

        if (!camera) {
            return;
        }

        postProcesses = postProcesses || <Array<PostProcess>>camera._postProcesses.filter((pp) => { return pp != null; });
        if (postProcesses.length === 0 || !this._scene.postProcessesEnabled) {
            return;
        }
        var engine = this._scene.getEngine();

        for (var index = 0, len = postProcesses.length; index < len; index++) {
            var pp = postProcesses[index];

            if (index < len - 1) {
                pp._outputTexture = postProcesses[index + 1].activate(camera, targetTexture);
            } else {
                if (targetTexture) {
                    engine.bindFramebuffer(targetTexture, faceIndex, undefined, undefined, forceFullscreenViewport);
                    pp._outputTexture = targetTexture;
                } else {
                    engine.restoreDefaultFramebuffer();
                    pp._outputTexture = null;
                }
            }

            if (doNotPresent) {
                break;
            }

            var effect = pp.apply();

            if (effect) {
                pp.onBeforeRenderObservable.notifyObservers(effect);

                // VBOs
                this._prepareBuffers();
                engine.bindBuffers(this._vertexBuffers, this._indexBuffer, effect);

                // Draw order
                engine.drawElementsType(Material.TriangleFillMode, 0, 6);

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
        var buffer = this._vertexBuffers[VertexBuffer.PositionKind];
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
