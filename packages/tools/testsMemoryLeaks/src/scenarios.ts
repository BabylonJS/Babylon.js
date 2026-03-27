import type { IScenario } from "@memlab/core";

import type { IGlobalConfig } from "./config";
import { CreateBabylonLeakFilter, type ILeakFilterOptions } from "./filters";
import {
    EvaluateDisposePlaygroundScene,
    EvaluateInitializePlaygroundScene,
    EvaluateInitializePackageScene,
    EvaluateMountViewerScenario,
    EvaluateUnmountViewerScenario,
    type IPackageSceneBrowserOptions,
    type IPlaygroundSceneBrowserOptions,
    type IViewerSceneBrowserOptions,
} from "./browserActions";

interface IPageLike {
    evaluate: (...args: any[]) => Promise<any>;
    waitForFunction: (...args: any[]) => Promise<any>;
    setViewport: (viewport: { width: number; height: number }) => Promise<void>;
}

/** Supported scenario groups. */
export type ScenarioSuite = "ci" | "extended" | "packages" | "all";

/** Valid suite values for runtime validation. */
export const ValidScenarioSuites: readonly ScenarioSuite[] = ["ci", "extended", "packages", "all"];

interface IBaseScenarioDefinition {
    /** Stable identifier used by the CLI. */
    id: string;
    /** Human readable scenario name. */
    name: string;
    /** Package this scenario is intended to validate. */
    packageName: string;
    /** Scenario suites that include this scenario. */
    suites: Exclude<ScenarioSuite, "all">[];
    /** Optional memlab repeat count. */
    repeat?: number;
    /** Optional per-scenario timeout. */
    timeoutMs?: number;
    /** Optional delay after the scene becomes ready. */
    settleAfterReadyMs?: number;
    /** Optional delay after disposal completes. */
    settleAfterDisposeMs?: number;
    /** Optional leak filter overrides. */
    leakFilterOptions?: ILeakFilterOptions;
}

/** Scenario definition for Babylon playground-based leak checks. */
export interface IPlaygroundScenarioDefinition extends IBaseScenarioDefinition {
    /** Discriminator. */
    kind: "playground";
    /** Playground identifier to run. */
    playgroundId: string;
    /** Number of frames to render after the scene is ready. */
    renderCount?: number;
    /** Whether to briefly show the inspector during the action. */
    toggleInspector?: boolean;
    /** Whether to mutate the active camera during the action. */
    simulateCameraMove?: boolean;
    /** Whether to briefly exercise animation groups during the action. */
    exerciseAnimationGroups?: boolean;
}

/** Scenario definition for non-core package pages. */
export interface IViewerScenarioDefinition extends IBaseScenarioDefinition {
    /** Discriminator. */
    kind: "viewer";
    /** Relative path of the page that serves the viewer app. */
    urlPath: string;
    /** HTML injected into the page to create the viewer scenario. */
    viewerHtml: string;
    /** Required minimum rendered frame count. */
    minFrameCount?: number;
}

/** Scenario definition for package-focused checks hosted on the Babylon Server empty page. */
export interface IPackageScenarioDefinition extends IBaseScenarioDefinition {
    /** Discriminator. */
    kind: "package";
    /** Browser-side package scenario identifier. */
    packageScenario: IPackageSceneBrowserOptions["scenario"];
    /** Number of frames to render after the package action is ready. */
    renderCount?: number;
}

/** All supported scenario definitions. */
export type MemoryLeakScenarioDefinition = IPlaygroundScenarioDefinition | IViewerScenarioDefinition | IPackageScenarioDefinition;

/**
 * Default scenario coverage for the Babylon memory leak runner.
 */
