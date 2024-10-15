/* eslint-disable @typescript-eslint/naming-convention */
import { VertexBuffer } from "core/Buffers";
import { Constants } from "core/Engines/constants";
import type { Material } from "core/Materials/material";
import type { PBRMaterial } from "core/Materials/PBR/pbrMaterial";
import type { PBRMetallicRoughnessMaterial } from "core/Materials/PBR/pbrMetallicRoughnessMaterial";
import type { StandardMaterial } from "core/Materials/standardMaterial";
import type { BaseTexture } from "core/Materials/Textures/baseTexture";
import type { Texture } from "core/Materials/Textures/texture";
import { Color3 } from "core/Maths/math.color";
import { Matrix, Vector2 } from "core/Maths/math.vector";
import type { Geometry } from "core/Meshes";
import type { Mesh } from "core/Meshes/mesh";
import { DumpTools } from "core/Misc/dumpTools";
import { Tools } from "core/Misc/tools";
import type { Scene } from "core/scene";
import type { FloatArray, Nullable } from "core/types";

/**
 * Ported from https://github.com/mrdoob/three.js/blob/master/examples/jsm/exporters/USDZExporter.js
 */

// FFlate access
declare const fflate: any;

/**
 * Options for the USDZ export
 */
export interface IUSDZExportOptions {
    /**
     * URL to load the fflate library from
     */
    fflateUrl?: string;
    /**
     * Include anchoring properties in the USDZ file
     */
    includeAnchoringProperties?: boolean;
    /**
     * Anchoring type (plane by default)
     */
    anchoringType?: string;
    /**
     * Plane anchoring alignment (horizontal by default)
     */
    planeAnchoringAlignment?: string;
    /**
     * Model file name (model.usda by default)
     */
    modelFileName?: string;
    /**
     * Precision to use for number (5 by default)
     */
    precision?: number;
}

function BuildHeader() {
    return `#usda 1.0
    (
        customLayerData = {
            string creator = "Babylon.js USDZExportAsync"
        }
        defaultPrim = "Root"
        metersPerUnit = 1
        upAxis = "Y"
    )`;
}

function BuildSceneStart(options: IUSDZExportOptions) {
    const alignment =
        options.includeAnchoringProperties === true
            ? `
		token preliminary:anchoring:type = "${options.anchoringType}"
		token preliminary:planeAnchoring:alignment = "${options.planeAnchoringAlignment}"`
            : "";
    return `def Xform "Root"
    {
        def Scope "Scenes" (
            kind = "sceneLibrary"
        )
        {
            def Xform "Scene" (
                customData = {
                    bool preliminary_collidesWithEnvironment = 0
                    string sceneName = "Scene"
                }
                sceneName = "Scene"
            )
            {${alignment}
            `;
}

function BuildSceneEnd() {
    return `
            }
        }
    }`;
}

function BuildMeshVertexCount(geometry: Geometry) {
    const count = geometry.getIndices()?.length ? geometry.getTotalIndices() : geometry.getTotalVertices();

    return Array(count / 3)
        .fill(3)
        .join(", ");
}

function BuildMeshVertexIndices(geometry: Geometry) {
    const index = geometry.getIndices();
    const array = [];

    if (index !== null) {
        for (let i = 0; i < index.length; i++) {
            array.push(index[i]);
        }
    } else {
        const length = geometry.getTotalVertices();

        for (let i = 0; i < length; i++) {
            array.push(i);
        }
    }

    return array.join(", ");
}

function BuildVector3Array(attribute: FloatArray, options: IUSDZExportOptions, stride = 3) {
    const array = [];

    for (let i = 0; i < attribute.length / stride; i++) {
        const x = attribute[i * stride];
        const y = attribute[i * stride + 1];
        const z = attribute[i * stride + 2];

        array.push(`(${x.toPrecision(options.precision)}, ${y.toPrecision(options.precision)}, ${z.toPrecision(options.precision)})`);
    }

    return array.join(", ");
}

