/* eslint-disable @typescript-eslint/naming-convention */
import type { Nullable } from "core/types";
import { Tools } from "core/Misc/tools";
import { VertexBuffer } from "core/Buffers/buffer";
import type { AbstractMesh } from "core/Meshes/abstractMesh";
import { Mesh } from "core/Meshes/mesh";
import type { ISceneLoaderPlugin } from "core/Loading/sceneLoader";
import { registerSceneLoaderPlugin } from "core/Loading/sceneLoader";
import { AssetContainer } from "core/assetContainer";
import type { Scene } from "core/scene";
import { STLFileLoaderMetadata } from "./stlFileLoader.metadata";
import "core/Materials/standardMaterial";

declare module "core/Loading/sceneLoader" {
    // eslint-disable-next-line jsdoc/require-jsdoc
    export interface SceneLoaderPluginOptions {
        /**
         * Defines options for the stl loader.
         */
        [STLFileLoaderMetadata.name]: {};
    }
}

/**
 * STL file type loader.
 * This is a babylon scene loader plugin.
 */
export class STLFileLoader implements ISceneLoaderPlugin {
    /** @internal */
    public solidPattern = /solid (\S*)([\S\s]*?)endsolid[ ]*(\S*)/g;

    /** @internal */
    public facetsPattern = /facet([\s\S]*?)endfacet/g;
    /** @internal */
    public normalPattern = /normal[\s]+([-+]?[0-9]+\.?[0-9]*([eE][-+]?[0-9]+)?)+[\s]+([-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?)+[\s]+([-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?)+/g;
    /** @internal */
    public vertexPattern = /vertex[\s]+([-+]?[0-9]+\.?[0-9]*([eE][-+]?[0-9]+)?)+[\s]+([-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?)+[\s]+([-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?)+/g;

    /**
     * Defines the name of the plugin.
     */
    public readonly name = STLFileLoaderMetadata.name;

    /**
     * Defines the extensions the stl loader is able to load.
     * force data to come in as an ArrayBuffer
     * we'll convert to string if it looks like it's an ASCII .stl
     */
    public readonly extensions = STLFileLoaderMetadata.extensions;

    /**
     * Defines if Y and Z axes are swapped or not when loading an STL file.
     * The default is false to maintain backward compatibility. When set to
     * true, coordinates from the STL file are used without change.
     */
    public static DO_NOT_ALTER_FILE_COORDINATES = false;

    /**
     * Import meshes into a scene.
     * @param meshesNames An array of mesh names, a single mesh name, or empty string for all meshes that filter what meshes are imported
     * @param scene The scene to import into
     * @param data The data to import
     * @param rootUrl The root url for scene and resources
     * @param meshes The meshes array to import into
     * @returns True if successful or false otherwise
     */
    public importMesh(meshesNames: any, scene: Scene, data: any, rootUrl: string, meshes: Nullable<AbstractMesh[]>): boolean {
        let matches;

        if (typeof data !== "string") {
            if (this._isBinary(data)) {
                // binary .stl
                const babylonMesh = new Mesh("stlmesh", scene);
                this._parseBinary(babylonMesh, data);
                if (meshes) {
                    meshes.push(babylonMesh);
                }
                return true;
            }

            // ASCII .stl

            // convert to string
            data = new TextDecoder().decode(new Uint8Array(data));
        }

        //if arrived here, data is a string, containing the STLA data.

        while ((matches = this.solidPattern.exec(data))) {
            let meshName = matches[1];
            const meshNameFromEnd = matches[3];
            if (meshNameFromEnd && meshName != meshNameFromEnd) {
                Tools.Error("Error in STL, solid name != endsolid name");
                return false;
            }

            // check meshesNames
            if (meshesNames && meshName) {
                if (meshesNames instanceof Array) {
                    if (!meshesNames.indexOf(meshName)) {
                        continue;
                    }
                } else {
                    if (meshName !== meshesNames) {
                        continue;
                    }
                }
            }

            // stl mesh name can be empty as well
            meshName = meshName || "stlmesh";

            const babylonMesh = new Mesh(meshName, scene);
            this._parseASCII(babylonMesh, matches[2]);
            if (meshes) {
                meshes.push(babylonMesh);
            }
        }

        return true;
    }

    /**
     * Load into a scene.
     * @param scene The scene to load into
     * @param data The data to import
     * @param rootUrl The root url for scene and resources
     * @returns true if successful or false otherwise
     */
    public load(scene: Scene, data: any, rootUrl: string): boolean {
        const result = this.importMesh(null, scene, data, rootUrl, null);
        return result;
    }

    /**
     * Load into an asset container.
     * @param scene The scene to load into
     * @param data The data to import
     * @param rootUrl The root url for scene and resources
     * @returns The loaded asset container
     */
    public loadAssetContainer(scene: Scene, data: string, rootUrl: string): AssetContainer {
        const container = new AssetContainer(scene);
        scene._blockEntityCollection = true;
        this.importMesh(null, scene, data, rootUrl, container.meshes);
        scene._blockEntityCollection = false;
        return container;
    }

    private _isBinary(data: any) {
        // check if file size is correct for binary stl
        const reader = new DataView(data);

        // A Binary STL header is 80 bytes, if the data size is not great than
        // that then it's not a binary STL.
        if (reader.byteLength <= 80) {
            return false;
        }

        const faceSize = (32 / 8) * 3 + (32 / 8) * 3 * 3 + 16 / 8;
        const nFaces = reader.getUint32(80, true);

        if (80 + 32 / 8 + nFaces * faceSize === reader.byteLength) {
            return true;
        }

        // US-ASCII begin with 's', 'o', 'l', 'i', 'd'
        const ascii = [115, 111, 108, 105, 100];
        for (let off = 0; off < 5; off++) {
            if (reader.getUint8(off) !== ascii[off]) {
                return true;
            }
        }

        return false;
    }

    private _parseBinary(mesh: Mesh, data: ArrayBuffer) {
        const reader = new DataView(data);
        const faces = reader.getUint32(80, true);

        const dataOffset = 84;
        const faceLength = 12 * 4 + 2;

        let offset = 0;

        const positions = new Float32Array(faces * 3 * 3);
        const normals = new Float32Array(faces * 3 * 3);
        const indices = new Uint32Array(faces * 3);
        let indicesCount = 0;

        for (let face = 0; face < faces; face++) {
            const start = dataOffset + face * faceLength;
            const normalX = reader.getFloat32(start, true);
            const normalY = reader.getFloat32(start + 4, true);
            const normalZ = reader.getFloat32(start + 8, true);

            for (let i = 1; i <= 3; i++) {
                const vertexstart = start + i * 12;

                // ordering is intentional to match ascii import
                positions[offset] = reader.getFloat32(vertexstart, true);
                normals[offset] = normalX;

                if (!STLFileLoader.DO_NOT_ALTER_FILE_COORDINATES) {
                    positions[offset + 2] = reader.getFloat32(vertexstart + 4, true);
                    positions[offset + 1] = reader.getFloat32(vertexstart + 8, true);

                    normals[offset + 2] = normalY;
                    normals[offset + 1] = normalZ;
                } else {
                    positions[offset + 1] = reader.getFloat32(vertexstart + 4, true);
                    positions[offset + 2] = reader.getFloat32(vertexstart + 8, true);

                    normals[offset + 1] = normalY;
                    normals[offset + 2] = normalZ;
                }

                offset += 3;
            }

            if (STLFileLoader.DO_NOT_ALTER_FILE_COORDINATES) {
                indices[indicesCount] = indicesCount;
                indices[indicesCount + 1] = indicesCount + 2;
                indices[indicesCount + 2] = indicesCount + 1;
                indicesCount += 3;
            } else {
                indices[indicesCount] = indicesCount++;
                indices[indicesCount] = indicesCount++;
                indices[indicesCount] = indicesCount++;
            }
        }

        mesh.setVerticesData(VertexBuffer.PositionKind, positions);
        mesh.setVerticesData(VertexBuffer.NormalKind, normals);
        mesh.setIndices(indices);
        mesh.computeWorldMatrix(true);
    }

    private _parseASCII(mesh: Mesh, solidData: string) {
        const positions = [];
        const normals = [];
        const indices = [];
        let indicesCount = 0;

        //load facets, ignoring loop as the standard doesn't define it can contain more than vertices
        let matches;
        while ((matches = this.facetsPattern.exec(solidData))) {
            const facet = matches[1];
            //one normal per face
            const normalMatches = this.normalPattern.exec(facet);
            this.normalPattern.lastIndex = 0;
            if (!normalMatches) {
                continue;
            }
            const normal = [Number(normalMatches[1]), Number(normalMatches[5]), Number(normalMatches[3])];

            let vertexMatch;
            while ((vertexMatch = this.vertexPattern.exec(facet))) {
                if (!STLFileLoader.DO_NOT_ALTER_FILE_COORDINATES) {
                    positions.push(Number(vertexMatch[1]), Number(vertexMatch[5]), Number(vertexMatch[3]));
                    normals.push(normal[0], normal[1], normal[2]);
                } else {
                    positions.push(Number(vertexMatch[1]), Number(vertexMatch[3]), Number(vertexMatch[5]));

                    // Flipping the second and third component because inverted
                    // when normal was declared.
                    normals.push(normal[0], normal[2], normal[1]);
                }
            }
            if (STLFileLoader.DO_NOT_ALTER_FILE_COORDINATES) {
                indices.push(indicesCount, indicesCount + 2, indicesCount + 1);
                indicesCount += 3;
            } else {
                indices.push(indicesCount++, indicesCount++, indicesCount++);
            }
            this.vertexPattern.lastIndex = 0;
        }

        this.facetsPattern.lastIndex = 0;
        mesh.setVerticesData(VertexBuffer.PositionKind, positions);
        mesh.setVerticesData(VertexBuffer.NormalKind, normals);
        mesh.setIndices(indices);
        mesh.computeWorldMatrix(true);
    }
}

registerSceneLoaderPlugin(new STLFileLoader());
