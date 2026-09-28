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
const NativeRuntimeImplementation = /from ["'](?:@dev\/core|core\/(?!index["']))/;
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
        expect(textureService).toContain('import("./textureMetadataAdapter")');
        expect(textureService).not.toMatch(/^import .*textureMetadataAdapter/m);
    });

    it("keeps Lite lazy adapter sources free of Babylon.js implementation and preview/editor dependencies", () => {
        const sources = [
            "lite/services/panes/properties/materialAdapters/standardMaterialAdapter.tsx",
            "lite/services/panes/properties/materialAdapters/pbrMaterialAdapter.tsx",
            "lite/services/panes/properties/materialAdapters/shaderMaterialAdapter.tsx",
            "lite/services/panes/properties/materialAdapters/nodeMaterialAdapter.tsx",
            "lite/services/panes/properties/materialAdapters/materialAdapterTypes.ts",
            "lite/services/panes/properties/materialAdapters/useDirectMaterialOperations.ts",
            "lite/services/panes/properties/materialAdapters/directTextureBinding.tsx",
            "lite/services/panes/properties/materialAdapters/dynamicMaterialField.tsx",
            "lite/services/panes/properties/textureMetadataAdapter.tsx",
            "lite/services/panes/properties/useLatestAsyncOperation.ts",
            "lite/services/panes/scene/materialTopologyBindings.ts",
            "lite/services/panes/scene/sceneResources.ts",
        ].map(ReadInspectorSource);

        sources.forEach((source) => {
            expect(source).not.toMatch(PreviewOrEditorDependency);
            expect(source).not.toMatch(NativeRuntimeImplementation);
            expect(source).not.toMatch(RemovedLiteInspectionApi);
            expect(source).not.toMatch(RemovedAwaitedRebuildContract);
            expect(source).not.toMatch(/@babylonjs\/lite\/(?:src|dist)\//);
        });
        expect(sources.filter((source) => source.includes('from "core/index"'))).toEqual([expect.stringContaining('import { type IReadonlyObservable } from "core/index"')]);
        expect(sources.join("\n").match(/from ["']core\/index["']/g)).toHaveLength(1);
    });

    it("keeps family-specific field and binding logic out of the eager service and topology chunks", () => {
        const materialService = ReadInspectorSource("lite/services/panes/properties/materialPropertiesService.tsx");
        const topology = ReadInspectorSource("lite/services/panes/scene/materialTopologyBindings.ts");
        expect(materialService).not.toMatch(/(?:descriptors\/|materialAdapterCore|directTextureBinding|dynamicMaterialField)/);
        expect(topology).not.toMatch(/(?:descriptors\/|materialAdapters\/)/);
    });

    it("keeps shared material and texture cores runtime-neutral", () => {
        const sources = [
            "fluent/hoc/propertyLines/colorPropertyLineCore.tsx",
            "fluent/hoc/propertyLines/vectorPropertyLineCore.tsx",
            "fluent/hoc/propertyLines/materialTextureBindingPropertyLine.tsx",
            "fluent/hoc/propertyLines/textureMetadataProperties.tsx",
        ].map(ReadSharedSource);

        sources.forEach((source) => {
            expect(source).not.toMatch(/from ["'](?:@babylonjs\/lite|@dev\/core|core\/)/);
            expect(source).not.toMatch(PreviewOrEditorDependency);
        });
    });

    it("keeps native BJS bindings and Lite derived fields independent", () => {
        const source = ReadInspectorSource("components/properties/materials/standardMaterialProperties.tsx");
        const textureRow = ReadInspectorSource("components/properties/materials/materialTextureDebugPropertyLine.tsx");
        const textureProperties = ReadInspectorSource("components/properties/textures/baseTextureProperties.tsx");
        const liteSource = ["standard", "pbr", "shader", "node"]
            .map((family) => ReadInspectorSource(`lite/services/panes/properties/materialAdapters/${family}MaterialAdapter.tsx`))
            .join("\n");
        const dynamicField = ReadInspectorSource("lite/services/panes/properties/materialAdapters/dynamicMaterialField.tsx");
        expect(source).toContain('component={Color3PropertyLine} label="Diffuse Color"');
        expect(source).toContain('component={SyncedSliderPropertyLine} label="Specular Power"');
        expect(source).not.toContain("MaterialPropertySection");
        expect(source).not.toContain("@babylonjs/lite");
        expect(textureRow).toContain("<TextureSelector {...textureProps} />");
        expect(textureRow).not.toContain("MaterialTextureBindingPropertyLine");
        expect(textureProperties).toContain('<StringifiedPropertyLine label="Internal Unique ID"');
        expect(textureProperties).not.toContain("TextureMetadataProperties");
        expect(liteSource).toContain("component={Color3PropertyLine}");
        expect(liteSource).toContain("DerivedProperty");
        expect(liteSource).toContain("ComputedProperty");
        expect(dynamicField).toContain("DerivedProperty");
        expect(liteSource).not.toContain("MaterialPropertySection");
        expect(liteSource).not.toContain("../descriptors/");
    });
});
