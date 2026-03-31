import {
    EvaluateDisposePlaygroundScene,
    EvaluateInitializePackageScene,
    EvaluateInitializePlaygroundScene,
    EvaluateMountViewerScenario,
    EvaluateUnmountViewerScenario,
} from "../../src/browserActions";
import { GetGlobalConfig } from "../../src/config";
import { CreateMemlabScenario, DefaultScenarioDefinitions, ResolveScenarioDefinitions } from "../../src/scenarios";
import { createMockFn } from "./testFramework";

const createPageMock = () => ({
    evaluate: createMockFn().mockResolvedValueOnce(undefined).mockResolvedValueOnce(null).mockResolvedValueOnce(undefined).mockResolvedValueOnce(null),
    waitForFunction: createMockFn().mockResolvedValue(undefined),
    setViewport: createMockFn().mockResolvedValue(undefined),
});

describe("memory leak scenarios", () => {
    it("resolves the ci suite without package-only scenarios", () => {
        const scenarios = ResolveScenarioDefinitions("ci");

        expect(scenarios.length).toBeGreaterThan(0);
        expect(scenarios.every((scenario) => scenario.packageName === "@babylonjs/core")).toBe(true);
    });

    it("resolves explicit scenario ids", () => {
        const scenarios = ResolveScenarioDefinitions("all", ["viewer-boombox-web-component"]);

        expect(scenarios).toHaveLength(1);
        expect(scenarios[0].id).toBe("viewer-boombox-web-component");
    });

    it("creates a playground scenario that uses the deterministic browser actions", async () => {
        const definition = DefaultScenarioDefinitions.find((scenario) => scenario.id === "core-playground-2FDQT5-1508");
        const config = GetGlobalConfig();
        const scenario = CreateMemlabScenario(definition!, config);

        const page = createPageMock();

        await scenario.beforeInitialPageLoad?.(page as any);
        await scenario.action?.(page as any);
        await scenario.back?.(page as any);

        expect(scenario.url()).toContain("/empty.html");
        expect(scenario.repeat?.()).toBe(1);
        expect(page.setViewport).toHaveBeenCalledWith({ width: 1280, height: 720 });
        expect(page.evaluate).toHaveBeenNthCalledWith(
            1,
            EvaluateInitializePlaygroundScene,
            expect.objectContaining({ playgroundId: "#2FDQT5#1508", exerciseAnimationGroups: true, settleAfterReadyMs: 150 })
        );
        expect(page.evaluate).toHaveBeenNthCalledWith(3, EvaluateDisposePlaygroundScene, expect.objectContaining({ settleAfterDisposeMs: 150 }));
    });

    it("creates a viewer scenario that uses the viewer mount helpers", async () => {
        const definition = DefaultScenarioDefinitions.find((scenario) => scenario.id === "viewer-boombox-web-component");
        const config = GetGlobalConfig();
        const scenario = CreateMemlabScenario(definition!, config);

        const page = createPageMock();

        await scenario.action?.(page as any);
        await scenario.back?.(page as any);

        expect(scenario.url()).toContain("/packages/tools/viewer/test/apps/web/test.html");
        expect(page.evaluate).toHaveBeenNthCalledWith(1, EvaluateMountViewerScenario, expect.objectContaining({ minFrameCount: 20, settleAfterReadyMs: 150 }));
        expect(page.evaluate).toHaveBeenNthCalledWith(3, EvaluateUnmountViewerScenario, expect.objectContaining({ settleAfterDisposeMs: 150 }));
    });

    it("creates a package scenario on top of empty.html", async () => {
        const definition = DefaultScenarioDefinitions.find((scenario) => scenario.id === "loaders-boombox-import");
        const config = GetGlobalConfig();
        const scenario = CreateMemlabScenario(definition!, config);

        const page = createPageMock();

        await scenario.action?.(page as any);
        await scenario.back?.(page as any);

        expect(scenario.url()).toContain("/empty.html");
        expect(page.evaluate).toHaveBeenNthCalledWith(
            1,
            EvaluateInitializePackageScene,
            expect.objectContaining({ scenario: "loaders-boombox-import", assetsUrl: expect.any(String) })
        );
        expect(page.evaluate).toHaveBeenNthCalledWith(3, EvaluateDisposePlaygroundScene, expect.objectContaining({ settleAfterDisposeMs: 250 }));
    });

    it("creates the new direct-load package scenario on top of empty.html", async () => {
        const definition = DefaultScenarioDefinitions.find((scenario) => scenario.id === "loaders-obj-direct-load");
        const config = GetGlobalConfig();
        const scenario = CreateMemlabScenario(definition!, config);

        const page = createPageMock();

        await scenario.action?.(page as any);
        await scenario.back?.(page as any);

        expect(page.evaluate).toHaveBeenNthCalledWith(
            1,
            EvaluateInitializePackageScene,
            expect.objectContaining({ scenario: "loaders-obj-direct-load", assetsUrl: expect.any(String) })
        );
        expect(page.evaluate).toHaveBeenNthCalledWith(3, EvaluateDisposePlaygroundScene, expect.objectContaining({ settleAfterDisposeMs: 150 }));
    });

    it("creates the materials-library package scenario on top of empty.html", async () => {
        const definition = DefaultScenarioDefinitions.find((scenario) => scenario.id === "materials-library-stack");
        const config = GetGlobalConfig();
        const scenario = CreateMemlabScenario(definition!, config);

        const page = createPageMock();

        await scenario.action?.(page as any);
        await scenario.back?.(page as any);

        expect(page.evaluate).toHaveBeenNthCalledWith(
            1,
            EvaluateInitializePackageScene,
            expect.objectContaining({ scenario: "materials-library-stack", assetsUrl: expect.any(String) })
        );
        expect(page.evaluate).toHaveBeenNthCalledWith(3, EvaluateDisposePlaygroundScene, expect.objectContaining({ settleAfterDisposeMs: 250 }));
    });

    it("creates the combined core feature package scenario on top of empty.html", async () => {
        const definition = DefaultScenarioDefinitions.find((scenario) => scenario.id === "core-feature-stack");
        const config = GetGlobalConfig();
        const scenario = CreateMemlabScenario(definition!, config);

        const page = createPageMock();

        await scenario.action?.(page as any);
        await scenario.back?.(page as any);

        expect(page.evaluate).toHaveBeenNthCalledWith(
            1,
            EvaluateInitializePackageScene,
            expect.objectContaining({ scenario: "core-feature-stack", assetsUrl: expect.any(String), settleAfterReadyMs: 300 })
        );
        expect(page.evaluate).toHaveBeenNthCalledWith(3, EvaluateDisposePlaygroundScene, expect.objectContaining({ settleAfterDisposeMs: 300 }));
    });

    it("creates the combined core rendering and shadows package scenario on top of empty.html", async () => {
        const definition = DefaultScenarioDefinitions.find((scenario) => scenario.id === "core-rendering-materials-shadows-stack");
        const config = GetGlobalConfig();
        const scenario = CreateMemlabScenario(definition!, config);

        const page = createPageMock();

        await scenario.action?.(page as any);
        await scenario.back?.(page as any);

        expect(page.evaluate).toHaveBeenNthCalledWith(
            1,
            EvaluateInitializePackageScene,
            expect.objectContaining({ scenario: "core-rendering-materials-shadows-stack", assetsUrl: expect.any(String), settleAfterReadyMs: 250 })
        );
        expect(page.evaluate).toHaveBeenNthCalledWith(3, EvaluateDisposePlaygroundScene, expect.objectContaining({ settleAfterDisposeMs: 250 }));
    });

    it("creates the combined core textures render target post-process scenario on top of empty.html", async () => {
        const definition = DefaultScenarioDefinitions.find((scenario) => scenario.id === "core-textures-render-targets-postprocess-stack");
        const config = GetGlobalConfig();
        const scenario = CreateMemlabScenario(definition!, config);

        const page = createPageMock();

        await scenario.action?.(page as any);
        await scenario.back?.(page as any);

        expect(page.evaluate).toHaveBeenNthCalledWith(
            1,
            EvaluateInitializePackageScene,
            expect.objectContaining({ scenario: "core-textures-render-targets-postprocess-stack", assetsUrl: expect.any(String), settleAfterReadyMs: 250 })
        );
        expect(page.evaluate).toHaveBeenNthCalledWith(3, EvaluateDisposePlaygroundScene, expect.objectContaining({ settleAfterDisposeMs: 250 }));
    });

    it("includes a heavier animation-driven playground in the ci suite", () => {
        const scenarios = ResolveScenarioDefinitions("ci");

        expect(scenarios.some((scenario) => scenario.id === "core-playground-LL5BIQ-636")).toBe(true);
    });

    it("keeps inspector-driven playground interactions out of the ci suite", () => {
        const scenarios = ResolveScenarioDefinitions("ci");

        expect(scenarios.some((scenario) => scenario.kind === "playground" && scenario.toggleInspector)).toBe(false);
    });

    it("exposes the combined deterministic core feature scenario outside the ci suite", () => {
        const ciScenarios = ResolveScenarioDefinitions("ci");
        const extendedScenarios = ResolveScenarioDefinitions("extended");
        const packageScenarios = ResolveScenarioDefinitions("packages");

        expect(ciScenarios.some((scenario) => scenario.id === "core-feature-stack")).toBe(false);
        expect(ciScenarios.some((scenario) => scenario.id === "core-rendering-materials-shadows-stack")).toBe(false);
        expect(ciScenarios.some((scenario) => scenario.id === "core-textures-render-targets-postprocess-stack")).toBe(false);
        expect(extendedScenarios.some((scenario) => scenario.id === "core-feature-stack")).toBe(true);
        expect(extendedScenarios.some((scenario) => scenario.id === "core-rendering-materials-shadows-stack")).toBe(true);
        expect(extendedScenarios.some((scenario) => scenario.id === "core-textures-render-targets-postprocess-stack")).toBe(true);
        expect(packageScenarios.some((scenario) => scenario.id === "core-feature-stack")).toBe(true);
        expect(packageScenarios.some((scenario) => scenario.id === "core-rendering-materials-shadows-stack")).toBe(true);
        expect(packageScenarios.some((scenario) => scenario.id === "core-textures-render-targets-postprocess-stack")).toBe(true);
    });

    it("covers deterministic core and package scenarios on empty.html", () => {
        const scenarios = ResolveScenarioDefinitions("packages");

        expect(new Set(scenarios.map((scenario) => scenario.packageName))).toEqual(
            new Set([
                "@babylonjs/core",
                "@babylonjs/gui",
                "@babylonjs/loaders",
                "@babylonjs/materials",
                "@babylonjs/post-processes",
                "@babylonjs/procedural-textures",
                "@babylonjs/serializers",
            ])
        );
        expect(scenarios).toHaveLength(13);
    });
});
