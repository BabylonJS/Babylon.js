import type { AbstractEngine, Engine, Nullable, RenderTargetWrapper, Scene, ShadowGenerator, WebGPUEngine } from "core/index";
import { AbortError } from "core/Misc/error";
import { Constants } from "core/Engines/constants";
import { Matrix, Vector3, TmpVectors } from "core/Maths/math.vector";
import { DirectionalLight } from "core/Lights/directionalLight";
import { Mesh } from "core/Meshes/mesh";
import { ComputeShader } from "core/Compute/computeShader";
import { CopyTextureToTexture } from "core/Misc/copyTextureToTexture";
import { UniformBuffer } from "core/Materials/uniformBuffer";
import { StorageBuffer } from "core/Buffers/storageBuffer";
import { BaseTexture } from "core/Materials/Textures/baseTexture";
import { VertexBuffer } from "core/Buffers/buffer";

import "core/ShadersWGSL/lightingVolume.compute";

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
    private readonly _buildFullVolume = true;
    private _name: string;
    private _cs?: ComputeShader;
    private _cs2?: ComputeShader;
    private _light?: DirectionalLight;
    private _fallbackTexture?: BaseTexture;
    private _storageBuffer?: StorageBuffer;
    private _depthCopy?: RenderTargetWrapper;
    private _readPixelPromise: Nullable<Promise<ArrayBufferView>> = null;
    private _readPixelAbortController: Nullable<AbortController> = null;
    private _numFrames = 0;
    private _firstUpdate = true;
    private _currentLightDirection = new Vector3();
    private _positions: Float32Array;
    private _indices: number[];
    private _needFullUpdateUBO = true;

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

        this._updateGeometry();

        if (!this._engine.isWebGPU) {
            this._createFallbackTextures();
        }

        this._setComputeShaderInputs();
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

    /** @internal */
    public _setComputeShaderFastMode(enabled: boolean) {
        if (this._cs) {
            this._cs.fastMode = enabled;
            this._cs.triggerContextRebuild = enabled;
        }
        if (this._cs2) {
            this._cs2.fastMode = enabled;
            this._cs2.triggerContextRebuild = enabled;
        }
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
        this._indices = [];

        this._engine = scene.getEngine();
        this._scene = scene;

        this._mesh = new Mesh(name, this._scene);
        scene.meshes.splice(scene.meshes.indexOf(this._mesh), 1);

        if (this._engine.isWebGPU) {
            this._uBuffer = new UniformBuffer(this._engine);

            this._uBuffer.addUniform("invViewProjMatrix", 16);
            this._uBuffer.addUniform("invViewMatrix", 16);
            this._uBuffer.addUniform("startVertexIndex", 1);
            this._uBuffer.addUniform("step", 1);
            this._uBuffer.addUniform("tesselation", 1);
            this._uBuffer.addUniform("orthoMin", 3);
            this._uBuffer.addUniform("orthoMax", 3);
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
        if (this._cs2) {
            isReady = this._cs2.isReady() && isReady;
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

        if (this._engine.isWebGPU) {
            this._uBuffer!.updateMatrix("invViewProjMatrix", this._shadowGenerator.getTransformMatrix().invertToRef(TmpVectors.Matrix[0]));

            if (this._engine._enableGPUDebugMarkers) {
                this._engine.restoreDefaultFramebuffer(true);
                this._engine._debugPushGroup?.(`Update lighting volume (${this._name})`);
            }

            if (this._needUpdateGeometry()) {
                this._fullUpdateUBO(true);

                const dispatchSize = Math.ceil((this._tesselation + 1) / 32);

                this._engine._debugPushGroup?.(`Update vertices of other planes`);
                this._cs2!.dispatch(dispatchSize, 1, 1);
                this._engine._debugPopGroup?.();
            } else {
                this._fullUpdateUBO();
            }

            const dispatchSize = Math.ceil((this._tesselation + 1) / 8);

            this._engine._debugPushGroup?.(`Update vertices of far plane`);
            this._cs!.dispatch(dispatchSize, dispatchSize, 1);
            this._engine._debugPopGroup?.();

            if (this._engine._enableGPUDebugMarkers) {
                this._engine._debugPopGroup?.();
            }

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

    private _needUpdateGeometry() {
        if (this._cs?.triggerContextRebuild || (this._light && !this._currentLightDirection.equals(this._light.direction))) {
            this._currentLightDirection.copyFrom(this._light!.direction);
            return true;
        }

        return false;
    }

    private _createComputeShader() {
        this._cs = new ComputeShader("updateFarPlaneVertices", this._engine, "lightingVolume", {
            bindingsMapping: {
                shadowMap: { group: 0, binding: 0 },
                params: { group: 0, binding: 1 },
                positions: { group: 0, binding: 2 },
            },
            defines: !this._buildFullVolume ? ["#define KEEP_EDGES", "#define MOVE_FAR_DEPTH_TO_NEAR"] : undefined,
            entryPoint: "updateFarPlaneVertices",
        });

        this._cs2 = new ComputeShader("updatePlaneVertices", this._engine, "lightingVolume", {
            bindingsMapping: {
                shadowMap: { group: 0, binding: 0 },
                params: { group: 0, binding: 1 },
                positions: { group: 0, binding: 2 },
            },
            entryPoint: "updatePlaneVertices",
        });

        this._setComputeShaderInputs();
    }

    private _setComputeShaderInputs() {
        if (!this._engine.isWebGPU) {
            return;
        }

        if (this._shadowGenerator) {
            const depthTexture = this._shadowGenerator.getShadowMap()?.depthStencilTexture;
            if (depthTexture) {
                this._cs?.setInternalTexture("shadowMap", depthTexture);
                this._cs2?.setInternalTexture("shadowMap", depthTexture);
            }
        }

        if (this._uBuffer) {
            this._cs?.setUniformBuffer("params", this._uBuffer);
            this._cs2?.setUniformBuffer("params", this._uBuffer);
        }
        if (this._storageBuffer) {
            this._cs?.setStorageBuffer("positions", this._storageBuffer);
            this._cs2?.setStorageBuffer("positions", this._storageBuffer);
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

        if (this._needUpdateGeometry()) {
            this._updateGeometry();
        }

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

    private _fullUpdateUBO(force = false) {
        const light = this._light;

        if ((!force && !this._needFullUpdateUBO) || !light || !this._shadowGenerator) {
            this._uBuffer!.update();
            return;
        }

        this._needFullUpdateUBO = false;

        const numTesselation = this._tesselation;
        const min = TmpVectors.Vector3[0].set(light.orthoLeft, light.orthoBottom, light.shadowMinZ ?? Constants.ShadowMinZ);
        const max = TmpVectors.Vector3[1].set(light.orthoRight, light.orthoTop, light.shadowMaxZ ?? Constants.ShadowMaxZ);

        const invViewMatrix = this._shadowGenerator.viewMatrix.invertToRef(TmpVectors.Matrix[1]);

        this._uBuffer!.updateUInt("startVertexIndex", this._buildFullVolume ? (numTesselation + 1) * 4 * 3 : 4 * 3);
        this._uBuffer!.updateFloat("step", ((this._shadowGenerator?.mapSize ?? 128) - 1) / numTesselation);
        this._uBuffer!.updateUInt("tesselation", numTesselation);
        this._uBuffer!.updateVector3("orthoMin", min);
        this._uBuffer!.updateVector3("orthoMax", max);
        this._uBuffer!.updateMatrix("invViewMatrix", invViewMatrix);
        this._uBuffer!.update();
    }

    private _createGeometry() {
        const light = this._light;

        if (!light) {
            return;
        }

        this._tesselation = Math.max(Math.ceil(this._tesselation) & ~1, 2);

        const numTesselation = this._tesselation;
        const vertexNumber = (numTesselation + 1) * (numTesselation + 1) + (this._buildFullVolume ? (numTesselation + 1) * 4 : 4);

        this._positions = new Float32Array(vertexNumber * 3);
        this._indices.length = 0;

        this._createIndices(light);

        this._mesh.setIndices(this._indices, vertexNumber);

        if (this._engine.isWebGPU) {
            const webGPUEngine = this._engine as WebGPUEngine;

            this._storageBuffer?.dispose();
            this._storageBuffer = new StorageBuffer(webGPUEngine, vertexNumber * 3 * 4, Constants.BUFFER_CREATIONFLAG_VERTEX | Constants.BUFFER_CREATIONFLAG_READWRITE);

            this._mesh.setVerticesBuffer(new VertexBuffer(webGPUEngine, this._storageBuffer.getBuffer(), "position", { takeBufferOwnership: false }), true, vertexNumber);

            this._setComputeShaderInputs();

            this._cs!.triggerContextRebuild = true;
            this._cs2!.triggerContextRebuild = true;

            this._needFullUpdateUBO = true;
        }

        this._updateGeometry();
    }

    private _updateGeometry() {
        const light = this._light;

        if (!light || !this._shadowGenerator) {
            return;
        }

        if (this._indices.length === 0) {
            this._createGeometry();
            return;
        }

        if (this._engine.isWebGPU) {
            return;
        }

        const numTesselation = this._tesselation;

        const min = TmpVectors.Vector3[0].set(light.orthoLeft, light.orthoBottom, light.shadowMinZ ?? Constants.ShadowMinZ);
        const max = TmpVectors.Vector3[1].set(light.orthoRight, light.orthoTop, light.shadowMaxZ ?? Constants.ShadowMaxZ);

        const invViewMatrix = this._shadowGenerator.viewMatrix.invertToRef(TmpVectors.Matrix[1]);

        const stepX = (max.x - min.x) / numTesselation;
        const stepY = (max.y - min.y) / numTesselation;

        let vIndex = 0;

        if (this._buildFullVolume) {
            // Right faces of the frustum
            for (let i = 0; i <= numTesselation; ++i) {
                TmpVec3.set(max.x, min.y + i * stepY, min.z);
                Vector3.TransformCoordinatesToRef(TmpVec3, invViewMatrix, TmpVec3);
                this._positions[vIndex++] = TmpVec3.x;
                this._positions[vIndex++] = TmpVec3.y;
                this._positions[vIndex++] = TmpVec3.z;
            }

            // Left faces of the frustum
            for (let i = 0; i <= numTesselation; ++i) {
                TmpVec3.set(min.x, min.y + i * stepY, min.z);
                Vector3.TransformCoordinatesToRef(TmpVec3, invViewMatrix, TmpVec3);
                this._positions[vIndex++] = TmpVec3.x;
                this._positions[vIndex++] = TmpVec3.y;
                this._positions[vIndex++] = TmpVec3.z;
            }

            // Bottom faces of the frustum
            for (let i = 0; i <= numTesselation; ++i) {
                TmpVec3.set(min.x + i * stepX, min.y, min.z);
                Vector3.TransformCoordinatesToRef(TmpVec3, invViewMatrix, TmpVec3);
                this._positions[vIndex++] = TmpVec3.x;
                this._positions[vIndex++] = TmpVec3.y;
                this._positions[vIndex++] = TmpVec3.z;
            }

            // Top faces of the frustum
            for (let i = 0; i <= numTesselation; ++i) {
                TmpVec3.set(min.x + i * stepX, max.y, min.z);
                Vector3.TransformCoordinatesToRef(TmpVec3, invViewMatrix, TmpVec3);
                this._positions[vIndex++] = TmpVec3.x;
                this._positions[vIndex++] = TmpVec3.y;
                this._positions[vIndex++] = TmpVec3.z;
            }
        } else {
            // Closes the volume with two near triangles
            TmpVec3.set(max.x, min.y, min.z);
            Vector3.TransformCoordinatesToRef(TmpVec3, invViewMatrix, TmpVec3);
            this._positions[vIndex++] = TmpVec3.x;
            this._positions[vIndex++] = TmpVec3.y;
            this._positions[vIndex++] = TmpVec3.z;

            TmpVec3.set(max.x, max.y, min.z);
            Vector3.TransformCoordinatesToRef(TmpVec3, invViewMatrix, TmpVec3);
            this._positions[vIndex++] = TmpVec3.x;
            this._positions[vIndex++] = TmpVec3.y;
            this._positions[vIndex++] = TmpVec3.z;

            TmpVec3.set(min.x, min.y, min.z);
            Vector3.TransformCoordinatesToRef(TmpVec3, invViewMatrix, TmpVec3);
            this._positions[vIndex++] = TmpVec3.x;
            this._positions[vIndex++] = TmpVec3.y;
            this._positions[vIndex++] = TmpVec3.z;

            TmpVec3.set(min.x, max.y, min.z);
            Vector3.TransformCoordinatesToRef(TmpVec3, invViewMatrix, TmpVec3);
            this._positions[vIndex++] = TmpVec3.x;
            this._positions[vIndex++] = TmpVec3.y;
            this._positions[vIndex++] = TmpVec3.z;
        }

        this._mesh.setVerticesData("position", this._positions);
    }

    private _createIndices(light: DirectionalLight) {
        const invViewMatrix = Matrix.LookAtLH(light.position, light.position.add(light.direction), Vector3.UpReadOnly);
        invViewMatrix.invertToRef(invViewMatrix);

        const numTesselation = this._tesselation;

        const startFarIndices = this._buildFullVolume ? (numTesselation + 1) * 4 : 4;

        if (this._buildFullVolume) {
            const rightFaceStartIndex = 0;

            // Right faces of the frustum
            for (let i = 0; i <= numTesselation; ++i) {
                if (i < numTesselation) {
                    this._indices.push(
                        rightFaceStartIndex + i,
                        startFarIndices + numTesselation + (i + 1) * (numTesselation + 1),
                        startFarIndices + numTesselation + i * (numTesselation + 1)
                    );
                    this._indices.push(rightFaceStartIndex + i, rightFaceStartIndex + i + 1, startFarIndices + numTesselation + (i + 1) * (numTesselation + 1));
                }
            }

            const leftFaceStartIndex = rightFaceStartIndex + numTesselation + 1;

            // Left faces of the frustum
            for (let i = 0; i <= numTesselation; ++i) {
                if (i < numTesselation) {
                    this._indices.push(leftFaceStartIndex + i, startFarIndices + 0 + i * (numTesselation + 1), startFarIndices + 0 + (i + 1) * (numTesselation + 1));
                    this._indices.push(leftFaceStartIndex + i, startFarIndices + 0 + (i + 1) * (numTesselation + 1), leftFaceStartIndex + i + 1);
                }
            }

            const bottomFaceStartIndex = leftFaceStartIndex + numTesselation + 1;

            // Bottom faces of the frustum
            for (let i = 0; i <= numTesselation; ++i) {
                if (i < numTesselation) {
                    this._indices.push(bottomFaceStartIndex + i, bottomFaceStartIndex + i + 1, startFarIndices + i + 0 * (numTesselation + 1));
                    this._indices.push(bottomFaceStartIndex + i + 1, startFarIndices + i + 1 + 0 * (numTesselation + 1), startFarIndices + i + 0 * (numTesselation + 1));
                }
            }

            const topFaceStartIndex = bottomFaceStartIndex + numTesselation + 1;

            // Top faces of the frustum
            for (let i = 0; i <= numTesselation; ++i) {
                if (i < numTesselation) {
                    this._indices.push(topFaceStartIndex + i, startFarIndices + i + numTesselation * (numTesselation + 1), topFaceStartIndex + i + 1);
                    this._indices.push(
                        topFaceStartIndex + i + 1,
                        startFarIndices + i + numTesselation * (numTesselation + 1),
                        startFarIndices + i + 1 + numTesselation * (numTesselation + 1)
                    );
                }
            }

            // Near faces of the frustum
            for (let i = 0; i < numTesselation; ++i) {
                this._indices.push(leftFaceStartIndex + i, leftFaceStartIndex + i + 1, topFaceStartIndex + numTesselation - i);
                if (i < numTesselation - 1) {
                    this._indices.push(leftFaceStartIndex + i + 1, topFaceStartIndex + numTesselation - i - 1, topFaceStartIndex + numTesselation - i);
                }
            }

            for (let i = 0; i < numTesselation; ++i) {
                this._indices.push(bottomFaceStartIndex + i, rightFaceStartIndex + numTesselation - i, rightFaceStartIndex + numTesselation - i - 1);
                if (i < numTesselation - 1) {
                    this._indices.push(bottomFaceStartIndex + i, rightFaceStartIndex + numTesselation - i - 1, bottomFaceStartIndex + i + 1);
                }
            }
        } else {
            this._indices.push(0, 2, 1);
            this._indices.push(2, 3, 1);
        }

        // Tesselate the far plane
        for (let iy = 0; iy <= numTesselation; ++iy) {
            for (let ix = 0; ix <= numTesselation; ++ix) {
                if (ix < numTesselation && iy < numTesselation) {
                    this._indices.push(
                        startFarIndices + ix + iy * (numTesselation + 1),
                        startFarIndices + ix + 1 + iy * (numTesselation + 1),
                        startFarIndices + ix + 1 + (iy + 1) * (numTesselation + 1)
                    );
                    this._indices.push(
                        startFarIndices + ix + iy * (numTesselation + 1),
                        startFarIndices + ix + 1 + (iy + 1) * (numTesselation + 1),
                        startFarIndices + ix + (iy + 1) * (numTesselation + 1)
                    );
                }
            }
        }
    }
}
