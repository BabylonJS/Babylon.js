import { getMaterialFamily, getMaterialSource, isMaterialView, markMaterialUboDirty, rebuildMaterial, type Material, type SceneContext } from "@babylonjs/lite";
import {
    type AppliedMaterialMutationClass,
    type DescriptorValue,
    type IMaterialDescriptor,
    type MaterialDescriptorAccess,
    type IMaterialDescriptorEdit,
    type IMaterialDescriptorMutationResult,
    type IMaterialDescriptorMutationScope,
    type IMaterialDescriptorProperty,
    type MaterialDescriptorPropertyId,
    type MaterialDescriptorPropertyValue,
    type IMaterialTextureBinding,
    type MaterialTextureBindingId,
    type MaterialTextureMutation,
} from "./descriptorTypes.js";

/** @internal Family-owned descriptor data before the common layer copies it into a public snapshot. */
export interface IMaterialDescriptorFamilySnapshot {
    readonly properties: readonly IMaterialDescriptorProperty[];
    readonly textureBindings: readonly IMaterialTextureBinding[];
}

/**
 * @internal A side-effect-free mutation plan. `apply` is the transaction's only
 * mutation step, allowing the common layer to validate scene ownership first.
 */
export interface IMaterialDescriptorMutationPlan {
    readonly mutation: AppliedMaterialMutationClass;
    readonly invalidationOwned?: boolean;
    readonly rebuildMaterial?: boolean;
    readonly frameGraphParticipationChanged?: boolean;
    readonly apply: () => void | Promise<void>;
}

/** @internal Family descriptor seam used by the family descriptor modules. */
export interface IMaterialDescriptorFamilyDescriptor {
    readonly inspect: (source: Material) => IMaterialDescriptorFamilySnapshot;
    readonly preparePropertyMutation?: (
        source: Material,
        property: IMaterialDescriptorProperty,
        value: MaterialDescriptorPropertyValue
    ) => IMaterialDescriptorMutationPlan | Promise<IMaterialDescriptorMutationPlan>;
    readonly prepareTextureMutation?: (
        source: Material,
        binding: IMaterialTextureBinding,
        mutation: MaterialTextureMutation
    ) => IMaterialDescriptorMutationPlan | Promise<IMaterialDescriptorMutationPlan>;
}

interface IResolvedMaterial {
    readonly source: Material;
    readonly target: Material;
    readonly isView: boolean;
}

/** @internal Build a copied common/family snapshot without retaining mutable tuple or capability arrays. */
export function CreateMaterialDescriptorWithFamily(material: Material, descriptor?: IMaterialDescriptorFamilyDescriptor): IMaterialDescriptor {
    const resolved = ResolveMaterial(material);
    const family = ReadMaterialFamily(resolved.source);
    const commonProperties = CreateCommonProperties(resolved.target);
    const familySnapshot = InspectFamilySafely(resolved.target, descriptor);
    const properties = commonProperties.concat(familySnapshot.properties.filter((property) => property.id !== "material.name").map((property) => CopyDescriptorProperty(property)));
    return {
        source: resolved.source,
        family,
        displayName: GetMaterialDisplayName(resolved.target, family),
        isView: resolved.isView,
        properties,
        textureBindings: familySnapshot.textureBindings.map((binding) => CopyTextureBinding(binding)),
    };
}

/** @internal Execute a common or family property transaction. */
export async function SetMaterialDescriptorPropertyWithFamily(
    scope: IMaterialDescriptorMutationScope,
    material: Material,
    propertyId: MaterialDescriptorPropertyId,
    value: MaterialDescriptorPropertyValue,
    familyDescriptor?: IMaterialDescriptorFamilyDescriptor
): Promise<IMaterialDescriptorMutationResult> {
    const descriptor = CreateMaterialDescriptorWithFamily(material, familyDescriptor);
    const target = ResolveMaterial(material).target;
    const property = FindDescriptorProperty(descriptor.properties, propertyId);
    const access = RequireEditable(property.access, `Property "${propertyId}"`);
    const candidate = ValidatePropertyValue(property, value);

    if (property.value.state === "present" && SameDescriptorValue(property.value.value, candidate)) {
        return UnchangedResult(access);
    }

    if (propertyId === "material.name") {
        (target as { name?: string }).name = candidate as string;
        return { changed: true, mutation: "A", postMutation: "none" };
    }

    const prepare = familyDescriptor?.preparePropertyMutation;
    if (!prepare) {
        throw new Error(`Property "${propertyId}" is stale or has no mutation implementation.`);
    }
    const plan = await prepare(target, property, candidate);
    return await ExecuteMutationPlan(scope, descriptor.source, target, access, plan);
}