function BuildVector2Array(attribute: FloatArray, options: IUSDZExportOptions) {
    const array = [];

    for (let i = 0; i < attribute.length / 2; i++) {
        const x = attribute[i * 2];
        const y = attribute[i * 2 + 1];

        array.push(`(${x.toPrecision(options.precision)}, ${(1 - y).toPrecision(options.precision)})`);
    }

    return array.join(", ");
}

function BuildAdditionalAttributes(geometry: Geometry, options: IUSDZExportOptions) {
    let string = "";

    for (let i = 0; i < 4; i++) {
        const id = i > 0 ? i : "";
        const uvAttribute = geometry.getVerticesData(VertexBuffer.UVKind + (id ? id : ""));

        if (uvAttribute) {
            string += `
		texCoord2f[] primvars:st${id} = [${BuildVector2Array(uvAttribute, options)}] (
			interpolation = "vertex"
		)`;
        }
    }

    // vertex colors

    const colorAttribute = geometry.getVerticesData(VertexBuffer.ColorKind);

    if (colorAttribute) {
        string += `
	color3f[] primvars:displayColor = [${BuildVector3Array(colorAttribute, options, 4)}] (
		interpolation = "vertex"
		)`;
    }

    return string;
}

function BuildMesh(geometry: Geometry, options: IUSDZExportOptions) {
    const name = "Geometry";
    const position = geometry.getVerticesData(VertexBuffer.PositionKind);
    const normal = geometry.getVerticesData(VertexBuffer.PositionKind);

    if (!position || !normal) {
        return;
    }

    return `
	def Mesh "${name}"
	{
		int[] faceVertexCounts = [${BuildMeshVertexCount(geometry)}]
		int[] faceVertexIndices = [${BuildMeshVertexIndices(geometry)}]
		normal3f[] normals = [${BuildVector3Array(normal, options)}] (
			interpolation = "vertex"
		)
		point3f[] points = [${BuildVector3Array(position, options)}]
        ${BuildAdditionalAttributes(geometry, options)}
		uniform token subdivisionScheme = "none"
	}
`;
}

function BuildMeshObject(geometry: Geometry, options: IUSDZExportOptions) {
    const mesh = BuildMesh(geometry, options);
    return `
        def "Geometry"
        {
        ${mesh}
        }
        `;
}

function BuildUSDFileAsString(dataToInsert: string) {
    let output = BuildHeader();
    output += dataToInsert;
    return fflate.strToU8(output);
}

function BuildMatrix(matrix: Matrix) {
    const array = matrix.m as number[];

    return `( ${BuildMatrixRow(array, 0)}, ${BuildMatrixRow(array, 4)}, ${BuildMatrixRow(array, 8)}, ${BuildMatrixRow(array, 12)} )`;
}

function BuildMatrixRow(array: number[], offset: number) {
    return `(${array[offset + 0]}, ${array[offset + 1]}, ${array[offset + 2]}, ${array[offset + 3]})`;
}

function BuildXform(mesh: Mesh) {
    const name = "Object_" + mesh.uniqueId;
    const matrix = mesh.getWorldMatrix().clone();

    if (matrix.determinant() < 0) {
        matrix.multiplyToRef(Matrix.Scaling(-1, 1, 1), matrix);
    }
    const transform = BuildMatrix(matrix);

    return `def Xform "${name}" (
	prepend references = @./geometries/Geometry_${mesh.geometry!.uniqueId}.usda@</Geometry>
	prepend apiSchemas = ["MaterialBindingAPI"]
)
{
	matrix4d xformOp:transform = ${transform}
	uniform token[] xformOpOrder = ["xformOp:transform"]	

    rel material:binding = </Materials/Material_${mesh.material!.uniqueId}>
}

`;
}

