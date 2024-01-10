import { Constants } from "../../Engines/constants";
import { Effect } from "../../Materials/effect";
import { RawTexture } from "../../Materials/Textures/rawTexture";
import { ShaderMaterial } from "../../Materials/shaderMaterial";
import { Matrix, Quaternion, TmpVectors, Vector2, Vector3 } from "../../Maths/math.vector";
import { Mesh } from "../../Meshes/mesh";
import { VertexData } from "../../Meshes/mesh.vertexData";
import type { Observer } from "../../Misc/observable";
import { Tools } from "../../Misc/tools";
import type { Scene } from "../../scene";
import type { Nullable } from "../../types";
import { Logger } from "../../Misc/logger";

/**
 * @experimental
 * Helper class that loads, creates and manipulates a Gaussian Splatting
 */
export class GaussianSplatting {
    private _vertexCount: number = 0;
    private _positions: Float32Array;
    private _uBuffer: Uint8Array;
    private _covA: Float32Array;
    private _covB: Float32Array;
    private _sceneDisposeObserver: Nullable<Observer<Scene>>;
    private _sceneBeforeRenderObserver: Nullable<Observer<Scene>>;
    private _material: ShaderMaterial;
    private _modelViewMatrix = Matrix.Identity();
    private _minimum = new Vector3();
    private _maximum = new Vector3();
    /**
     * Name of the GS that is also used to name a mesh for rendering it
     */
    public readonly name: string = "GaussianSplatting";
    /**
     * The scene the Gaussian Splatting mesh belongs to
     */
    public readonly scene: Scene;
    /**
     * The mesh responsible for rendering the GS
     */
    public mesh: Nullable<Mesh>;

    /**
     * Return the number of splattings used
     */
    public get vertexCount(): number {
        return this._vertexCount;
    }

    /**
     * Shader material with alpha blending
     * @param scene parent scene
     */
    private _createMaterial(scene: Scene) {
        Effect.ShadersStore["gaussianSplattingVertexShader"] = GaussianSplatting._VertexShaderSource;
        Effect.ShadersStore["gaussianSplattingFragmentShader"] = GaussianSplatting._FragmentShaderSource;
        const shaderMaterial = new ShaderMaterial(
            "GaussianSplattingShader",
            scene,
            {
                vertex: "gaussianSplatting",
                fragment: "gaussianSplatting",
            },
            {
                attributes: ["position", "splatIndex"],
                uniforms: ["projection", "modelView", "viewport", "dataTextureSize"],
                samplers: ["covariancesATexture", "covariancesBTexture", "centersTexture", "colorsTexture"],
            }
        );
        shaderMaterial.backFaceCulling = false;
        shaderMaterial.alpha = 0.9999;
        this._material = shaderMaterial;
    }

    /**
     *
     * @param scene parent scene
     * @returns A simple 2 triangles quad
     */
    private _getMesh(scene: Scene): Mesh {
        const mesh = new Mesh(this.name, scene);
        const vertexData = new VertexData();
        vertexData.positions = [-2, -2, 0, 2, -2, 0, 2, 2, 0, -2, 2, 0];
        vertexData.indices = [0, 1, 2, 0, 2, 3];
        vertexData.applyToMesh(mesh);
        const binfo = mesh.getBoundingInfo();
        binfo.reConstruct(this._minimum, this._maximum);
        binfo.isLocked = true;
        mesh.doNotSyncBoundingInfo = true;
        mesh.material = this._material;
        return mesh;
    }

