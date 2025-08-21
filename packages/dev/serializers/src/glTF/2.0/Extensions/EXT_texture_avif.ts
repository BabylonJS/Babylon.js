/* eslint-disable jsdoc/require-jsdoc */
/* eslint-disable babylonjs/available */
import type { IGLTFExporterExtensionV2 } from "../glTFExporterExtension";
import { GLTFExporter } from "../glTFExporter";
import { GetMimeType } from "core/Misc/fileTools";
import { ImageMimeType } from "babylonjs-gltf2interface";

const NAME = "EXT_texture_avif";

/**
 * [Proposed Specification](https://github.com/KhronosGroup/glTF/blob/5cb7518cf9a1bfb8268320026961b21caf5a4aac/extensions/2.0/Vendor/EXT_texture_avif/README.md)
 * @experimental
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export class EXT_texture_avif implements IGLTFExporterExtensionV2 {
    public readonly name = NAME;

    public enabled = true;

    public required = true;

    private _wasUsed = false;

    public get wasUsed() {
        return this._wasUsed;
    }

    private _exporter: GLTFExporter;

    constructor(exporter: GLTFExporter) {
        this._exporter = exporter;
    }

    public dispose() {}

    public postExportTexture(_: string, textureInfo: BABYLON.GLTF2.ITextureInfo): void {
        const texture = this._exporter._textures[textureInfo.index];
        const imageIndex = texture.source;
        if (imageIndex === undefined) {
            return;
        }

        const image = this._exporter._images[imageIndex];
        const sourceMimeType = image.mimeType || GetMimeType(image.uri!);
        if (sourceMimeType !== ImageMimeType.AVIF) {
            return;
        }

        texture.source = undefined;
        texture.extensions ||= {};
        texture.extensions[NAME] = {
            source: imageIndex,
        };

        this._wasUsed = true;
    }
}

GLTFExporter.RegisterExtension(NAME, (exporter) => new EXT_texture_avif(exporter));