function BuildMaterials(materials: { [key: string]: Material }, textureToExports: { [key: string]: BaseTexture }, options: IUSDZExportOptions) {
    const array = [];

    for (const uuid in materials) {
        const material = materials[uuid];

        array.push(BuildMaterial(material, textureToExports, options));
    }

    return `
    def "Materials"
{
${array.join("")}
}

`;
}

function BuildWrapping(wrapping: number) {
    switch (wrapping) {
        case Constants.TEXTURE_CLAMP_ADDRESSMODE:
            return "clamp";
        case Constants.TEXTURE_MIRROR_ADDRESSMODE:
            return "mirror";
        case Constants.TEXTURE_WRAP_ADDRESSMODE:
        default:
            return "repeat";
    }
}

function BuildColor4(color: Color3) {
    return `(${color.r}, ${color.g}, ${color.b}, 1.0)`;
}

function BuildVector2(vector: Vector2) {
    return `(${vector.x}, ${vector.y})`;
}

function BuildColor(color: Color3) {
    return `(${color.r}, ${color.g}, ${color.b})`;
}

function BuildTexture(
    texture: Texture,
    material: Material,
    mapType: string,
    color: Nullable<Color3>,
    textureToExports: { [key: string]: BaseTexture },
    options: IUSDZExportOptions
) {
    const id = texture.getInternalTexture()!.uniqueId + "_" + texture.invertY;

    textureToExports[id] = texture;

    const uv = texture.coordinatesIndex > 0 ? "st" + texture.coordinatesIndex : "st";
    const repeat = new Vector2(texture.uScale, texture.vScale);
    const offset = new Vector2(texture.uOffset, texture.vOffset);
    const rotation = texture.wAng;

    // rotation is around the wrong point. after rotation we need to shift offset again so that we're rotating around the right spot
    const xRotationOffset = Math.sin(rotation);
    const yRotationOffset = Math.cos(rotation);

    // texture coordinates start in the opposite corner, need to correct
    offset.y = 1 - offset.y - repeat.y;

    offset.x += xRotationOffset * repeat.x;
    offset.y += (1 - yRotationOffset) * repeat.y;

    return `
    def Shader "PrimvarReader_${mapType}"
    {
        uniform token info:id = "UsdPrimvarReader_float2"
        float2 inputs:fallback = (0.0, 0.0)
        token inputs:varname = "${uv}"
        float2 outputs:result
    }

    def Shader "Transform2d_${mapType}"
    {
        uniform token info:id = "UsdTransform2d"
        token inputs:in.connect = </Materials/Material_${material.uniqueId}/PrimvarReader_${mapType}.outputs:result>
        float inputs:rotation = ${(rotation * (180 / Math.PI)).toFixed(options.precision)}
        float2 inputs:scale = ${BuildVector2(repeat)}
        float2 inputs:translation = ${BuildVector2(offset)}
        float2 outputs:result
    }

    def Shader "Texture_${texture.uniqueId}_${mapType}"
    {
        uniform token info:id = "UsdUVTexture"
        asset inputs:file = @textures/Texture_${id}.png@
        float2 inputs:st.connect = </Materials/Material_${material.uniqueId}/Transform2d_${mapType}.outputs:result>
        ${color ? "float4 inputs:scale = " + BuildColor4(color) : ""}
        token inputs:sourceColorSpace = "${texture.gammaSpace ? "raw" : "sRGB"}"
        token inputs:wrapS = "${BuildWrapping(texture.wrapU)}"
        token inputs:wrapT = "${BuildWrapping(texture.wrapV)}"
        float outputs:r
        float outputs:g
        float outputs:b
        float3 outputs:rgb
        ${material.needAlphaBlending() ? "float outputs:a" : ""}
    }`;
}

