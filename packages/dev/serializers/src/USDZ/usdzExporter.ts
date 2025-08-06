/* eslint-disable @typescript-eslint/naming-convention */
import { VertexBuffer } from "core/Buffers/buffer";
import type { Camera } from "core/Cameras/camera";
import { Constants } from "core/Engines/constants";
import { Material } from "core/Materials/material";
import { PBRBaseMaterial } from "core/Materials/PBR/pbrBaseMaterial";
import { StandardMaterial } from "core/Materials/standardMaterial";
import type { BaseTexture } from "core/Materials/Textures/baseTexture";
import type { Texture } from "core/Materials/Textures/texture";
import { Color3 } from "core/Maths/math.color";
import { Matrix, Vector2 } from "core/Maths/math.vector";
import type { Geometry } from "core/Meshes/geometry";
import type { Mesh } from "core/Meshes/mesh";
import { DumpTools } from "core/Misc/dumpTools";
import { Tools } from "core/Misc/tools";
import type { Scene } from "core/scene";
import type { FloatArray, Nullable } from "core/types";
import { IsNoopNode } from "../exportUtils";
import { GetTextureDataAsync } from "core/Misc/textureTools";

/**
 * Ported from https://github.com/mrdoob/three.js/blob/master/examples/jsm/exporters/USDZExporter.js
 * Thanks a lot to the three.js team for their amazing work!
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
    /**
     * Export the camera (false by default)
     */
    exportCamera?: boolean;
    /**
     * Camera sensor width (35 by default)
     */
    cameraSensorWidth?: number;
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

function BuildRootAndSceneStart(options: IUSDZExportOptions) {
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
        }`;
}

function BuildRootEnd() {
    return `
    }`;
}

function BuildMeshVertexCount(geometry: Geometry) {
    const count = geometry.getIndices()?.length ? geometry.getTotalIndices() : geometry.getTotalVertices();

    return Array(count / 3)
        .fill(3)
        .join(", ");
}

function BuildMeshVertexIndices(geometry: Geometry) {
    const indices = geometry.getIndices();
    const count = indices?.length ?? geometry.getTotalVertices();

    const array: number[] = [];
    if (indices !== null) {
        for (let i = 0; i < count; i++) {
            array.push(indices[i]);
        }
    } else {
        for (let i = 0; i < count; i++) {
            array.push(i);
        }
    }

    return array.join(", ");
}

function BuildVector3Array(attribute: FloatArray, options: IUSDZExportOptions, stride = 3, convertToRightHanded = false) {
    const array: string[] = [];

    for (let i = 0; i < attribute.length / stride; i++) {
        const x = attribute[i * stride] * (convertToRightHanded ? -1 : 1);
        const y = attribute[i * stride + 1];
        const z = attribute[i * stride + 2];

        array.push(`(${x.toPrecision(options.precision)}, ${y.toPrecision(options.precision)}, ${z.toPrecision(options.precision)})`);
    }

    return array.join(", ");
}

function BuildVector2Array(attribute: FloatArray, options: IUSDZExportOptions) {
    const array: string[] = [];

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
        const uvAttribute = geometry.getVerticesData(VertexBuffer.UVKind + (id ? id + 1 : "")); // UV names go like "uv", "uv2", "uv3", etc.

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
	color3f[] primvars:displayColor = [${BuildVector3Array(colorAttribute, options, colorAttribute.length / geometry.getTotalVertices())}] (
		interpolation = "vertex"
		)`;
    }

    return string;
}

function BuildMesh(geometry: Geometry, options: IUSDZExportOptions, windingOrder: string, convertToRightHanded: boolean) {
    const name = "Geometry";
    const position = geometry.getVerticesData(VertexBuffer.PositionKind);
    const normal = geometry.getVerticesData(VertexBuffer.NormalKind);

    if (!position || !normal) {
        return;
    }

    return `
	def Mesh "${name}"
	{
        uniform token orientation = "${windingOrder}"
		int[] faceVertexCounts = [${BuildMeshVertexCount(geometry)}]
		int[] faceVertexIndices = [${BuildMeshVertexIndices(geometry)}]
		normal3f[] normals = [${BuildVector3Array(normal, options, undefined, convertToRightHanded)}] (
			interpolation = "vertex"
		)
		point3f[] points = [${BuildVector3Array(position, options, undefined, convertToRightHanded)}]
        ${BuildAdditionalAttributes(geometry, options)}
		uniform token subdivisionScheme = "none"
	}
`;
}

