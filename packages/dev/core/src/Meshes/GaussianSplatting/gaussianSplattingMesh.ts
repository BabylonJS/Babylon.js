import type { Scene } from "core/scene";
import type { DeepImmutable, FloatArray, Nullable } from "core/types";
import type { BaseTexture } from "core/Materials/Textures/baseTexture";
import { SubMesh } from "../subMesh";
import type { AbstractMesh } from "../abstractMesh";
import { Mesh } from "../mesh";
import { VertexData } from "../mesh.vertexData";
import { Matrix, TmpVectors, Vector2, Vector3 } from "core/Maths/math.vector";
import { Logger } from "core/Misc/logger";
import { GaussianSplattingMaterial } from "core/Materials/GaussianSplatting/gaussianSplattingMaterial";
import { RawTexture } from "core/Materials/Textures/rawTexture";
import { Constants } from "core/Engines/constants";

/**
 * Class used to render a gaussian splatting mesh
 */
export class GaussianSplattingMesh extends Mesh {
    private _vertexCount = 0;
    private _worker: Nullable<Worker> = null;
    private _frameIdLastUpdate = -1;
    private _modelViewMatrix = Matrix.Identity();
    private _material: Nullable<GaussianSplattingMaterial> = null;
    private _depthMix: BigInt64Array;
    private _canPostToWorker = true;
    private _lastModelViewMatrix: DeepImmutable<FloatArray>;
    private _covariancesATexture: Nullable<BaseTexture> = null;
    private _covariancesBTexture: Nullable<BaseTexture> = null;
    private _centersTexture: Nullable<BaseTexture> = null;
    private _colorsTexture: Nullable<BaseTexture> = null;
    private _splatPositions: Nullable<Float32Array> = null;
    //@ts-ignore
    private _covariancesA: Nullable<Float32Array> = null;
    //@ts-ignore
    private _covariancesB: Nullable<Float32Array> = null;
    //@ts-ignore
    private _colors: Nullable<Float32Array> = null;
    private _keepInRam: boolean = false;

    /**
     * Gets the covariancesA texture
     */
    public get covariancesATexture() {
        return this._covariancesATexture;
    }

    /**
     * Gets the covariancesB texture
     */
    public get covariancesBTexture() {
        return this._covariancesBTexture;
    }

    /**
     * Gets the centers texture
     */
    public get centersTexture() {
        return this._centersTexture;
    }

    /**
     * Gets the colors texture
     */
    public get colorsTexture() {
        return this._colorsTexture;
    }

    /**
     * Creates a new gaussian splatting mesh
     * @param name defines the name of the mesh
     * @param url defines the url to load from (optional)
     * @param scene defines the hosting scene (optional)
     * @param keepInRam keep datas in ram for editing purpose
     */
    constructor(name: string, scene: Nullable<Scene> = null, keepInRam: boolean = false) {
        super(name, scene);

        const vertexData = new VertexData();

        vertexData.positions = [-2, -2, 0, 2, -2, 0, 2, 2, 0, -2, 2, 0];
        vertexData.indices = [0, 1, 2, 0, 2, 3];
        vertexData.applyToMesh(this);

        this.subMeshes = [];
        new SubMesh(0, 0, 4, 0, 6, this);

        this.setEnabled(false);

        this._lastModelViewMatrix = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        this._keepInRam = keepInRam;
    }

    /**
     * Returns the class name
     * @returns "GaussianSplattingMesh"
     */
    public override getClassName(): string {
        return "GaussianSplattingMesh";
    }

    /**
     * Returns the total number of vertices (splats) within the mesh
     * @returns the total number of vertices
     */
    public override getTotalVertices(): number {
        return this._vertexCount;
    }

