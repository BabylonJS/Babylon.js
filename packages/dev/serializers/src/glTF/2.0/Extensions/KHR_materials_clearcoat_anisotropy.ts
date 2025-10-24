import type { IMaterial, IKHRMaterialsClearcoatAnisotropy } from "babylonjs-gltf2interface";
import type { IGLTFExporterExtensionV2 } from "../glTFExporterExtension";
import { GLTFExporter } from "../glTFExporter";
import type { Material } from "core/Materials/material";
import type { Nullable } from "core/types";
import type { BaseTexture } from "core/Materials/Textures/baseTexture";
import type { Texture } from "core/Materials/Textures/texture";
import { OpenPBRMaterial } from "core/Materials/PBR/openpbrMaterial";
import { Constants } from "core/Engines/constants";
import { Effect } from "core/Materials/effect";
import { ProceduralTexture } from "core/Materials/Textures/Procedurals/proceduralTexture";
import type { IProceduralTextureCreationOptions } from "core/Materials/Textures/Procedurals/proceduralTexture";

const NAME = "KHR_materials_clearcoat_anisotropy";

// Convert OpenPBR anisotropy values to glTF-compatible values
function OpenpbrAnisotropyStrengthToGltf(baseRoughness: number, anisotropy: number) {
    const baseAlpha = baseRoughness * baseRoughness;
    const roughnessT = baseAlpha * Math.sqrt(2.0 / (1.0 + (1 - anisotropy) * (1 - anisotropy)));
    const roughnessB = (1 - anisotropy) * roughnessT;
    const newBaseRoughness = Math.sqrt(roughnessB);
    const newAnisotropyStrength = Math.min(Math.sqrt((roughnessT - baseAlpha) / Math.max(1.0 - baseAlpha, 0.0001)), 1.0);

    return { newBaseRoughness, newAnisotropyStrength };
}

function CopyTextureTransform(source: Texture, destination: Texture) {
    destination.uOffset = source.uOffset;
    destination.vOffset = source.vOffset;
    destination.uScale = source.uScale;
    destination.vScale = source.vScale;
    destination.uAng = source.uAng;
    destination.vAng = source.vAng;
    destination.wAng = source.wAng;
    destination.uRotationCenter = source.uRotationCenter;
    destination.vRotationCenter = source.vRotationCenter;
}

// Custom shader for merging anisotropy into tangent texture
const AnisotropyMergeFragment = `
    precision highp float;
#ifdef HAS_TANGENT_TEXTURE
    uniform sampler2D tangentTexture;
#endif
#ifdef HAS_ANISOTROPY_TEXTURE
    uniform sampler2D anisotropyTexture;
#endif
    uniform int useRoughnessFromMetallicGreen;
    uniform int useAnisotropyFromTangentBlue;

    varying vec2 vUV;

    void main() {
        vec2 tangent = vec2(1.0, 0.0);
        float anisotropy = 1.0;
        #ifdef HAS_TANGENT_TEXTURE
            // Tangent texture is present
            vec4 tangentSample = texture2D(tangentTexture, vUV);
            tangent = tangentSample.rg;

            if (useAnisotropyFromTangentBlue > 0) {
                anisotropy = tangentSample.b;
            }
        #endif
        #ifdef HAS_ANISOTROPY_TEXTURE
            // Anisotropy texture is present
            vec4 anisotropySample = texture2D(anisotropyTexture, vUV);
            anisotropy = anisotropySample.r;
        #endif
        
        // Output: RG = tangent XY, B = anisotropy strength
        vec4 anisotropyData = vec4(tangent.x, tangent.y, anisotropy, 1.0);
        gl_FragColor = anisotropyData;
    }
`;

