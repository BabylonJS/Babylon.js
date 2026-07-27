import { type Vec2, type Vec3, type Vec4, type Quat, type Mat4 } from "../resolvedStage";
import { type ISdfAttributeSpec, type ISdfPrimSpec, type ISdfRelationshipSpec, type SdfMetadata, type SdfValue } from "../sdf/index";
import { ReadListOpItems } from "../sdf/sdfListOp";

/**
 * Returns an authored attribute by name, if the property exists and is an attribute.
 * @param prim prim that owns the property map
 * @param name property name to read
 * @returns the attribute spec, if present
 */
export function GetAttribute(prim: ISdfPrimSpec, name: string): ISdfAttributeSpec | undefined {
    const property = prim.properties[name];
    return property?.kind === "attribute" ? property : undefined;
}

/**
 * Returns an authored relationship by name, if the property exists and is a relationship.
 * @param prim prim that owns the property map
 * @param name property name to read
 * @returns the relationship spec, if present
 */
export function GetRelationship(prim: ISdfPrimSpec, name: string): ISdfRelationshipSpec | undefined {
    const property = prim.properties[name];
    return property?.kind === "relationship" ? property : undefined;
}

/**
 * Returns the attribute default, or the sample at time 0, or the first time sample.
 * @param attribute attribute to read
 * @returns the best static value for schema evaluation
 */
export function GetAttributeValue(attribute: ISdfAttributeSpec | undefined): SdfValue | undefined {
    if (!attribute) {
        return undefined;
    }
    if (attribute.default) {
        return attribute.default;
    }
    const samples = attribute.timeSamples;
    if (!samples || samples.values.length === 0) {
        return undefined;
    }
    const zeroIndex = samples.times.indexOf(0);
    return samples.values[zeroIndex >= 0 ? zeroIndex : 0];
}

/**
 * Returns connection targets authored on an attribute.
 * @param attribute attribute whose connections should be read
 * @returns ordered connection target paths
 */
export function GetConnectionTargets(attribute: ISdfAttributeSpec | undefined): string[] {
    return ReadListOpItems(attribute?.connections);
}

/**
 * Returns relationship targets authored on a relationship.
 * @param relationship relationship whose targets should be read
 * @returns ordered relationship target paths
 */
export function GetRelationshipTargets(relationship: ISdfRelationshipSpec | undefined): string[] {
    return ReadListOpItems(relationship?.targets);
}

/**
 * Splits an absolute USD property path into prim path and property name.
 * @param path absolute USD property path
 * @returns split path parts, or undefined when the path has no property segment
 */
export function SplitPropertyPath(path: string): { primPath: string; propertyName: string } | undefined {
    const dotIndex = path.lastIndexOf(".");
    if (dotIndex < 0) {
        return undefined;
    }
    return {
        primPath: path.slice(0, dotIndex),
        propertyName: path.slice(dotIndex + 1),
    };
}

/**
 * Reads a numeric scalar from a tagged Sdf value.
 * @param value tagged value to read
 * @returns numeric payload, if compatible
 */
export function AsNumber(value: SdfValue | undefined): number | undefined {
    if (!value) {
        return undefined;
    }
    if (typeof value.value === "number") {
        return value.value;
    }
    if (typeof value.value === "bigint") {
        return Number(value.value);
    }
    return undefined;
}

/**
 * Reads a boolean scalar from a tagged Sdf value.
 * @param value tagged value to read
 * @returns boolean payload, if compatible
 */
export function AsBoolean(value: SdfValue | undefined): boolean | undefined {
    if (!value) {
        return undefined;
    }
    if (typeof value.value === "boolean") {
        return value.value;
    }
    if (typeof value.value === "number") {
        return value.value !== 0;
    }
    if (typeof value.value === "string") {
        return value.value === "true" ? true : value.value === "false" ? false : undefined;
    }
    return undefined;
}

/**
 * Reads a token or string scalar from a tagged Sdf value.
 * @param value tagged value to read
 * @returns string payload, if compatible
 */
export function AsToken(value: SdfValue | undefined): string | undefined {
    if (!value) {
        return undefined;
    }
    return typeof value.value === "string" ? value.value : undefined;
}

/**
 * Reads a two-component vector from a tagged Sdf value.
 * @param value tagged value to read
 * @returns Vec2 payload, if compatible
 */
export function AsVec2(value: SdfValue | undefined): Vec2 | undefined {
    const components = value?.value as number[] | undefined;
    return IsNumericTuple(components, 2) ? [components[0], components[1]] : undefined;
}

/**
 * Reads a three-component vector from a tagged Sdf value.
 * @param value tagged value to read
 * @returns Vec3 payload, if compatible
 */
export function AsVec3(value: SdfValue | undefined): Vec3 | undefined {
    const components = value?.value as number[] | undefined;
    return IsNumericTuple(components, 3) ? [components[0], components[1], components[2]] : undefined;
}

/**
 * Reads a four-component vector from a tagged Sdf value.
 * @param value tagged value to read
 * @returns Vec4 payload, if compatible
 */
export function AsVec4(value: SdfValue | undefined): Vec4 | undefined {
    const components = value?.value as number[] | undefined;
    return IsNumericTuple(components, 4) ? [components[0], components[1], components[2], components[3]] : undefined;
}