function BuildMeshObject(geometry: Geometry, options: IUSDZExportOptions, windingOrder: string, convertToRightHanded: boolean) {
    const meshObject = BuildMesh(geometry, options, windingOrder, convertToRightHanded);
    return `
        def "Geometry"
        {
        ${meshObject}
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

function BuildXform(mesh: Mesh, matrix: Matrix) {
    const name = "Object_" + mesh.uniqueId;
    const transform = BuildMatrix(matrix);

    return `def Xform "${name}" (
	prepend references = @./geometries/Geometry_${mesh.geometry!.uniqueId}.usda@</Geometry>
	prepend apiSchemas = ["MaterialBindingAPI"]
)
{
	matrix4d xformOp:transform = ${transform}
	uniform token[] xformOpOrder = ["xformOp:transform"]	

    rel material:binding = </Root/Materials/Material_${mesh.material!.uniqueId}>
}

`;
}

function BuildMaterials(materials: { [key: string]: Material }, textureToExports: { [key: string]: BaseTexture }, options: IUSDZExportOptions) {
    const array: string[] = [];

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
        token inputs:in.connect = </Root/Materials/Material_${material.uniqueId}/PrimvarReader_${mapType}.outputs:result>
        float inputs:rotation = ${(rotation * (180 / Math.PI)).toFixed(options.precision)}
        float2 inputs:scale = ${BuildVector2(repeat)}
        float2 inputs:translation = ${BuildVector2(offset)}
        float2 outputs:result
    }

    def Shader "Texture_${texture.uniqueId}_${mapType}"
    {
        uniform token info:id = "UsdUVTexture"
        asset inputs:file = @textures/Texture_${id}.png@
        float2 inputs:st.connect = </Root/Materials/Material_${material.uniqueId}/Transform2d_${mapType}.outputs:result>
        ${color ? "float4 inputs:scale = " + BuildColor4(color) : ""}
        token inputs:sourceColorSpace = "${texture.gammaSpace ? "sRGB" : "raw"}"
        token inputs:wrapS = "${BuildWrapping(texture.wrapU)}"
        token inputs:wrapT = "${BuildWrapping(texture.wrapV)}"
        float outputs:r
        float outputs:g
        float outputs:b
        float3 outputs:rgb
        ${material.needAlphaBlending() || material.needAlphaTesting() ? "float outputs:a" : ""}
    }`;
}

function ExtractTextureInformations(material: Material) {
    const defaults = {
        diffuseMap: null,
        diffuse: null,
        alphaCutOff: 0,
        emissiveMap: null,
        emissive: null,
        normalMap: null,
        roughnessMap: null,
        roughnessChannel: "a",
        roughness: 0,
        metalnessMap: null,
        metalnessChannel: "r",
        metalness: 0,
        aoMap: null,
        aoMapChannel: "rgb",
        aoMapIntensity: 0,
        alphaMap: null,
        ior: 1,
        clearCoatEnabled: false,
        clearCoat: 0,
        clearCoatMap: null,
        clearCoatRoughness: 0,
        clearCoatRoughnessMap: null,
    };

    if (material instanceof StandardMaterial) {
        return {
            ...defaults,
            diffuseMap: material.diffuseTexture,
            diffuse: material.diffuseColor,
            alphaCutOff: material.alphaCutOff,
            emissiveMap: material.emissiveTexture,
            emissive: material.emissiveColor,
            roughness: 1,
            alphaMap: material.opacityTexture,
        };
    }
    if (material instanceof PBRBaseMaterial) {
        return {
            ...defaults,
            diffuseMap: material._albedoTexture,
            diffuse: material._albedoColor,
            alphaCutOff: material._alphaCutOff,
            emissiveMap: material._emissiveTexture,
            emissive: material._emissiveColor,
            normalMap: material._bumpTexture,
            roughnessMap: material._metallicTexture,
            roughnessChannel: material._useRoughnessFromMetallicTextureAlpha ? "a" : "g",
            roughness: material._roughness ?? 1,
            metalnessMap: material._metallicTexture,
            metalnessChannel: material._useMetallnessFromMetallicTextureBlue ? "b" : "r",
            metalness: material._metallic ?? 0,
            aoMap: material._ambientTexture,
            aoMapChannel: material._useAmbientInGrayScale ? "r" : "rgb",
            aoMapIntensity: material._ambientTextureStrength,
            alphaMap: material._opacityTexture,
            ior: material.subSurface.indexOfRefraction,
            clearCoatEnabled: material.clearCoat.isEnabled,
            clearCoat: material.clearCoat.intensity,
            clearCoatMap: material.clearCoat.texture,
            clearCoatRoughness: material.clearCoat.roughness,
            clearCoatRoughnessMap: material.clearCoat.useRoughnessFromMainTexture ? material.clearCoat.texture : material.clearCoat.textureRoughness,
        };
    }
    return defaults;
}