    /**
     * Triggers the draw call for the mesh. Usually, you don't need to call this method by your own because the mesh rendering is handled by the scene rendering manager
     * @param subMesh defines the subMesh to render
     * @param enableAlphaMode defines if alpha mode can be changed
     * @param effectiveMeshReplacement defines an optional mesh used to provide info for the rendering
     * @returns the current mesh
     */
    public override render(subMesh: SubMesh, enableAlphaMode: boolean, effectiveMeshReplacement?: AbstractMesh): Mesh {
        if (!this.material) {
            this._material = new GaussianSplattingMaterial(this.name + "_material", this._scene);
            this.material = this._material;
        }

        const frameId = this.getScene().getFrameId();
        if (frameId !== this._frameIdLastUpdate && this._worker && this._scene.activeCamera && this._canPostToWorker) {
            this.getWorldMatrix().multiplyToRef(this._scene.activeCamera.getViewMatrix(), this._modelViewMatrix);
            TmpVectors.Vector3[0].set(this._lastModelViewMatrix[8], this._lastModelViewMatrix[9], this._lastModelViewMatrix[10]);
            TmpVectors.Vector3[1].set(this._modelViewMatrix.m[8], this._modelViewMatrix.m[9], this._modelViewMatrix.m[10]);
            TmpVectors.Vector3[0].normalize();
            TmpVectors.Vector3[1].normalize();

            const dot = Vector3.Dot(TmpVectors.Vector3[0], TmpVectors.Vector3[1]);
            if (Math.abs(dot - 1) >= 0.01) {
                this._frameIdLastUpdate = frameId;
                this._canPostToWorker = false;
                this._lastModelViewMatrix = this._modelViewMatrix.m.slice(0);
                this._worker.postMessage({ view: this._modelViewMatrix.m, depthMix: this._depthMix, useRightHandedSystem: this._scene.useRightHandedSystem }, [
                    this._depthMix.buffer,
                ]);
            }
        }

        return super.render(subMesh, enableAlphaMode, effectiveMeshReplacement);
    }

    /**
     * Loads a .splat Gaussian Splatting array buffer asynchronously
     * @param data arraybuffer containing splat file
     * @returns a promise that resolves when the operation is complete
     */

    public loadDataAsync(data: ArrayBuffer): Promise<void> {
        return Promise.resolve(this._loadData(data));
    }

    /**
     * Releases resources associated with this mesh.
     * @param doNotRecurse Set to true to not recurse into each children (recurse into each children by default)
     */
    public override dispose(doNotRecurse?: boolean): void {
        this._covariancesATexture?.dispose();
        this._covariancesBTexture?.dispose();
        this._centersTexture?.dispose();
        this._colorsTexture?.dispose();

        this._covariancesATexture = null;
        this._covariancesBTexture = null;
        this._centersTexture = null;
        this._colorsTexture = null;

        this._material?.dispose(false, true);
        this._material = null;

        this._worker?.terminate();
        this._worker = null;

        super.dispose(doNotRecurse);
    }

    private _copyTextures(source: GaussianSplattingMesh): void {
        this._covariancesATexture = source.covariancesATexture?.clone()!;
        this._covariancesBTexture = source.covariancesBTexture?.clone()!;
        this._centersTexture = source.centersTexture?.clone()!;
        this._colorsTexture = source.colorsTexture?.clone()!;
    }

    /**
     * Returns a new Mesh object generated from the current mesh properties.
     * @param name is a string, the name given to the new mesh
     * @returns a new Gaussian Splatting Mesh
     */
    public override clone(name: string = ""): GaussianSplattingMesh {
        const newGS = new GaussianSplattingMesh(name, undefined, this.getScene());
        newGS._copySource(this);
        newGS.makeGeometryUnique();
        newGS._vertexCount = this._vertexCount;
        newGS._copyTextures(this);
        newGS._modelViewMatrix = Matrix.Identity();
        newGS._splatPositions = this._splatPositions;
        newGS._instanciateWorker();

        const binfo = this.getBoundingInfo();
        newGS.getBoundingInfo().reConstruct(binfo.minimum, binfo.maximum, this.getWorldMatrix());

        newGS.forcedInstanceCount = newGS._vertexCount;
        newGS.setEnabled(true);
        return newGS;
    }