function ExtractTextureInformations(material: Material) {
    const className = material.getClassName();

    switch (className) {
        case "StandardMaterial":
            return {
                diffuseMap: (material as StandardMaterial).diffuseTexture,
                diffuse: (material as StandardMaterial).diffuseColor,
                alphaCutOff: (material as StandardMaterial).alphaCutOff,
                emissiveMap: (material as StandardMaterial).emissiveTexture,
                emissive: (material as StandardMaterial).emissiveColor,
                normalMap: null,
                roughness: 1,
                metalness: 0,
            };
        case "PBRMaterial":
            return {
                diffuseMap: (material as PBRMaterial).albedoTexture,
                diffuse: (material as PBRMaterial).albedoColor,
                alphaCutOff: (material as PBRMaterial).alphaCutOff,
                emissiveMap: (material as PBRMaterial).emissiveTexture,
                emissive: (material as PBRMaterial).emissiveColor,
                normalMap: (material as PBRMaterial).bumpTexture,
                roughness: (material as PBRMaterial).roughness,
                metalness: (material as PBRMaterial).metallic,
            };
        case "PBRMetallicRoughnessMaterial":
            return {
                diffuseMap: (material as PBRMetallicRoughnessMaterial).baseTexture,
                diffuse: (material as PBRMetallicRoughnessMaterial).baseColor,
                alphaCutOff: (material as PBRMetallicRoughnessMaterial).alphaCutOff,
                emissiveMap: (material as PBRMetallicRoughnessMaterial).emissiveTexture,
                emissive: (material as PBRMetallicRoughnessMaterial).emissiveColor,
                normalMap: (material as PBRMetallicRoughnessMaterial).normalTexture,
                roughness: (material as PBRMetallicRoughnessMaterial).roughness,
                metalness: (material as PBRMetallicRoughnessMaterial).metallic,
            };
        default:
            return {
                diffuseMap: null,
                diffuse: null,
                emissiveMap: null,
                emissemissiveiveColor: null,
                normalMap: null,
                alphaCutOff: 0,
                roughness: 0,
                metalness: 0,
            };
    }
}

