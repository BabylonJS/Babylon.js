import { describe, expect, it } from "vitest";
import { isLegacyDocument, upgradeLegacyDocument } from "loaders/FBX/interpreter/legacyDocument";
import { interpretFBX } from "loaders/FBX/interpreter/fbxInterpreter";
import { getPropertyEntries } from "loaders/FBX/interpreter/propertyTemplates";
import { type FBXDocument, type FBXNode, findDocumentNode } from "loaders/FBX/types/fbxTypes";

describe("FBX legacy document upgrade", () => {
    it("detects pre-6000 documents by their top-level models", () => {
        expect(isLegacyDocument(createLegacyDocument(true))).toBe(true);
        expect(isLegacyDocument({ version: 7500, nodes: [{ name: "Objects", properties: [], children: [] }] })).toBe(false);
    });

    it("keeps the file's GlobalSettings and only adds the frame rate", () => {
        const upgraded = upgradeLegacyDocument(createLegacyDocument(true));

        const globalSettings = upgraded.nodes.filter((node) => node.name === "GlobalSettings");
        expect(globalSettings).toHaveLength(1);
        const entries = getPropertyEntries(globalSettings[0]);
        const value = (name: string) => entries.find((entry) => entry.name === name)?.values[0];
        expect(value("UpAxis")).toBe(2);
        expect(value("UpAxisSign")).toBe(1);
        expect(value("UnitScaleFactor")).toBe(2.54);
        expect(value("TimeMode")).toBe(14);
        expect(value("CustomFrameRate")).toBe(24);
        expect(findDocumentNode(upgraded, "Settings")).toBeUndefined();
        expect(findDocumentNode(upgraded, "Objects")?.children.map((node) => node.name)).toEqual(["Model"]);
    });

    it("interprets axis, unit and frame rate settings of a legacy file", () => {
        const scene = interpretFBX(createLegacyDocument(true));

        expect(scene.upAxis).toBe(2);
        expect(scene.unitScaleFactor).toBe(2.54);
        expect(scene.frameRate).toBe(24);
        expect(scene.rootModels.map((model) => model.name)).toEqual(["Box"]);
    });

    it("synthesizes GlobalSettings when the legacy file has none", () => {
        const upgraded = upgradeLegacyDocument(createLegacyDocument(false));

        const entries = getPropertyEntries(findDocumentNode(upgraded, "GlobalSettings")!);
        expect(entries.map((entry) => entry.name)).toEqual(["TimeMode", "CustomFrameRate"]);
        expect(interpretFBX(createLegacyDocument(false)).frameRate).toBe(24);
    });
});

function property60(name: string, type: string, value: number): FBXNode {
    return {
        name: "Property",
        properties: [
            { type: "string", value: name },
            { type: "string", value: type },
            { type: "string", value: "" },
            { type: type === "double" ? "float64" : "int32", value },
        ],
        children: [],
    };
}

function createLegacyDocument(withGlobalSettings: boolean): FBXDocument {
    const nodes: FBXNode[] = [{ name: "FBXHeaderExtension", properties: [], children: [{ name: "FBXVersion", properties: [{ type: "int32", value: 5800 }], children: [] }] }];
    if (withGlobalSettings) {
        nodes.push({
            name: "GlobalSettings",
            properties: [],
            children: [
                { name: "Version", properties: [{ type: "int32", value: 1000 }], children: [] },
                {
                    name: "Properties60",
                    properties: [],
                    children: [
                        property60("UpAxis", "int", 2),
                        property60("UpAxisSign", "int", 1),
                        property60("FrontAxis", "int", 1),
                        property60("FrontAxisSign", "int", 1),
                        property60("CoordAxis", "int", 0),
                        property60("CoordAxisSign", "int", 1),
                        property60("UnitScaleFactor", "double", 2.54),
                    ],
                },
            ],
        });
    }
    nodes.push({ name: "Settings", properties: [], children: [{ name: "FrameRate", properties: [{ type: "float64", value: 24 }], children: [] }] });
    nodes.push({
        name: "Model",
        properties: [{ type: "string", value: "Model::Box" }],
        children: [{ name: "Type", properties: [{ type: "string", value: "Null" }], children: [] }],
    });
    return { version: 5800, nodes };
}