// In your postExportMaterialAsync method:
async function CreateMergedAnisotropyTexture(babylonMaterial: OpenPBRMaterial): Promise<Nullable<ProceduralTexture>> {
    const scene = babylonMaterial.getScene();

    // Register the custom shader if not already done
    if (!Effect.ShadersStore["anisotropyMergeFragmentShader"]) {
        Effect.ShadersStore["anisotropyMergeFragmentShader"] = AnisotropyMergeFragment;
    }

    const anisoStrengthTexture: Nullable<BaseTexture> = babylonMaterial.coatRoughnessAnisotropyTexture;
    const tangentTexture = babylonMaterial.geometryCoatTangentTexture;

    // If we don't have any textures, we don't need to generate anything.
    if (!(anisoStrengthTexture || tangentTexture)) {
        return null;
    }

    const width = Math.max(anisoStrengthTexture ? anisoStrengthTexture.getSize().width : 1, tangentTexture ? tangentTexture.getSize().width : 1);
    const height = Math.max(anisoStrengthTexture ? anisoStrengthTexture.getSize().height : 1, tangentTexture ? tangentTexture.getSize().height : 1);
    const textureOptions: IProceduralTextureCreationOptions = {
        type: Constants.TEXTURETYPE_UNSIGNED_BYTE,
        format: Constants.TEXTUREFORMAT_RGBA,
        samplingMode: Constants.TEXTURE_BILINEAR_SAMPLINGMODE,
        generateDepthBuffer: false,
        generateStencilBuffer: false,
        generateMipMaps: false,
    };
    const rtTexture = new ProceduralTexture(
        babylonMaterial.name + "_anisotropy",
        {
            width,
            height,
        },
        "anisotropyMerge",
        scene,
        textureOptions
    );
    rtTexture.refreshRate = -1;

    // Set uniforms and defines
    let defines = "";
    if (tangentTexture) {
        defines += "#define HAS_TANGENT_TEXTURE\n";
        rtTexture.setTexture("tangentTexture", tangentTexture);
        CopyTextureTransform(tangentTexture as Texture, rtTexture);
    }
    rtTexture.setVector2("tangentVector", babylonMaterial.geometryTangent);
    if (anisoStrengthTexture) {
        defines += "#define HAS_ANISOTROPY_TEXTURE\n";
        rtTexture.setTexture("anisotropyTexture", anisoStrengthTexture);
        CopyTextureTransform(anisoStrengthTexture as Texture, rtTexture);
    }
    rtTexture.setInt("useAnisotropyFromTangentBlue", babylonMaterial._useCoatRoughnessAnisotropyFromTangentTexture ? 1 : 0);
    rtTexture.defines = defines;

    return await new Promise<ProceduralTexture>((resolve, reject) => {
        // Compile and render
        rtTexture.executeWhenReady(() => {
            try {
                rtTexture.render();
                resolve(rtTexture);
            } catch (error) {
                reject(error instanceof Error ? error : new Error(String(error)));
            }
        });
    });
}