export const DefaultScenarioDefinitions: MemoryLeakScenarioDefinition[] = [
    {
        id: "core-playground-2FDQT5-1508",
        name: "Core Playground #2FDQT5#1508",
        packageName: "@babylonjs/core",
        kind: "playground",
        playgroundId: "#2FDQT5#1508",
        suites: ["ci", "extended"],
        repeat: 1,
        timeoutMs: 90000,
        renderCount: 8,
        simulateCameraMove: true,
        exerciseAnimationGroups: true,
        settleAfterReadyMs: 150,
        settleAfterDisposeMs: 150,
    },
    {
        id: "core-playground-T90MQ4-14",
        name: "Core Playground #T90MQ4#14",
        packageName: "@babylonjs/core",
        kind: "playground",
        playgroundId: "#T90MQ4#14",
        suites: ["ci", "extended"],
        repeat: 1,
        timeoutMs: 90000,
        renderCount: 8,
        settleAfterReadyMs: 150,
        settleAfterDisposeMs: 150,
    },
    {
        id: "core-playground-8EDB5N-2",
        name: "Core Playground #8EDB5N#2",
        packageName: "@babylonjs/core",
        kind: "playground",
        playgroundId: "#8EDB5N#2",
        suites: ["ci", "extended"],
        repeat: 1,
        timeoutMs: 90000,
        renderCount: 8,
        settleAfterReadyMs: 150,
        settleAfterDisposeMs: 150,
    },
    {
        id: "core-playground-LL5BIQ-636",
        name: "Core Playground #LL5BIQ#636",
        packageName: "@babylonjs/core",
        kind: "playground",
        playgroundId: "#LL5BIQ#636",
        suites: ["ci", "extended"],
        repeat: 1,
        timeoutMs: 120000,
        renderCount: 14,
        simulateCameraMove: true,
        exerciseAnimationGroups: true,
        settleAfterReadyMs: 250,
        settleAfterDisposeMs: 250,
    },
    {
        id: "core-playground-YACNQS-2",
        name: "Core Playground #YACNQS#2",
        packageName: "@babylonjs/core",
        kind: "playground",
        playgroundId: "#YACNQS#2",
        suites: ["extended"],
        repeat: 1,
        timeoutMs: 90000,
        renderCount: 8,
        settleAfterReadyMs: 150,
        settleAfterDisposeMs: 150,
    },
    {
        id: "core-playground-SLV8LW-3",
        name: "Core Playground #SLV8LW#3",
        packageName: "@babylonjs/core",
        kind: "playground",
        playgroundId: "#SLV8LW#3",
        suites: ["extended"],
        repeat: 1,
        timeoutMs: 90000,
        renderCount: 8,
        settleAfterReadyMs: 150,
        settleAfterDisposeMs: 150,
    },
    {
        id: "core-playground-1LK70I-40",
        name: "Core Playground #1LK70I#40",
        packageName: "@babylonjs/core",
        kind: "playground",
        playgroundId: "#1LK70I#40",
        suites: ["extended"],
        repeat: 1,
        timeoutMs: 120000,
        renderCount: 16,
        settleAfterReadyMs: 250,
        settleAfterDisposeMs: 250,
    },
    {
        id: "core-feature-stack",
        name: "Core Feature Stack",
        packageName: "@babylonjs/core",
        kind: "package",
        packageScenario: "core-feature-stack",
        suites: ["extended", "packages"],
        repeat: 1,
        timeoutMs: 150000,
        renderCount: 18,
        settleAfterReadyMs: 300,
        settleAfterDisposeMs: 300,
    },
    {
        id: "core-rendering-materials-shadows-stack",
        name: "Core Rendering Materials Shadows Stack",
        packageName: "@babylonjs/core",
        kind: "package",
        packageScenario: "core-rendering-materials-shadows-stack",
        suites: ["extended", "packages"],
        repeat: 1,
        timeoutMs: 150000,
        renderCount: 16,
        settleAfterReadyMs: 250,
        settleAfterDisposeMs: 250,
    },
    {
        id: "core-textures-render-targets-postprocess-stack",
        name: "Core Textures Render Targets PostProcess Stack",
        packageName: "@babylonjs/core",
        kind: "package",
        packageScenario: "core-textures-render-targets-postprocess-stack",
        suites: ["extended", "packages"],
        repeat: 1,
        timeoutMs: 150000,
        renderCount: 14,
        settleAfterReadyMs: 250,
        settleAfterDisposeMs: 250,
    },
    {
        id: "gui-fullscreen-ui-controls",
        name: "GUI Fullscreen UI Controls",
        packageName: "@babylonjs/gui",
        kind: "package",
        packageScenario: "gui-fullscreen-ui",
        suites: ["packages"],
        repeat: 1,
        timeoutMs: 90000,
        renderCount: 10,
        settleAfterReadyMs: 150,
        settleAfterDisposeMs: 150,
    },
    {
        id: "gui-mesh-adt-controls",
        name: "GUI Mesh ADT Controls",
        packageName: "@babylonjs/gui",
        kind: "package",
        packageScenario: "gui-mesh-adt",
        suites: ["packages"],
        repeat: 1,
        timeoutMs: 90000,
        renderCount: 10,
        settleAfterReadyMs: 150,
        settleAfterDisposeMs: 150,
    },
    {
        id: "loaders-boombox-import",
        name: "Loaders Boombox Import",
        packageName: "@babylonjs/loaders",
        kind: "package",
        packageScenario: "loaders-boombox-import",
        suites: ["packages"],
        repeat: 1,
        timeoutMs: 120000,
        renderCount: 10,
        settleAfterReadyMs: 250,
        settleAfterDisposeMs: 250,
    },
    {
        id: "loaders-obj-direct-load",
        name: "Loaders OBJ Direct Load",
        packageName: "@babylonjs/loaders",
        kind: "package",
        packageScenario: "loaders-obj-direct-load",
        suites: ["packages"],
        repeat: 1,
        timeoutMs: 90000,
        renderCount: 8,
        settleAfterReadyMs: 150,
        settleAfterDisposeMs: 150,
    },
    {
        id: "loaders-stl-direct-load",
        name: "Loaders STL Direct Load",
        packageName: "@babylonjs/loaders",
        kind: "package",
        packageScenario: "loaders-stl-direct-load",
        suites: ["packages"],
        repeat: 1,
        timeoutMs: 90000,
        renderCount: 8,
        settleAfterReadyMs: 150,
        settleAfterDisposeMs: 150,
    },
    {
        id: "materials-library-stack",
        name: "Materials Library Stack",
        packageName: "@babylonjs/materials",
        kind: "package",
        packageScenario: "materials-library-stack",
        suites: ["packages"],
        repeat: 1,
        timeoutMs: 120000,
        renderCount: 12,
        settleAfterReadyMs: 250,
        settleAfterDisposeMs: 250,
    },
    {
        id: "serializers-gltf-export",
        name: "Serializers glTF Export",
        packageName: "@babylonjs/serializers",
        kind: "package",
        packageScenario: "serializers-gltf-export",
        suites: ["packages"],
        repeat: 1,
        timeoutMs: 120000,
        renderCount: 8,
        settleAfterReadyMs: 200,
        settleAfterDisposeMs: 200,
    },
    {
        id: "serializers-glb-export",
        name: "Serializers GLB Export",
        packageName: "@babylonjs/serializers",
        kind: "package",
        packageScenario: "serializers-glb-export",
        suites: ["packages"],
        repeat: 1,
        timeoutMs: 120000,
        renderCount: 8,
        settleAfterReadyMs: 200,
        settleAfterDisposeMs: 200,
    },
    {
        id: "postprocesses-digital-rain-stack",
        name: "PostProcesses Digital Rain Stack",
        packageName: "@babylonjs/post-processes",
        kind: "package",
        packageScenario: "postprocesses-digital-rain-stack",
        suites: ["packages"],
        repeat: 1,
        timeoutMs: 120000,
        renderCount: 14,
        settleAfterReadyMs: 250,
        settleAfterDisposeMs: 250,
    },
    {
        id: "procedural-textures-stack",
        name: "Procedural Textures Stack",
        packageName: "@babylonjs/procedural-textures",
        kind: "package",
        packageScenario: "procedural-textures-stack",
        suites: ["packages"],
        repeat: 1,
        timeoutMs: 120000,
        renderCount: 12,
        settleAfterReadyMs: 200,
        settleAfterDisposeMs: 200,
    },
    {
        id: "viewer-boombox-web-component",
        name: "Viewer Boombox Web Component",
        packageName: "@tools/viewer",
        kind: "viewer",
        suites: ["extended"],
        repeat: 1,
        timeoutMs: 90000,
        urlPath: "/packages/tools/viewer/test/apps/web/test.html",
        minFrameCount: 20,
        viewerHtml: '<babylon-viewer render-when-idle source="https://assets.babylonjs.com/meshes/boombox.glb" environment="auto" animation-auto-play></babylon-viewer>',
        settleAfterReadyMs: 150,
        settleAfterDisposeMs: 150,
        leakFilterOptions: { minRetainedSize: 50000 },
    },
];

