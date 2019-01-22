import { ImageMimeType, IMeshPrimitive, INode } from "babylonjs-gltf2interface";
import { Node } from "babylonjs/node";

import { Nullable } from "babylonjs/types";
import { Texture } from "babylonjs/Materials/Textures/texture";
import { SubMesh } from "babylonjs/Meshes/subMesh";
import { IDisposable } from "babylonjs/scene";

import { _BinaryWriter } from "./glTFExporter";
import { IGLTFExporterExtension } from "../glTFFileExporter";

/** @hidden */
export var __IGLTFExporterExtensionV2 = 0; // I am here to allow dts to be created

/**
 * Interface for a glTF exporter extension
 * @hidden
 */
export interface IGLTFExporterExtensionV2 extends IGLTFExporterExtension, IDisposable {
    /**
     * Define this method to modify the default behavior before exporting a texture
     * @param context The context when loading the asset
     * @param babylonTexture The glTF texture info property
     * @param mimeType The mime-type of the generated image
     * @returns A promise that resolves with the exported glTF texture info when the export is complete, or null if not handled
     */
    preExportTextureAsync?(context: string, babylonTexture: Texture, mimeType: ImageMimeType): Nullable<Promise<Texture>>;

    /**
     * Define this method to modify the default behavior when exporting texture info
     * @param context The context when loading the asset
     * @param meshPrimitive glTF mesh primitive
     * @param babylonSubMesh Babylon submesh
     * @param binaryWriter glTF serializer binary writer instance
     */
    postExportMeshPrimitiveAsync?(context: string, meshPrimitive: IMeshPrimitive, babylonSubMesh: SubMesh, binaryWriter: _BinaryWriter): Nullable<Promise<IMeshPrimitive>>;

    /**
     * Define this method to modify the default behavior when exporting a node
     * @param context The context when exporting the node
     * @param node glTF node
     * @param babylonNode BabylonJS node
     */
    postExportNodeAsync?(context: string, node: INode, babylonNode: Node): Nullable<Promise<INode>>;

    /**
     * Called after the exporter state changes to EXPORTING
     */
    onExporting?(): void;
}