import { describe, expect, it } from "vitest";
import { extractPropertyTemplates, getPropertyEntries, getPropertyTemplate, resolvePropertyValues } from "loaders/FBX/interpreter/propertyTemplates";
import { type FBXDocument, type FBXNode } from "loaders/FBX/types/fbxTypes";

describe("FBX property templates", () => {
    it("resolves object-local properties before template defaults", () => {
        const template = getPropertyTemplate(extractPropertyTemplates(createSyntheticTemplateDocument()), "Material", "FbxSurfaceLambert");
        const materialNode = createSyntheticMaterialNode();

        expect(resolvePropertyValues(materialNode, template, "DiffuseFactor")).toEqual([0.25]);
        expect(resolvePropertyValues(materialNode, template, "AmbientFactor")).toEqual([1]);
        expect(resolvePropertyValues(materialNode, template, "MissingProperty")).toBeUndefined();
    });

    it("reads the entry layout from the entry node, not from its container", () => {
        // Transitional 6.x files write four-field "P" entries inside Properties60.
        const node: FBXNode = {
            name: "GlobalSettings",
            properties: [],
            children: [
                {
                    name: "Properties60",
                    properties: [],
                    children: [
                        {
                            name: "P",
                            properties: [
                                { type: "string", value: "UpAxis" },
                                { type: "string", value: "int" },
                                { type: "string", value: "Integer" },
                                { type: "string", value: "" },
                                { type: "int32", value: 2 },
                            ],
                            children: [],
                        },
                        {
                            name: "Property",
                            properties: [
                                { type: "string", value: "UnitScaleFactor" },
                                { type: "string", value: "double" },
                                { type: "string", value: "" },
                                { type: "float64", value: 2.54 },
                            ],
                            children: [],
                        },
                    ],
                },
            ],
        };

        expect(getPropertyEntries(node)).toEqual([
            { name: "UpAxis", type: "int", flags: "", values: [2] },
            { name: "UnitScaleFactor", type: "double", flags: "", values: [2.54] },
        ]);
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