/**
 * @internal
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export class KHR_materials_clearcoat_anisotropy implements IGLTFExporterExtensionV2 {
    /** Name of this extension */
    public readonly name = NAME;

    /** Defines whether this extension is enabled */
    public enabled = true;

    /** Defines whether this extension is required */
    public required = false;

    private _exporter: GLTFExporter;

    private _wasUsed = false;

    private _anisoTexturesMap: Record<string, ProceduralTexture> = {};

    constructor(exporter: GLTFExporter) {
        this._exporter = exporter;
    }

    public dispose() {}

    /** @internal */
    public get wasUsed() {
        return this._wasUsed;
    }

    /**
     * After exporting a material, deal with the additional textures
     * @param context GLTF context of the material
     * @param node exported GLTF node
     * @param babylonMaterial corresponding babylon material
     * @returns array of additional textures to export
     */
    public async postExportMaterialAdditionalTexturesAsync?(context: string, node: IMaterial, babylonMaterial: Material): Promise<BaseTexture[]> {
        const additionalTextures: BaseTexture[] = [];
        if (babylonMaterial instanceof OpenPBRMaterial) {
            if (babylonMaterial.coatRoughnessAnisotropy > 0) {
                const anisoTexture = await CreateMergedAnisotropyTexture(babylonMaterial);
                if (anisoTexture) {
                    additionalTextures.push(anisoTexture);
                    this._anisoTexturesMap[babylonMaterial.id] = anisoTexture;
                }
                return additionalTextures;
            }
        }

        return [];
    }

    // eslint-disable-next-line no-restricted-syntax
    public postExportMaterialAsync?(context: string, node: IMaterial, babylonMaterial: Material): Promise<IMaterial> {
        return new Promise((resolve) => {
            if (babylonMaterial instanceof OpenPBRMaterial) {
                if (babylonMaterial.coatRoughnessAnisotropy > 0) {
                    // This material must have the clearcoat extension already before
                    // we can add the clearcoat anisotropy sub-extension
                    node.extensions = node.extensions || {};
                    const parentExt = node.extensions ? node.extensions["KHR_materials_clearcoat"] : null;
                    if (!parentExt) {
                        return resolve(node);
                    }
                    this._wasUsed = true;

                    // Check if we can convert from OpenPBR anisotropy to glTF anisotropy
                    // Conversion involves both specular roughness and anisotropic roughness changes so,
                    // if there are textures for either, we can't reliably convert due to there potentially
                    // being different mappings between the textures.
                    const roughnessTexture: Nullable<BaseTexture> = babylonMaterial.coatRoughnessTexture;
                    const mergedAnisoTexture = this._anisoTexturesMap[babylonMaterial.id];

                    // If no textures are being used, we'll always output glTF-style anisotropy.
                    // If using OpenPBR anisotropy, convert the constants. Otherwise, just export what we have.
                    if (!roughnessTexture && !mergedAnisoTexture) {
                        // Convert constants
                        let newBaseRoughness = babylonMaterial.coatRoughness;
                        let newAnisotropyStrength = babylonMaterial.coatRoughnessAnisotropy;
                        if (!babylonMaterial._useGltfStyleAnisotropy) {
                            const newParams = OpenpbrAnisotropyStrengthToGltf(babylonMaterial.coatRoughness, babylonMaterial.coatRoughnessAnisotropy);
                            newBaseRoughness = newParams.newBaseRoughness;
                            newAnisotropyStrength = newParams.newAnisotropyStrength;
                        }
                        if (node.pbrMetallicRoughness) {
                            node.pbrMetallicRoughness.roughnessFactor = newBaseRoughness;
                        }
                        const anisotropyInfo: IKHRMaterialsClearcoatAnisotropy = {
                            clearcoatAnisotropyStrength: newAnisotropyStrength,
                            clearcoatAnisotropyRotation: babylonMaterial.geometryCoatTangentAngle + Math.PI * 0.5,
                            clearcoatAnisotropyTexture: undefined,
                        };
                        parentExt.extensions = parentExt.extensions || {};
                        parentExt.extensions[NAME] = anisotropyInfo;
                        return resolve(node);
                    }

                    const mergedAnisoTextureInfo = mergedAnisoTexture ? this._exporter._materialExporter.getTextureInfo(mergedAnisoTexture) : null;

                    const anisotropyInfo: IKHRMaterialsClearcoatAnisotropy = {
                        clearcoatAnisotropyStrength: babylonMaterial.coatRoughnessAnisotropy,
                        clearcoatAnisotropyRotation: babylonMaterial.geometryCoatTangentAngle,
                        clearcoatAnisotropyTexture: mergedAnisoTextureInfo ? mergedAnisoTextureInfo : undefined,
                        extensions: {},
                    };

                    if (!babylonMaterial._useGltfStyleAnisotropy) {
                        anisotropyInfo.extensions!["EXT_materials_anisotropy_openpbr"] = {
                            openPbrAnisotropyEnabled: true,
                        };
                        this._exporter._glTF.extensionsUsed ||= [];
                        if (this._exporter._glTF.extensionsUsed.indexOf("EXT_materials_anisotropy_openpbr") === -1) {
                            this._exporter._glTF.extensionsUsed.push("EXT_materials_anisotropy_openpbr");
                        }
                    }

                    this._exporter._materialNeedsUVsSet.add(babylonMaterial);

                    parentExt.extensions = parentExt.extensions || {};
                    parentExt.extensions[NAME] = anisotropyInfo;
                }
            }
            resolve(node);
        });
    }
}

GLTFExporter.RegisterExtension(NAME, (exporter) => new KHR_materials_clearcoat_anisotropy(exporter), 105);
