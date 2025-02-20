import type { ITextureInfo, IKHRTextureTransform } from "babylonjs-gltf2interface";
import { Tools } from "core/Misc/tools";
import type { Texture } from "core/Materials/Textures/texture";
import type { IGLTFExporterExtensionV2 } from "../glTFExporterExtension";
import { GLTFExporter } from "../glTFExporter";

const NAME = "KHR_texture_transform";

/**
 * Computes the adjusted offset for a rotation centered about the origin.
 * @internal
 */
function AdjustOffsetForRotationCenter(babylonTexture: Texture): [number, number] {
    const { uOffset, vOffset, uRotationCenter, vRotationCenter, uScale, vScale, wAng } = babylonTexture;
    const cosAngle = Math.cos(wAng);
    const sinAngle = Math.sin(wAng);
    const scaledURotationCenter = uRotationCenter * uScale;
    const scaledVRotationCenter = vRotationCenter * vScale;
    const deltaU = scaledURotationCenter * (1 - cosAngle) + scaledVRotationCenter * sinAngle;
    const deltaV = scaledVRotationCenter * (1 - cosAngle) - scaledURotationCenter * sinAngle;
    return [uOffset + deltaU, vOffset + deltaV];
}

/**
 * @internal
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export class KHR_texture_transform implements IGLTFExporterExtensionV2 {
    /** Name of this extension */
    public readonly name = NAME;

    /** Defines whether this extension is enabled */
    public enabled = true;

    /** Defines whether this extension is required */
    public required = false;

    /** Reference to the glTF exporter */
    private _wasUsed = false;

    constructor() {}

    public dispose() {}

    /** @internal */
    public get wasUsed() {
        return this._wasUsed;
    }

    public postExportTexture?(context: string, textureInfo: ITextureInfo, babylonTexture: Texture): void {
        const scene = babylonTexture.getScene();
        if (!scene) {
            Tools.Warn(`${context}: "scene" is not defined for Babylon texture ${babylonTexture.name}!`);
        }

        /*
         * The KHR_texture_transform schema only supports w rotation around the origin.
         * See https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_texture_transform#gltf-schema-updates.
         */
        if (babylonTexture.uAng !== 0 || babylonTexture.vAng !== 0) {
            Tools.Warn(`${context}: Texture ${babylonTexture.name} with rotation in the u or v axis is not supported in glTF.`);
            // Usually, we'd always early return here if the texture uses an unsupported combination of transform properties,
            // but we're making an exception here to maintain backwards compatibility.
            if (babylonTexture.uRotationCenter !== 0 || babylonTexture.vRotationCenter !== 0) {
                return;
            }
        }

        const textureTransform: IKHRTextureTransform = {};
        let transformIsRequired = false;

        if (babylonTexture.uOffset !== 0 || babylonTexture.vOffset !== 0) {
            textureTransform.offset = [babylonTexture.uOffset, babylonTexture.vOffset];
            transformIsRequired = true;
        }

        if (babylonTexture.uScale !== 1 || babylonTexture.vScale !== 1) {
            textureTransform.scale = [babylonTexture.uScale, babylonTexture.vScale];
            transformIsRequired = true;
        }

        if (babylonTexture.wAng !== 0) {
            if (babylonTexture.uRotationCenter !== 0 || babylonTexture.vRotationCenter !== 0) {
                // See https://github.com/mrdoob/three.js/issues/15831 for more details.
                if (babylonTexture.homogeneousRotationInUVTransform && babylonTexture.uScale !== babylonTexture.vScale) {
                    Tools.Warn(
                        `${context}: Texture ${babylonTexture.name} with homogenousRotationInUVTransform, non-uniform scaling, and non-zero rotation cannot be exported with ${NAME}.`
                    );
                    return;
                }
                Tools.Warn(`${context}: Texture ${babylonTexture.name} with non-origin rotation center will be exported using an adjusted offset with ${NAME}.`);
                textureTransform.offset = AdjustOffsetForRotationCenter(babylonTexture);
            }
            textureTransform.rotation = -babylonTexture.wAng;
            transformIsRequired = true;
        }

        if (babylonTexture.coordinatesIndex !== 0) {
            textureTransform.texCoord = babylonTexture.coordinatesIndex;
            transformIsRequired = true;
        }

        if (!transformIsRequired) {
            return;
        }

        this._wasUsed = true;
        if (!textureInfo.extensions) {
            textureInfo.extensions = {};
        }
        textureInfo.extensions[NAME] = textureTransform;
    }
}

GLTFExporter.RegisterExtension(NAME, () => new KHR_texture_transform());