    private static _CreateWorker = function (self: Worker) {
        let vertexCount = 0;
        let positions: Float32Array;
        let depthMix: BigInt64Array;
        let indices: Uint32Array;
        let floatMix: Float32Array;

        self.onmessage = (e: any) => {
            // updated on init
            if (e.data.positions) {
                positions = e.data.positions;
                vertexCount = e.data.vertexCount;
            }
            // udpate on view changed
            else {
                const viewProj = e.data.view;
                if (!positions || !viewProj) {
                    // Sanity check, it shouldn't happen!
                    throw new Error("positions or view is not defined!");
                }

                depthMix = e.data.depthMix;
                indices = new Uint32Array(depthMix.buffer);
                floatMix = new Float32Array(depthMix.buffer);

                // Sort
                for (let j = 0; j < vertexCount; j++) {
                    indices[2 * j] = j;
                }

                let depthFactor = -1;
                if (e.data.useRightHandedSystem) {
                    depthFactor = 1;
                }

                for (let j = 0; j < vertexCount; j++) {
                    floatMix[2 * j + 1] = 10000 + (viewProj[2] * positions[3 * j + 0] + viewProj[6] * positions[3 * j + 1] + viewProj[10] * positions[3 * j + 2]) * depthFactor;
                }

                depthMix.sort();

                self.postMessage({ depthMix }, [depthMix.buffer]);
            }
        };
    };