/** @internal Execute a family binding transaction after common capability validation. */
export async function SetMaterialDescriptorTextureWithFamily(
    scope: IMaterialDescriptorMutationScope,
    material: Material,
    bindingId: MaterialTextureBindingId,
    mutation: MaterialTextureMutation,
    familyDescriptor?: IMaterialDescriptorFamilyDescriptor
): Promise<IMaterialDescriptorMutationResult> {
    const descriptor = CreateMaterialDescriptorWithFamily(material, familyDescriptor);
    const target = ResolveMaterial(material).target;
    const binding = FindTextureBinding(descriptor.textureBindings, bindingId);
    const access = RequireEditable(binding.mutation, `Texture binding "${bindingId}"`);

    if (!binding.directions.includes(mutation.direction)) {
        throw new Error(`Texture binding "${bindingId}" does not support "${mutation.direction}".`);
    }
    if (mutation.direction === "assign") {
        if (binding.value.state !== "absent") {
            throw new Error(`Texture binding "${bindingId}" is no longer empty.`);
        }
        RequireTextureObject(bindingId, mutation.texture);
    } else if (mutation.direction === "replace") {
        if (binding.value.state !== "present") {
            throw new Error(`Texture binding "${bindingId}" no longer has a value to replace.`);
        }
        RequireTextureObject(bindingId, mutation.texture);
        if (binding.value.value.entity === mutation.texture) {
            return UnchangedResult(access);
        }
    } else if (binding.value.state !== "present") {
        throw new Error(`Texture binding "${bindingId}" no longer has a value to clear.`);
    }

    const prepare = familyDescriptor?.prepareTextureMutation;
    if (!prepare) {
        throw new Error(`Texture binding "${bindingId}" is stale or has no mutation implementation.`);
    }
    const plan = await prepare(target, binding, mutation);
    return await ExecuteMutationPlan(scope, descriptor.source, target, access, plan);
}

/** @internal Validate and copy a property value before it reaches family code. */
export function ValidateMaterialDescriptorPropertyValue(property: IMaterialDescriptorProperty, value: unknown): MaterialDescriptorPropertyValue {
    return ValidatePropertyValue(property, value);
}

/** @internal Compare scalar and tuple descriptor values without coercion. */
export function SameMaterialDescriptorValue(a: MaterialDescriptorPropertyValue, b: MaterialDescriptorPropertyValue): boolean {
    return SameDescriptorValue(a, b);
}

function InspectFamilySafely(source: Material, descriptor?: IMaterialDescriptorFamilyDescriptor): IMaterialDescriptorFamilySnapshot {
    if (!descriptor) {
        return { properties: [], textureBindings: [] };
    }
    try {
        const snapshot = descriptor.inspect(source);
        if (!snapshot || !Array.isArray(snapshot.properties) || !Array.isArray(snapshot.textureBindings)) {
            return { properties: [], textureBindings: [] };
        }
        return snapshot;
    } catch {
        return { properties: [], textureBindings: [] };
    }
}

function ResolveMaterial(material: Material): IResolvedMaterial {
    if (!IsObject(material)) {
        return { source: material, target: material, isView: false };
    }
    try {
        const source = getMaterialSource(material);
        if (isMaterialView(material) && IsObject(source) && source !== material) {
            return { source, target: material, isView: true };
        }
    } catch {
        // A malformed third-party value remains inspectable as an unknown source.
    }
    return { source: material, target: material, isView: false };
}

