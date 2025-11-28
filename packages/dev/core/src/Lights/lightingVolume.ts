import type { AbstractEngine, Engine, Nullable, RenderTargetWrapper, Scene, ShadowGenerator, WebGPUEngine } from "core/index";
import { AbortError } from "core/Misc/error";
import { Constants } from "core/Engines/constants";
import { Matrix, Vector3 } from "core/Maths/math.vector";
import { DirectionalLight } from "core/Lights/directionalLight";
import { Mesh } from "core/Meshes/mesh";
import { ComputeShader } from "core/Compute/computeShader";
import { CopyTextureToTexture } from "core/Misc/copyTextureToTexture";
import { UniformBuffer } from "core/Materials/uniformBuffer";
import { StorageBuffer } from "core/Buffers/storageBuffer";
import { BaseTexture } from "core/Materials/Textures/baseTexture";
import { VertexBuffer } from "core/Buffers/buffer";

import "core/ShadersWGSL/lightingVolume.compute";

const InvViewProjMatrix = new Matrix();
const TmpVec3 = new Vector3();

/**
 * Class used to create a lighting volume from a directional light's shadow generator.
 */
export class LightingVolume {
    private readonly _engine: AbstractEngine;
    private readonly _scene: Scene;
    private readonly _mesh: Mesh;
    private readonly _copyTexture?: CopyTextureToTexture;
    private readonly _uBuffer?: UniformBuffer;
    private _name: string;
    private _cs?: ComputeShader;
    private _light?: DirectionalLight;
    private _fallbackTexture?: BaseTexture;
    private _storageBuffer?: StorageBuffer;
    private _depthCopy?: RenderTargetWrapper;
    private _readPixelPromise: Nullable<Promise<ArrayBufferView>> = null;
    private _readPixelAbortController: Nullable<AbortController> = null;
    private _numFrames = 0;
    private _firstUpdate = true;

    private _shadowGenerator?: ShadowGenerator;
    /**
     * The shadow generator used to create the lighting volume.
     */
    public get shadowGenerator() {
        return this._shadowGenerator!;
    }

    public set shadowGenerator(sg: ShadowGenerator) {
        const light = sg.getLight();

        if (!(light instanceof DirectionalLight)) {
            throw new Error(`LightingVolumeMesh ${this._name}: light must be a directional light`);
        }

        this._shadowGenerator = sg;
        this._light = light;

        this._createGeometry();

        if (!this._engine.isWebGPU) {
            this._createFallbackTextures();
        }

        const depthTexture = this._shadowGenerator.getShadowMap()?.depthStencilTexture;
        if (this._cs && depthTexture) {
            this._cs.setInternalTexture("shadowMap", depthTexture);
        }
    }

    private _tesselation = 0;
    /**
     * The tesselation level of the lighting volume.
     */
    public get tesselation() {
        return this._tesselation;
    }

    public set tesselation(n: number) {
        this._tesselation = n;
        this._createGeometry();
    }

    private _buildFullVolume = false;
    /**
     * Indicates whether to build the full volume (true) or only the near plane (false). Default is false.
     */
    public get buildFullVolume() {
        return this._buildFullVolume;
    }

    public set buildFullVolume(value: boolean) {
        if (this._buildFullVolume === value) {
            return;
        }
        this._buildFullVolume = value;
        this._createGeometry();
        if (this._engine.isWebGPU) {
            this._createComputeShader();
        }
        this._firstUpdate = true;
    }

    /**
     * The mesh used as a support for the lighting volume.
     * Note that this mesh is not automatically added to the scene's mesh array.
     * If you want to render it, you need to add it manually.
     */
    public get mesh() {
        return this._mesh;
    }

    private _frequency = 1;

    /**
     * The frequency (in number of times you call updateMesh) at which the lighting volume is updated.
     */
    public get frequency() {
        return this._frequency;
    }

    public set frequency(value: number) {
        this._frequency = value;
        this._firstUpdate = true;
    }

