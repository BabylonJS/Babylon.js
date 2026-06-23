import { describe, expect, it } from "vitest";
import { extractPropertyTemplates, getPropertyTemplate, resolvePropertyValues } from "loaders/FBX/interpreter/propertyTemplates";
import { type FBXDocument, type FBXNode } from "loaders/FBX/types/fbxTypes";

describe("FBX property templates", () => {
    it("resolves object-local properties before template defaults", () => {
        const template = getPropertyTemplate(extractPropertyTemplates(createSyntheticTemplateDocument()), "Material", "FbxSurfaceLambert");
        const materialNode = createSyntheticMaterialNode();

        expect(resolvePropertyValues(materialNode, template, "DiffuseFactor")).toEqual([0.25]);
        expect(resolvePropertyValues(materialNode, template, "AmbientFactor")).toEqual([1]);
        expect(resolvePropertyValues(materialNode, template, "MissingProperty")).toBeUndefined();
    });
});

function createSyntheticTemplateDocument(): FBXDocument {
    return {
        version: 7500,
        nodes: [
            {
                name: "Definitions",
                properties: [],
                children: [
                    {
                        name: "ObjectType",
                        properties: [{ type: "string", value: "Material" }],
                        children: [
                            {
                                name: "PropertyTemplate",
                                properties: [{ type: "string", value: "FbxSurfaceLambert" }],
                                children: [
                                    {
                                        name: "Properties70",
                                        properties: [],
                                        children: [createPropertyNode("DiffuseFactor", "Number", "", "A", [1]), createPropertyNode("AmbientFactor", "Number", "", "A", [1])],
                                    },
                                ],
                            },
                        ],
                    },
                ],
            },
        ],
    };
}

function createSyntheticMaterialNode(): FBXNode {
    return {
        name: "Material",
        properties: [
            { type: "int64", value: 1 },
            { type: "string", value: "Material" },
            { type: "string", value: "" },
        ],
        children: [
            {
                name: "Properties70",
                properties: [],
                children: [createPropertyNode("DiffuseFactor", "Number", "", "A", [0.25])],
            },
        ],
    };
}

function createPropertyNode(name: string, propertyType: string, label: string, flags: string, values: number[] | string[]): FBXNode {
    return {
        name: "P",
        properties: [
            { type: "string", value: name },
            { type: "string", value: propertyType },
            { type: "string", value: label },
            { type: "string", value: flags },
            ...values.map((value) => ({
                type: typeof value === "number" ? ("float64" as const) : ("string" as const),
                value,
            })),
        ],
        children: [],
    };
}