function ReadMaterialFamily(material: Material): string | undefined {
    if (!IsObject(material)) {
        return undefined;
    }
    try {
        const family = getMaterialFamily(material);
        return typeof family === "string" && family.length > 0 ? family : undefined;
    } catch {
        return undefined;
    }
}

function GetMaterialDisplayName(material: Material, family: string | undefined): string {
    if (IsObject(material)) {
        try {
            const name = (material as { name?: unknown }).name;
            if (typeof name === "string" && name.length > 0) {
                return name;
            }
        } catch {
            // Fall through to the stable family identity.
        }
    }
    switch (family) {
        case "standard":
            return "Standard Material";
        case "pbr":
            return "Pbr Material";
        case "shader":
            return "Shader Material";
        case "node":
            return "Node Material";
        default:
            return "Material";
    }
}

function CreateCommonProperties(material: Material): IMaterialDescriptorProperty[] {
    if (!IsObject(material)) {
        return [];
    }
    let value: DescriptorValue<MaterialDescriptorPropertyValue>;
    try {
        const name = (material as { name?: unknown }).name;
        value = name === undefined || typeof name === "string" ? { state: "present", value: name ?? "" } : { state: "unsupported", reason: "Material name is not a string." };
    } catch {
        value = { state: "unsupported", reason: "Material name is unavailable." };
    }
    return [
        {
            id: "material.name",
            section: "general",
            label: "Name",
            valueType: "string",
            value,
            access: { access: "read-write", mutation: "A", postMutation: "none" },
        },
    ];
}

function CopyDescriptorProperty(property: IMaterialDescriptorProperty): IMaterialDescriptorProperty {
    let value = property.value;
    if (value.state === "present") {
        try {
            value = { state: "present", value: ValidatePropertyValue(property, value.value) };
        } catch (error) {
            value = { state: "unsupported", reason: error instanceof Error ? error.message : `Property "${property.id}" has an invalid value.` };
        }
    } else if (value.state === "unsupported") {
        value = { state: "unsupported", reason: value.reason };
    } else {
        value = { state: "absent" };
    }
    return {
        ...property,
        value,
        access: CopyAccess(property.access),
        options: property.options?.map((option) => ({ value: option.value, label: option.label })),
    };
}

function CopyTextureBinding(binding: IMaterialTextureBinding): IMaterialTextureBinding {
    const value =
        binding.value.state === "present"
            ? { state: "present" as const, value: { entity: binding.value.value.entity, kind: binding.value.value.kind } }
            : binding.value.state === "unsupported"
              ? { state: "unsupported" as const, reason: binding.value.reason }
              : { state: "absent" as const };
    const transform =
        binding.transform.state === "present"
            ? { state: "present" as const, value: { ...binding.transform.value } }
            : binding.transform.state === "unsupported"
              ? { state: "unsupported" as const, reason: binding.transform.reason }
              : { state: "absent" as const };
    return {
        ...binding,
        value,
        acceptedKinds: binding.acceptedKinds.slice(),
        directions: binding.directions.slice(),
        mutation: CopyAccess(binding.mutation),
        transform,
    };
}

function CopyAccess(access: MaterialDescriptorAccess): MaterialDescriptorAccess {
    if (access.access === "read-only") {
        return { access: "read-only", reason: access.reason };
    }
    return {
        access: "read-write",
        mutation: access.mutation,
        postMutation: access.postMutation,
        number: access.number ? { ...access.number } : undefined,
    };
}

function FindDescriptorProperty(properties: readonly IMaterialDescriptorProperty[], id: MaterialDescriptorPropertyId): IMaterialDescriptorProperty {
    let found: IMaterialDescriptorProperty | undefined;
    for (const property of properties) {
        if (property.id === id) {
            if (found) {
                throw new Error(`Property "${id}" is ambiguous.`);
            }
            found = property;
        }
    }
    if (!found) {
        throw new Error(`Property "${id}" is stale or unsupported for this material.`);
    }
    return found;
}

