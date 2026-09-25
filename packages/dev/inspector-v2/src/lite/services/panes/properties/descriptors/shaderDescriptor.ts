import {
    getShaderTexture,
    getShaderUniform,
    getTextureMetadata,
    setShaderTexture,
    setShaderUniform,
    type Material,
    type ShaderMaterial,
    type ShaderSamplerDecl,
    type ShaderUniformDecl,
    type ShaderUniformType,
    type ShaderUniformValue,
    type Texture2D,
} from "@babylonjs/lite";
import {
    type IDescriptorNumberConstraint,
    type MaterialDescriptorAccess,
    type IMaterialDescriptorProperty,
    type MaterialDescriptorPropertyValue,
    type IMaterialTextureBinding,
    type MaterialTextureMutation,
    type TextureBindingKind,
    type TextureSampleCategory,
} from "./descriptorTypes.js";
import { type IMaterialDescriptorFamilyDescriptor, type IMaterialDescriptorMutationPlan } from "./materialDescriptor.js";

const FiniteNumber = { finite: true } as const;
const U32Number = { finite: true, integer: true, min: 0, max: 0xffffffff } as const;
const I32Number = { finite: true, integer: true, min: -0x80000000, max: 0x7fffffff } as const;
const SystemUniforms = new Set(["world", "view", "projection", "viewProjection", "worldView", "worldViewProjection", "cameraPosition", "screenSize", "alphaCutoff"]);

/** @internal Side-effect-free Shader descriptor. Dispatcher wiring is owned by the family convergence task. */
export const ShaderMaterialDescriptor: IMaterialDescriptorFamilyDescriptor = {
    inspect: InspectShaderMaterial,
    preparePropertyMutation: PrepareShaderPropertyMutation,
    prepareTextureMutation: PrepareShaderTextureMutation,
};

function InspectShaderMaterial(source: Material) {
    const material = source as ShaderMaterial;
    const properties: IMaterialDescriptorProperty[] = [];
    for (const declaration of material.uniformDecls) {
        if (!SystemUniforms.has(declaration.name)) {
            properties.push(CreateUniformProperty(material, declaration));
        }
    }
    properties.push({
        id: "shader.configuration",
        section: "configuration",
        label: "Configuration",
        valueType: "summary",
        value: { state: "present", value: SummarizeConfiguration(material) },
        access: { access: "read-only", reason: "Shader pipeline configuration is read-only." },
    });
    return {
        properties,
        textureBindings: material.samplerDecls.map((declaration) => CreateSamplerBinding(material, declaration)),
    };
}

function CreateUniformProperty(material: ShaderMaterial, declaration: ShaderUniformDecl): IMaterialDescriptorProperty {
    const value = getShaderUniform(material, declaration.name);
    return {
        id: `shader.uniform:${declaration.name}`,
        section: "inputs",
        label: declaration.name,
        valueType: UniformValueType(declaration.type),
        value: { state: "present", value: CopyUniformValue(declaration.type, value) },
        access: Edit(NumberConstraint(declaration.type)),
    };
}

function UniformValueType(type: ShaderUniformType): IMaterialDescriptorProperty["valueType"] {
    switch (type) {
        case "f32":
        case "u32":
        case "i32":
            return "number";
        case "vec2<f32>":
            return "vec2";
        case "vec3<f32>":
            return "vec3";
        case "vec4<f32>":
            return "vec4";
        case "mat4x4<f32>":
            return "mat4";
    }
}

function NumberConstraint(type: ShaderUniformType): IDescriptorNumberConstraint | undefined {
    switch (type) {
        case "f32":
            return FiniteNumber;
        case "u32":
            return U32Number;
        case "i32":
            return I32Number;
        default:
            return undefined;
    }
}

function CopyUniformValue(type: ShaderUniformType, value: number | Readonly<ArrayLike<number>>): MaterialDescriptorPropertyValue {
    const values = typeof value === "number" ? [value] : value;
    switch (type) {
        case "f32":
        case "u32":
        case "i32":
            return values[0]!;
        case "vec2<f32>":
            return [values[0]!, values[1]!];
        case "vec3<f32>":
            return [values[0]!, values[1]!, values[2]!];
        case "vec4<f32>":
            return [values[0]!, values[1]!, values[2]!, values[3]!];
        case "mat4x4<f32>":
            return [
                values[0]!,
                values[1]!,
                values[2]!,
                values[3]!,
                values[4]!,
                values[5]!,
                values[6]!,
                values[7]!,
                values[8]!,
                values[9]!,
                values[10]!,
                values[11]!,
                values[12]!,
                values[13]!,
                values[14]!,
                values[15]!,
            ];
    }
}

function CreateSamplerBinding(material: ShaderMaterial, declaration: ShaderSamplerDecl): IMaterialTextureBinding {
    const texture = getShaderTexture(material, declaration.name);
    const expectedKind = SamplerKind(declaration);
    const kind = texture ? TextureKind(texture) : undefined;
    const value: IMaterialTextureBinding["value"] = !texture
        ? { state: "absent" }
        : kind
          ? { state: "present", value: { entity: texture, kind } }
          : { state: "unsupported", reason: `Sampler "${declaration.name}" contains an unsupported texture value.` };
    return {
        id: `shader.sampler:${declaration.name}`,
        label: declaration.name,
        value,
        acceptedKinds: [expectedKind],
        sampleCategory: SamplerSampleCategory(declaration),
        viewCategory: expectedKind,
        directions: texture ? (kind ? ["replace", "clear", "navigate"] : ["replace", "clear"]) : ["assign"],
        mutation: Edit(),
        transform: texture ? { state: "unsupported", reason: "Shader samplers do not use standard material UV transforms." } : { state: "absent" },
    };
}

