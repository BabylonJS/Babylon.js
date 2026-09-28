/* eslint-disable @typescript-eslint/naming-convention, jsdoc/require-param, jsdoc/require-returns */
import { type FBXDocument, type FBXNode, type FBXPropertyValue, findChildByName, findDocumentNode, getPropertyValue } from "../types/fbxTypes";

export interface FBXTemplateProperty {
    name: string;
    propertyType: string;
    label: string;
    flags: string;
    values: FBXPropertyValue[];
}

export interface FBXPropertyTemplate {
    objectType: string;
    templateName: string;
    properties: Map<string, FBXTemplateProperty>;
}

export type FBXPropertyTemplateMap = Map<string, Map<string, FBXPropertyTemplate>>;

export function extractPropertyTemplates(doc: FBXDocument): FBXPropertyTemplateMap {
    const templates: FBXPropertyTemplateMap = new Map();
    const definitions = findDocumentNode(doc, "Definitions");
    if (!definitions) {
        return templates;
    }

    for (const objectTypeNode of definitions.children) {
        if (objectTypeNode.name !== "ObjectType") {
            continue;
        }

        const objectType = getPropertyValue<string>(objectTypeNode, 0);
        if (!objectType) {
            continue;
        }

        for (const templateNode of objectTypeNode.children) {
            if (templateNode.name !== "PropertyTemplate") {
                continue;
            }

            const templateName = getPropertyValue<string>(templateNode, 0);
            if (!templateName) {
                continue;
            }

            const template = extractPropertyTemplate(objectType, templateName, templateNode);
            let templatesByName = templates.get(objectType);
            if (!templatesByName) {
                templatesByName = new Map();
                templates.set(objectType, templatesByName);
            }
            templatesByName.set(templateName, template);
        }
    }

    return templates;
}

export function getPropertyTemplate(templates: FBXPropertyTemplateMap, objectType: string, templateName?: string): FBXPropertyTemplate | undefined {
    const templatesByName = templates.get(objectType);
    if (!templatesByName) {
        return undefined;
    }
    if (templateName) {
        return templatesByName.get(templateName);
    }
    return templatesByName.values().next().value;
}

export function getTemplatePropertyValue<T extends FBXPropertyValue>(template: FBXPropertyTemplate | undefined, propertyName: string, valueIndex = 0): T | undefined {
    return template?.properties.get(propertyName)?.values[valueIndex] as T | undefined;
}

export function resolvePropertyValue<T extends FBXPropertyValue>(node: FBXNode, template: FBXPropertyTemplate | undefined, propertyName: string, valueIndex = 0): T | undefined {
    return resolvePropertyValues(node, template, propertyName)?.[valueIndex] as T | undefined;
}

export function resolveNumberProperty(node: FBXNode, template: FBXPropertyTemplate | undefined, propertyName: string, fallback: number): number {
    return toNumber(resolvePropertyValue(node, template, propertyName)) ?? fallback;
}

export function resolveVector2Property(node: FBXNode, template: FBXPropertyTemplate | undefined, propertyName: string, fallback: [number, number]): [number, number] {
    const values = resolvePropertyValues(node, template, propertyName);
    if (!values) {
        return fallback;
    }
    const x = toNumber(values[0]);
    const y = toNumber(values[1]);
    return x !== undefined && y !== undefined ? [x, y] : fallback;
}

export function resolveVector3Property(
    node: FBXNode,
    template: FBXPropertyTemplate | undefined,
    propertyName: string,
    fallback: [number, number, number]
): [number, number, number] {
    const values = resolvePropertyValues(node, template, propertyName);
    if (!values) {
        return fallback;
    }
    const x = toNumber(values[0]);
    const y = toNumber(values[1]);
    const z = toNumber(values[2]);
    return x !== undefined && y !== undefined && z !== undefined ? [x, y, z] : fallback;
}

export function resolvePropertyValues(node: FBXNode, template: FBXPropertyTemplate | undefined, propertyName: string): FBXPropertyValue[] | undefined {
    return findLocalPropertyValues(node, propertyName) ?? template?.properties.get(propertyName)?.values;
}

function toNumber(value: FBXPropertyValue | undefined): number | undefined {
    if (typeof value === "number") {
        return value;
    }
    return undefined;
}

function extractPropertyTemplate(objectType: string, templateName: string, templateNode: FBXNode): FBXPropertyTemplate {
    const properties = new Map<string, FBXTemplateProperty>();
    const properties70 = findChildByName(templateNode, "Properties70");

    for (const propertyNode of properties70?.children ?? []) {
        if (propertyNode.name !== "P") {
            continue;
        }

        const property = extractPropertyNode(propertyNode);
        if (property) {
            properties.set(property.name, property);
        }
    }

    return { objectType, templateName, properties };
}

/** A property from a Properties70 ("P") or Properties60 ("Property") block. */
export interface FBXPropertyEntry {
    name: string;
    type: string;
    flags: string;
    values: FBXPropertyValue[];
}

