/* eslint-disable @typescript-eslint/promise-function-async*/
/* eslint-disable @typescript-eslint/naming-convention */
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
import type { GaussianSplattingMaterial } from "core/Materials/GaussianSplatting/gaussianSplattingMaterial";
import { ParseSpz } from "./spz";
import { Mode } from "./splatDefs";
import type { IParsedSplat } from "./splatDefs";
import { ParseSogMeta } from "./sog";
import type { SOGRootData } from "./sog";
import { Tools } from "core/Misc/tools";
import type { ArcRotateCamera } from "core/Cameras/arcRotateCamera";

declare module "core/Loading/sceneLoader" {
    // eslint-disable-next-line jsdoc/require-jsdoc, @typescript-eslint/naming-convention
    export interface SceneLoaderPluginOptions {
        /**
         * Defines options for the splat loader.
         */
        [SPLATFileLoaderMetadata.name]: Partial<SPLATLoadingOptions>;
    }
}

// FFlate access
declare const fflate: any;

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
     * @param _onProgress callback called while file is loading
     * @param _fileName Defines the name of the file to load
     * @returns a promise containing the loaded meshes, particles, skeletons and animations
     */
    public async importMeshAsync(
        meshesNames: any,
        scene: Scene,
        data: any,
        rootUrl: string,
        _onProgress?: (event: ISceneLoaderProgressEvent) => void,
        _fileName?: string
    ): Promise<ISceneLoaderAsyncResult> {
        // eslint-disable-next-line github/no-then
        return await this._parseAsync(meshesNames, scene, data, rootUrl).then((meshes) => {
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

    private static _BuildMesh(scene: Scene, parsedPLY: IParsedSplat): Mesh {
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

    // eslint-disable-next-line @typescript-eslint/promise-function-async, no-restricted-syntax, @typescript-eslint/naming-convention
    private async _unzipWithFFlateAsync(data: Uint8Array): Promise<Map<string, Uint8Array>> {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        let fflate = this._loadingOptions.fflate as typeof import("fflate");
        // ensure fflate is loaded
        if (!fflate) {
            if (typeof (window as any).fflate === "undefined") {
                await Tools.LoadScriptAsync(this._loadingOptions.deflateURL ?? "https://unpkg.com/fflate/umd/index.js");
            }
            fflate = (window as any).fflate as typeof fflate;
        }

        const { unzipSync } = fflate;

        const unzipped = unzipSync(data) as Record<string, Uint8Array>; // { [filename: string]: Uint8Array }

        const files = new Map<string, Uint8Array>();
        for (const [name, content] of Object.entries(unzipped)) {
            files.set(name, content);
        }
        return files;
    }
    // eslint-disable-next-line @typescript-eslint/promise-function-async, no-restricted-syntax
    private _parseAsync(meshesNames: any, scene: Scene, data: any, rootUrl: string): Promise<Array<AbstractMesh>> {
        const babylonMeshesArray: Array<Mesh> = []; //The mesh for babylon

        const makeGSFromParsedSOG = (parsedSOG: IParsedSplat) => {
            scene._blockEntityCollection = !!this._assetContainer;
            const gaussianSplatting = this._loadingOptions.gaussianSplattingMesh ?? new GaussianSplattingMesh("GaussianSplatting", null, scene, this._loadingOptions.keepInRam);
            gaussianSplatting._parentContainer = this._assetContainer;
            babylonMeshesArray.push(gaussianSplatting);
            gaussianSplatting.updateData(parsedSOG.data, parsedSOG.sh, { flipY: false });
            gaussianSplatting.scaling.y *= -1;
            gaussianSplatting.computeWorldMatrix(true);
            scene._blockEntityCollection = false;
        };

        // check if data is json string
        if (typeof data === "string") {
            const dataSOG = JSON.parse(data) as SOGRootData;
            if (dataSOG && dataSOG.means && dataSOG.scales && dataSOG.quats && dataSOG.sh0) {
                return new Promise((resolve) => {
                    ParseSogMeta(dataSOG, rootUrl, scene)
                        // eslint-disable-next-line @typescript-eslint/no-floating-promises, github/no-then
                        .then((parsedSOG) => {
                            makeGSFromParsedSOG(parsedSOG);
                            resolve(babylonMeshesArray);
                        })
                        // eslint-disable-next-line github/no-then
                        .catch(() => {
                            throw new Error("Failed to parse SOG data.");
                        });
                });
            }
        }

        const u8 = data instanceof ArrayBuffer ? new Uint8Array(data) : data;
        // ZIP signature check for SOG
        if (u8[0] === 0x50 && u8[1] === 0x4b) {
            return new Promise((resolve) => {
                // eslint-disable-next-line @typescript-eslint/no-floating-promises, github/no-then
                this._unzipWithFFlateAsync(u8).then((files) => {
                    ParseSogMeta(files, rootUrl, scene)
                        // eslint-disable-next-line @typescript-eslint/no-floating-promises, github/no-then
                        .then((parsedSOG) => {
                            makeGSFromParsedSOG(parsedSOG);
                            resolve(babylonMeshesArray);
                        }) // eslint-disable-next-line github/no-then
                        .catch(() => {
                            throw new Error("Failed to parse SOG zip data.");
                        });
                });
            });
        }

        const handlePLY = (resolve: (value: AbstractMesh[]) => void) => {
            // eslint-disable-next-line @typescript-eslint/no-floating-promises, github/no-then
            SPLATFileLoader._ConvertPLYToSplat(data as ArrayBuffer).then(async (parsedPLY) => {
                scene._blockEntityCollection = !!this._assetContainer;
                switch (parsedPLY.mode) {
                    case Mode.Splat:
                        {
                            const gaussianSplatting =
                                this._loadingOptions.gaussianSplattingMesh ?? new GaussianSplattingMesh("GaussianSplatting", null, scene, this._loadingOptions.keepInRam);
                            gaussianSplatting._parentContainer = this._assetContainer;
                            babylonMeshesArray.push(gaussianSplatting);
                            gaussianSplatting.updateData(parsedPLY.data, parsedPLY.sh, { flipY: false });
                            gaussianSplatting.scaling.y *= -1.0;

                            if (parsedPLY.chirality === "RightHanded") {
                                gaussianSplatting.scaling.y *= -1.0;
                            }

                            switch (parsedPLY.upAxis) {
                                case "X":
                                    gaussianSplatting.rotation = new Vector3(0, 0, Math.PI / 2);
                                    break;
                                case "Y":
                                    gaussianSplatting.rotation = new Vector3(0, 0, Math.PI);
                                    break;
                                case "Z":
                                    gaussianSplatting.rotation = new Vector3(-Math.PI / 2, Math.PI, 0);
                                    break;
                            }
                            gaussianSplatting.computeWorldMatrix(true);
                        }
                        break;
                    case Mode.PointCloud:
                        {
                            const pointcloud = new PointsCloudSystem("PointCloud", 1, scene);
                            if (SPLATFileLoader._BuildPointCloud(pointcloud, parsedPLY.data)) {
                                // eslint-disable-next-line github/no-then
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
                this.applyAutoCameraLimits(parsedPLY, scene);
                resolve(babylonMeshesArray);
            });
        };

        // Check for gzip magic bytes (SPZ format) before attempting decompression
        if (u8[0] !== 0x1f || u8[1] !== 0x8b) {
            return new Promise((resolve) => {
                handlePLY(resolve);
            });
        }

        // Use GZip DecompressionStream for SPZ files
        const readableStream = new ReadableStream({
            start(controller) {
                controller.enqueue(new Uint8Array(data));
                controller.close();
            },
        });
        const decompressionStream = new DecompressionStream("gzip");
        const decompressedStream = readableStream.pipeThrough(decompressionStream);

        return new Promise((resolve) => {
            new Response(decompressedStream)
                .arrayBuffer()
                // eslint-disable-next-line github/no-then
                .then((buffer) => {
                    // eslint-disable-next-line @typescript-eslint/no-floating-promises, github/no-then
                    ParseSpz(buffer, scene, this._loadingOptions).then((parsedSPZ) => {
                        scene._blockEntityCollection = !!this._assetContainer;
                        const gaussianSplatting =
                            this._loadingOptions.gaussianSplattingMesh ?? new GaussianSplattingMesh("GaussianSplatting", null, scene, this._loadingOptions.keepInRam);
                        if (parsedSPZ.trainedWithAntialiasing) {
                            const gsMaterial = gaussianSplatting.material as GaussianSplattingMaterial;
                            gsMaterial.kernelSize = 0.1;
                            gsMaterial.compensation = true;
                        }
                        gaussianSplatting._parentContainer = this._assetContainer;
                        babylonMeshesArray.push(gaussianSplatting);
                        gaussianSplatting.updateData(parsedSPZ.data, parsedSPZ.sh, { flipY: false });
                        if (!this._loadingOptions.flipY) {
                            gaussianSplatting.scaling.y *= -1.0;
                            gaussianSplatting.computeWorldMatrix(true);
                        }
                        scene._blockEntityCollection = false;
                        this.applyAutoCameraLimits(parsedSPZ, scene);
                        resolve(babylonMeshesArray);
                    });
                })
                // eslint-disable-next-line github/no-then
                .catch(() => {
                    handlePLY(resolve);
                });
        });
    }

    /**
     * Applies camera limits based on parsed meta data
     * @param meta parsed splat meta data
     * @param scene
     */
    private applyAutoCameraLimits(meta: IParsedSplat, scene: Scene): void {
        if (this._loadingOptions.disableAutoCameraLimits) {
            return;
        }
        if ((meta.safeOrbitCameraRadiusMin !== undefined || meta.safeOrbitCameraElevationMinMax !== undefined) && scene.activeCamera?.getClassName() === "ArcRotateCamera") {
            const arcCam = scene.activeCamera as ArcRotateCamera;
            if (meta.safeOrbitCameraElevationMinMax) {
                arcCam.lowerBetaLimit = Math.PI * 0.5 - meta.safeOrbitCameraElevationMinMax[1];
                arcCam.upperBetaLimit = Math.PI * 0.5 - meta.safeOrbitCameraElevationMinMax[0];
            }

            if (meta.safeOrbitCameraRadiusMin) {
                arcCam.lowerRadiusLimit = meta.safeOrbitCameraRadiusMin;
            }
        }
    }

    /**
     * Load into an asset container.
     * @param scene The scene to load into
     * @param data The data to import
     * @param rootUrl The root url for scene and resources
     * @returns The loaded asset container
     */
    // eslint-disable-next-line no-restricted-syntax
    public loadAssetContainerAsync(scene: Scene, data: string, rootUrl: string): Promise<AssetContainer> {
        const container = new AssetContainer(scene);
        this._assetContainer = container;

        return (
            this.importMeshAsync(null, scene, data, rootUrl)
                // eslint-disable-next-line github/no-then
                .then((result) => {
                    for (const mesh of result.meshes) {
                        container.meshes.push(mesh);
                    }
                    // mesh material will be null before 1st rendered frame.
                    this._assetContainer = null;
                    return container;
                })
                // eslint-disable-next-line github/no-then
                .catch((ex) => {
                    this._assetContainer = null;
                    throw ex;
                })
        );
    }

    /**
     * Imports all objects from the loaded OBJ data and adds them to the scene
     * @param scene the scene the objects should be added to
     * @param data the OBJ data to load
     * @param rootUrl root url to load from
     * @returns a promise which completes when objects have been loaded to the scene
     */
    // eslint-disable-next-line @typescript-eslint/promise-function-async, no-restricted-syntax
    public loadAsync(scene: Scene, data: string, rootUrl: string): Promise<void> {
        //Get the 3D model
        // eslint-disable-next-line github/no-then
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
    private static _ConvertPLYToSplat(data: ArrayBuffer): Promise<IParsedSplat> {
        const ubuf = new Uint8Array(data);
        const header = new TextDecoder().decode(ubuf.slice(0, 1024 * 10));
        const headerEnd = "end_header\n";
        const headerEndIndex = header.indexOf(headerEnd);
        if (headerEndIndex < 0 || !header) {
            // standard splat
            return new Promise((resolve) => {
                resolve({ mode: Mode.Splat, data: data, rawSplat: true });
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

        const ElementMode: Record<string, number> = {
            Vertex: 0,
            Chunk: 1,
            SH: 2,
            Float_Tuple: 3,
            Float: 4,
            Uchar: 5,
        };

        let chunkMode = ElementMode.Chunk;
        const vertexProperties: PlyProperty[] = [];
        const chunkProperties: PlyProperty[] = [];
        const filtered = header.slice(0, headerEndIndex).split("\n");
        const metaData: Partial<IParsedSplat> = {};
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
                } else if (chunkMode == ElementMode.Float_Tuple) {
                    const view = new DataView(data, rowChunkOffset, offsets.float * 2);
                    metaData.safeOrbitCameraElevationMinMax = [view.getFloat32(0, true), view.getFloat32(4, true)];
                } else if (chunkMode == ElementMode.Float) {
                    const view = new DataView(data, rowChunkOffset, offsets.float);
                    metaData.safeOrbitCameraRadiusMin = view.getFloat32(0, true);
                } else if (chunkMode == ElementMode.Uchar) {
                    const view = new DataView(data, rowChunkOffset, offsets.uchar);
                    if (name == "up_axis") {
                        metaData.upAxis = view.getUint8(0) == 0 ? "X" : view.getUint8(0) == 1 ? "Y" : "Z";
                    } else if (name == "chirality") {
                        metaData.chirality = view.getUint8(0) == 0 ? "LeftHanded" : "RightHanded";
                    }
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
                } else if (type == "safe_orbit_camera_elevation_min_max_radians") {
                    chunkMode = ElementMode.Float_Tuple;
                } else if (type == "safe_orbit_camera_radius_min") {
                    chunkMode = ElementMode.Float;
                } else if (type == "up_axis" || type == "chirality") {
                    chunkMode = ElementMode.Uchar;
                }
            }
        }

        const rowVertexLength = rowVertexOffset;
        const rowChunkLength = rowChunkOffset;

        // eslint-disable-next-line github/no-then
        return (GaussianSplattingMesh.ConvertPLYWithSHToSplatAsync(data) as any).then(async (splatsData: any) => {
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
                return await new Promise((resolve) => {
                    resolve({ mode: Mode.Splat, data: splatsData.buffer, sh: splatsData.sh, faces: faces, hasVertexColors: false, compressed: true, rawSplat: false });
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
            return await new Promise((resolve) => {
                resolve({
                    ...metaData,
                    mode: currentMode,
                    data: splatsData.buffer,
                    sh: splatsData.sh,
                    faces: faces,
                    hasVertexColors: !!propertyColorCount,
                    compressed: false,
                    rawSplat: false,
                });
            });
        });
    }
}

// Add this loader into the register plugin
RegisterSceneLoaderPlugin(new SPLATFileLoader());
