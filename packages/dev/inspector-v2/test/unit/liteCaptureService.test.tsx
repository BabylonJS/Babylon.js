/**
 * @vitest-environment jsdom
 */

import { type EngineContext, type SurfaceContext } from "@babylonjs/lite";
import { FluentProvider, webLightTheme } from "@fluentui/react-components";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";

import { type IShellService, type SidePaneDefinition } from "shared-ui-components/modularTool/services/shellService";
import { SettingsStoreContext } from "shared-ui-components/modularTool/contexts/settingsContext";
import { type ISettingsStore } from "shared-ui-components/modularTool/services/settingsStore";
import { Observable } from "core/Misc/observable";
import { CaptureServiceDefinition } from "../../src/lite/services/panes/captureService";
import { type IWatcherService } from "../../src/services/watcherService";

vi.hoisted(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    vi.stubGlobal(
        "matchMedia",
        vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }))
    );
    vi.stubGlobal(
        "ResizeObserver",
        class {
            public observe() {}
            public unobserve() {}
            public disconnect() {}
        }
    );
});

vi.mock("@babylonjs/lite", () => ({ captureScreenshot: vi.fn() }));

describe("Babylon Lite capture service", () => {
    it("watches surface topology, updates mounted controls, and releases its registrations", () => {
        let pane!: SidePaneDefinition;
        const unregister = vi.fn();
        const unregisterWatcher = vi.fn();
        const engine = { canvas: document.createElement("canvas") } as EngineContext;
        const surfaces = [engine] as SurfaceContext[];
        Object.assign(engine, { surfaces });
        let snapshot!: () => readonly SurfaceContext[];
        let refresh!: () => void;
        let equal!: (left: readonly SurfaceContext[], right: readonly SurfaceContext[]) => boolean;
        const watcher = {
            watchValue: (get: typeof snapshot, changed: () => void, equals: typeof equal) => {
                snapshot = get;
                refresh = changed;
                equal = equals;
                return { dispose: unregisterWatcher };
            },
        } as IWatcherService;
        const shell = {
            addSidePane: (definition: SidePaneDefinition) => {
                pane = definition;
                return { dispose: unregister };
            },
        } as IShellService;
        const service = CaptureServiceDefinition.factory({ engine }, shell, watcher);
        expect(pane.key).toBe("Tools");
        const initial = snapshot();
        const container = document.createElement("div");
        document.body.appendChild(container);
        const root = createRoot(container);
        const Pane = pane.content;
        const settings: ISettingsStore = {
            readSetting: (descriptor) => descriptor.defaultValue,
            writeSetting: vi.fn(),
            onChanged: new Observable<string>(),
        };
        try {
            act(() =>
                root.render(
                    <FluentProvider theme={webLightTheme}>
                        <SettingsStoreContext.Provider value={settings}>
                            <Pane />
                        </SettingsStoreContext.Provider>
                    </FluentProvider>
                )
            );
            expect(container.textContent).toContain("Primary Surface");
            const record = container.querySelector('button[aria-label="Record Video"]') as HTMLButtonElement;
            expect(record.disabled).toBe(true);
            const surface = { canvas: document.createElement("canvas") } as SurfaceContext;
            surfaces.push(surface);
            expect(initial).toHaveLength(1);
            expect(equal(initial, snapshot())).toBe(false);
            act(() => refresh());
        } finally {
            act(() => root.unmount());
            service?.dispose?.();
            container.remove();
        }
        expect(unregister).toHaveBeenCalledTimes(1);
        expect(unregisterWatcher).toHaveBeenCalledTimes(1);
    });
});