/**
 * Lists the properties declared directly on an object, from both the 7.x and 6.x property blocks.
 * @param node - Object node
 * @returns Property entries in declaration order (empty when the node has no property block)
 */
export function getPropertyEntries(node: FBXNode | undefined): FBXPropertyEntry[] {
    const out: FBXPropertyEntry[] = [];
    if (!node) {
        return out;
    }
    for (const container of node.children) {
        if (container.name !== "Properties70" && container.name !== "Properties60") {
            continue;
        }
        for (const p of container.children) {
            if (p.name !== "P" && p.name !== "PS" && p.name !== "Property") {
                continue;
            }
            const name = getPropertyValue<string>(p, 0);
            if (typeof name !== "string") {
                continue;
            }
            // The layout follows the entry node, not its container: `P` / `PS` carry name, type, label and flags,
            // `Property` carries name, type and flags. Transitional 6.x files write `P` entries inside Properties60.
            const hasLabel = p.name !== "Property";
            const type = getPropertyValue<string>(p, 1);
            const flags = getPropertyValue<string>(p, hasLabel ? 3 : 2);
            out.push({
                name,
                type: typeof type === "string" ? type : "",
                flags: typeof flags === "string" ? flags : "",
                values: p.properties.slice(hasLabel ? 4 : 3).map((property) => property.value),
            });
        }
    }
    return out;
}

/** Value of a user property: scalars as-is, vectors and colours as number arrays. */
export type FBXUserPropertyValue = string | number | boolean | number[];

/**
 * User-defined properties of an object: those flagged "U" (user) in the property flags. Every DCC exports custom
 * attributes this way (Maya extra attributes, 3ds Max user properties, Blender custom properties).
 * @param node - Object node
 * @returns Map of property name to value, or undefined when the object has none
 */
export function extractUserProperties(node: FBXNode): Record<string, FBXUserPropertyValue> | undefined {
    const result: Record<string, FBXUserPropertyValue> = {};
    let any = false;
    for (const entry of getPropertyEntries(node)) {
        if (!entry.flags.includes("U")) {
            continue;
        }
        const value = userPropertyValue(entry.values, entry.type);
        if (value !== undefined) {
            result[entry.name] = value;
            any = true;
        }
    }
    return any ? result : undefined;
}

/** Property types whose extra values are limits or labels rather than components (value, min, max). */
const SCALAR_PROPERTY_TYPES = new Set([
    "Integer",
    "int",
    "Number",
    "double",
    "Float",
    "float",
    "Bool",
    "bool",
    "Enum",
    "enum",
    "Visibility",
    "Roll",
    "Weight",
    "Distance",
    "KTime",
    "Time",
]);

export function userPropertyValue(values: FBXPropertyValue[], typeName?: string): FBXUserPropertyValue | undefined {
    if (values.length === 0) {
        return undefined;
    }
    const first = values[0];
    if (typeName !== undefined && SCALAR_PROPERTY_TYPES.has(typeName) && (typeof first === "number" || typeof first === "boolean")) {
        return typeof first === "boolean" ? first : first;
    }
    if (values.length === 1) {
        return typeof first === "string" || typeof first === "number" || typeof first === "boolean" ? first : undefined;
    }
    const numbers: number[] = [];
    for (const v of values) {
        if (typeof v === "number") {
            numbers.push(v);
        } else if (typeof v === "boolean") {
            numbers.push(v ? 1 : 0);
        } else {
            break;
        }
    }
    if (numbers.length === values.length) {
        return numbers;
    }
    return typeof first === "string" ? first : undefined;
}

function findLocalPropertyValues(node: FBXNode, propertyName: string): FBXPropertyValue[] | undefined {
    const propertyContainers = [findChildByName(node, "Properties70"), findChildByName(node, "Properties60")].filter((child): child is FBXNode => child !== undefined);

    // When a property is declared more than once the SDK keeps the last declaration.
    let found: FBXPropertyValue[] | undefined;
    for (const container of propertyContainers) {
        for (const propertyNode of container.children) {
            if (propertyNode.name !== "P" && propertyNode.name !== "Property") {
                continue;
            }
            if (getPropertyValue<string>(propertyNode, 0) !== propertyName) {
                continue;
            }
            found = propertyNode.properties.slice(propertyNode.name === "Property" ? 3 : 4).map((property) => property.value);
        }
    }

    return found;
}

function extractPropertyNode(node: FBXNode): FBXTemplateProperty | null {
    const name = getPropertyValue<string>(node, 0);
    if (!name) {
        return null;
    }

    return {
        name,
        propertyType: getPropertyValue<string>(node, 1) ?? "",
        label: getPropertyValue<string>(node, 2) ?? "",
        flags: getPropertyValue<string>(node, 3) ?? "",
        values: node.properties.slice(4).map((property) => property.value),
    };
}