function BuildMaterial(material: Material, textureToExports: { [key: string]: BaseTexture }, options: IUSDZExportOptions) {
    // https://graphics.pixar.com/usd/docs/UsdPreviewSurface-Proposal.html

    const pad = "			";
    const inputs = [];
    const samplers = [];

    const { diffuseMap, diffuse, alphaCutOff, emissiveMap, emissive, normalMap, roughness, metalness } = ExtractTextureInformations(material);

    if (diffuseMap !== null) {
        inputs.push(`${pad}color3f inputs:diffuseColor.connect = </Materials/Material_${material.uniqueId}/Texture_${diffuseMap.uniqueId}_diffuse.outputs:rgb>`);

        if (material.needAlphaBlending()) {
            inputs.push(`${pad}float inputs:opacity.connect = </Materials/Material_${material.uniqueId}/Texture_${diffuseMap.uniqueId}_diffuse.outputs:a>`);
        } else if (material.needAlphaTesting()) {
            inputs.push(`${pad}float inputs:opacity.connect = </Materials/Material_${material.uniqueId}/Texture_${diffuseMap.uniqueId}_diffuse.outputs:a>`);
            inputs.push(`${pad}float inputs:opacityThreshold = ${alphaCutOff}`);
        }

        samplers.push(BuildTexture(diffuseMap as Texture, material, "diffuse", diffuse, textureToExports, options));
    } else {
        inputs.push(`${pad}color3f inputs:diffuseColor = ${BuildColor(diffuse || Color3.White())}`);
    }

    if (emissiveMap !== null) {
        inputs.push(`${pad}color3f inputs:emissiveColor.connect = </Materials/Material_${material.id}/Texture_${emissiveMap.uniqueId}_emissive.outputs:rgb>`);

        samplers.push(BuildTexture(emissiveMap as Texture, material, "emissive", emissive, textureToExports, options));
    } else if (emissive && emissive.toLuminance() > 0) {
        inputs.push(`${pad}color3f inputs:emissiveColor = ${BuildColor(emissive)}`);
    }

    if (normalMap !== null) {
        inputs.push(`${pad}normal3f inputs:normal.connect = </Materials/Material_${material.id}/Texture_${normalMap.uniqueId}_normal.outputs:rgb>`);

        samplers.push(BuildTexture(normalMap as Texture, material, "normal", null, textureToExports, options));
    }

    // if (material.aoMap !== null) {
    //     inputs.push(`${pad}float inputs:occlusion.connect = </Materials/Material_${material.id}/Texture_${material.aoMap.id}_occlusion.outputs:r>`);

    //     samplers.push(buildTexture(material.aoMap, "occlusion", new Color(material.aoMapIntensity, material.aoMapIntensity, material.aoMapIntensity)));
    // }

    // if (material.roughnessMap !== null) {
    //     inputs.push(`${pad}float inputs:roughness.connect = </Materials/Material_${material.id}/Texture_${material.roughnessMap.id}_roughness.outputs:g>`);

    //     samplers.push(buildTexture(material.roughnessMap, "roughness", new Color(material.roughness, material.roughness, material.roughness)));
    // } else {
    inputs.push(`${pad}float inputs:roughness = ${1}`);
    // }

    // if (material.metalnessMap !== null) {
    //     inputs.push(`${pad}float inputs:metallic.connect = </Materials/Material_${material.id}/Texture_${material.metalnessMap.id}_metallic.outputs:b>`);

    //     samplers.push(buildTexture(material.metalnessMap, "metallic", new Color(material.metalness, material.metalness, material.metalness)));
    // } else {
    inputs.push(`${pad}float inputs:metallic = ${0}`);
    // }

    // if (material.alphaMap !== null) {
    //     inputs.push(`${pad}float inputs:opacity.connect = </Materials/Material_${material.id}/Texture_${material.alphaMap.id}_opacity.outputs:r>`);
    //     inputs.push(`${pad}float inputs:opacityThreshold = 0.0001`);

    //     samplers.push(buildTexture(material.alphaMap, "opacity"));
    // } else {
    inputs.push(`${pad}float inputs:opacity = ${material.alpha}`);
    // }

    // if (material.isMeshPhysicalMaterial) {
    //     if (material.clearcoatMap !== null) {
    //         inputs.push(`${pad}float inputs:clearcoat.connect = </Materials/Material_${material.id}/Texture_${material.clearcoatMap.id}_clearcoat.outputs:r>`);
    //         samplers.push(buildTexture(material.clearcoatMap, "clearcoat", new Color(material.clearcoat, material.clearcoat, material.clearcoat)));
    //     } else {
    //         inputs.push(`${pad}float inputs:clearcoat = ${material.clearcoat}`);
    //     }

    //     if (material.clearcoatRoughnessMap !== null) {
    //         inputs.push(
    //             `${pad}float inputs:clearcoatRoughness.connect = </Materials/Material_${material.id}/Texture_${material.clearcoatRoughnessMap.id}_clearcoatRoughness.outputs:g>`
    //         );
    //         samplers.push(
    //             buildTexture(material.clearcoatRoughnessMap, "clearcoatRoughness", new Color(material.clearcoatRoughness, material.clearcoatRoughness, material.clearcoatRoughness))
    //         );
    //     } else {
    //         inputs.push(`${pad}float inputs:clearcoatRoughness = ${material.clearcoatRoughness}`);
    //     }

    //     inputs.push(`${pad}float inputs:ior = ${material.ior}`);
    // }

    return `
	def Material "Material_${material.uniqueId}"
	{
		def Shader "PreviewSurface"
		{
			uniform token info:id = "UsdPreviewSurface"
${inputs.join("\n")}
			int inputs:useSpecularWorkflow = 0
			token outputs:surface
		}

		token outputs:surface.connect = </Materials/Material_${material.uniqueId}/PreviewSurface.outputs:surface>

${samplers.join("\n")}

	}
`;
}

