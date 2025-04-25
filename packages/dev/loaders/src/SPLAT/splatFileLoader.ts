import type { ISceneLoaderPluginAsync, ISceneLoaderPluginFactory, ISceneLoaderAsyncResult, ISceneLoaderProgressEvent, SceneLoaderPluginOptions } from "core/Loading/sceneLoader";
import { RegisterSceneLoaderPlugin } from "core/Loading/sceneLoader";
import { SPLATFileLoaderMetadata } from "./splatFileLoader.metadata";
import { GaussianSplattingMesh } from "core/Meshes/GaussianSplatting/gaussianSplattingMesh";
import { AssetContainer } from "core/assetContainer";
import type { Scene } from "core/scene";
import type { Nullable } from "core/types";
import type { AbstractMesh } from "core/Meshes/abstractMesh";
import { Mesh } from "core/Meshes/mesh";
import { Logger } from "core/Misc/logger";
import { Vector3 } from "core/Maths/math.vector";
import { PointsCloudSystem } from "core/Particles/pointsCloudSystem";
import { Color4 } from "core/Maths/math.color";
import { VertexData } from "core/Meshes/mesh.vertexData";
import type { SPLATLoadingOptions } from "./splatLoadingOptions";
import { Scalar } from "core/Maths/math.scalar";

declare module "core/Loading/sceneLoader" {
    // eslint-disable-next-line jsdoc/require-jsdoc
    export interface SceneLoaderPluginOptions {
        /**
         * Defines options for the splat loader.
         */
        [SPLATFileLoaderMetadata.name]: Partial<SPLATLoadingOptions>;
    }
}

/**
 * Indicator of the parsed ply buffer. A standard ready to use splat or an array of positions for a point cloud
 */
const enum Mode {
    Splat = 0,
    PointCloud = 1,
    Mesh = 2,
    Reject = 3,
}

/**
 * A parsed buffer and how to use it
 */
interface ParsedPLY {
    data: ArrayBuffer;
    mode: Mode;
    faces?: number[];
    hasVertexColors?: boolean;
    sh?: Uint8Array[];
}

/**
 * @experimental
 * SPLAT file type loader.
 * This is a babylon scene loader plugin.
 */
export class SPLATFileLoader implements ISceneLoaderPluginAsync, ISceneLoaderPluginFactory {
    /**
     * Defines the name of the plugin.
     */
    public readonly name = SPLATFileLoaderMetadata.name;

    private _assetContainer: Nullable<AssetContainer> = null;

    private readonly _loadingOptions: Readonly<SPLATLoadingOptions>;
    /**
     * Defines the extensions the splat loader is able to load.
     * force data to come in as an ArrayBuffer
     */
    public readonly extensions = SPLATFileLoaderMetadata.extensions;

    /**
     * Creates loader for gaussian splatting files
     * @param loadingOptions options for loading and parsing splat and PLY files.
     */
    constructor(loadingOptions: Partial<Readonly<SPLATLoadingOptions>> = SPLATFileLoader._DefaultLoadingOptions) {
        this._loadingOptions = loadingOptions;
    }

    private static readonly _DefaultLoadingOptions = {
        keepInRam: false,
        flipY: false,
    } as const satisfies SPLATLoadingOptions;

    /** @internal */
    createPlugin(options: SceneLoaderPluginOptions): ISceneLoaderPluginAsync {
        return new SPLATFileLoader(options[SPLATFileLoaderMetadata.name]);
    }

    /**
     * Imports  from the loaded gaussian splatting data and adds them to the scene
     * @param meshesNames a string or array of strings of the mesh names that should be loaded from the file
     * @param scene the scene the meshes should be added to
     * @param data the gaussian splatting data to load
     * @param rootUrl root url to load from
     * @param onProgress callback called while file is loading
     * @param fileName Defines the name of the file to load
     * @returns a promise containing the loaded meshes, particles, skeletons and animations
     */
    public async importMeshAsync(
        meshesNames: any,
        scene: Scene,
        data: any,
        rootUrl: string,
        onProgress?: (event: ISceneLoaderProgressEvent) => void,
        fileName?: string
    ): Promise<ISceneLoaderAsyncResult> {
        return this._parse(meshesNames, scene, data, rootUrl).then((meshes) => {
            return {
                meshes: meshes,
                particleSystems: [],
                skeletons: [],
                animationGroups: [],
                transformNodes: [],
                geometries: [],
                lights: [],
                spriteManagers: [],
            };
        });
    }