function FindTextureBinding(bindings: readonly IMaterialTextureBinding[], id: MaterialTextureBindingId): IMaterialTextureBinding {
    let found: IMaterialTextureBinding | undefined;
    for (const binding of bindings) {
        if (binding.id === id) {
            if (found) {
                throw new Error(`Texture binding "${id}" is ambiguous.`);
            }
            found = binding;
        }
    }
    if (!found) {
        throw new Error(`Texture binding "${id}" is stale or unsupported for this material.`);
    }
    return found;
}

function RequireEditable(access: MaterialDescriptorAccess, subject: string): IMaterialDescriptorEdit {
    if (access.access !== "read-write") {
        throw new Error(`${subject} is read-only${access.reason ? `: ${access.reason}` : "."}`);
    }
    return access;
}

function ValidatePropertyValue(property: IMaterialDescriptorProperty, value: unknown): MaterialDescriptorPropertyValue {
    switch (property.valueType) {
        case "string":
        case "summary":
            if (typeof value !== "string") {
                throw new TypeError(`Property "${property.id}" requires a string.`);
            }
            return value;
        case "boolean":
            if (typeof value !== "boolean") {
                throw new TypeError(`Property "${property.id}" requires a boolean.`);
            }
            return value;
        case "number":
            return ValidateNumber(property, value);
        case "enum": {
            if ((typeof value !== "string" && typeof value !== "number") || (typeof value === "number" && !Number.isFinite(value))) {
                throw new TypeError(`Property "${property.id}" requires a finite string or number enum value.`);
            }
            if (!property.options?.some((option) => Object.is(option.value, value))) {
                throw new RangeError(`Property "${property.id}" does not accept enum value "${String(value)}".`);
            }
            return value;
        }
        case "vec2":
            return ValidateTuple(property.id, value, 2);
        case "vec3":
            return ValidateTuple(property.id, value, 3);
        case "vec4":
            return ValidateTuple(property.id, value, 4);
        case "mat4":
            return ValidateTuple(property.id, value, 16);
    }
}

function ValidateNumber(property: IMaterialDescriptorProperty, value: unknown): number {
    if (typeof value !== "number" || !Number.isFinite(value)) {
        throw new TypeError(`Property "${property.id}" requires a finite number.`);
    }
    const constraint = property.access.access === "read-write" ? property.access.number : undefined;
    if (constraint?.integer && !Number.isInteger(value)) {
        throw new TypeError(`Property "${property.id}" requires an integer.`);
    }
    if (constraint?.min !== undefined && value < constraint.min) {
        throw new RangeError(`Property "${property.id}" must be at least ${constraint.min}.`);
    }
    if (constraint?.max !== undefined && value > constraint.max) {
        throw new RangeError(`Property "${property.id}" must be at most ${constraint.max}.`);
    }
    return value;
}

function ValidateTuple(id: MaterialDescriptorPropertyId, value: unknown, length: 2 | 3 | 4 | 16): MaterialDescriptorPropertyValue {
    const tuple = Array.isArray(value) ? value : ArrayBuffer.isView(value) && "length" in value ? Array.from(value as unknown as ArrayLike<unknown>) : undefined;
    if (!tuple || tuple.length !== length) {
        throw new TypeError(`Property "${id}" requires a ${length}-component tuple.`);
    }
    const copy = tuple.slice();
    if (copy.some((component) => typeof component !== "number" || !Number.isFinite(component))) {
        throw new TypeError(`Property "${id}" requires finite tuple components.`);
    }
    return copy as unknown as MaterialDescriptorPropertyValue;
}

function SameDescriptorValue(a: MaterialDescriptorPropertyValue, b: MaterialDescriptorPropertyValue): boolean {
    if (!Array.isArray(a) || !Array.isArray(b)) {
        return Object.is(a, b);
    }
    if (a.length !== b.length) {
        return false;
    }
    for (let i = 0; i < a.length; i++) {
        if (!Object.is(a[i], b[i])) {
            return false;
        }
    }
    return true;
}

