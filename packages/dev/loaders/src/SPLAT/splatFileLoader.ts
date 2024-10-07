import type { ISceneLoaderPluginAsync, ISceneLoaderPluginFactory, ISceneLoaderAsyncResult, ISceneLoaderProgressEvent, SceneLoaderPluginOptions } from "core/Loading/sceneLoader";
import { registerSceneLoaderPlugin } from "core/Loading/sceneLoader";
import { SPLATFileLoaderMetadata } from "./splatFileLoader.metadata";
import { GaussianSplattingMesh } from "core/Meshes/GaussianSplatting/gaussianSplattingMesh";
import { AssetContainer } from "core/assetContainer";
import type { Scene } from "core/scene";
import type { Nullable } from "core/types";
import type { AbstractMesh } from "core/Meshes/abstractMesh";
import { Mesh } from "core/Meshes/mesh";
import { Logger } from "core/Misc/logger";
import { Quaternion, TmpVectors, Vector3 } from "core/Maths/math.vector";
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
}

/**
 * A parsed buffer and how to use it
 */
interface ParsedPLY {
    data: ArrayBuffer;
    mode: Mode;
    faces?: number[];
    hasVertexColors?: boolean;
}

/** @internal */
interface CompressedPLYChunk {
    min: Vector3;
    max: Vector3;
    minScale: Vector3;
    maxScale: Vector3;
}