    private static _BuildPointCloud(pointcloud: PointsCloudSystem, data: ArrayBuffer): boolean {
        if (!data.byteLength) {
            return false;
        }
        const uBuffer = new Uint8Array(data);
        const fBuffer = new Float32Array(data);

        // parsed array contains room for position(3floats), normal(3floats), color (4b), quantized quaternion (4b)
        const rowLength = 3 * 4 + 3 * 4 + 4 + 4;
        const vertexCount = uBuffer.length / rowLength;

        const pointcloudfunc = function (particle: any, i: number) {
            const x = fBuffer[8 * i + 0];
            const y = fBuffer[8 * i + 1];
            const z = fBuffer[8 * i + 2];
            particle.position = new Vector3(x, y, z);

            const r = uBuffer[rowLength * i + 24 + 0] / 255;
            const g = uBuffer[rowLength * i + 24 + 1] / 255;
            const b = uBuffer[rowLength * i + 24 + 2] / 255;
            particle.color = new Color4(r, g, b, 1);
        };

        pointcloud.addPoints(vertexCount, pointcloudfunc);
        return true;
    }

    private static _BuildMesh(scene: Scene, parsedPLY: ParsedPLY): Mesh {
        const mesh = new Mesh("PLYMesh", scene);

        const uBuffer = new Uint8Array(parsedPLY.data);
        const fBuffer = new Float32Array(parsedPLY.data);

        const rowLength = 3 * 4 + 3 * 4 + 4 + 4;
        const vertexCount = uBuffer.length / rowLength;

        const positions = [];

        const vertexData = new VertexData();
        for (let i = 0; i < vertexCount; i++) {
            const x = fBuffer[8 * i + 0];
            const y = fBuffer[8 * i + 1];
            const z = fBuffer[8 * i + 2];
            positions.push(x, y, z);
        }

        if (parsedPLY.hasVertexColors) {
            const colors = new Float32Array(vertexCount * 4);
            for (let i = 0; i < vertexCount; i++) {
                const r = uBuffer[rowLength * i + 24 + 0] / 255;
                const g = uBuffer[rowLength * i + 24 + 1] / 255;
                const b = uBuffer[rowLength * i + 24 + 2] / 255;
                colors[i * 4 + 0] = r;
                colors[i * 4 + 1] = g;
                colors[i * 4 + 2] = b;
                colors[i * 4 + 3] = 1;
            }
            vertexData.colors = colors;
        }

        vertexData.positions = positions;
        vertexData.indices = parsedPLY.faces!;

        vertexData.applyToMesh(mesh);
        return mesh;
    }

