import { ImageMimeType, IMeshPrimitive, INode, IMaterial, ITextureInfo } from "babylonjs-gltf2interface";
import { Node } from "babylonjs/node";
import { Nullable } from "babylonjs/types";

import { Texture } from "babylonjs/Materials/Textures/texture";
import { SubMesh } from "babylonjs/Meshes/subMesh";
import { IDisposable } from "babylonjs/scene";

import { _BinaryWriter } from "./glTFExporter";
import { IGLTFExporterExtension } from "../glTFFileExporter";
import { Material } from 'babylonjs/Materials/material';
import { BaseTexture } from 'babylonjs/Materials/Textures/baseTexture';

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
     * @param babylonTexture The Babylon.js texture
     * @param mimeType The mime-type of the generated image
     * @returns A promise that resolves with the exported texture
     */
    preExportTextureAsync?(context: string, babylonTexture: Nullable<Texture>, mimeType: ImageMimeType): Promise<Texture>;

    /**
     * Define this method to get notified when a texture info is created
     * @param context The context when loading the asset
     * @param textureInfo The glTF texture info
     * @param babylonTexture The Babylon.js texture
     */
    postExportTexture?(context: string, textureInfo: ITextureInfo, babylonTexture: BaseTexture): void;

    /**
     * Define this method to modify the default behavior when exporting texture info
     * @param context The context when loading the asset
     * @param meshPrimitive glTF mesh primitive
     * @param babylonSubMesh Babylon submesh
     * @param binaryWriter glTF serializer binary writer instance
     * @returns nullable IMeshPrimitive promise
     */
    postExportMeshPrimitiveAsync?(context: string, meshPrimitive: Nullable<IMeshPrimitive>, babylonSubMesh: SubMesh, binaryWriter: _BinaryWriter): Promise<IMeshPrimitive>;

    /**
     * Define this method to modify the default behavior when exporting a node
     * @param context The context when exporting the node
     * @param node glTF node
     * @param babylonNode BabylonJS node
     * @returns nullable INode promise
     */
    postExportNodeAsync?(context: string, node: Nullable<INode>, babylonNode: Node, nodeMap?: {[key: number]: number}): Promise<Nullable<INode>>;

    /**
     * Define this method to modify the default behavior when exporting a material
     * @param material glTF material
     * @param babylonMaterial BabylonJS material
     * @returns nullable IMaterial promise
     */
    postExportMaterialAsync?(context: string, node: Nullable<IMaterial>, babylonMaterial: Material): Promise<IMaterial>;

    /**
     * Define this method to return additional textures to export from a material
     * @param material glTF material
     * @param babylonMaterial BabylonJS material
     * @returns List of textures
     */
    postExportMaterialAdditionalTextures?(context: string, node: IMaterial, babylonMaterial: Material): BaseTexture[];

    /** Gets a boolean indicating that this extension was used */
    wasUsed: boolean;

    /** Gets a boolean indicating that this extension is required for the file to work */
    required: boolean;

    /**
     * Called after the exporter state changes to EXPORTING
     */
    onExporting?(): void;
}