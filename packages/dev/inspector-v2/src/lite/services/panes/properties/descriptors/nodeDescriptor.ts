import { getTextureMetadata, type Material, type NodeInputHandle, type NodeMaterial, type Texture2D } from "@babylonjs/lite";
import {
    type DescriptorValue,
    type MaterialDescriptorAccess,
    type IMaterialDescriptorProperty,
    type MaterialDescriptorPropertyValue,
    type IMaterialDescriptorTextureReference,
    type IMaterialTextureBinding,
    type MaterialTextureMutation,
} from "./descriptorTypes.js";
import { type IMaterialDescriptorFamilyDescriptor, type IMaterialDescriptorMutationPlan } from "./materialDescriptor.js";

const FiniteNumber = { finite: true } as const;

/** @internal Side-effect-free Node descriptor. Dispatcher wiring is owned by the family convergence task. */
export const NodeMaterialDescriptor: IMaterialDescriptorFamilyDescriptor = {
    inspect: InspectNodeMaterial,
    preparePropertyMutation: PrepareNodePropertyMutation,
    prepareTextureMutation: PrepareNodeTextureMutation,
};

function InspectNodeMaterial(source: Material) {
    const material = source as NodeMaterial;
    const properties: IMaterialDescriptorProperty[] = [];
    const textureBindings: IMaterialTextureBinding[] = [];
    for (const name of Object.keys(material.inputs).sort()) {
        const handle = material.inputs[name]!;
        if (handle.type === "texture2d") {
            textureBindings.push(CreateTextureBinding(name, handle));
        } else {
            properties.push(CreateValueProperty(name, handle));
        }
    }
    return { properties, textureBindings };
}

function CreateValueProperty(name: string, handle: NodeInputHandle): IMaterialDescriptorProperty {
    const type = handle.type;
    const valueType = type === "f32" ? "number" : type === "vec2f" ? "vec2" : type === "vec3f" ? "vec3" : "vec4";
    let value: DescriptorValue<MaterialDescriptorPropertyValue>;
    try {
        const current = handle.value;
        const copied = CopyInputValue(type, current);
        value = copied === undefined ? { state: "unsupported", reason: `Node input "${name}" has no readable ${type} value.` } : { state: "present", value: copied };
    } catch {
        value = { state: "unsupported", reason: `Node input "${name}" is unavailable.` };
    }
    return {
        id: `node.input:${name}`,
        section: "inputs",
        label: name,
        valueType,
        value,
        access: Edit(type === "f32" ? FiniteNumber : undefined),
    };
}

function CopyInputValue(type: NodeInputHandle["type"], value: number | number[] | undefined): MaterialDescriptorPropertyValue | undefined {
    if (type === "f32") {
        return typeof value === "number" ? value : undefined;
    }
    if (!Array.isArray(value)) {
        return undefined;
    }
    switch (type) {
        case "vec2f":
            return value.length === 2 ? [value[0]!, value[1]!] : undefined;
        case "vec3f":
            return value.length === 3 ? [value[0]!, value[1]!, value[2]!] : undefined;
        case "vec4f":
            return value.length === 4 ? [value[0]!, value[1]!, value[2]!, value[3]!] : undefined;
        default:
            return undefined;
    }
}

function CreateTextureBinding(name: string, handle: NodeInputHandle): IMaterialTextureBinding {
    let texture: Texture2D | null | undefined;
    let readable = true;
    try {
        texture = handle.texture;
    } catch {
        readable = false;
    }

    const valid = texture ? IsCompatibleTexture2D(texture) : false;
    const value: DescriptorValue<IMaterialDescriptorTextureReference> = !readable
        ? { state: "unsupported", reason: `Node texture input "${name}" is unavailable.` }
        : !texture
          ? { state: "absent" }
          : valid
            ? { state: "present", value: { entity: texture, kind: "2d" } }
            : { state: "unsupported", reason: `Node texture input "${name}" contains an incompatible texture value.` };

    return {
        id: `node.texture:${name}`,
        label: name,
        value,
        acceptedKinds: ["2d"],
        sampleCategory: "float",
        viewCategory: "2d",
        directions: !readable ? [] : !texture ? ["assign"] : valid ? ["replace", "clear", "navigate"] : ["replace", "clear"],
        mutation: readable ? EditForRebuild() : { access: "read-only", reason: `Node texture input "${name}" is unavailable.` },
        transform: texture ? { state: "unsupported", reason: "Node texture inputs do not use standard material UV transforms." } : { state: "absent" },
    };
}

function PrepareNodePropertyMutation(source: Material, property: IMaterialDescriptorProperty, value: MaterialDescriptorPropertyValue): IMaterialDescriptorMutationPlan {
    const input = FindValueInput(source as NodeMaterial, property.id);
    return {
        mutation: "A",
        invalidationOwned: true,
        apply: () => {
            input.value = value as number | number[];
        },
    };
}

function PrepareNodeTextureMutation(source: Material, binding: IMaterialTextureBinding, mutation: MaterialTextureMutation): IMaterialDescriptorMutationPlan {
    const input = FindTextureInput(source as NodeMaterial, binding.id);
    const texture = mutation.direction === "clear" ? null : mutation.texture;
    if (texture && !IsCompatibleTexture2D(texture)) {
        throw new TypeError(`Texture binding "${binding.id}" requires a float-sampled Texture2D value.`);
    }
    return {
        mutation: "R",
        apply: () => {
            input.texture = texture as Texture2D | null;
        },
    };
}

function FindValueInput(material: NodeMaterial, propertyId: IMaterialDescriptorProperty["id"]): NodeInputHandle {
    for (const name of Object.keys(material.inputs)) {
        const input = material.inputs[name]!;
        if (propertyId === `node.input:${name}` && input.type !== "texture2d") {
            return input;
        }
    }
    throw new Error(`Property "${propertyId}" is stale or unsupported for a Node material.`);
}

function FindTextureInput(material: NodeMaterial, bindingId: IMaterialTextureBinding["id"]): NodeInputHandle {
    for (const name of Object.keys(material.inputs)) {
        const input = material.inputs[name]!;
        if (bindingId === `node.texture:${name}` && input.type === "texture2d") {
            return input;
        }
    }
    throw new Error(`Texture binding "${bindingId}" is stale or unsupported for a Node material.`);
}

function IsCompatibleTexture2D(texture: object): texture is Texture2D {
    try {
        const metadata = getTextureMetadata(texture);
        return metadata?.kind === "2d" && metadata.sampleType !== "depth" && metadata.sampleType !== "sint" && metadata.sampleType !== "uint";
    } catch {
        return false;
    }
}

function Edit(number?: typeof FiniteNumber): MaterialDescriptorAccess {
    return { access: "read-write", mutation: "A", postMutation: "none", number };
}

function EditForRebuild(): MaterialDescriptorAccess {
    return { access: "read-write", mutation: "R", postMutation: "rebuild-material" };
}