    private _parseSPZ(data: ArrayBuffer, scene: Scene): Promise<ParsedPLY> {
        const ubuf = new Uint8Array(data);
        const ubufu32 = new Uint32Array(data.slice(0, 12)); // Only need ubufu32[0] to [2]
        // debug infos
        const splatCount = ubufu32[2];

        const shDegree = ubuf[12];
        const fractionalBits = ubuf[13];
        //const flags = ubuf[14];
        const reserved = ubuf[15];

        // check magic and version
        if (reserved || ubufu32[0] != 0x5053474e || ubufu32[1] != 2) {
            // reserved must be 0
            return new Promise((resolve) => {
                resolve({ mode: Mode.Reject, data: buffer, hasVertexColors: false });
            });
        }

        const rowOutputLength = 3 * 4 + 3 * 4 + 4 + 4; // 32
        const buffer = new ArrayBuffer(rowOutputLength * splatCount);

        const positionScale = 1.0 / (1 << fractionalBits);

        const int32View = new Int32Array(1);
        const uint8View = new Uint8Array(int32View.buffer);
        const read24bComponent = function (u8: Uint8Array, offset: number) {
            uint8View[0] = u8[offset + 0];
            uint8View[1] = u8[offset + 1];
            uint8View[2] = u8[offset + 2];
            uint8View[3] = u8[offset + 2] & 0x80 ? 0xff : 0x00;
            return int32View[0] * positionScale;
        };

        let byteOffset = 16;

        const position = new Float32Array(buffer);
        const scale = new Float32Array(buffer);
        const rgba = new Uint8ClampedArray(buffer);
        const rot = new Uint8ClampedArray(buffer);

        let coordinateSign = 1;
        let quaternionOffset = 0;
        if (!this._loadingOptions.flipY) {
            coordinateSign = -1;
            quaternionOffset = 255;
        }
        // positions
        for (let i = 0; i < splatCount; i++) {
            position[i * 8 + 0] = read24bComponent(ubuf, byteOffset + 0);
            position[i * 8 + 1] = coordinateSign * read24bComponent(ubuf, byteOffset + 3);
            position[i * 8 + 2] = coordinateSign * read24bComponent(ubuf, byteOffset + 6);
            byteOffset += 9;
        }

        // colors
        const SH_C0 = 0.282;
        for (let i = 0; i < splatCount; i++) {
            for (let component = 0; component < 3; component++) {
                const byteValue = ubuf[byteOffset + splatCount + i * 3 + component];
                // 0.15 is hard coded value from spz
                // Scale factor for DC color components. To convert to RGB, we should multiply by 0.282, but it can
                // be useful to represent base colors that are out of range if the higher spherical harmonics bands
                // bring them back into range so we multiply by a smaller value.
                const value = (byteValue - 127.5) / (0.15 * 255);
                rgba[i * 32 + 24 + component] = Scalar.Clamp((0.5 + SH_C0 * value) * 255, 0, 255);
            }

            rgba[i * 32 + 24 + 3] = ubuf[byteOffset + i];
        }
        byteOffset += splatCount * 4;

        // scales
        for (let i = 0; i < splatCount; i++) {
            scale[i * 8 + 3 + 0] = Math.exp(ubuf[byteOffset + 0] / 16.0 - 10.0);
            scale[i * 8 + 3 + 1] = Math.exp(ubuf[byteOffset + 1] / 16.0 - 10.0);
            scale[i * 8 + 3 + 2] = Math.exp(ubuf[byteOffset + 2] / 16.0 - 10.0);
            byteOffset += 3;
        }

        // convert quaternion
        for (let i = 0; i < splatCount; i++) {
            const x = ubuf[byteOffset + 0];
            const y = ubuf[byteOffset + 1] * coordinateSign + quaternionOffset;
            const z = ubuf[byteOffset + 2] * coordinateSign + quaternionOffset;
            const nx = x / 127.5 - 1;
            const ny = y / 127.5 - 1;
            const nz = z / 127.5 - 1;
            rot[i * 32 + 28 + 1] = x;
            rot[i * 32 + 28 + 2] = y;
            rot[i * 32 + 28 + 3] = z;
            const v = 1 - (nx * nx + ny * ny + nz * nz);
            rot[i * 32 + 28 + 0] = 127.5 + Math.sqrt(v < 0 ? 0 : v) * 127.5;

            byteOffset += 3;
        }

        //SH
        if (shDegree) {
            // shVectorCount is : 3 for dim = 1, 8 for dim = 2 and 15 for dim = 3
            // number of vec3 vector needed per splat
            const shVectorCount = (shDegree + 1) * (shDegree + 1) - 1; // minus 1 because sh0 is color
            // number of component values : 3 per vector3 (45)
            const shComponentCount = shVectorCount * 3;

            const textureCount = Math.ceil(shComponentCount / 16); // 4 components can be stored per texture, 4 sh per component
            let shIndexRead = byteOffset;

            // sh is an array of uint8array that will be used to create sh textures
            const sh: Uint8Array[] = [];

            const engine = scene.getEngine();
            const width = engine.getCaps().maxTextureSize;
            const height = Math.ceil(splatCount / width);
            // create array for the number of textures needed.
            for (let textureIndex = 0; textureIndex < textureCount; textureIndex++) {
                const texture = new Uint8Array(height * width * 4 * 4); // 4 components per texture, 4 sh per component
                sh.push(texture);
            }

            for (let i = 0; i < splatCount; i++) {
                for (let shIndexWrite = 0; shIndexWrite < shComponentCount; shIndexWrite++) {
                    const shValue = ubuf[shIndexRead++];

                    const textureIndex = Math.floor(shIndexWrite / 16);
                    const shArray = sh[textureIndex];

                    const byteIndexInTexture = shIndexWrite % 16; // [0..15]
                    const offsetPerSplat = i * 16; // 16 sh values per texture per splat.
                    shArray[byteIndexInTexture + offsetPerSplat] = shValue;
                }
            }

            return new Promise((resolve) => {
                resolve({ mode: Mode.Splat, data: buffer, hasVertexColors: false, sh: sh });
            });
        }

        return new Promise((resolve) => {
            resolve({ mode: Mode.Splat, data: buffer, hasVertexColors: false });
        });
    }