/**
 *
 * @param scene scene to export
 * @param options options to configure the export
 * @param meshPredicate predicate to filter the meshes to export
 * @returns a uint8 array containing the USDZ file
 * #H2G5XW#3 - Simple sphere
 * #H2G5XW#4 - Red sphere
 * #5N3RWK#1 - Boombox
 */
export async function USDZExportAsync(scene: Scene, options: Partial<IUSDZExportOptions>, meshPredicate?: (m: Mesh) => boolean): Promise<Uint8Array> {
    const localOptions = {
        fflateUrl: "https://unpkg.com/fflate@0.8.2",
        includeAnchoringProperties: true,
        anchoringType: "plane",
        planeAnchoringAlignment: "horizontal",
        modelFileName: "model.usda",
        precision: 5,
        ...options,
    };

    // Get the fflate library
    if (typeof fflate === "undefined") {
        await Tools.LoadScriptAsync(localOptions.fflateUrl);
    }

    // Start the export
    const files: { [key: string]: any } = {};

    // model file should be first in USDZ archive so we init it here
    files[localOptions.modelFileName] = null;

    let output = BuildHeader();
    output += BuildSceneStart(localOptions);

    const materialToExports: { [key: string]: Material } = {};

    // Meshes
    for (const abstractMesh of scene.meshes) {
        if (abstractMesh.getTotalVertices() === 0) {
            continue;
        }
        const mesh = abstractMesh as Mesh;
        const geometry = mesh.geometry;
        const material = mesh.material;

        if (!material || !geometry || (meshPredicate && !meshPredicate(mesh))) {
            continue;
        }

        const supportedMaterials = ["StandardMaterial", "PBRMaterial", "PBRMetallicRoughnessMaterial"];

        if (supportedMaterials.indexOf(material.getClassName()) !== -1) {
            const geometryFileName = "geometries/Geometry_" + geometry.uniqueId + ".usda";

            if (!(geometryFileName in files)) {
                const meshObject = BuildMeshObject(geometry, localOptions);
                files[geometryFileName] = BuildUSDFileAsString(meshObject);
            }

            if (!(material.uniqueId in materialToExports)) {
                materialToExports[material.uniqueId] = material;
            }

            output += BuildXform(mesh);
        } else {
            Tools.Warn("USDZExportAsync does not support this material type: " + material.getClassName());
        }
    }

    output += BuildSceneEnd();

    // Materials
    const textureToExports: { [key: string]: BaseTexture } = {};
    output += BuildMaterials(materialToExports, textureToExports, localOptions);

    for (const id in textureToExports) {
        const texture = textureToExports[id];

        const size = texture.getSize();
        const textureData = await texture.readPixels();

        if (!textureData) {
            throw new Error("Texture data is not available");
        }

        const fileContent = await DumpTools.DumpDataAsync(size.width, size.height, textureData, "image/png", undefined, false, true);

        files[`textures/Texture_${id}.png`] = new Uint8Array(fileContent as ArrayBuffer);
    }

    // Compress
    files[localOptions.modelFileName] = fflate.strToU8(output);

    // 64 byte alignment
    // https://github.com/101arrowz/fflate/issues/39#issuecomment-777263109

    let offset = 0;

    for (const filename in files) {
        const file = files[filename];
        if (!file) {
            continue;
        }
        const headerSize = 34 + filename.length;

        offset += headerSize;

        const offsetMod64 = offset & 63;

        if (offsetMod64 !== 4) {
            const padLength = 64 - offsetMod64;
            const padding = new Uint8Array(padLength);

            // eslint-disable-next-line @typescript-eslint/naming-convention
            files[filename] = [file, { extra: { 12345: padding } }];
        }

        offset = file.length;
    }

    return fflate.zipSync(files, { level: 0 });
}
