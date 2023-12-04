import { Effect, Material, ShaderMaterial } from "../../Materials";
import { Matrix, Quaternion, Vector2 } from "../../Maths/math.vector";
import { Mesh } from "../../Meshes/mesh";
import { VertexData } from "../../Meshes/mesh.vertexData";
import { Observer } from "../../Misc/observable";
import { Tools } from "../../Misc/tools";
import { Scene } from "../../scene";
import { Nullable } from "../../types";

export class GaussianSplatting {
    private _vertexCount: number = 0;
    private _positions: Float32Array;
    private _u_buffer: Uint8Array;
    private _covA: Float32Array;
    private _covB: Float32Array;
    private _mesh: Nullable<Mesh>;
    private _sceneDisposeObserver: Nullable<Observer<Scene>>;

    public readonly name: string;
    public readonly scene: Scene;

    /**
     * return the number of splattings used
     */
    public get vertexCount(): number {
        return this._vertexCount;
    }

    private _getMaterial(scene: Scene): Material {
        if (!GaussianSplatting._Material) {
            Effect.ShadersStore["customVertexShader"] = GaussianSplatting._VertexShaderSource;
            Effect.ShadersStore["customFragmentShader"] = GaussianSplatting._FragmentShaderSource;
            const shaderMaterial = new ShaderMaterial(
                "GaussianSplattingShader",
                scene,
                {
                    vertex: "custom",
                    fragment: "custom",
                },
                {
                    attributes: ["position", "normal", "uv"],
                    uniforms: ["view", "projection"],
                }
            );
            shaderMaterial.setVector2("focal", new Vector2(1132, 1132));
            shaderMaterial.backFaceCulling = false;
            shaderMaterial.alpha = 0.9999;
            GaussianSplatting._Material = shaderMaterial;
        }
        return GaussianSplatting._Material;
    }

    private _getMesh(scene: Scene): Mesh {
        const mesh = new Mesh(this.name, scene);
        var vertexData = new VertexData();
        vertexData.positions = [-2, -2, 0, 2, -2, 0, 2, 2, 0, -2, 2, 0];
        vertexData.indices = [0, 1, 2, 0, 2, 3];
        vertexData.applyToMesh(mesh);

        mesh.material = this._getMaterial(scene);
        mesh.alwaysSelectAsActiveMesh = true;
        return mesh;
    }