    private _parse(meshesNames: any, scene: Scene, data: any, rootUrl: string): Promise<Array<AbstractMesh>> {
        const babylonMeshesArray: Array<Mesh> = []; //The mesh for babylon

        const readableStream = new ReadableStream({
            start(controller) {
                controller.enqueue(new Uint8Array(data)); // Enqueue the ArrayBuffer as a Uint8Array
                controller.close();
            },
        });

        // Use GZip DecompressionStream
        const decompressionStream = new DecompressionStream("gzip");
        const decompressedStream = readableStream.pipeThrough(decompressionStream);

        return new Promise((resolve) => {
            new Response(decompressedStream)
                .arrayBuffer()
                .then((buffer) => {
                    this._parseSPZ(buffer, scene).then((parsedSPZ) => {
                        scene._blockEntityCollection = !!this._assetContainer;
                        const gaussianSplatting = new GaussianSplattingMesh("GaussianSplatting", null, scene, this._loadingOptions.keepInRam);
                        gaussianSplatting._parentContainer = this._assetContainer;
                        babylonMeshesArray.push(gaussianSplatting);
                        gaussianSplatting.updateData(parsedSPZ.data, parsedSPZ.sh);
                        scene._blockEntityCollection = false;
                        resolve(babylonMeshesArray);
                    });
                })
                .catch(() => {
                    // Catch any decompression errors
                    SPLATFileLoader._ConvertPLYToSplat(data as ArrayBuffer).then(async (parsedPLY) => {
                        scene._blockEntityCollection = !!this._assetContainer;
                        switch (parsedPLY.mode) {
                            case Mode.Splat:
                                {
                                    const gaussianSplatting = new GaussianSplattingMesh("GaussianSplatting", null, scene, this._loadingOptions.keepInRam);
                                    gaussianSplatting._parentContainer = this._assetContainer;
                                    babylonMeshesArray.push(gaussianSplatting);
                                    gaussianSplatting.updateData(parsedPLY.data, parsedPLY.sh);
                                }
                                break;
                            case Mode.PointCloud:
                                {
                                    const pointcloud = new PointsCloudSystem("PointCloud", 1, scene);
                                    if (SPLATFileLoader._BuildPointCloud(pointcloud, parsedPLY.data)) {
                                        await pointcloud.buildMeshAsync().then((mesh) => {
                                            babylonMeshesArray.push(mesh);
                                        });
                                    } else {
                                        pointcloud.dispose();
                                    }
                                }
                                break;
                            case Mode.Mesh:
                                {
                                    if (parsedPLY.faces) {
                                        babylonMeshesArray.push(SPLATFileLoader._BuildMesh(scene, parsedPLY));
                                    } else {
                                        throw new Error("PLY mesh doesn't contain face informations.");
                                    }
                                }
                                break;
                            default:
                                throw new Error("Unsupported Splat mode");
                        }
                        scene._blockEntityCollection = false;
                        resolve(babylonMeshesArray);
                    });
                });
        });
    }

    /**
     * Load into an asset container.
     * @param scene The scene to load into
     * @param data The data to import
     * @param rootUrl The root url for scene and resources
     * @returns The loaded asset container
     */
    public loadAssetContainerAsync(scene: Scene, data: string, rootUrl: string): Promise<AssetContainer> {
        const container = new AssetContainer(scene);
        this._assetContainer = container;

        return this.importMeshAsync(null, scene, data, rootUrl)
            .then((result) => {
                for (const mesh of result.meshes) {
                    container.meshes.push(mesh);
                }
                // mesh material will be null before 1st rendered frame.
                this._assetContainer = null;
                return container;
            })
            .catch((ex) => {
                this._assetContainer = null;
                throw ex;
            });
    }

    /**
     * Imports all objects from the loaded OBJ data and adds them to the scene
     * @param scene the scene the objects should be added to
     * @param data the OBJ data to load
     * @param rootUrl root url to load from
     * @returns a promise which completes when objects have been loaded to the scene
     */
    public loadAsync(scene: Scene, data: string, rootUrl: string): Promise<void> {
        //Get the 3D model
        return this.importMeshAsync(null, scene, data, rootUrl).then(() => {
            // return void
        });
    }