function BuildMaterial(material: Material, textureToExports: { [key: string]: BaseTexture }, options: IUSDZExportOptions) {
    // https://graphics.pixar.com/usd/docs/UsdPreviewSurface-Proposal.html

    const pad = "			";
    const inputs = [];
    const samplers = [];

    const {
        diffuseMap,
        diffuse,
        alphaCutOff,
        emissiveMap,
        emissive,
        normalMap,
        roughnessMap,
        roughnessChannel,
        roughness,
        metalnessMap,
        metalnessChannel,
        metalness,
        aoMap,
        aoMapChannel,
        aoMapIntensity,
        alphaMap,
        ior,
        clearCoatEnabled,
        clearCoat,
        clearCoatMap,
        clearCoatRoughness,
        clearCoatRoughnessMap,
    } = ExtractTextureInformations(material);

    if (diffuseMap !== null) {
        inputs.push(`${pad}color3f inputs:diffuseColor.connect = </Root/Materials/Material_${material.uniqueId}/Texture_${diffuseMap.uniqueId}_diffuse.outputs:rgb>`);

        if (material.needAlphaBlending()) {
            inputs.push(`${pad}float inputs:opacity.connect = </Root/Materials/Material_${material.uniqueId}/Texture_${diffuseMap.uniqueId}_diffuse.outputs:a>`);
        } else if (material.needAlphaTesting()) {
            inputs.push(`${pad}float inputs:opacity.connect = </Root/Materials/Material_${material.uniqueId}/Texture_${diffuseMap.uniqueId}_diffuse.outputs:a>`);
            inputs.push(`${pad}float inputs:opacityThreshold = ${alphaCutOff}`);
        }

        samplers.push(BuildTexture(diffuseMap as Texture, material, "diffuse", diffuse, textureToExports, options));
    } else {
        inputs.push(`${pad}color3f inputs:diffuseColor = ${BuildColor(diffuse || Color3.White())}`);
    }

    if (emissiveMap !== null) {
        inputs.push(`${pad}color3f inputs:emissiveColor.connect = </Root/Materials/Material_${material.uniqueId}/Texture_${emissiveMap.uniqueId}_emissive.outputs:rgb>`);

        samplers.push(BuildTexture(emissiveMap as Texture, material, "emissive", emissive, textureToExports, options));
    } else if (emissive && emissive.toLuminance() > 0) {
        inputs.push(`${pad}color3f inputs:emissiveColor = ${BuildColor(emissive)}`);
    }

    if (normalMap !== null) {
        inputs.push(`${pad}normal3f inputs:normal.connect = </Root/Materials/Material_${material.uniqueId}/Texture_${normalMap.uniqueId}_normal.outputs:rgb>`);

        samplers.push(BuildTexture(normalMap as Texture, material, "normal", null, textureToExports, options));
    }

    if (aoMap !== null) {
        inputs.push(`${pad}float inputs:occlusion.connect = </Root/Materials/Material_${material.uniqueId}/Texture_${aoMap.uniqueId}_occlusion.outputs:${aoMapChannel}>`);

        samplers.push(BuildTexture(aoMap as Texture, material, "occlusion", new Color3(aoMapIntensity, aoMapIntensity, aoMapIntensity), textureToExports, options));
    }

    if (roughnessMap !== null) {
        inputs.push(
            `${pad}float inputs:roughness.connect = </Root/Materials/Material_${material.uniqueId}/Texture_${roughnessMap.uniqueId}_roughness.outputs:${roughnessChannel}>`
        );

        samplers.push(BuildTexture(roughnessMap as Texture, material, "roughness", new Color3(roughness, roughness, roughness), textureToExports, options));
    } else {
        inputs.push(`${pad}float inputs:roughness = ${roughness}`);
    }

    if (metalnessMap !== null) {
        inputs.push(`${pad}float inputs:metallic.connect = </Root/Materials/Material_${material.uniqueId}/Texture_${metalnessMap.uniqueId}_metallic.outputs:${metalnessChannel}>`);

        samplers.push(BuildTexture(metalnessMap as Texture, material, "metallic", new Color3(metalness, metalness, metalness), textureToExports, options));
    } else {
        inputs.push(`${pad}float inputs:metallic = ${metalness}`);
    }

    if (alphaMap !== null) {
        inputs.push(`${pad}float inputs:opacity.connect = </Root/Materials/Material_${material.uniqueId}/Texture_${alphaMap.uniqueId}_opacity.outputs:r>`);
        inputs.push(`${pad}float inputs:opacityThreshold = 0.0001`);

        samplers.push(BuildTexture(alphaMap as Texture, material, "opacity", null, textureToExports, options));
    } else {
        inputs.push(`${pad}float inputs:opacity = ${material.alpha}`);
    }

    if (clearCoatEnabled) {
        if (clearCoatMap !== null) {
            inputs.push(`${pad}float inputs:clearcoat.connect = </Root/Materials/Material_${material.uniqueId}/Texture_${clearCoatMap.uniqueId}_clearcoat.outputs:r>`);
            samplers.push(BuildTexture(clearCoatMap as Texture, material, "clearcoat", new Color3(clearCoat, clearCoat, clearCoat), textureToExports, options));
        } else {
            inputs.push(`${pad}float inputs:clearcoat = ${clearCoat}`);
        }

        if (clearCoatRoughnessMap !== null) {
            inputs.push(
                `${pad}float inputs:clearcoatRoughness.connect = </Root/Materials/Material_${material.uniqueId}/Texture_${clearCoatRoughnessMap.uniqueId}_clearcoatRoughness.outputs:g>`
            );
            samplers.push(
                BuildTexture(
                    clearCoatRoughnessMap as Texture,
                    material,
                    "clearcoatRoughness",
                    new Color3(clearCoatRoughness, clearCoatRoughness, clearCoatRoughness),
                    textureToExports,
                    options
                )
            );
        } else {
            inputs.push(`${pad}float inputs:clearcoatRoughness = ${clearCoatRoughness}`);
        }
    }

    inputs.push(`${pad}float inputs:ior = ${ior}`);

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

		token outputs:surface.connect = </Root/Materials/Material_${material.uniqueId}/PreviewSurface.outputs:surface>

${samplers.join("\n")}

	}