    /**
     * The name of the lighting volume.
     */
    public get name() {
        return this._name;
    }

    public set name(name: string) {
        this._name = name;
        if (this._mesh) {
            this._mesh.name = name;
        }
    }

    /**
     * Indicates whether this is the first update of the lighting volume.
     * If true, the volume has not yet been updated for the first time.
     */
    public get firstUpdate() {
        return this._firstUpdate;
    }

    /**
     * Creates a new LightingVolume.
     * @param name The name of the lighting volume.
     * @param scene The scene the lighting volume belongs to.
     * @param shadowGenerator The shadow generator used to create the lighting volume. This is optional in the constructor, but must be set before calling updateMesh.
     * @param tesselation The tesselation level of the lighting volume (default: 64).
     */
    constructor(name: string, scene: Scene, shadowGenerator?: ShadowGenerator, tesselation = 64) {
        const light = shadowGenerator ? shadowGenerator.getLight() : undefined;

        if (light && !(light instanceof DirectionalLight)) {
            throw new Error(`LightingVolumeMesh ${name}: light must be a directional light`);
        }

        this._name = name;
        this._shadowGenerator = shadowGenerator;
        this._light = light as DirectionalLight;

        this._engine = scene.getEngine();
        this._scene = scene;

        this._mesh = new Mesh(name, this._scene);
        scene.meshes.splice(scene.meshes.indexOf(this._mesh), 1);

        if (this._engine.isWebGPU) {
            this._uBuffer = new UniformBuffer(this._engine);

            this._uBuffer.addUniform("invViewProjMatrix", 16);
            this._uBuffer.addUniform("startVertexIndex", 1);
            this._uBuffer.addUniform("step", 1);
            this._uBuffer.addUniform("tesselation", 1);
            this._uBuffer.update();

            this._createComputeShader();
        } else {
            this._copyTexture = new CopyTextureToTexture(this._engine, false, true);
            this._createFallbackTextures();
        }

        this._tesselation = tesselation;
        this._createGeometry();
    }

    /**
     * Checks if the lighting volume is ready to be updated.
     * @returns True if the volume is ready to be updated.
     */
    public isReady() {
        let isReady = this._mesh.isReady(true);
        if (this._cs) {
            isReady = this._cs.isReady() && isReady;
        }
        return isReady;
    }

    /**
     * Updates the lighting volume mesh.
     * @param forceUpdate If true, forces the update even if the frequency condition is not met.
     */
    public update(forceUpdate = false) {
        if (this._tesselation === 0 || !this._shadowGenerator) {
            return;
        }

        if (!forceUpdate && !this._firstUpdate && (this.frequency === 0 || ++this._numFrames < this.frequency)) {
            return;
        }

        this._numFrames = 0;

        if (this._cs && this._uBuffer) {
            const dispatchSize = Math.ceil((this._tesselation + 1) / 8);

            const viewProjMatrix = this._shadowGenerator.getTransformMatrix();
            viewProjMatrix.invertToRef(InvViewProjMatrix);

            this._uBuffer.updateMatrix("invViewProjMatrix", InvViewProjMatrix);
            this._uBuffer.update();

            this._engine._debugPushGroup?.(`Update lighting volume (${this._name})`, 1);
            this._cs.dispatch(dispatchSize, dispatchSize, 1);
            this._engine._debugPopGroup?.(1);

            this._firstUpdate = false;
        } else {
            try {
                void this._fallbackReadPixelAsync();
            } catch {
                this._readPixelPromise = null;
            }
        }
    }

    /**
     * Disposes the lighting volume and associated resources.
     */
    public dispose() {
        this._readPixelAbortController?.abort(new AbortError("LightingVolume is disposed"));
        this._readPixelAbortController = null;
        this._mesh.dispose();
        if (this._fallbackTexture) {
            this._fallbackTexture._texture = null;
        }
        this._fallbackTexture?.dispose();
        this._copyTexture?.dispose();
        this._storageBuffer?.dispose();
        this._uBuffer?.dispose();
        this._depthCopy?.dispose();
    }

