import { afterAll, describe, expect, expectTypeOf, it, vi } from "vitest";

vi.hoisted(() => {
    vi.stubGlobal("window", globalThis);
    vi.stubGlobal(
        "matchMedia",
        vi.fn(() => ({ matches: false }))
    );
});

import { type ISceneContext, SceneContextIdentity } from "../../src/services/sceneContext";
import { PropertiesServiceIdentity } from "../../src/services/panes/properties/propertiesService";
import { type ISelectionService, SelectionServiceIdentity } from "../../src/services/selectionService";
import { SceneSelectionServiceDefinition } from "../../src/services/sceneSelectionService";
import { EngineContextIdentity } from "../../src/lite/engineContext";
import { EngineExplorerServiceIdentity } from "../../src/lite/engineExplorerService";
import { EngineSelectionServiceDefinition } from "../../src/lite/engineSelectionService";

import { type EngineContext } from "@babylonjs/lite";

// This test intentionally validates the public "@babylonjs/inspector/lite" entry point, so it imports the barrel directly.
// eslint-disable-next-line babylonjs/no-directory-barrel-imports, import/no-internal-modules
import * as LitePublicApi from "../../src/lite/index";

function CreateTestSelectionService(initialEntity: object | null = null): ISelectionService {
    let selectedEntity = initialEntity;

    return {
        get selectedEntity() {
            return selectedEntity;
        },
        set selectedEntity(entity) {
            selectedEntity = entity;
        },
        onSelectedEntityChanged: { add: () => null, remove: () => true } as unknown as ISelectionService["onSelectedEntityChanged"],
    } as ISelectionService;
}

describe("SceneSelectionService", () => {
    afterAll(() => {
        vi.unstubAllGlobals();
    });

    it("consumes only the scene context and the selection service", () => {
        expect(SceneSelectionServiceDefinition.consumes?.[0]).toBe(SceneContextIdentity);
        expect(SceneSelectionServiceDefinition.consumes).toHaveLength(2);
        expect(SceneSelectionServiceDefinition.produces).toBeUndefined();
    });

    it("selects the scene by default", () => {
        const scene = { name: "TestScene" };
        const selectionService = CreateTestSelectionService();

        SceneSelectionServiceDefinition.factory({ currentScene: scene } as unknown as ISceneContext, selectionService);

        expect(selectionService.selectedEntity).toBe(scene);
    });

    it("does not overwrite an existing selection", () => {
        const scene = { name: "TestScene" };
        const mesh = { name: "TestMesh" };
        const selectionService = CreateTestSelectionService(mesh);

        SceneSelectionServiceDefinition.factory({ currentScene: scene } as unknown as ISceneContext, selectionService);

        expect(selectionService.selectedEntity).toBe(mesh);
    });
});

describe("EngineSelectionService", () => {
    afterAll(() => {
        vi.unstubAllGlobals();
    });

    it("consumes only the engine context and the selection service", () => {
        expect(EngineSelectionServiceDefinition.consumes?.[0]).toBe(EngineContextIdentity);
        expect(EngineSelectionServiceDefinition.consumes).toHaveLength(2);
        expect(EngineSelectionServiceDefinition.produces).toBeUndefined();
    });

    it("selects the engine by default", () => {
        const engine = { surfaces: [] };
        const selectionService = CreateTestSelectionService();

        EngineSelectionServiceDefinition.factory({ engine } as never, selectionService);

        expect(selectionService.selectedEntity).toBe(engine);
    });

    it("does not overwrite an existing selection", () => {
        const engine = { surfaces: [] };
        const renderingContext = { kind: "scene" };
        const selectionService = CreateTestSelectionService(renderingContext);

        EngineSelectionServiceDefinition.factory({ engine } as never, selectionService);

        expect(selectionService.selectedEntity).toBe(renderingContext);
    });
});

describe("Babylon Lite public API", () => {
    it("exposes the engine context contract", () => {
        expect(LitePublicApi.EngineContextIdentity).toBe(EngineContextIdentity);
        expect(LitePublicApi.EngineExplorerServiceIdentity).toBe(EngineExplorerServiceIdentity);
        expect(LitePublicApi.PropertiesServiceIdentity).toBe(PropertiesServiceIdentity);
        expect(LitePublicApi.SelectionServiceIdentity).toBe(SelectionServiceIdentity);
        expect(typeof LitePublicApi.ShowInspector).toBe("function");
        expect("SceneContextIdentity" in LitePublicApi).toBe(false);
        expect("AttachDebugLayer" in LitePublicApi).toBe(false);
        expectTypeOf<LitePublicApi.IEngineContext["engine"]>().toEqualTypeOf<EngineContext>();
        expectTypeOf<LitePublicApi.ExplorerNodeDescription>().toBeObject();
        expectTypeOf<LitePublicApi.IEngineContext>().not.toHaveProperty("currentTarget");
    });
});
