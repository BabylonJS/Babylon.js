import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const DevRoot = resolve(import.meta.dirname, "../../..");
const InspectorRoot = resolve(DevRoot, "inspector-v2/src");
const SharedRoot = resolve(DevRoot, "sharedUiComponents/src");

function ReadInspectorSource(path: string): string {
    return readFileSync(resolve(InspectorRoot, path), "utf8");
}

function ReadSharedSource(path: string): string {
    return readFileSync(resolve(SharedRoot, path), "utf8");
}

const PreviewOrEditorDependency = /(?:texture|material)(?:Preview|Editor)|pixelReadback|readback|uploadTexture|exportTexture/i;
const BabylonRuntimeImplementation = /from ["'](?:@dev\/core|core\/(?!index["']))/;
const RemovedLiteInspectionApi =
    /\b(?:inspectMaterial|inspectTexture|getMaterialTextureBindings|setMaterialInspectionProperty|setMaterialInspectionTexture|setTextureInspectionTransform|MaterialInspection|TextureInspection|InspectionDatum|InspectionValue)\b/;
const RemovedAwaitedRebuildContract = /\b(?:AwaitedRebuildMaterialOptions|awaitCompletion)\b/;

describe("P4 Inspector import boundaries", () => {
    it("keeps every material family and texture metadata adapter behind its own lazy entrypoint", () => {
        const materialService = ReadInspectorSource("lite/services/panes/properties/materialPropertiesService.tsx");
        const textureService = ReadInspectorSource("lite/services/panes/properties/texturePropertiesService.tsx");
        const families = ["standard", "pbr", "shader", "node"] as const;

        families.forEach((family) => {
            expect(materialService).toContain(`import("./materialAdapters/${family}MaterialAdapter")`);
            expect(materialService).not.toMatch(new RegExp(`^import .*materialAdapters/${family}MaterialAdapter`, "m"));
        });
        expect(textureService).toContain('import("./liteTextureMetadataAdapter")');
        expect(textureService).not.toMatch(/^import .*liteTextureMetadataAdapter/m);
    });

    it("keeps Lite lazy adapter sources free of Babylon.js implementation and preview/editor dependencies", () => {
        const sources = [
            "lite/services/panes/properties/materialAdapters/standardMaterialAdapter.tsx",
            "lite/services/panes/properties/materialAdapters/pbrMaterialAdapter.tsx",
            "lite/services/panes/properties/materialAdapters/shaderMaterialAdapter.tsx",
            "lite/services/panes/properties/materialAdapters/nodeMaterialAdapter.tsx",
            "lite/services/panes/properties/materialAdapters/materialAdapterCore.tsx",
            "lite/services/panes/properties/liteTextureMetadataAdapter.tsx",
            "lite/services/panes/properties/useLatestAsyncOperation.ts",
            "lite/services/panes/properties/descriptors/descriptorTypes.ts",
            "lite/services/panes/properties/descriptors/materialDescriptor.ts",
            "lite/services/panes/properties/descriptors/standardDescriptor.ts",
            "lite/services/panes/properties/descriptors/pbrDescriptor.ts",
            "lite/services/panes/properties/descriptors/shaderDescriptor.ts",
            "lite/services/panes/properties/descriptors/nodeDescriptor.ts",
            "lite/services/panes/scene/materialTopologyBindings.ts",
            "lite/services/panes/scene/sceneResources.ts",
        ].map(ReadInspectorSource);

        sources.forEach((source) => {
            expect(source).not.toMatch(PreviewOrEditorDependency);
            expect(source).not.toMatch(BabylonRuntimeImplementation);
            expect(source).not.toMatch(RemovedLiteInspectionApi);
            expect(source).not.toMatch(RemovedAwaitedRebuildContract);
            expect(source).not.toMatch(/@babylonjs\/lite\/(?:src|dist)\//);
        });
        expect(sources.filter((source) => source.includes('from "core/index"'))).toEqual([expect.stringContaining('import { type IReadonlyObservable } from "core/index"')]);
        expect(sources.join("\n").match(/from ["']core\/index["']/g)).toHaveLength(1);
    });

    it("keeps family descriptors Inspector-owned and out of the eager service and topology chunks", () => {
        const materialService = ReadInspectorSource("lite/services/panes/properties/materialPropertiesService.tsx");
        const topology = ReadInspectorSource("lite/services/panes/scene/materialTopologyBindings.ts");
        const families = ["standard", "pbr", "shader", "node"] as const;

        families.forEach((family) => {
            const adapter = ReadInspectorSource(`lite/services/panes/properties/materialAdapters/${family}MaterialAdapter.tsx`);
            expect(adapter).toContain(`../descriptors/${family}Descriptor`);
            expect(materialService).not.toContain(`descriptors/${family}Descriptor`);
            expect(topology).not.toContain(`descriptors/${family}Descriptor`);
        });
    });

    it("keeps shared material and texture cores runtime-neutral", () => {
        const sources = [
            "fluent/hoc/propertyLines/materialPropertyLine.tsx",
            "fluent/hoc/propertyLines/materialPropertyAdaptersCore.ts",
            "fluent/hoc/propertyLines/materialTextureBindingPropertyLine.tsx",
            "fluent/hoc/propertyLines/textureMetadataProperties.tsx",
        ].map(ReadSharedSource);

        sources.forEach((source) => {
            expect(source).not.toMatch(/from ["'](?:@babylonjs\/lite|@dev\/core|core\/)/);
            expect(source).not.toMatch(PreviewOrEditorDependency);
        });
    });

    it("keeps the legacy Babylon.js adapter independent of Lite while retaining native translation", () => {
        const source = ReadInspectorSource("components/properties/materials/materialPropertyAdapters.tsx");
        const babylonAdapter = ReadSharedSource("fluent/hoc/propertyLines/materialPropertyAdapters.ts");
        const liteAdapter = ReadSharedSource("lite/fluent/hoc/propertyLines/materialPropertyAdapters.ts");

        expect(source).toContain('import { type Color3 } from "core/Maths/math.color"');
        expect(babylonAdapter).toContain("new Color3(color.r, color.g, color.b)");
        expect(liteAdapter).not.toMatch(/from ["'](?:core\/|@dev\/core)/);
        expect(source).not.toContain("@babylonjs/lite");
        expect(babylonAdapter).not.toContain("@babylonjs/lite");
        expect(source).not.toMatch(PreviewOrEditorDependency);
        expect(babylonAdapter).not.toMatch(PreviewOrEditorDependency);
        expect(liteAdapter).not.toMatch(PreviewOrEditorDependency);
    });
});
