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
    if (typeof value === "bigint") {
        return Number(value);
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

function findLocalPropertyValues(node: FBXNode, propertyName: string): FBXPropertyValue[] | undefined {
    const propertyContainers = [findChildByName(node, "Properties70"), findChildByName(node, "Properties60")].filter((child): child is FBXNode => child !== undefined);

    for (const container of propertyContainers) {
        for (const propertyNode of container.children) {
            if (propertyNode.name !== "P" && propertyNode.name !== "Property") {
                continue;
            }
            if (getPropertyValue<string>(propertyNode, 0) !== propertyName) {
                continue;
            }
            return propertyNode.properties.slice(propertyNode.name === "Property" ? 3 : 4).map((property) => property.value);
        }
    }

    return undefined;
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
