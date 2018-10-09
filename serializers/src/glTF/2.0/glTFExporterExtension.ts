import { IDisposable, Texture, Nullable, SubMesh } from "babylonjs";

import { ImageMimeType, IMeshPrimitive } from "babylonjs-gltf2interface";

import { _BinaryWriter } from "./glTFExporter";
import { IGLTFExporterExtension } from "../glTFFileExporter";

export var toto2 = 0;

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
}