function PrepareShaderPropertyMutation(source: Material, property: IMaterialDescriptorProperty, value: MaterialDescriptorPropertyValue): IMaterialDescriptorMutationPlan {
    const material = source as ShaderMaterial;
    const declaration = material.uniformDecls.find((candidate) => !SystemUniforms.has(candidate.name) && property.id === `shader.uniform:${candidate.name}`);
    if (!declaration) {
        throw new Error(`Property "${property.id}" is stale, read-only, or unsupported for a Shader material.`);
    }
    return {
        mutation: "A",
        invalidationOwned: true,
        apply: () => {
            setShaderUniform(material, declaration.name, value as ShaderUniformValue);
        },
    };
}

function PrepareShaderTextureMutation(source: Material, binding: IMaterialTextureBinding, mutation: MaterialTextureMutation): IMaterialDescriptorMutationPlan {
    const material = source as ShaderMaterial;
    const declaration = material.samplerDecls.find((candidate) => binding.id === `shader.sampler:${candidate.name}`);
    if (!declaration) {
        throw new Error(`Texture binding "${binding.id}" is stale or unsupported for a Shader material.`);
    }
    const texture = mutation.direction === "clear" ? null : mutation.texture;
    if (texture) {
        RequireCompatibleTexture(binding.id, declaration, texture);
    }
    return {
        mutation: "A",
        invalidationOwned: true,
        apply: () => {
            setShaderTexture(material, declaration.name, texture as Texture2D | null);
        },
    };
}

function RequireCompatibleTexture(binding: IMaterialTextureBinding["id"], declaration: ShaderSamplerDecl, texture: object): void {
    const kind = TextureKind(texture);
    const expectedKind = SamplerKind(declaration);
    if (kind !== expectedKind) {
        throw new TypeError(`Texture binding "${binding}" requires a ${expectedKind === "2d-array" ? "Texture2DArray" : "Texture2D"} value.`);
    }
    const sampleCategory = TextureSampleCategory(texture);
    const expectedSampleCategory = SamplerSampleCategory(declaration);
    const compatible = expectedSampleCategory === "depth" ? sampleCategory === "depth" : sampleCategory === "float";
    if (!compatible) {
        throw new TypeError(`Texture binding "${binding}" requires a ${expectedSampleCategory} texture sample type.`);
    }
}

function TextureKind(texture: object): TextureBindingKind | undefined {
    try {
        const kind = getTextureMetadata(texture)?.kind;
        return kind === "2d" || kind === "2d-array" ? kind : undefined;
    } catch {
        return undefined;
    }
}

function TextureSampleCategory(texture: object): "float" | "depth" | undefined {
    try {
        const sampleType = getTextureMetadata(texture)?.sampleType;
        return sampleType === "float" || sampleType === "unfilterable-float" || sampleType === undefined ? "float" : sampleType === "depth" ? "depth" : undefined;
    } catch {
        return undefined;
    }
}

function SamplerKind(declaration: ShaderSamplerDecl): "2d" | "2d-array" {
    return declaration.viewDimension === "2d-array" ? "2d-array" : "2d";
}

function SamplerSampleCategory(declaration: ShaderSamplerDecl): TextureSampleCategory {
    return declaration.comparison === true ? "depth" : (declaration.sampleType ?? "float");
}

function Edit(number?: IDescriptorNumberConstraint): MaterialDescriptorAccess {
    return { access: "read-write", mutation: "A", postMutation: "none", number };
}

function SummarizeConfiguration(material: ShaderMaterial): string {
    const attributes = material.attributes.length > 0 ? material.attributes.join(", ") : "none";
    const defines = material.defines.length > 0 ? material.defines.map((define) => `${define.name}=${String(define.value)}`).join(", ") : "none";
    const storageBuffers =
        material.storageBufferDecls.length > 0 ? material.storageBufferDecls.map((declaration) => `${declaration.name}: ${declaration.type}`).join(", ") : "none";
    return [
        `Attributes: ${attributes}`,
        `Defines: ${defines}`,
        `Blend: ${SummarizeBlend(material)}`,
        `Transmissive: ${String(material.transmissive)}`,
        `Alpha testing: ${String(material.needAlphaTesting)}`,
        `Back-face culling: ${String(material.backFaceCulling)}`,
        `Depth write: ${String(material.depthWrite)}`,
        `Depth compare: ${material.depthCompare}`,
        `Depth-only fragment: ${String(material.depthOnlyFragment)}`,
        `Depth bias: ${String(material.depthBias)}`,
        `Depth bias slope scale: ${String(material.depthBiasSlopeScale)}`,
        "Topology: unavailable",
        `Storage buffers: ${storageBuffers}`,
    ].join("; ");
}

function SummarizeBlend(material: ShaderMaterial): string {
    if (material.blend) {
        return `custom color(${SummarizeBlendComponent(material.blend.color)}) alpha(${SummarizeBlendComponent(material.blend.alpha)})`;
    }
    return material.needAlphaBlending ? material.blendMode : "disabled";
}

function SummarizeBlendComponent(component: GPUBlendComponent): string {
    return `${component.srcFactor ?? "one"}, ${component.dstFactor ?? "zero"}, ${component.operation ?? "add"}`;
}