    /**
     * Code from https://github.com/dylanebert/gsplat.js/blob/main/src/loaders/PLYLoader.ts Under MIT license
     * Converts a .ply data array buffer to splat
     * if data array buffer is not ply, returns the original buffer
     * @param data the .ply data to load
     * @returns the loaded splat buffer
     */
    private static _ConvertPLYToSplat(data: ArrayBuffer): Promise<ParsedPLY> {
        const ubuf = new Uint8Array(data);
        const header = new TextDecoder().decode(ubuf.slice(0, 1024 * 10));
        const headerEnd = "end_header\n";
        const headerEndIndex = header.indexOf(headerEnd);
        if (headerEndIndex < 0 || !header) {
            // standard splat
            return new Promise((resolve) => {
                resolve({ mode: Mode.Splat, data: data });
            });
        }

        const vertexCount = parseInt(/element vertex (\d+)\n/.exec(header)![1]);
        const faceElement = /element face (\d+)\n/.exec(header);
        let faceCount = 0;
        if (faceElement) {
            faceCount = parseInt(faceElement[1]);
        }
        const chunkElement = /element chunk (\d+)\n/.exec(header);
        let chunkCount = 0;
        if (chunkElement) {
            chunkCount = parseInt(chunkElement[1]);
        }

        let rowVertexOffset = 0;
        let rowChunkOffset = 0;
        const offsets: Record<string, number> = {
            double: 8,
            int: 4,
            uint: 4,
            float: 4,
            short: 2,
            ushort: 2,
            uchar: 1,
            list: 0,
        };

        type PlyProperty = {
            name: string;
            type: string;
            offset: number;
        };

        const enum ElementMode {
            Vertex = 0,
            Chunk = 1,
            SH = 2,
        }

        let chunkMode = ElementMode.Chunk;
        const vertexProperties: PlyProperty[] = [];
        const chunkProperties: PlyProperty[] = [];
        const filtered = header.slice(0, headerEndIndex).split("\n");
        for (const prop of filtered) {
            if (prop.startsWith("property ")) {
                const [, type, name] = prop.split(" ");

                if (chunkMode == ElementMode.Chunk) {
                    chunkProperties.push({ name, type, offset: rowChunkOffset });
                    rowChunkOffset += offsets[type];
                } else if (chunkMode == ElementMode.Vertex) {
                    vertexProperties.push({ name, type, offset: rowVertexOffset });
                    rowVertexOffset += offsets[type];
                } else if (chunkMode == ElementMode.SH) {
                    vertexProperties.push({ name, type, offset: rowVertexOffset });
                }
                if (!offsets[type]) {
                    Logger.Warn(`Unsupported property type: ${type}.`);
                }
            } else if (prop.startsWith("element ")) {
                const [, type] = prop.split(" ");
                if (type == "chunk") {
                    chunkMode = ElementMode.Chunk;
                } else if (type == "vertex") {
                    chunkMode = ElementMode.Vertex;
                } else if (type == "sh") {
                    chunkMode = ElementMode.SH;
                }
            }
        }

        const rowVertexLength = rowVertexOffset;
        const rowChunkLength = rowChunkOffset;

        return (GaussianSplattingMesh.ConvertPLYWithSHToSplatAsync(data) as any).then((splatsData: any) => {
            const dataView = new DataView(data, headerEndIndex + headerEnd.length);
            let offset = rowChunkLength * chunkCount + rowVertexLength * vertexCount;
            // faces
            const faces: number[] = [];
            if (faceCount) {
                for (let i = 0; i < faceCount; i++) {
                    const faceVertexCount = dataView.getUint8(offset);
                    if (faceVertexCount != 3) {
                        continue; // only support triangles
                    }
                    offset += 1;

                    for (let j = 0; j < faceVertexCount; j++) {
                        const vertexIndex = dataView.getUint32(offset + (2 - j) * 4, true); // change face winding
                        faces.push(vertexIndex);
                    }
                    offset += 12;
                }
            }

            // early exit for chunked/quantized ply
            if (chunkCount) {
                return new Promise((resolve) => {
                    resolve({ mode: Mode.Splat, data: splatsData.buffer, sh: splatsData.sh, faces: faces, hasVertexColors: false });
                });
            }
            // count available properties. if all necessary are present then it's a splat. Otherwise, it's a point cloud
            // if faces are found, then it's a standard mesh
            let propertyCount = 0;
            let propertyColorCount = 0;
            const splatProperties = ["x", "y", "z", "scale_0", "scale_1", "scale_2", "opacity", "rot_0", "rot_1", "rot_2", "rot_3"];
            const splatColorProperties = ["red", "green", "blue", "f_dc_0", "f_dc_1", "f_dc_2"];
            for (let propertyIndex = 0; propertyIndex < vertexProperties.length; propertyIndex++) {
                const property = vertexProperties[propertyIndex];
                if (splatProperties.includes(property.name)) {
                    propertyCount++;
                }
                if (splatColorProperties.includes(property.name)) {
                    propertyColorCount++;
                }
            }
            const hasMandatoryProperties = propertyCount == splatProperties.length && propertyColorCount == 3;
            const currentMode = faceCount ? Mode.Mesh : hasMandatoryProperties ? Mode.Splat : Mode.PointCloud;
            // parsed ready ready to be used as a splat
            return new Promise((resolve) => {
                resolve({ mode: currentMode, data: splatsData.buffer, sh: splatsData.sh, faces: faces, hasVertexColors: !!propertyColorCount });
            });
        });
    }
}

// Add this loader into the register plugin
RegisterSceneLoaderPlugin(new SPLATFileLoader());
