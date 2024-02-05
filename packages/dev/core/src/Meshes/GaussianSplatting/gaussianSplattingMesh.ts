import type { Scene } from "core/scene";
import type { DeepImmutable, Nullable } from "core/types";
import type { BaseTexture } from "core/Materials/Textures/baseTexture";
import { SubMesh } from "../subMesh";
import type { AbstractMesh } from "../abstractMesh";
import { Mesh } from "../mesh";
import { VertexData } from "../mesh.vertexData";
import { Tools } from "core/Misc/tools";
import { Matrix, TmpVectors, Vector2, Vector3, Quaternion } from "core/Maths/math.vector";
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
    private _lastProj: DeepImmutable<Float32Array | number[]>;
    private _covariancesATexture: Nullable<BaseTexture> = null;
    private _covariancesBTexture: Nullable<BaseTexture> = null;
    private _centersTexture: Nullable<BaseTexture> = null;
    private _colorsTexture: Nullable<BaseTexture> = null;

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
     */
    constructor(name: string, url: Nullable<string> = null, scene: Nullable<Scene> = null) {
        super(name, scene);

        const vertexData = new VertexData();

        vertexData.positions = [-2, -2, 0, 2, -2, 0, 2, 2, 0, -2, 2, 0];
        vertexData.indices = [0, 1, 2, 0, 2, 3];
        vertexData.applyToMesh(this);

        this.subMeshes = [];
        new SubMesh(0, 0, 4, 0, 6, this);

        this.doNotSyncBoundingInfo = true;
        this.setEnabled(false);

        this._lastProj = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

        if (url) {
            this.loadFileAsync(url);
        }
    }

    /**
     * Returns the class name
     * @returns "GaussianSplattingMesh"
     */
    public getClassName(): string {
        return "GaussianSplattingMesh";
    }

    /**
     * Returns the total number of vertices (splats) within the mesh
     * @returns the total number of vertices
     */
    public getTotalVertices(): number {
        return this._vertexCount;
    }

    /**
     * Triggers the draw call for the mesh. Usually, you don't need to call this method by your own because the mesh rendering is handled by the scene rendering manager
     * @param subMesh defines the subMesh to render
     * @param enableAlphaMode defines if alpha mode can be changed
     * @param effectiveMeshReplacement defines an optional mesh used to provide info for the rendering
     * @returns the current mesh
     */
    public render(subMesh: SubMesh, enableAlphaMode: boolean, effectiveMeshReplacement?: AbstractMesh): Mesh {
        if (!this.material) {
            this._material = new GaussianSplattingMaterial(name + "_material", this._scene);
            this.material = this._material;
        }

        const frameId = this.getScene().getFrameId();
        if (frameId !== this._frameIdLastUpdate && this._worker && this._scene.activeCamera && this._canPostToWorker) {
            this.getWorldMatrix().multiplyToRef(this._scene.activeCamera.getViewMatrix(), this._modelViewMatrix);

            const dot = this._lastProj[2] * this._modelViewMatrix.m[2] + this._lastProj[6] * this._modelViewMatrix.m[6] + this._lastProj[10] * this._modelViewMatrix.m[10];
            if (Math.abs(dot - 1) >= 0.01) {
                this._frameIdLastUpdate = frameId;
                this._canPostToWorker = false;
                this._lastProj = this._modelViewMatrix.m.slice(0);
                this._worker.postMessage({ view: this._modelViewMatrix.m, depthMix: this._depthMix }, [this._depthMix.buffer]);
            }
        }

        return super.render(subMesh, enableAlphaMode, effectiveMeshReplacement);
    }

    /**
     * Code from https://github.com/dylanebert/gsplat.js/blob/main/src/loaders/PLYLoader.ts Under MIT license
     * Converts a .ply data array buffer to splat
     * if data array buffer is not ply, returns the original buffer
     * @param data the .ply data to load
     * @returns the loaded splat buffer
     */
    public static ConvertPLYToSplat(data: ArrayBuffer): ArrayBuffer {
        const ubuf = new Uint8Array(data);
        const header = new TextDecoder().decode(ubuf.slice(0, 1024 * 10));
        const headerEnd = "end_header\n";
        const headerEndIndex = header.indexOf(headerEnd);
        if (headerEndIndex < 0 || !header) {
            return data;
        }
        const vertexCount = parseInt(/element vertex (\d+)\n/.exec(header)![1]);

        let rowOffset = 0;
        const offsets: Record<string, number> = {
            double: 8,
            int: 4,
            uint: 4,
            float: 4,
            short: 2,
            ushort: 2,
            uchar: 1,
        };

        type PlyProperty = {
            name: string;
            type: string;
            offset: number;
        };
        const properties: PlyProperty[] = [];
        const filtered = header
            .slice(0, headerEndIndex)
            .split("\n")
            .filter((k) => k.startsWith("property "));
        for (const prop of filtered) {
            const [, type, name] = prop.split(" ");
            properties.push({ name, type, offset: rowOffset });
            if (!offsets[type]) throw new Error(`Unsupported property type: ${type}`);
            rowOffset += offsets[type];
        }

        const rowLength = 3 * 4 + 3 * 4 + 4 + 4;
        const SH_C0 = 0.28209479177387814;

        const dataView = new DataView(data, headerEndIndex + headerEnd.length);
        const buffer = new ArrayBuffer(rowLength * vertexCount);
        const q = new Quaternion();

        for (let i = 0; i < vertexCount; i++) {
            const position = new Float32Array(buffer, i * rowLength, 3);
            const scale = new Float32Array(buffer, i * rowLength + 12, 3);
            const rgba = new Uint8ClampedArray(buffer, i * rowLength + 24, 4);
            const rot = new Uint8ClampedArray(buffer, i * rowLength + 28, 4);

            let r0: number = 255;
            let r1: number = 0;
            let r2: number = 0;
            let r3: number = 0;

            for (let propertyIndex = 0; propertyIndex < properties.length; propertyIndex++) {
                const property = properties[propertyIndex];
                let value;
                switch (property.type) {
                    case "float":
                        value = dataView.getFloat32(property.offset + i * rowOffset, true);
                        break;
                    case "int":
                        value = dataView.getInt32(property.offset + i * rowOffset, true);
                        break;
                    default:
                        throw new Error(`Unsupported property type: ${property.type}`);
                }

                switch (property.name) {
                    case "x":
                        position[0] = value;
                        break;
                    case "y":
                        position[1] = value;
                        break;
                    case "z":
                        position[2] = value;
                        break;
                    case "scale_0":
                        scale[0] = Math.exp(value);
                        break;
                    case "scale_1":
                        scale[1] = Math.exp(value);
                        break;
                    case "scale_2":
                        scale[2] = Math.exp(value);
                        break;
                    case "red":
                        rgba[0] = value;
                        break;
                    case "green":
                        rgba[1] = value;
                        break;
                    case "blue":
                        rgba[2] = value;
                        break;
                    case "f_dc_0":
                        rgba[0] = (0.5 + SH_C0 * value) * 255;
                        break;
                    case "f_dc_1":
                        rgba[1] = (0.5 + SH_C0 * value) * 255;
                        break;
                    case "f_dc_2":
                        rgba[2] = (0.5 + SH_C0 * value) * 255;
                        break;
                    case "f_dc_3":
                        rgba[3] = (0.5 + SH_C0 * value) * 255;
                        break;
                    case "opacity":
                        rgba[3] = (1 / (1 + Math.exp(-value))) * 255;
                        break;
                    case "rot_0":
                        r0 = value;
                        break;
                    case "rot_1":
                        r1 = value;
                        break;
                    case "rot_2":
                        r2 = value;
                        break;
                    case "rot_3":
                        r3 = value;
                        break;
                }
            }

            q.set(r1, r2, r3, r0);
            q.normalize();
            rot[0] = q.w * 128 + 128;
            rot[1] = q.x * 128 + 128;
            rot[2] = q.y * 128 + 128;
            rot[3] = q.z * 128 + 128;
        }

        return buffer;
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
     * Loads a .splat Gaussian or .ply Splatting file asynchronously
     * @param url path to the splat file to load
     * @returns a promise that resolves when the operation is complete
     */
    public loadFileAsync(url: string): Promise<void> {
        return Tools.LoadFileAsync(url, true).then((data) => {
            this._loadData(GaussianSplattingMesh.ConvertPLYToSplat(data));
        });
    }

    /**
     * Releases resources associated with this mesh.
     * @param doNotRecurse Set to true to not recurse into each children (recurse into each children by default)
     */
    public dispose(doNotRecurse?: boolean): void {
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

                for (let j = 0; j < vertexCount; j++) {
                    floatMix[2 * j + 1] = 10000 - (viewProj[2] * positions[3 * j + 0] + viewProj[6] * positions[3 * j + 1] + viewProj[10] * positions[3 * j + 2]);
                }

                depthMix.sort();

                self.postMessage({ depthMix }, [depthMix.buffer]);
            }
        };
    };

    private _loadData(data: ArrayBuffer): void {
        // Parse the data
        const uBuffer = new Uint8Array(data);
        const fBuffer = new Float32Array(uBuffer.buffer);

        const rowLength = 3 * 4 + 3 * 4 + 4 + 4;
        const vertexCount = uBuffer.length / rowLength;

        this._vertexCount = vertexCount;

        const textureSize = this._getTextureSize(vertexCount);
        const textureLength = textureSize.x * textureSize.y;

        const positions = new Float32Array(3 * textureLength);
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

            positions[3 * i + 0] = x;
            positions[3 * i + 1] = y;
            positions[3 * i + 2] = z;

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
        binfo.isLocked = true;

        this.forcedInstanceCount = this._vertexCount;
        this.setEnabled(true);

        const splatIndex = new Float32Array(this._vertexCount * 1);

        this.thinInstanceSetBuffer("splatIndex", splatIndex, 1, false);

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

        this._covariancesATexture = createTextureFromData(convertRgbToRgba(covA), textureSize.x, textureSize.y, Constants.TEXTUREFORMAT_RGBA);
        this._covariancesBTexture = createTextureFromData(convertRgbToRgba(covB), textureSize.x, textureSize.y, Constants.TEXTUREFORMAT_RGBA);
        this._centersTexture = createTextureFromData(convertRgbToRgba(positions), textureSize.x, textureSize.y, Constants.TEXTUREFORMAT_RGBA);
        this._colorsTexture = createTextureFromData(colorArray, textureSize.x, textureSize.y, Constants.TEXTUREFORMAT_RGBA);

        // Start the worker thread
        this._worker?.terminate();
        this._worker = new Worker(
            URL.createObjectURL(
                new Blob(["(", GaussianSplattingMesh._CreateWorker.toString(), ")(self)"], {
                    type: "application/javascript",
                })
            )
        );

        this._depthMix = new BigInt64Array(vertexCount);

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

        if (engine.webGLVersion === 1 && !engine.isWebGPU) {
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
