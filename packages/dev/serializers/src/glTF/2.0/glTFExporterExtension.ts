import type { ImageMimeType, IMeshPrimitive, INode, IMaterial, ITextureInfo } from "babylonjs-gltf2interface";
import type { Node } from "core/node";
import type { Nullable } from "core/types";

import type { Texture } from "core/Materials/Textures/texture";
import type { SubMesh } from "core/Meshes/subMesh";
import type { IDisposable } from "core/scene";

import type { IGLTFExporterExtension } from "../glTFFileExporter";
import type { Material } from "core/Materials/material";
import type { BaseTexture } from "core/Materials/Textures/baseTexture";
import type { DataWriter } from "./dataWriter";

/** @internal */
// eslint-disable-next-line no-var, @typescript-eslint/naming-convention
export var __IGLTFExporterExtensionV2 = 0; // I am here to allow dts to be created

/**
 * Interface for a glTF exporter extension
 * @internal
 */
export interface IGLTFExporterExtensionV2 extends IGLTFExporterExtension, IDisposable {
    /**
     * Define this method to modify the default behavior before exporting a texture
     * @param context The context when loading the asset
     * @param babylonTexture The Babylon.js texture
     * @param mimeType The mime-type of the generated image
     * @returns A promise that resolves with the exported texture
     */
    preExportTextureAsync?(context: string, babylonTexture: Texture, mimeType: ImageMimeType): Promise<Nullable<Texture>>;

    /**
     * Define this method to get notified when a texture info is created
     * @param context The context when loading the asset
     * @param textureInfo The glTF texture info
     * @param babylonTexture The Babylon.js texture
     */
    postExportTexture?(context: string, textureInfo: ITextureInfo, babylonTexture: BaseTexture): void;

    /**
     * Define this method to modify the default behavior when exporting a mesh primitive
     * @param context The context when loading the asset
     * @param meshPrimitive glTF mesh primitive
     * @param babylonSubMesh Babylon submesh
     * @returns nullable IMeshPrimitive promise
     */
    postExportMeshPrimitiveAsync?(context: string, meshPrimitive: IMeshPrimitive, babylonSubMesh: SubMesh): Promise<IMeshPrimitive>;

    /**
     * Define this method to modify the default behavior when exporting a node
     * @param context The context when exporting the node
     * @param node glTF node
     * @param babylonNode BabylonJS node
     * @param nodeMap Current node mapping of babylon node to glTF node index. Useful for combining nodes together.
     * @param convertToRightHanded Flag indicating whether to convert values to right-handed
     * @returns nullable INode promise
     */
    postExportNodeAsync?(
        context: string,
        node: INode,
        babylonNode: Node,
        nodeMap: Map<Node, number>,
        convertToRightHanded: boolean,
        dataWriter: DataWriter
    ): Promise<Nullable<INode>>;

    /**
     * Define this method to modify the default behavior when exporting a material
     * @param material glTF material
     * @param babylonMaterial BabylonJS material
     * @returns nullable IMaterial promise
     */
    postExportMaterialAsync?(context: string, node: IMaterial, babylonMaterial: Material): Promise<IMaterial>;

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