    protected _worker: Nullable<Worker> = null;
    protected static _VertexShaderSource = `
        precision mediump float;

        attribute float splatIndex;

        attribute vec2 position;

        uniform highp sampler2D covariancesATexture;
        uniform highp sampler2D covariancesBTexture;
        uniform highp sampler2D centersTexture;
        uniform highp sampler2D colorsTexture;
        uniform vec2 dataTextureSize;

        uniform mat4 projection;
        uniform mat4 modelView;
        uniform vec2 viewport;

        varying vec4 vColor;
        varying vec2 vPosition;

        #if !defined(WEBGL2) && !defined(WEBGPU) && !defined(NATIVE)
        mat3 transpose(mat3 matrix) {
            return mat3(matrix[0][0], matrix[1][0], matrix[2][0],
                matrix[0][1], matrix[1][1], matrix[2][1],
                matrix[0][2], matrix[1][2], matrix[2][2]);
        }
        #endif

        vec2 getDataUV(float index, vec2 textureSize) {
            float y = floor(index / textureSize.x);
            float x = index - y * textureSize.x;
            return vec2((x + 0.5) / dataTextureSize.x, (y + 0.5) / dataTextureSize.y);
        }

        void main () {
        vec2 splatUV = getDataUV(splatIndex, dataTextureSize);
        vec3 center = texture2D(centersTexture, splatUV).xyz;
        vec4 color = texture2D(colorsTexture, splatUV);
        vec3 covA = texture2D(covariancesATexture, splatUV).xyz;
        vec3 covB = texture2D(covariancesBTexture, splatUV).xyz;

        vec4 camspace = modelView * vec4(center, 1);
        vec4 pos2d = projection * camspace;

        float bounds = 1.2 * pos2d.w;
        if (pos2d.z < -pos2d.w || pos2d.x < -bounds || pos2d.x > bounds
            || pos2d.y < -bounds || pos2d.y > bounds) {
            gl_Position = vec4(0.0, 0.0, 2.0, 1.0);
            return;
        }

        mat3 Vrk = mat3(
            covA.x, covA.y, covA.z, 
            covA.y, covB.x, covB.y,
            covA.z, covB.y, covB.z
        );
        vec2 focal = vec2(1132., 1132.);
        mat3 J = mat3(
            focal.x / camspace.z, 0., -(focal.x * camspace.x) / (camspace.z * camspace.z), 
            0., focal.y / camspace.z, -(focal.y * camspace.y) / (camspace.z * camspace.z), 
            0., 0., 0.
        );

        mat3 invy = mat3(1,0,0, 0,-1,0,0,0,1);

        mat3 T = invy * transpose(mat3(modelView)) * J;
        mat3 cov2d = transpose(T) * Vrk * T;

        float mid = (cov2d[0][0] + cov2d[1][1]) / 2.0;
        float radius = length(vec2((cov2d[0][0] - cov2d[1][1]) / 2.0, cov2d[0][1]));
        float lambda1 = mid + radius, lambda2 = mid - radius;

        if(lambda2 < 0.0) return;
        vec2 diagonalVector = normalize(vec2(cov2d[0][1], lambda1 - cov2d[0][0]));
        vec2 majorAxis = min(sqrt(2.0 * lambda1), 1024.0) * diagonalVector;
        vec2 minorAxis = min(sqrt(2.0 * lambda2), 1024.0) * vec2(diagonalVector.y, -diagonalVector.x);

        vColor = color;
        vPosition = position;
        vec2 vCenter = vec2(pos2d);
        gl_Position = vec4(
            vCenter 
            + (position.x * majorAxis * 1. / viewport 
            + position.y * minorAxis * 1. / viewport) * pos2d.w, pos2d.zw);
        }`;

    protected static _FragmentShaderSource = `
        precision highp float;
        varying vec4 vColor;
        varying vec2 vPosition;
        void main () {    
        float A = -dot(vPosition, vPosition);
        if (A < -4.0) discard;
        float B = exp(A) * vColor.a;
        gl_FragColor = vec4(vColor.rgb, B);
        }`;

    protected static _CreateWorker = function (self: Worker) {
        let viewProj: number[];
        let lastProj: number[] = [];
        let vertexCount = 0;
        let positions: Float32Array;

        const runSort = (viewProj: number[]) => {
            vertexCount = positions.length;
            const depthMix = new BigInt64Array(vertexCount);
            const indices = new Uint32Array(depthMix.buffer);
            for (let j = 0; j < vertexCount; j++) {
                indices[2 * j] = j;
            }

            const floatMix = new Float32Array(depthMix.buffer);
            for (let j = 0; j < vertexCount; j++) {
                floatMix[2 * j + 1] = 10000 - (viewProj[2] * positions[3 * j + 0] + viewProj[6] * positions[3 * j + 1] + viewProj[10] * positions[3 * j + 2]);
            }
            lastProj = viewProj;

            depthMix.sort();

            self.postMessage({ depthMix }, [depthMix.buffer]);
        };

        let sortRunning: boolean = false;
        const throttledSort = () => {
            if (!sortRunning) {
                sortRunning = true;
                const lastView = viewProj;
                runSort(lastView);
                setTimeout(() => {
                    sortRunning = false;
                    if (lastView !== viewProj) {
                        throttledSort();
                    }
                }, 0);
            }
        };

        self.onmessage = (e: any) => {
            /// updated on init
            if (e.data.positions) {
                positions = e.data.positions;
            }
            /// udpate on view changed
            else if (e.data.view) {
                viewProj = e.data.view;
                const dot = lastProj[2] * viewProj[2] + lastProj[6] * viewProj[6] + lastProj[10] * viewProj[10];
                if (Math.abs(dot - 1) < 0.01) {
                    return;
                }
                if (positions) {
                    throttledSort();
                }
            }
        };
    };