/**
 * Resolves scenario definitions from a suite name and optional ids.
 * @param suite The scenario suite to resolve.
 * @param scenarioIds Optional explicit scenario ids.
 * @param definitions Scenario definitions to resolve from.
 * @returns The resolved scenario definitions.
 */
export function ResolveScenarioDefinitions(
    suite: ScenarioSuite = "ci",
    scenarioIds?: string[],
    definitions: MemoryLeakScenarioDefinition[] = DefaultScenarioDefinitions
): MemoryLeakScenarioDefinition[] {
    if (scenarioIds?.length) {
        const selected = definitions.filter((definition) => scenarioIds.includes(definition.id));
        const missingScenarioIds = scenarioIds.filter((scenarioId) => !selected.some((definition) => definition.id === scenarioId));
        if (missingScenarioIds.length > 0) {
            throw new Error(`Unknown memory leak scenario(s): ${missingScenarioIds.join(", ")}.`);
        }
        return selected;
    }

    if (suite === "all") {
        return [...definitions];
    }

    return definitions.filter((definition) => definition.suites.includes(suite));
}

const WaitForHarnessIdleAsync = async (page: IPageLike, timeoutMs: number) => {
    await page.waitForFunction(
        () => {
            const harnessState = (window as any).__babylonLeakHarnessState;
            return !!window.document && !harnessState?.busy;
        },
        { timeout: timeoutMs }
    );

    const errorMessage = await page.evaluate(() => (window as any).__babylonLeakHarnessState?.lastError ?? null);
    if (errorMessage) {
        throw new Error(errorMessage);
    }
};