    private _loadData(data: ArrayBuffer): void {
        if (!data.byteLength) {
            return;
        }
        // Parse the data
        const uBuffer = new Uint8Array(data);
        const fBuffer = new Float32Array(uBuffer.buffer);

        const rowLength = 3 * 4 + 3 * 4 + 4 + 4;
        const vertexCount = uBuffer.length / rowLength;

        this._vertexCount = vertexCount;

        const textureSize = this._getTextureSize(vertexCount);
        const textureLength = textureSize.x * textureSize.y;

        this._splatPositions = new Float32Array(3 * textureLength);
        const covA = new Float32Array(3 * textureLength);
        const covB = new Float32Array(3 * textureLength);

        const matrixRotation = TmpVectors.Matrix[0];
        const matrixScale = TmpVectors.Matrix[1];
        const quaternion = TmpVectors.Quaternion[0];

        const minimum = new Vector3(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
        const maximum = new Vector3(-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE);

        for (let i = 0; i < vertexCount; i++) {
            const x = fBuffer[8 * i + 0];
            const y = -fBuffer[8 * i + 1];
            const z = fBuffer[8 * i + 2];

            this._splatPositions[3 * i + 0] = x;
            this._splatPositions[3 * i + 1] = y;
            this._splatPositions[3 * i + 2] = z;

            minimum.minimizeInPlaceFromFloats(x, y, z);
            maximum.maximizeInPlaceFromFloats(x, y, z);

            quaternion.set(
                (uBuffer[32 * i + 28 + 1] - 128) / 128,
                (uBuffer[32 * i + 28 + 2] - 128) / 128,
                (uBuffer[32 * i + 28 + 3] - 128) / 128,
                -(uBuffer[32 * i + 28 + 0] - 128) / 128
            );
            quaternion.toRotationMatrix(matrixRotation);

            Matrix.ScalingToRef(fBuffer[8 * i + 3 + 0] * 2, fBuffer[8 * i + 3 + 1] * 2, fBuffer[8 * i + 3 + 2] * 2, matrixScale);

            const M = matrixRotation.multiplyToRef(matrixScale, TmpVectors.Matrix[0]).m;

            covA[i * 3 + 0] = M[0] * M[0] + M[1] * M[1] + M[2] * M[2];
            covA[i * 3 + 1] = M[0] * M[4] + M[1] * M[5] + M[2] * M[6];
            covA[i * 3 + 2] = M[0] * M[8] + M[1] * M[9] + M[2] * M[10];
            covB[i * 3 + 0] = M[4] * M[4] + M[5] * M[5] + M[6] * M[6];
            covB[i * 3 + 1] = M[4] * M[8] + M[5] * M[9] + M[6] * M[10];
            covB[i * 3 + 2] = M[8] * M[8] + M[9] * M[9] + M[10] * M[10];
        }

        // Update the mesh
        const binfo = this.getBoundingInfo();
        binfo.reConstruct(minimum, maximum, this.getWorldMatrix());

        this.forcedInstanceCount = this._vertexCount;
        this.setEnabled(true);

        // Update the material
        const createTextureFromData = (data: Float32Array, width: number, height: number, format: number) => {
            return new RawTexture(data, width, height, format, this._scene, false, false, Constants.TEXTURE_BILINEAR_SAMPLINGMODE, Constants.TEXTURETYPE_FLOAT);
        };

        const convertRgbToRgba = (rgb: Float32Array) => {
            const count = rgb.length / 3;
            const rgba = new Float32Array(count * 4);
            for (let i = 0; i < count; ++i) {
                rgba[i * 4 + 0] = rgb[i * 3 + 0];
                rgba[i * 4 + 1] = rgb[i * 3 + 1];
                rgba[i * 4 + 2] = rgb[i * 3 + 2];
                rgba[i * 4 + 3] = 1.0;
            }
            return rgba;
        };

        const colorArray = new Float32Array(textureSize.x * textureSize.y * 4);
        for (let i = 0; i < this._vertexCount; ++i) {
            colorArray[i * 4 + 0] = uBuffer[32 * i + 24 + 0] / 255;
            colorArray[i * 4 + 1] = uBuffer[32 * i + 24 + 1] / 255;
            colorArray[i * 4 + 2] = uBuffer[32 * i + 24 + 2] / 255;
            colorArray[i * 4 + 3] = uBuffer[32 * i + 24 + 3] / 255;
        }

        if (this._keepInRam) {
            this._covariancesA = covA;
            this._covariancesB = covB;
            this._colors = colorArray;
        }
        this._covariancesATexture = createTextureFromData(convertRgbToRgba(covA), textureSize.x, textureSize.y, Constants.TEXTUREFORMAT_RGBA);
        this._covariancesBTexture = createTextureFromData(convertRgbToRgba(covB), textureSize.x, textureSize.y, Constants.TEXTUREFORMAT_RGBA);
        this._centersTexture = createTextureFromData(convertRgbToRgba(this._splatPositions), textureSize.x, textureSize.y, Constants.TEXTUREFORMAT_RGBA);
        this._colorsTexture = createTextureFromData(colorArray, textureSize.x, textureSize.y, Constants.TEXTUREFORMAT_RGBA);

        this._instanciateWorker();
    }

    private _instanciateWorker(): void {
        if (!this._vertexCount) {
            return;
        }
        const splatIndex = new Float32Array(this._vertexCount);

        this.thinInstanceSetBuffer("splatIndex", splatIndex, 1, false);

        // Start the worker thread
        this._worker?.terminate();
        this._worker = new Worker(
            URL.createObjectURL(
                new Blob(["(", GaussianSplattingMesh._CreateWorker.toString(), ")(self)"], {
                    type: "application/javascript",
                })
            )
        );

        this._depthMix = new BigInt64Array(this._vertexCount);
        const positions = Float32Array.from(this._splatPositions!);
        const vertexCount = this._vertexCount;

        this._worker.postMessage({ positions, vertexCount }, [positions.buffer]);

        this._worker.onmessage = (e) => {
            this._depthMix = e.data.depthMix;
            const indexMix = new Uint32Array(e.data.depthMix.buffer);
            for (let j = 0; j < this._vertexCount; j++) {
                splatIndex[j] = indexMix[2 * j];
            }
            this.thinInstanceBufferUpdated("splatIndex");
            this._canPostToWorker = true;
        };
    }

    private _getTextureSize(length: number): Vector2 {
        const engine = this._scene.getEngine();
        const width = engine.getCaps().maxTextureSize;

        let height = 1;

        if (engine.version === 1 && !engine.isWebGPU) {
            while (width * height < length) {
                height *= 2;
            }
        } else {
            height = Math.ceil(length / width);
        }

        if (height > width) {
            Logger.Error("GaussianSplatting texture size: (" + width + ", " + height + "), maxTextureSize: " + width);
            height = width;
        }

        return new Vector2(width, height);
    }
}