function RequireTextureObject(binding: MaterialTextureBindingId, texture: object): void {
    if (!IsObject(texture)) {
        throw new TypeError(`Texture binding "${binding}" requires a texture object.`);
    }
}

function UnchangedResult(access: IMaterialDescriptorEdit): IMaterialDescriptorMutationResult {
    return {
        changed: false,
        mutation: access.mutation === "U/R" ? "U" : access.mutation,
        postMutation: "none",
    };
}

async function ExecuteMutationPlan(
    scope: IMaterialDescriptorMutationScope,
    source: Material,
    target: Material,
    access: IMaterialDescriptorEdit,
    plan: IMaterialDescriptorMutationPlan
): Promise<IMaterialDescriptorMutationResult> {
    ValidateMutationPlan(access, plan);
    const rebuildRequested = plan.mutation === "R" || plan.rebuildMaterial === true;
    const scenes = rebuildRequested ? GetUniqueOwningScenes(scope, source) : [];

    await plan.apply();

    if (plan.mutation === "U" && !plan.invalidationOwned) {
        markMaterialUboDirty(target);
    }
    if (rebuildRequested) {
        await Promise.all(
            scenes.map(
                async (scene) =>
                    await Promise.resolve(
                        rebuildMaterial(scene, target, {
                            awaitCompletion: true,
                            rebuildViews: true,
                            rebuildFrameGraph: plan.frameGraphParticipationChanged === true,
                        })
                    )
            )
        );
    }

    return {
        changed: true,
        mutation: plan.mutation,
        postMutation: rebuildRequested ? (plan.frameGraphParticipationChanged ? "rebuild-material-and-frame-graph" : "rebuild-material") : "none",
    };
}

function ValidateMutationPlan(access: IMaterialDescriptorEdit, plan: IMaterialDescriptorMutationPlan): void {
    if (!plan || typeof plan.apply !== "function") {
        throw new Error("Material mutation implementation returned an invalid transaction plan.");
    }
    if (access.mutation === "U/R") {
        if (plan.mutation !== "U" && plan.mutation !== "R") {
            throw new Error(`Material mutation resolved "U/R" to invalid class "${plan.mutation}".`);
        }
    } else if (plan.mutation !== access.mutation) {
        throw new Error(`Material mutation class "${plan.mutation}" does not match declared class "${access.mutation}".`);
    }
    const rebuildRequested = plan.mutation === "R" || plan.rebuildMaterial === true;
    if (rebuildRequested && access.postMutation === "none") {
        throw new Error("Material mutation requested an undeclared material rebuild.");
    }
    if (plan.frameGraphParticipationChanged && access.postMutation !== "rebuild-material-and-frame-graph") {
        throw new Error("Material mutation requested an undeclared frame-graph rebuild.");
    }
}

/** @internal Validate and deduplicate the explicit scene scope used by descriptor mutations. */
export function _ValidateDescriptorScopeScenes(scope: IMaterialDescriptorMutationScope): SceneContext[] {
    if (!scope || !Array.isArray(scope.scenes)) {
        throw new TypeError("Material mutation scope must provide an array of scenes.");
    }
    const scenes: SceneContext[] = [];
    for (const scene of scope.scenes) {
        if (!scenes.includes(scene)) {
            scenes.push(scene);
        }
    }
    for (const scene of scenes) {
        if (!IsObject(scene) || !Array.isArray(scene.meshes)) {
            throw new TypeError("Material mutation scope contains an invalid scene.");
        }
    }
    return scenes;
}

function GetUniqueOwningScenes(scope: IMaterialDescriptorMutationScope, source: Material): SceneContext[] {
    const scenes = _ValidateDescriptorScopeScenes(scope);
    if (scenes.length === 0) {
        throw new Error("Material rebuild requires at least one owning scene.");
    }
    for (const scene of scenes) {
        if (!scene.meshes.some((mesh) => mesh?.material && ResolveMaterial(mesh.material).source === source)) {
            throw new Error("Material is not reachable from every scene in the mutation scope.");
        }
    }
    return scenes;
}

function IsObject(value: unknown): value is object {
    return typeof value === "object" && value !== null;
}