`;
}

function BuildCamera(camera: Camera, options: IUSDZExportOptions) {
    const name = "Camera_" + camera.uniqueId;
    const matrix = Matrix.RotationY(Math.PI).multiply(camera.getWorldMatrix()); // work towards positive z

    const transform = BuildMatrix(matrix);

    if (camera.mode === Constants.ORTHOGRAPHIC_CAMERA) {
        return `def Camera "${name}"
		{
			matrix4d xformOp:transform = ${transform}
			uniform token[] xformOpOrder = ["xformOp:transform"]

			float2 clippingRange = (${camera.minZ.toPrecision(options.precision)}, ${camera.maxZ.toPrecision(options.precision)})
			float horizontalAperture = ${((Math.abs(camera.orthoLeft || 1) + Math.abs(camera.orthoRight || 1)) * 10).toPrecision(options.precision)}
			float verticalAperture = ${((Math.abs(camera.orthoTop || 1) + Math.abs(camera.orthoBottom || 1)) * 10).toPrecision(options.precision)}
			token projection = "orthographic"
		}
	
	`;
    } else {
        const aspect = camera.getEngine().getAspectRatio(camera);
        const sensorwidth = options.cameraSensorWidth || 35;

        return `def Camera "${name}"
		{
			matrix4d xformOp:transform = ${transform}
			uniform token[] xformOpOrder = ["xformOp:transform"]

			float2 clippingRange = (${camera.minZ.toPrecision(options.precision)}, ${camera.maxZ.toPrecision(options.precision)})
			float focalLength = ${(sensorwidth / (2 * Math.tan(camera.fov * 0.5))).toPrecision(options.precision)}
            token projection = "perspective"
			float horizontalAperture = ${(sensorwidth * aspect).toPrecision(options.precision)}
			float verticalAperture = ${(sensorwidth / aspect).toPrecision(options.precision)}            
		}
	
	`;
    }
}

function ExtractMeshInformations(mesh: Mesh) {
    mesh.computeWorldMatrix(true);
    const matrix = mesh.getWorldMatrix().clone();
    const sceneIsRightHanded = mesh.getScene().useRightHandedSystem;
    let sideOrientation = mesh.material?._getEffectiveOrientation(mesh) ?? mesh.sideOrientation;
    let convertToRightHanded = !sceneIsRightHanded;

    // Search for a root conversion node from the glTF loader in the mesh's ancestors.
    let current = mesh.parent;
    while (current) {
        if (IsNoopNode(current, sceneIsRightHanded) && current.parent === null) {
            if (!sceneIsRightHanded) {
                // If it's a RH->LH node, cancel out its inversion effect on the mesh's matrix and winding order.
                matrix.multiplyToRef(current.getWorldMatrix().invert(), matrix);
                sideOrientation = sideOrientation === Material.ClockWiseSideOrientation ? Material.CounterClockWiseSideOrientation : Material.ClockWiseSideOrientation;
            }
            convertToRightHanded = false;
            break;
        }
        current = current.parent;
    }

    if (matrix.determinant() < 0) {
        // RealityKit doesn't seem to automatically flip faces of a mesh with negative scale, like other engines do (including us).
        Tools.Warn(`Mesh ${mesh.name} has a negative scale, which may look incorrect in destinations like QuickLook.`);
    }

    return {
        matrix,
        windingOrder: sideOrientation === Material.ClockWiseSideOrientation ? "leftHanded" : "rightHanded",
        convertToRightHanded,
    };
}

/**
 *
 * @param scene scene to export
 * @param options options to configure the export
 * @param meshPredicate predicate to filter the meshes to export
 * @returns a uint8 array containing the USDZ file
 * @see [Simple sphere](https://playground.babylonjs.com/#H2G5XW#6)
 * @see [Red sphere](https://playground.babylonjs.com/#H2G5XW#7)
 * @see [Boombox](https://playground.babylonjs.com/#5N3RWK#5)
 */
export async function USDZExportAsync(scene: Scene, options: Partial<IUSDZExportOptions>, meshPredicate?: (m: Mesh) => boolean): Promise<Uint8Array> {
    const localOptions = {
        fflateUrl: "https://unpkg.com/fflate@0.8.2",
        includeAnchoringProperties: true,
        anchoringType: "plane",
        planeAnchoringAlignment: "horizontal",
        modelFileName: "model.usda",
        precision: 5,
        exportCamera: false,
        cameraSensorWidth: 35,
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
    output += BuildRootAndSceneStart(localOptions);

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
            const { matrix, windingOrder, convertToRightHanded } = ExtractMeshInformations(mesh);

            if (!(geometryFileName in files)) {
                const meshObject = BuildMeshObject(geometry, localOptions, windingOrder, convertToRightHanded);
                files[geometryFileName] = BuildUSDFileAsString(meshObject);
            }

            if (!(material.uniqueId in materialToExports)) {
                materialToExports[material.uniqueId] = material;
            }

            output += BuildXform(mesh, matrix);
        } else {
            Tools.Warn("USDZExportAsync does not support this material type: " + material.getClassName());
        }
    }

    // Camera
    if (scene.activeCamera && localOptions.exportCamera) {
        output += BuildCamera(scene.activeCamera, localOptions);
    }

    // Close scene
    output += BuildSceneEnd();

    // Materials
    const textureToExports: { [key: string]: BaseTexture } = {};
    output += BuildMaterials(materialToExports, textureToExports, localOptions);

    // Close root
    output += BuildRootEnd();

    // Compress
    files[localOptions.modelFileName] = fflate.strToU8(output);

    // Textures
    for (const id in textureToExports) {
        const texture = textureToExports[id];

        const size = texture.getSize();
        // eslint-disable-next-line no-await-in-loop
        const textureData = await GetTextureDataAsync(texture);

        // eslint-disable-next-line no-await-in-loop
        const fileContent = await DumpTools.DumpDataAsync(size.width, size.height, textureData, "image/png", undefined, false, true);

        files[`textures/Texture_${id}.png`] = new Uint8Array(fileContent as ArrayBuffer).slice(); // This is to avoid getting a link and not a copy
    }

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