/**
 * Reads a quaternion from a tagged Sdf value.
 * @param value tagged value to read
 * @returns quaternion payload, if compatible
 */
export function AsQuat(value: SdfValue | undefined): Quat | undefined {
    const components = value?.value as number[] | undefined;
    return IsNumericTuple(components, 4) ? [components[0], components[1], components[2], components[3]] : undefined;
}

/**
 * Reads a matrix from a tagged Sdf value.
 * @param value tagged value to read
 * @returns matrix payload, if compatible
 */
export function AsMat4(value: SdfValue | undefined): Mat4 | undefined {
    return IsNumericTuple(value?.value, 16) ? [...value.value] : undefined;
}

/**
 * Reads a numeric array from a tagged Sdf value.
 * @param value tagged value to read
 * @returns numeric array payload, if compatible
 */
export function AsNumberArray(value: SdfValue | undefined): number[] | undefined {
    if (!Array.isArray(value?.value) || !value.value.every((item) => typeof item === "number" || typeof item === "bigint")) {
        return undefined;
    }
    return value.value.map((item) => Number(item));
}

/**
 * Reads a token array from a tagged Sdf value.
 * @param value tagged value to read
 * @returns token array payload, if compatible
 */
export function AsTokenArray(value: SdfValue | undefined): string[] | undefined {
    return Array.isArray(value?.value) && value.value.every((item) => typeof item === "string") ? [...value.value] : undefined;
}

/**
 * Reads an array of Vec2 values from a tagged Sdf value.
 * @param value tagged value to read
 * @returns Vec2 array payload, if compatible
 */
export function AsVec2Array(value: SdfValue | undefined): Vec2[] | undefined {
    return AsTupleArray(value, 2) as Vec2[] | undefined;
}

/**
 * Reads an array of Vec3 values from a tagged Sdf value.
 * @param value tagged value to read
 * @returns Vec3 array payload, if compatible
 */
export function AsVec3Array(value: SdfValue | undefined): Vec3[] | undefined {
    return AsTupleArray(value, 3) as Vec3[] | undefined;
}

/**
 * Reads a string asset path from a tagged Sdf asset value.
 * @param value tagged asset value to read
 * @returns resolved or authored asset path, if compatible
 */
export function AsAssetPath(value: SdfValue | undefined): string | undefined {
    if (!value) {
        return undefined;
    }
    if (value.type === "asset") {
        return value.value.resolvedPath ?? value.value.authoredPath;
    }
    return typeof value.value === "string" ? value.value : undefined;
}

/**
 * Reads a typed metadata token or string value.
 * @param metadata metadata dictionary
 * @param name metadata key
 * @returns metadata string value, if present
 */
export function GetMetadataToken(metadata: SdfMetadata | undefined, name: string): string | undefined {
    const value = metadata?.[name];
    return AsToken(value);
}

/**
 * Reads a numeric attribute value from a prim.
 * @param prim prim that owns the attribute
 * @param name attribute name
 * @returns numeric attribute value, if compatible
 */
export function GetNumberAttribute(prim: ISdfPrimSpec, name: string): number | undefined {
    return AsNumber(GetAttributeValue(GetAttribute(prim, name)));
}

/**
 * Reads a boolean attribute value from a prim.
 * @param prim prim that owns the attribute
 * @param name attribute name
 * @returns boolean attribute value, if compatible
 */
export function GetBooleanAttribute(prim: ISdfPrimSpec, name: string): boolean | undefined {
    return AsBoolean(GetAttributeValue(GetAttribute(prim, name)));
}

/**
 * Reads a token attribute value from a prim.
 * @param prim prim that owns the attribute
 * @param name attribute name
 * @returns token attribute value, if compatible
 */
export function GetTokenAttribute(prim: ISdfPrimSpec, name: string): string | undefined {
    return AsToken(GetAttributeValue(GetAttribute(prim, name)));
}

/**
 * Reads a token-array attribute value from a prim.
 * @param prim prim that owns the attribute
 * @param name attribute name
 * @returns token-array attribute value, if compatible
 */
export function GetTokenArrayAttribute(prim: ISdfPrimSpec, name: string): string[] | undefined {
    return AsTokenArray(GetAttributeValue(GetAttribute(prim, name)));
}

/**
 * Reads a Vec3 attribute value from a prim.
 * @param prim prim that owns the attribute
 * @param name attribute name
 * @returns Vec3 attribute value, if compatible
 */
export function GetVec3Attribute(prim: ISdfPrimSpec, name: string): Vec3 | undefined {
    return AsVec3(GetAttributeValue(GetAttribute(prim, name)));
}

function IsNumericTuple(value: unknown, length: number): value is number[] {
    return Array.isArray(value) && value.length >= length && value.slice(0, length).every((item) => typeof item === "number");
}

function AsTupleArray(value: SdfValue | undefined, length: number): number[][] | undefined {
    if (!Array.isArray(value?.value) || !value.value.every((item) => IsNumericTuple(item, length))) {
        return undefined;
    }
    return value.value.map((item) => item.slice(0, length));
}