const CreateSharedScenarioScaffold = (
    definition: IBaseScenarioDefinition,
    initialPageUrl: () => string
): Pick<IScenario, "url" | "repeat" | "isPageLoaded" | "beforeInitialPageLoad"> => {
    const beforeInitialPageLoadAsync = async (page: IPageLike) => {
        await page.setViewport({ width: 1280, height: 720 });
    };

    const isPageLoadedAsync = async (page: IPageLike) => {
        await page.waitForFunction(
            () => {
                const harnessState = (window as any).__babylonLeakHarnessState;
                return document.readyState === "complete" && !harnessState?.busy;
            },
            { timeout: definition.timeoutMs ?? 60000 }
        );
        return true;
    };

    return {
        url: initialPageUrl,
        repeat: () => definition.repeat ?? 0,
        beforeInitialPageLoad: beforeInitialPageLoadAsync,
        isPageLoaded: isPageLoadedAsync,
    };
};

/**
 * Builds a memlab scenario object from a scenario definition.
 * @param definition The scenario definition.
 * @param config The resolved global configuration.
 * @returns The memlab scenario.
 */
export function CreateMemlabScenario(definition: MemoryLeakScenarioDefinition, config: IGlobalConfig): IScenario {
    if (definition.kind === "playground") {
        const browserOptions: IPlaygroundSceneBrowserOptions = {
            baseUrl: config.baseUrl,
            snippetUrl: config.snippetUrl,
            pgRoot: config.pgRoot,
            playgroundId: definition.playgroundId,
            renderCount: definition.renderCount,
            toggleInspector: definition.toggleInspector,
            simulateCameraMove: definition.simulateCameraMove,
            exerciseAnimationGroups: definition.exerciseAnimationGroups,
            engineName: "webgl2",
            settleAfterReadyMs: definition.settleAfterReadyMs,
            settleAfterDisposeMs: definition.settleAfterDisposeMs,
        };

        const actionAsync = async (page: IPageLike) => {
            await page.evaluate(EvaluateInitializePlaygroundScene, browserOptions);
            await WaitForHarnessIdleAsync(page, definition.timeoutMs ?? 60000);
        };
        const backAsync = async (page: IPageLike) => {
            await page.evaluate(EvaluateDisposePlaygroundScene, { settleAfterDisposeMs: definition.settleAfterDisposeMs });
            await WaitForHarnessIdleAsync(page, definition.timeoutMs ?? 60000);
        };

        return {
            ...CreateSharedScenarioScaffold(definition, () => `${config.baseUrl}/empty.html`),
            action: actionAsync,
            back: backAsync,
            leakFilter: CreateBabylonLeakFilter(definition.leakFilterOptions),
        };
    }

    if (definition.kind === "package") {
        const browserOptions: IPackageSceneBrowserOptions = {
            baseUrl: config.baseUrl,
            assetsUrl: config.assetsUrl,
            scenario: definition.packageScenario,
            renderCount: definition.renderCount,
            settleAfterReadyMs: definition.settleAfterReadyMs,
        };

        const actionAsync = async (page: IPageLike) => {
            await page.evaluate(EvaluateInitializePackageScene, browserOptions);
            await WaitForHarnessIdleAsync(page, definition.timeoutMs ?? 60000);
        };
        const backAsync = async (page: IPageLike) => {
            await page.evaluate(EvaluateDisposePlaygroundScene, { settleAfterDisposeMs: definition.settleAfterDisposeMs });
            await WaitForHarnessIdleAsync(page, definition.timeoutMs ?? 60000);
        };

        return {
            ...CreateSharedScenarioScaffold(definition, () => `${config.baseUrl}/empty.html`),
            action: actionAsync,
            back: backAsync,
            leakFilter: CreateBabylonLeakFilter(definition.leakFilterOptions),
        };
    }

    const browserOptions: IViewerSceneBrowserOptions = {
        viewerHtml: definition.viewerHtml,
        minFrameCount: definition.minFrameCount,
        settleAfterReadyMs: definition.settleAfterReadyMs,
        settleAfterDisposeMs: definition.settleAfterDisposeMs,
    };

    const actionAsync = async (page: IPageLike) => {
        await page.evaluate(EvaluateMountViewerScenario, browserOptions);
        await WaitForHarnessIdleAsync(page, definition.timeoutMs ?? 60000);
    };
    const backAsync = async (page: IPageLike) => {
        await page.evaluate(EvaluateUnmountViewerScenario, { settleAfterDisposeMs: definition.settleAfterDisposeMs });
        await WaitForHarnessIdleAsync(page, definition.timeoutMs ?? 60000);
    };

    return {
        ...CreateSharedScenarioScaffold(definition, () => `${config.viewerBaseUrl}${definition.urlPath}`),
        action: actionAsync,
        back: backAsync,
        leakFilter: CreateBabylonLeakFilter(definition.leakFilterOptions),
    };
}