    private _createComputeShader() {
        this._cs = new ComputeShader("createLightVolume", this._engine, "lightingVolume", {
            bindingsMapping: {
                shadowMap: { group: 0, binding: 0 },
                params: { group: 0, binding: 1 },
                positions: { group: 0, binding: 2 },
            },
            defines: !this._buildFullVolume ? ["#define KEEP_EDGES", "#define MOVE_FAR_DEPTH_TO_NEAR"] : undefined,
        });

        if (this._shadowGenerator) {
            const depthTexture = this._shadowGenerator.getShadowMap()?.depthStencilTexture;
            if (depthTexture) {
                this._cs.setInternalTexture("shadowMap", depthTexture);
            }
        }

        if (this._uBuffer) {
            this._cs.setUniformBuffer("params", this._uBuffer);
        }
        if (this._storageBuffer) {
            this._cs.setStorageBuffer("positions", this._storageBuffer);
        }
    }

    private _createFallbackTextures() {
        if (!this._shadowGenerator) {
            return;
        }

        this._readPixelAbortController?.abort(new AbortError("Fallback textures are being (re)created"));
        this._readPixelAbortController = new AbortController();

        const mapSize = this._shadowGenerator.mapSize;

        this._depthCopy?.dispose();
        this._depthCopy = this._engine.createRenderTargetTexture(
            { width: mapSize, height: mapSize },
            {
                type: Constants.TEXTURETYPE_FLOAT,
                format: Constants.TEXTUREFORMAT_RED,
                samples: 1,
                label: `${this._name} - fallback internal texture`,
                generateDepthBuffer: false,
            }
        );

        this._fallbackTexture?.dispose();
        this._fallbackTexture = new BaseTexture(this._scene, this._depthCopy.texture);
        this._fallbackTexture.name = `${this._name} - fallback texture`;
    }

    private async _fallbackReadPixelAsync() {
        if (this._readPixelPromise || !this._fallbackTexture || !this._copyTexture) {
            return;
        }

        const abortController = this._readPixelAbortController;

        abortController?.signal.throwIfAborted();

        const engine = this._engine as Engine;

        const shadowGenerator = this._shadowGenerator;
        const shadowMapDepthTexture = shadowGenerator?.getShadowMap()?.depthStencilTexture;

        if (!shadowMapDepthTexture) {
            return;
        }

        // Copies the shadow map of the shadow generator into _depthCopy
        // That's because we can't read from a depth attachment texture in WebGL. We must first copy it to a regular texture.
        engine.updateTextureSamplingMode(Constants.TEXTURE_NEAREST_SAMPLINGMODE, shadowMapDepthTexture);
        engine.updateTextureComparisonFunction(shadowMapDepthTexture, 0);

        this._copyTexture.copy(shadowMapDepthTexture, this._depthCopy);

        engine.updateTextureComparisonFunction(shadowMapDepthTexture, Constants.LESS);

        // Gets the texture from GPU to CPU
        this._readPixelPromise = this._fallbackTexture.readPixels(0, 0, undefined, true, false);
        if (!this._readPixelPromise) {
            return;
        }

        const buffer = await this._readPixelPromise;

        abortController?.signal.throwIfAborted();

        const depthValues = buffer as Float32Array;
        const positions = this._mesh.getVerticesData("position");
        const numTesselation = this._tesselation;
        const startPos = this._buildFullVolume ? (numTesselation + 1) * 4 * 3 : 4 * 3;
        const mapSize = shadowGenerator.mapSize;
        const step = (mapSize - 1) / numTesselation;

        if (!positions) {
            this._readPixelPromise = null;
            return;
        }

        const halfTesselation = numTesselation / 2;

        const invViewProjMatrix = shadowGenerator.getTransformMatrix().clone();
        invViewProjMatrix.invertToRef(invViewProjMatrix);

        const factor = 4;

        let posIndex = startPos;
        let stepY = 0;
        for (let y = 0; y < numTesselation + 1; ++y) {
            for (let x = 0; x < numTesselation + 1; ++x) {
                let depth = depthValues[Math.floor(mapSize * Math.floor(stepY) + x * step) * factor];
                if (!this._buildFullVolume) {
                    if (y === 0 || x === 0 || y === numTesselation || x === numTesselation) {
                        posIndex += 3;
                        continue;
                    }
                    if (depth === 1) {
                        depth = 0;
                    }
                }

                TmpVec3.set((x - halfTesselation) / halfTesselation, (y - halfTesselation) / halfTesselation, -1 + 2 * depth);

                Vector3.TransformCoordinatesToRef(TmpVec3, invViewProjMatrix, TmpVec3);

                positions[posIndex] = TmpVec3.x;
                positions[posIndex + 1] = TmpVec3.y;
                positions[posIndex + 2] = TmpVec3.z;
                posIndex += 3;
            }
            stepY += step;
        }

        this._mesh.setVerticesData("position", positions);

        this._readPixelPromise = null;
        this._firstUpdate = false;
    }

