vi.mock("../../src/tools/downloadManager", () => ({
    DownloadManager: class {
        public downloadAsync = vi.fn();
    },
}));

vi.mock("../../src/tools/localSession", () => ({
    AddFileRevision: vi.fn(),
}));

vi.mock("../../src/tools/utilities", () => ({
    Utilities: {
        ReadStringFromStore: vi.fn((_key: string, defaultValue: string) => defaultValue),
    },
}));

import { Observable } from "@dev/core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RenderingComponent } from "../../src/components/rendererComponent";
import { RuntimeMode, type GlobalState } from "../../src/globalState";

function createMockGlobalState() {
    return {
        MobileSizeTrigger: 768,
        runtimeMode: RuntimeMode.Editor,
        fpsElement: { innerHTML: "" },
        getRunnable: vi.fn(),
        onRunRequiredObservable: new Observable<void>(),
        onDownloadRequiredObservable: new Observable<void>(),
        onInspectorRequiredObservable: new Observable<void>(),
        onFullcreenRequiredObservable: new Observable<void>(),
        onThemeChangedObservable: new Observable<void>(),
        onErrorObservable: new Observable<unknown>(),
        onRunExecutedObservable: new Observable<void>(),
        onDisplayWaitRingObservable: new Observable<boolean>(),
    } as unknown as GlobalState;
}

function createInspectorToken() {
    const token = {
        isDisposed: false,
        onDisposed: new Observable<void>(),
        dispose: vi.fn(async () => {
            token.isDisposed = true;
            token.onDisposed.notifyObservers();
        }),
    };

    return token;
}

describe("RenderingComponent", () => {
    beforeEach(() => {
        const windowMock = {
            addEventListener: vi.fn(),
            setTimeout,
            clearTimeout,
            innerWidth: 1024,
        };

        Object.defineProperty(globalThis, "window", {
            value: windowMock,
            configurable: true,
        });
        Object.defineProperty(globalThis, "location", {
            value: { search: "" },
            configurable: true,
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("does not close Inspector when Smart Assets already reopened it during a run", async () => {
        const globalState = createMockGlobalState();
        const component = new RenderingComponent({ globalState });
        const initialInspectorToken = createInspectorToken();
        const reopenedInspectorToken = createInspectorToken();
        const scene = {
            debugLayer: {
                isVisible: () => false,
            },
        };
        const engine = {
            scenes: [
                {
                    executeWhenReady: (callback: () => void) => callback(),
                },
            ],
            runRenderLoop: vi.fn(),
        };
        const canvas = {};
        const runner = {
            getPackSnapshot: () => ({ manifest: {} }),
            run: vi.fn(async () => {
                (component as unknown as { _inspectorV2Token: typeof reopenedInspectorToken })._inspectorV2Token = reopenedInspectorToken;
                return [scene, engine];
            }),
        };

        globalState.getRunnable = vi.fn(async () => runner) as GlobalState["getRunnable"];
        component.state = { preferInspector: true };
        (component as unknown as { _canvasRef: { current: typeof canvas }; _inspectorV2Token: typeof initialInspectorToken })._canvasRef.current = canvas;
        (component as unknown as { _inspectorV2Token: typeof initialInspectorToken })._inspectorV2Token = initialInspectorToken;

        await (component as unknown as { _compileAndRunAsync: () => Promise<void> })._compileAndRunAsync();

        expect(initialInspectorToken.dispose).toHaveBeenCalledOnce();
        expect(reopenedInspectorToken.dispose).not.toHaveBeenCalled();
    });

    it("shows the wait ring after a missing Smart Asset replacement is selected", async () => {
        const globalState = createMockGlobalState();
        const waitRingValues: boolean[] = [];
        globalState.onDisplayWaitRingObservable.add((value) => {
            waitRingValues.push(value);
        });
        const component = new RenderingComponent({ globalState });
        const scene = {
            debugLayer: {
                isVisible: () => false,
            },
        };
        const replacementFile = new File(["mock"], "replacement.glb");
        (globalThis as unknown as { INSPECTOR: unknown }).INSPECTOR = {
            ShowInspector: vi.fn(),
            inspectorAssetNotFoundHandler: vi.fn(async () => replacementFile),
        };
        (component as unknown as { _inspectorV2Token: ReturnType<typeof createInspectorToken> })._inspectorV2Token = createInspectorToken();

        const replacement = await (
            component as unknown as {
                _resolveMissingSmartAssetWithInspectorAsync: (scene: typeof scene, key: string, expectedUrl: string) => Promise<string | File | null>;
            }
        )._resolveMissingSmartAssetWithInspectorAsync(scene, "missing-asset", "missing-asset.glb");

        expect(replacement).toBe(replacementFile);
        expect(waitRingValues).toContain(true);
    });
});