/** @internal */
const enum ElementMode {
    Vertex = 0,
    Chunk = 1,
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

    private _parse(meshesNames: any, scene: Scene, data: any, rootUrl: string): Promise<Array<AbstractMesh>> {
        const babylonMeshesArray: Array<Mesh> = []; //The mesh for babylon
        const parsedPLY = SPLATFileLoader._ConvertPLYToSplat(data as ArrayBuffer);
        switch (parsedPLY.mode) {
            case Mode.Splat:
                {
                    const gaussianSplatting = new GaussianSplattingMesh("GaussianSplatting", null, scene, this._loadingOptions.keepInRam);
                    gaussianSplatting._parentContainer = this._assetContainer;
                    babylonMeshesArray.push(gaussianSplatting);
                    gaussianSplatting.loadDataAsync(parsedPLY.data);
                }
                break;
            case Mode.PointCloud:
                {
                    const pointcloud = new PointsCloudSystem("PointCloud", 1, scene);
                    if (SPLATFileLoader._BuildPointCloud(pointcloud, parsedPLY.data)) {
                        return Promise.all([pointcloud.buildMeshAsync()]).then((mesh) => {
                            babylonMeshesArray.push(mesh[0]);
                            return babylonMeshesArray;
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
        return Promise.resolve(babylonMeshesArray);
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
                result.meshes.forEach((mesh) => container.meshes.push(mesh));
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
    private static _ConvertPLYToSplat(data: ArrayBuffer): ParsedPLY {
        const ubuf = new Uint8Array(data);
        const header = new TextDecoder().decode(ubuf.slice(0, 1024 * 10));
        const headerEnd = "end_header\n";
        const headerEndIndex = header.indexOf(headerEnd);
        if (headerEndIndex < 0 || !header) {
            // standard splat
            return { mode: Mode.Splat, data: data };
        }
        const vertexCount = parseInt(/element vertex (\d+)\n/.exec(header)![1]);
        const faceElement = /element face (\d+)\n/.exec(header);
        const chunkElement = /element chunk (\d+)\n/.exec(header);
        let faceCount = 0;
        let chunkCount = 0;
        if (faceElement) {
            faceCount = parseInt(faceElement[1]);
        }
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
                }
            }
        }

        const rowVertexLength = rowVertexOffset;
        const rowChunkLength = rowChunkOffset;

        const rowOutputLength = 3 * 4 + 3 * 4 + 4 + 4; // Vector3 position, Vector3 scale, 1 u8 quaternion, 1 color with alpha
        const SH_C0 = 0.28209479177387814;
        let offset = 0;

        const dataView = new DataView(data, headerEndIndex + headerEnd.length);
        const buffer = new ArrayBuffer(rowOutputLength * vertexCount);
        const q = new Quaternion();
        const temp3 = TmpVectors.Vector3[0];

        const unpackUnorm = (value: number, bits: number) => {
            const t = (1 << bits) - 1;
            return (value & t) / t;
        };

        const unpack111011 = (value: number, result: Vector3) => {
            result.x = unpackUnorm(value >>> 21, 11);
            result.y = unpackUnorm(value >>> 11, 10);
            result.z = unpackUnorm(value, 11);
        };

        const unpack8888 = (value: number, result: Uint8ClampedArray) => {
            result[0] = unpackUnorm(value >>> 24, 8) * 255;
            result[1] = unpackUnorm(value >>> 16, 8) * 255;
            result[2] = unpackUnorm(value >>> 8, 8) * 255;
            result[3] = unpackUnorm(value, 8) * 255;
        };

        // unpack quaternion with 2,10,10,10 format (largest element, 3x10bit element)
        const unpackRot = (value: number, result: Quaternion) => {
            const norm = 1.0 / (Math.sqrt(2) * 0.5);
            const a = (unpackUnorm(value >>> 20, 10) - 0.5) * norm;
            const b = (unpackUnorm(value >>> 10, 10) - 0.5) * norm;
            const c = (unpackUnorm(value, 10) - 0.5) * norm;
            const m = Math.sqrt(1.0 - (a * a + b * b + c * c));

            switch (value >>> 30) {
                case 0:
                    result.set(m, a, b, c);
                    break;
                case 1:
                    result.set(a, m, b, c);
                    break;
                case 2:
                    result.set(a, b, m, c);
                    break;
                case 3:
                    result.set(a, b, c, m);
                    break;
            }
        };

        const compressedChunks = new Array<CompressedPLYChunk>(chunkCount);
        for (let i = 0; i < chunkCount; i++) {
            const currentChunk = { min: new Vector3(), max: new Vector3(), minScale: new Vector3(), maxScale: new Vector3() };
            compressedChunks[i] = currentChunk;
            for (let propertyIndex = 0; propertyIndex < chunkProperties.length; propertyIndex++) {
                const property = chunkProperties[propertyIndex];
                let value;
                switch (property.type) {
                    case "float":
                        value = dataView.getFloat32(property.offset + offset, true);
                        break;
                    default:
                        //throw new Error(`Unsupported property type: ${property.type}`);
                        continue;
                }

                switch (property.name) {
                    case "min_x":
                        currentChunk.min.x = value;
                        break;
                    case "min_y":
                        currentChunk.min.y = value;
                        break;
                    case "min_z":
                        currentChunk.min.z = value;
                        break;
                    case "max_x":
                        currentChunk.max.x = value;
                        break;
                    case "max_y":
                        currentChunk.max.y = value;
                        break;
                    case "max_z":
                        currentChunk.max.z = value;
                        break;
                    case "min_scale_x":
                        currentChunk.minScale.x = value;
                        break;
                    case "min_scale_y":
                        currentChunk.minScale.y = value;
                        break;
                    case "min_scale_z":
                        currentChunk.minScale.z = value;
                        break;
                    case "max_scale_x":
                        currentChunk.maxScale.x = value;
                        break;
                    case "max_scale_y":
                        currentChunk.maxScale.y = value;
                        break;
                    case "max_scale_z":
                        currentChunk.maxScale.z = value;
                        break;
                }
            }
            offset += rowChunkLength;
        }

        for (let i = 0; i < vertexCount; i++) {
            const position = new Float32Array(buffer, i * rowOutputLength, 3);
            const scale = new Float32Array(buffer, i * rowOutputLength + 12, 3);
            const rgba = new Uint8ClampedArray(buffer, i * rowOutputLength + 24, 4);
            const rot = new Uint8ClampedArray(buffer, i * rowOutputLength + 28, 4);
            const chunkIndex = i >> 8;
            let r0: number = 255;
            let r1: number = 0;
            let r2: number = 0;
            let r3: number = 0;

            for (let propertyIndex = 0; propertyIndex < vertexProperties.length; propertyIndex++) {
                const property = vertexProperties[propertyIndex];
                let value;
                switch (property.type) {
                    case "float":
                        value = dataView.getFloat32(offset + property.offset, true);
                        break;
                    case "int":
                        value = dataView.getInt32(offset + property.offset, true);
                        break;
                    case "uint":
                        value = dataView.getUint32(offset + property.offset, true);
                        break;
                    case "double":
                        value = dataView.getFloat64(offset + property.offset, true);
                        break;
                    case "uchar":
                        value = dataView.getUint8(offset + property.offset);
                        break;
                    default:
                        //throw new Error(`Unsupported property type: ${property.type}`);
                        continue;
                }

                switch (property.name) {
                    case "packed_position":
                        {
                            const compressedChunk = compressedChunks[chunkIndex];
                            unpack111011(value, temp3);
                            position[0] = Scalar.Lerp(compressedChunk.min.x, compressedChunk.max.x, temp3.x);
                            position[1] = -Scalar.Lerp(compressedChunk.min.y, compressedChunk.max.y, temp3.y);
                            position[2] = Scalar.Lerp(compressedChunk.min.z, compressedChunk.max.z, temp3.z);
                        }
                        break;
                    case "packed_rotation":
                        {
                            unpackRot(value, q);
                            r0 = q.w;
                            r1 = q.z;
                            r2 = q.y;
                            r3 = q.x;
                        }
                        break;
                    case "packed_scale":
                        {
                            const compressedChunk = compressedChunks[chunkIndex];
                            unpack111011(value, temp3);
                            scale[0] = Math.exp(Scalar.Lerp(compressedChunk.minScale.x, compressedChunk.maxScale.x, temp3.x));
                            scale[1] = Math.exp(Scalar.Lerp(compressedChunk.minScale.y, compressedChunk.maxScale.y, temp3.y));
                            scale[2] = Math.exp(Scalar.Lerp(compressedChunk.minScale.z, compressedChunk.maxScale.z, temp3.z));
                        }
                        break;
                    case "packed_color":
                        unpack8888(value, rgba);
                        break;
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
                    case "diffuse_red":
                    case "red":
                        rgba[0] = value;
                        break;
                    case "diffuse_green":
                    case "green":
                        rgba[1] = value;
                        break;
                    case "diffuse_blue":
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
            offset += rowVertexLength;
        }

        // faces
        const faces = [];
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
            return { mode: Mode.Splat, data: buffer, faces: faces, hasVertexColors: false };
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
        return { mode: currentMode, data: buffer, faces: faces, hasVertexColors: !!propertyColorCount };
    }
}

// Add this loader into the register plugin
registerSceneLoaderPlugin(new SPLATFileLoader());