    private _createGeometry() {
        if (!this._light) {
            return;
        }

        this._tesselation = Math.max(Math.ceil(this._tesselation) & ~1, 2);

        const light = this._light;

        const min = new Vector3(light.orthoLeft, light.orthoBottom, light.shadowMinZ ?? Constants.ShadowMinZ);
        const max = new Vector3(light.orthoRight, light.orthoTop, light.shadowMaxZ ?? Constants.ShadowMaxZ);

        const invViewMatrix = Matrix.LookAtLH(light.position, light.position.add(light.direction), Vector3.UpReadOnly);
        invViewMatrix.invertToRef(invViewMatrix);

        const positions: number[] = [];
        const indices: number[] = [];

        const numTesselation = this._tesselation;
        const stepX = (max.x - min.x) / numTesselation;
        const stepY = (max.y - min.y) / numTesselation;
        const v = new Vector3();

        const startFarIndices = this._buildFullVolume ? (numTesselation + 1) * 4 : 4;

        if (this._buildFullVolume) {
            let startIndices = 0;

            // Right faces of the frustum
            for (let i = 0; i <= numTesselation; ++i) {
                v.set(max.x, min.y + i * stepY, min.z);

                const p = Vector3.TransformCoordinates(v, invViewMatrix);
                positions.push(p.x, p.y, p.z);

                if (i < numTesselation) {
                    indices.push(startIndices + i, startFarIndices + numTesselation + (i + 1) * (numTesselation + 1), startFarIndices + numTesselation + i * (numTesselation + 1));
                    indices.push(startIndices + i, startIndices + i + 1, startFarIndices + numTesselation + (i + 1) * (numTesselation + 1));
                }
            }

            const n0 = 0;
            const n1 = positions.length / 3 - 1;
            const n2 = n1 + 1;

            startIndices = positions.length / 3;

            // Left faces of the frustum
            for (let i = 0; i <= numTesselation; ++i) {
                v.set(min.x, min.y + i * stepY, min.z);

                const p = Vector3.TransformCoordinates(v, invViewMatrix);
                positions.push(p.x, p.y, p.z);

                if (i < numTesselation) {
                    indices.push(startIndices + i, startFarIndices + 0 + i * (numTesselation + 1), startFarIndices + 0 + (i + 1) * (numTesselation + 1));
                    indices.push(startIndices + i, startFarIndices + 0 + (i + 1) * (numTesselation + 1), startIndices + i + 1);
                }
            }

            const n3 = positions.length / 3 - 1;

            startIndices = positions.length / 3;

            // Bottom faces of the frustum
            for (let i = 0; i <= numTesselation; ++i) {
                v.set(min.x + i * stepX, min.y, min.z);

                const p = Vector3.TransformCoordinates(v, invViewMatrix);
                positions.push(p.x, p.y, p.z);

                if (i < numTesselation) {
                    indices.push(startIndices + i, startIndices + i + 1, startFarIndices + i + 0 * (numTesselation + 1));
                    indices.push(startIndices + i + 1, startFarIndices + i + 1 + 0 * (numTesselation + 1), startFarIndices + i + 0 * (numTesselation + 1));
                }
            }

            startIndices = positions.length / 3;

            // Top faces of the frustum
            for (let i = 0; i <= numTesselation; ++i) {
                v.set(min.x + i * stepX, max.y, min.z);

                const p = Vector3.TransformCoordinates(v, invViewMatrix);
                positions.push(p.x, p.y, p.z);

                if (i < numTesselation) {
                    indices.push(startIndices + i, startFarIndices + i + numTesselation * (numTesselation + 1), startIndices + i + 1);
                    indices.push(
                        startIndices + i + 1,
                        startFarIndices + i + numTesselation * (numTesselation + 1),
                        startFarIndices + i + 1 + numTesselation * (numTesselation + 1)
                    );
                }
            }

            startIndices = positions.length / 3;

            // Near faces of the frustum
            indices.push(n0, n2, n1);
            indices.push(n2, n3, n1);
        } else {
            let p: Vector3;

            v.set(max.x, min.y, min.z);
            p = Vector3.TransformCoordinates(v, invViewMatrix);
            positions.push(p.x, p.y, p.z);

            v.set(max.x, max.y, min.z);
            p = Vector3.TransformCoordinates(v, invViewMatrix);
            positions.push(p.x, p.y, p.z);

            v.set(min.x, min.y, min.z);
            p = Vector3.TransformCoordinates(v, invViewMatrix);
            positions.push(p.x, p.y, p.z);

            v.set(min.x, max.y, min.z);
            p = Vector3.TransformCoordinates(v, invViewMatrix);
            positions.push(p.x, p.y, p.z);

            indices.push(0, 2, 1);
            indices.push(2, 3, 1);
        }

        // Tesselate the near plane
        let y = min.y;
        for (let iy = 0; iy <= numTesselation; ++iy) {
            let x = min.x;
            for (let ix = 0; ix <= numTesselation; ++ix) {
                v.set(x, y, min.z);

                const p = Vector3.TransformCoordinates(v, invViewMatrix);
                positions.push(p.x, p.y, p.z);

                if (ix < numTesselation && iy < numTesselation) {
                    indices.push(
                        startFarIndices + ix + iy * (numTesselation + 1),
                        startFarIndices + ix + 1 + iy * (numTesselation + 1),
                        startFarIndices + ix + 1 + (iy + 1) * (numTesselation + 1)
                    );
                    indices.push(
                        startFarIndices + ix + iy * (numTesselation + 1),
                        startFarIndices + ix + 1 + (iy + 1) * (numTesselation + 1),
                        startFarIndices + ix + (iy + 1) * (numTesselation + 1)
                    );
                }
                x += stepX;
            }
            y += stepY;
        }

        if (this._uBuffer && this._cs) {
            const webGPUEngine = this._engine as WebGPUEngine;

            this._storageBuffer?.dispose();
            this._storageBuffer = new StorageBuffer(webGPUEngine, positions.length * 4, Constants.BUFFER_CREATIONFLAG_VERTEX | Constants.BUFFER_CREATIONFLAG_READWRITE);

            this._storageBuffer.update(positions);

            const vertexBuffer = new VertexBuffer(webGPUEngine, this._storageBuffer.getBuffer(), "position");

            this._mesh.setVerticesBuffer(vertexBuffer);

            this._cs.setStorageBuffer("positions", this._storageBuffer);

            this._uBuffer.updateUInt("startVertexIndex", this._buildFullVolume ? (numTesselation + 1) * 4 * 3 : 4 * 3);
            this._uBuffer.updateFloat("step", ((this._shadowGenerator?.mapSize ?? 128) - 1) / numTesselation);
            this._uBuffer.updateUInt("tesselation", numTesselation);
        } else {
            this._mesh.setVerticesData("position", positions);
        }

        this._mesh.setIndices(indices, positions.length / 3);
    }
}