    protected static _Worker: Nullable<Worker> = null;
    protected static _Material: Nullable<ShaderMaterial>;
    protected static _VertexShaderSource = `
        precision mediump float;
        attribute vec2 position;

        attribute vec4 world0;
        attribute vec4 world1;
        attribute vec4 world2;
        attribute vec4 world3;

        uniform mat4 projection, view;
        uniform vec2 focal;
        uniform vec2 viewport;

        varying vec4 vColor;
        varying vec2 vPosition;
        void main () {
        vec3 center = world0.xyz;
        vec4 color = world1;
        vec3 covA = world2.xyz;
        vec3 covB = world3.xyz;

        vec4 camspace = view * vec4(center, 1);
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
        
        mat3 J = mat3(
            focal.x / camspace.z, 0., -(focal.x * camspace.x) / (camspace.z * camspace.z), 
            0., focal.y / camspace.z, -(focal.y * camspace.y) / (camspace.z * camspace.z), 
            0., 0., 0.
        );

        mat3 invy = mat3(1,0,0, 0,-1,0,0,0,1);

        mat3 T = invy * transpose(mat3(view)) * J;
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

    protected static _CreateWorker(self: any) {
        var viewProj: number[];
        let lastProj: number[] = [];
        var depthMix = new BigInt64Array();
        var vertexCount = 0;
        var positions: Float32Array;

        const runSort = (viewProj: number[]) => {
            vertexCount = positions.length;
            if (depthMix.length !== vertexCount) {
                depthMix = new BigInt64Array(vertexCount);
                const indices = new Uint32Array(depthMix.buffer);
                for (let j = 0; j < vertexCount; j++) {
                    indices[2 * j] = j;
                }
            }
            let dot = lastProj[2] * viewProj[2] + lastProj[6] * viewProj[6] + lastProj[10] * viewProj[10];
            if (Math.abs(dot - 1) < 0.01) {
                return;
            }

            const floatMix = new Float32Array(depthMix.buffer);
            const indexMix = new Uint32Array(depthMix.buffer);
            for (let j = 0; j < vertexCount; j++) {
                let i = indexMix[2 * j];
                floatMix[2 * j + 1] = 10000 - (viewProj[2] * positions[3 * i + 0] + viewProj[6] * positions[3 * i + 1] + viewProj[10] * positions[3 * i + 2]);
            }
            lastProj = viewProj;

            depthMix.sort();

            self.postMessage({ depthMix }, [depthMix.buffer]);
        };

        const throttledSort = () => {
            if (!sortRunning) {
                sortRunning = true;
                let lastView = viewProj;
                runSort(lastView);
                setTimeout(() => {
                    sortRunning = false;
                    if (lastView !== viewProj) {
                        throttledSort();
                    }
                }, 0);
            }
        };

        let sortRunning: boolean = false;
        self.onmessage = (e: any) => {
            viewProj = e.data.view;
            positions = e.data.positions;
            throttledSort();
        };
    }

    protected _setData(binaryData: Uint8Array) {
        const rowLength = 3 * 4 + 3 * 4 + 4 + 4;
        this._vertexCount = binaryData.length / rowLength;
        const vertexCount = this._vertexCount;
        this._positions = new Float32Array(3 * vertexCount);
        this._covA = new Float32Array(3 * vertexCount);
        this._covB = new Float32Array(3 * vertexCount);

        const f_buffer = new Float32Array(binaryData.buffer);
        this._u_buffer = new Uint8Array(binaryData.buffer);

        let matrixRotation = Matrix.Zero();
        let matrixScale = Matrix.Zero();
        let quaternion = Quaternion.Identity();
        for (let i = 0; i < vertexCount; i++) {
            this._positions[3 * i + 0] = f_buffer[8 * i + 0];
            this._positions[3 * i + 1] = -f_buffer[8 * i + 1];
            this._positions[3 * i + 2] = f_buffer[8 * i + 2];

            quaternion.set(
                (this._u_buffer[32 * i + 28 + 1] - 128) / 128,
                (this._u_buffer[32 * i + 28 + 2] - 128) / 128,
                (this._u_buffer[32 * i + 28 + 3] - 128) / 128,
                -(this._u_buffer[32 * i + 28 + 0] - 128) / 128
            );
            quaternion.toRotationMatrix(matrixRotation);

            Matrix.ScalingToRef(f_buffer[8 * i + 3 + 0] * 2, f_buffer[8 * i + 3 + 1] * 2, f_buffer[8 * i + 3 + 2] * 2, matrixScale);

            const M = matrixRotation.multiply(matrixScale).m;

            this._covA[i * 3 + 0] = M[0] * M[0] + M[1] * M[1] + M[2] * M[2];
            this._covA[i * 3 + 1] = M[0] * M[4] + M[1] * M[5] + M[2] * M[6];
            this._covA[i * 3 + 2] = M[0] * M[8] + M[1] * M[9] + M[2] * M[10];
            this._covB[i * 3 + 0] = M[4] * M[4] + M[5] * M[5] + M[6] * M[6];
            this._covB[i * 3 + 1] = M[4] * M[8] + M[5] * M[9] + M[6] * M[10];
            this._covB[i * 3 + 2] = M[8] * M[8] + M[9] * M[9] + M[10] * M[10];
        }
    }

    /**
     *
     * @param scene
     */
    constructor(name: string, scene: Scene) {
        this.scene = scene;
        this.name = name;
    }

    /**
     *
     * @param url path to the splat file to load
     * @param scene scene to load the Gaussian Splatting into
     * @returns a promise that resolves when the operation is complete
     */
    public loadAsync(url: string): Promise<void> {
        return Tools.LoadFileAsync(url, true).then((data: string | ArrayBuffer) => {
            if (this._mesh) {
                this.dispose();
            }
            this._setData(new Uint8Array(data as any));
            var matricesData = new Float32Array(this.vertexCount * 16);

            const updateInstances = (indexMix: Uint32Array) => {
                for (let j = 0; j < this.vertexCount; j++) {
                    const i = indexMix[2 * j];
                    const index = j * 16;
                    matricesData[index + 0] = this._positions[i * 3 + 0];
                    matricesData[index + 1] = this._positions[i * 3 + 1];
                    matricesData[index + 2] = this._positions[i * 3 + 2];

                    matricesData[index + 4] = this._u_buffer[32 * i + 24 + 0] / 255;
                    matricesData[index + 5] = this._u_buffer[32 * i + 24 + 1] / 255;
                    matricesData[index + 6] = this._u_buffer[32 * i + 24 + 2] / 255;
                    matricesData[index + 7] = this._u_buffer[32 * i + 24 + 3] / 255;

                    matricesData[index + 8] = this._covA[i * 3 + 0];
                    matricesData[index + 9] = this._covA[i * 3 + 1];
                    matricesData[index + 10] = this._covA[i * 3 + 2];

                    matricesData[index + 12] = this._covB[i * 3 + 0];
                    matricesData[index + 13] = this._covB[i * 3 + 1];
                    matricesData[index + 14] = this._covB[i * 3 + 2];
                }

                if (!this._mesh) {
                    this._mesh = this._getMesh(this.scene);
                    this._mesh.thinInstanceSetBuffer("matrix", matricesData, 16, false);
                } else {
                    this._mesh.thinInstanceBufferUpdated("matrix");
                }
            };

            if (GaussianSplatting._Worker) {
                GaussianSplatting._Worker.terminate();
            }
            GaussianSplatting._Worker = new Worker(
                URL.createObjectURL(
                    new Blob(["(", GaussianSplatting._CreateWorker.toString(), ")(self)"], {
                        type: "application/javascript",
                    })
                )
            );

            GaussianSplatting._Worker.onmessage = (e) => {
                const indexMix = new Uint32Array(e.data.depthMix.buffer);
                updateInstances(indexMix);
            };
            this.scene.onBeforeRenderObservable.add(() => {
                if (this._mesh && GaussianSplatting._Worker) {
                    const engine = this.scene.getEngine();
                    GaussianSplatting._Material?.setVector2("viewport", new Vector2(engine.getRenderWidth(), engine.getRenderHeight()));
                    GaussianSplatting._Worker.postMessage({ view: this.scene.activeCamera?.getViewMatrix().m, positions: this._positions });
                }
            });
            this._sceneDisposeObserver = this.scene.onDisposeObservable.add(() => {
                this.dispose();
            });
        });
    }

    /**
     * Clear datas used for Gaussian Splatting and associated resources
     */
    public dispose(): void {
        this.scene.onDisposeObservable.remove(this._sceneDisposeObserver);
        GaussianSplatting._Worker?.terminate();
        GaussianSplatting._Worker = null;
        this._mesh?.dispose();
        this._mesh = null;
    }
}