    protected _setData(binaryData: Uint8Array) {
        const rowLength = 3 * 4 + 3 * 4 + 4 + 4;
        this._vertexCount = binaryData.length / rowLength;
        const vertexCount = this._vertexCount;

        const textureSize = this._getTextureSize(vertexCount);
        const textureLength = textureSize.x * textureSize.y;
        this._positions = new Float32Array(3 * textureLength);
        this._covA = new Float32Array(3 * textureLength);
        this._covB = new Float32Array(3 * textureLength);

        const f_buffer = new Float32Array(binaryData.buffer);
        this._uBuffer = new Uint8Array(binaryData.buffer);

        const matrixRotation = Matrix.Zero();
        const matrixScale = Matrix.Zero();
        const quaternion = Quaternion.Identity();

        this._minimum.set(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
        this._maximum.set(-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE);

        for (let i = 0; i < vertexCount; i++) {
            const x = f_buffer[8 * i + 0];
            const y = -f_buffer[8 * i + 1];
            const z = f_buffer[8 * i + 2];

            this._positions[3 * i + 0] = x;
            this._positions[3 * i + 1] = y;
            this._positions[3 * i + 2] = z;

            this._minimum.minimizeInPlaceFromFloats(x, y, z);
            this._maximum.maximizeInPlaceFromFloats(x, y, z);

            quaternion.set(
                (this._uBuffer[32 * i + 28 + 1] - 128) / 128,
                (this._uBuffer[32 * i + 28 + 2] - 128) / 128,
                (this._uBuffer[32 * i + 28 + 3] - 128) / 128,
                -(this._uBuffer[32 * i + 28 + 0] - 128) / 128
            );
            quaternion.toRotationMatrix(matrixRotation);

            Matrix.ScalingToRef(f_buffer[8 * i + 3 + 0] * 2, f_buffer[8 * i + 3 + 1] * 2, f_buffer[8 * i + 3 + 2] * 2, matrixScale);

            const M = matrixRotation.multiplyToRef(matrixScale, TmpVectors.Matrix[0]).m;

            this._covA[i * 3 + 0] = M[0] * M[0] + M[1] * M[1] + M[2] * M[2];
            this._covA[i * 3 + 1] = M[0] * M[4] + M[1] * M[5] + M[2] * M[6];
            this._covA[i * 3 + 2] = M[0] * M[8] + M[1] * M[9] + M[2] * M[10];
            this._covB[i * 3 + 0] = M[4] * M[4] + M[5] * M[5] + M[6] * M[6];
            this._covB[i * 3 + 1] = M[4] * M[8] + M[5] * M[9] + M[6] * M[10];
            this._covB[i * 3 + 2] = M[8] * M[8] + M[9] * M[9] + M[10] * M[10];
        }
    }

    /**
     * Construct a Gaussian Splatting proxy object
     * @param name name of the mesh used for rendering
     * @param scene scene it belongs to
     */
    public constructor(name: string, scene: Scene) {
        this.scene = scene;
        this.name = name;
        this._createMaterial(scene);
        this._worker?.terminate();
        this._worker = null;
    }

    private _loadData(data: ArrayBuffer) {
        if (this.mesh) {
            this.dispose();
        }
        this._setData(new Uint8Array(data as any));
        const splatIndex = new Float32Array(this.vertexCount * 1);

        const updateInstances = (indexMix: Uint32Array) => {
            for (let j = 0; j < this.vertexCount; j++) {
                splatIndex[j] = indexMix[2 * j];
            }
            this.mesh?.thinInstanceBufferUpdated("splatIndex"); // update splatIndex only
        };

        // update so this.mesh is valid when exiting this function
        this.mesh = this._getMesh(this.scene);
        this.mesh.forcedInstanceCount = this.vertexCount;
        this.mesh.thinInstanceSetBuffer("splatIndex", splatIndex, 1, false);

        const createTextureFromData = (data: Float32Array, width: number, height: number, format: number) => {
            return new RawTexture(data, width, height, format, this.scene, false, false, Constants.TEXTURE_BILINEAR_SAMPLINGMODE, Constants.TEXTURETYPE_FLOAT);
        };

        // additional conversion to avoid breaking the original data
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

        /// create textures for gaussian info
        if (this._material.name == "GaussianSplattingShader") {
            const material = this.mesh.material as ShaderMaterial;

            const textureSize = this._getTextureSize(this.vertexCount);
            material.setVector2("dataTextureSize", textureSize);

            const convATexture = createTextureFromData(convertRgbToRgba(this._covA), textureSize.x, textureSize.y, Constants.TEXTUREFORMAT_RGBA);
            material.setTexture("covariancesATexture", convATexture);

            const convBTexture = createTextureFromData(convertRgbToRgba(this._covB), textureSize.x, textureSize.y, Constants.TEXTUREFORMAT_RGBA);
            material.setTexture("covariancesBTexture", convBTexture);

            const centersTexture = createTextureFromData(convertRgbToRgba(this._positions), textureSize.x, textureSize.y, Constants.TEXTUREFORMAT_RGBA);
            material.setTexture("centersTexture", centersTexture);

            const colorArray = new Float32Array(textureSize.x * textureSize.y * 4);
            for (let i = 0; i < this.vertexCount; ++i) {
                colorArray[i * 4 + 0] = this._uBuffer[32 * i + 24 + 0] / 255;
                colorArray[i * 4 + 1] = this._uBuffer[32 * i + 24 + 1] / 255;
                colorArray[i * 4 + 2] = this._uBuffer[32 * i + 24 + 2] / 255;
                colorArray[i * 4 + 3] = this._uBuffer[32 * i + 24 + 3] / 255;
            }
            const colorsTexture = createTextureFromData(colorArray, textureSize.x, textureSize.y, Constants.TEXTUREFORMAT_RGBA);
            material.setTexture("colorsTexture", colorsTexture);
        }

        this._worker = new Worker(
            URL.createObjectURL(
                new Blob(["(", GaussianSplatting._CreateWorker.toString(), ")(self)"], {
                    type: "application/javascript",
                })
            )
        );

        /// set positions only once, no need to update on view changed
        this._worker?.postMessage({ positions: this._positions.slice(0, this._vertexCount * 3) }, [this._positions.buffer]);
        this._positions = new Float32Array(0);

        this._worker.onmessage = (e) => {
            const indexMix = new Uint32Array(e.data.depthMix.buffer);
            updateInstances(indexMix);
        };
        const viewport = new Vector2();
        this._sceneBeforeRenderObserver = this.scene.onBeforeRenderObservable.add(() => {
            const engine = this.scene.getEngine();
            viewport.set(engine.getRenderWidth(), engine.getRenderHeight());
            this._material.setVector2("viewport", viewport);
            const meshWorldMatrix = this.mesh!.getWorldMatrix();
            meshWorldMatrix.multiplyToRef(this.scene.activeCamera!.getViewMatrix(), this._modelViewMatrix);
            const binfo = this.mesh!.getBoundingInfo();
            binfo.reConstruct(this._minimum, this._maximum, meshWorldMatrix);
            binfo.isLocked = true;
            this._material.setMatrix("modelView", this._modelViewMatrix);
            this._worker?.postMessage({ view: this._modelViewMatrix.m });
        });
        this._sceneDisposeObserver = this.scene.onDisposeObservable.add(() => {
            this.dispose();
        });
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
     * Loads a .splat Gaussian Splatting file asynchronously
     * @param url path to the splat file to load
     * @returns a promise that resolves when the operation is complete
     */
    public loadFileAsync(url: string): Promise<void> {
        return Tools.LoadFileAsync(url, true).then((data) => {
            this._loadData(data);
        });
    }

    /**
     * Clear datas used for Gaussian Splatting and associated resources
     */
    public dispose(): void {
        this.scene.onDisposeObservable.remove(this._sceneDisposeObserver);
        this.scene.onBeforeRenderObservable.remove(this._sceneBeforeRenderObserver);
        this._worker?.terminate();
        this._worker = null;
        this.mesh?.dispose();
        this.mesh = null;
    }

    /**
     * Calculate the texture size of Gaussian Splatting data
     * @param length number of splattings
     * @returns texture size in Vector2
     */
    private _getTextureSize(length: number): Vector2 {
        const engine = this.scene.getEngine();
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
            Logger.Warn("GaussianSplatting texture size: (" + width + ", " + height + "), maxTextureSize: " + width);
            height = width;
        }
        return new Vector2(width, height);
    }
}
