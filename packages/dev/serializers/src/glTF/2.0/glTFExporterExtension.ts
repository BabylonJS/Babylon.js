import type { IMeshPrimitive, INode, IMaterial, ITextureInfo, IAccessor } from "babylonjs-gltf2interface";
import type { Node } from "core/node";
import type { Nullable } from "core/types";

import type { IDisposable } from "core/scene";

import type { IGLTFExporterExtension } from "../glTFFileExporter";
import type { Material } from "core/Materials/material";
import type { BaseTexture } from "core/Materials/Textures/baseTexture";
import type { BufferManager } from "./bufferManager";

/** @internal */
// eslint-disable-next-line no-var, @typescript-eslint/naming-convention
export var __IGLTFExporterExtensionV2 = 0; // I am here to allow dts to be created

/**
 * Interface for a glTF exporter extension
 * @internal
 */
export interface IGLTFExporterExtensionV2 extends IGLTFExporterExtension, IDisposable {
    /**
     * Define this method to get notified when a texture info is created
     * @param context The context when loading the asset
     * @param textureInfo The glTF texture info
     * @param babylonTexture The Babylon.js texture
     */
    postExportTexture?(context: string, textureInfo: ITextureInfo, babylonTexture: BaseTexture): void;

    /**
     * Define this method to get notified when a primitive is created
     * @param primitive glTF mesh primitive
     * @param bufferManager Buffer manager
     * @param accessors List of glTF accessors
     */
    postExportMeshPrimitive?(primitive: IMeshPrimitive, bufferManager: BufferManager, accessors: IAccessor[]): void;

    /**
     * Define this method to modify the default behavior when exporting a node
     * @param context The context when exporting the node
     * @param node glTF node
     * @param babylonNode BabylonJS node
     * @param nodeMap Current node mapping of babylon node to glTF node index. Useful for combining nodes together.
     * @param convertToRightHanded Flag indicating whether to convert values to right-handed
     * @param bufferManager Buffer manager
     * @returns nullable INode promise
     */
    postExportNodeAsync?(
        context: string,
        node: INode,
        babylonNode: Node,
        nodeMap: Map<Node, number>,
        convertToRightHanded: boolean,
        bufferManager: BufferManager
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
    postExportMaterialAdditionalTexturesAsync?(context: string, node: IMaterial, babylonMaterial: Material): Promise<BaseTexture[]>;

    /**
     * Define this method to modify the glTF buffer data before it is finalized and written
     * @param bufferManager Buffer manager
     */
    preGenerateBinaryAsync?(bufferManager: BufferManager): Promise<void>;

    /** Gets a boolean indicating that this extension was used */
    wasUsed: boolean;

    /** Gets a boolean indicating that this extension is required for the file to work */
    required: boolean;

    /**
     * Called after the exporter state changes to EXPORTING
     */
    onExporting?(): void;
}
